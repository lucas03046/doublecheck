import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Doublecheck } from "../target/types/doublecheck";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("doublecheck", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Doublecheck as Program<Doublecheck>;
  
  const admin = provider.wallet as anchor.Wallet;
  const issuer = Keypair.generate();
  
  // PDA seeds
  const ADMIN_SEED = "admin";
  const ISSUER_SEED = "issuer";
  const DOCUMENT_HASH_SEED = "document_hash";

  let adminStatePda: PublicKey;
  let issuerStatePda: PublicKey;
  let documentHashPda: PublicKey;
  
  // Test document hash (32 bytes)
  const testDocumentHash = Buffer.from(
    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "hex"
  );
  
  const issuerName = "Test Issuer - IHK München";

  before(async () => {
    // Derive PDAs
    [adminStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(ADMIN_SEED)],
      program.programId
    );

    [issuerStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(ISSUER_SEED), issuer.publicKey.toBuffer()],
      program.programId
    );

    [documentHashPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(DOCUMENT_HASH_SEED), testDocumentHash],
      program.programId
    );
    
    // Airdrop SOL to issuer for testing
    const signature = await provider.connection.requestAirdrop(
      issuer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes admin", async () => {
    await program.methods
      .initializeAdmin()
      .accounts({
        adminState: adminStatePda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const adminState = await program.account.adminState.fetch(adminStatePda);
    assert.equal(adminState.adminWallet.toString(), admin.publicKey.toString());
    assert.equal(adminState.totalIssuers.toNumber(), 0);
    console.log("Admin initialized:", adminState.adminWallet.toString());
  });

  it("Registers an issuer", async () => {
    await program.methods
      .registerIssuer(issuer.publicKey, issuerName)
      .accounts({
        adminState: adminStatePda,
        issuerState: issuerStatePda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const issuerState = await program.account.issuerState.fetch(issuerStatePda);
    assert.equal(issuerState.issuerPubkey.toString(), issuer.publicKey.toString());
    assert.equal(issuerState.isAuthorized, true);
    assert.equal(issuerState.name, issuerName);
    console.log("Issuer registered:", issuerState.name);

    const adminState = await program.account.adminState.fetch(adminStatePda);
    assert.equal(adminState.totalIssuers.toNumber(), 1);
  });

  it("Issues a document hash", async () => {
    await program.methods
      .issueDocumentHash(Array.from(testDocumentHash), null)
      .accounts({
        issuerState: issuerStatePda,
        documentHashAccount: documentHashPda,
        issuer: issuer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuer])
      .rpc();

    const docHash = await program.account.documentHash.fetch(documentHashPda);
    assert.deepEqual(Buffer.from(docHash.documentHash), testDocumentHash);
    assert.equal(docHash.issuerPubkey.toString(), issuer.publicKey.toString());
    assert.equal(docHash.status.verified !== undefined, true);
    console.log("Document hash issued");
  });

  it("Revokes a document", async () => {
    await program.methods
      .revokeDocument(Array.from(testDocumentHash))
      .accounts({
        documentHashAccount: documentHashPda,
        issuer: issuer.publicKey,
      })
      .signers([issuer])
      .rpc();

    const docHash = await program.account.documentHash.fetch(documentHashPda);
    assert.equal(docHash.status.revoked !== undefined, true);
    console.log("Document revoked");
  });

  it("Updates document status back to verified", async () => {
    await program.methods
      .updateDocumentStatus(Array.from(testDocumentHash), { verified: {} })
      .accounts({
        documentHashAccount: documentHashPda,
        issuer: issuer.publicKey,
      })
      .signers([issuer])
      .rpc();

    const docHash = await program.account.documentHash.fetch(documentHashPda);
    assert.equal(docHash.status.verified !== undefined, true);
    console.log("Document status updated to verified");
  });

  it("Fails when unauthorized issuer tries to modify document", async () => {
    const unauthorizedIssuer = Keypair.generate();
    
    // Airdrop SOL to unauthorized issuer
    const signature = await provider.connection.requestAirdrop(
      unauthorizedIssuer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    try {
      await program.methods
        .revokeDocument(Array.from(testDocumentHash))
        .accounts({
          documentHashAccount: documentHashPda,
          issuer: unauthorizedIssuer.publicKey,
        })
        .signers([unauthorizedIssuer])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (err) {
      assert.include(err.toString(), "UnauthorizedIssuer");
      console.log("Correctly rejected unauthorized issuer");
    }
  });
});
