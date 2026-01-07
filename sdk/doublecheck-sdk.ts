/**
 * Doublecheck SDK - TypeScript client for the Doublecheck Solana program
 * 
 * This SDK provides a convenient interface for interacting with the
 * Doublecheck document verification program.
 */

import { 
  PublicKey, 
  Connection, 
  Keypair, 
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Doublecheck } from '../target/types/doublecheck';
import { sha3_256 } from 'js-sha3';

// PDA Seeds
const ADMIN_SEED = Buffer.from('admin');
const ISSUER_SEED = Buffer.from('issuer');
const DOCUMENT_HASH_SEED = Buffer.from('document_hash');

export interface DocumentInfo {
  documentHash: Buffer;
  issuerPubkey: PublicKey;
  status: 'verified' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
  saltHash?: Buffer;
}

export interface IssuerInfo {
  issuerPubkey: PublicKey;
  isAuthorized: boolean;
  createdAt: Date;
  name: string;
}

export class DoublecheckClient {
  private program: Program<Doublecheck>;
  private connection: Connection;
  
  constructor(
    program: Program<Doublecheck>,
    connection: Connection
  ) {
    this.program = program;
    this.connection = connection;
  }

  /**
   * Create a new DoublecheckClient instance
   */
  static async create(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey
  ): Promise<DoublecheckClient> {
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program<Doublecheck>(
      require('../target/idl/doublecheck.json'),
      programId,
      provider
    );
    
    return new DoublecheckClient(program, connection);
  }

  /**
   * Derive the Admin PDA
   */
  getAdminPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [ADMIN_SEED],
      this.program.programId
    );
  }

  /**
   * Derive an Issuer PDA
   */
  getIssuerPDA(issuerPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [ISSUER_SEED, issuerPubkey.toBuffer()],
      this.program.programId
    );
  }

  /**
   * Derive a Document Hash PDA
   */
  getDocumentHashPDA(documentHash: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [DOCUMENT_HASH_SEED, documentHash],
      this.program.programId
    );
  }

  /**
   * Hash a document using SHA3-256
   */
  static hashDocument(documentContent: Buffer): Buffer {
    return Buffer.from(sha3_256(documentContent), 'hex');
  }

  /**
   * Initialize the admin account
   */
  async initializeAdmin(
    adminWallet: Keypair
  ): Promise<string> {
    const [adminStatePda] = this.getAdminPDA();

    const tx = await this.program.methods
      .initializeAdmin()
      .accounts({
        adminState: adminStatePda,
        admin: adminWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminWallet])
      .rpc();

    return tx;
  }

  /**
   * Register a new issuer
   */
  async registerIssuer(
    adminWallet: Keypair,
    issuerPubkey: PublicKey,
    issuerName: string
  ): Promise<string> {
    const [adminStatePda] = this.getAdminPDA();
    const [issuerStatePda] = this.getIssuerPDA(issuerPubkey);

    const tx = await this.program.methods
      .registerIssuer(issuerPubkey, issuerName)
      .accounts({
        adminState: adminStatePda,
        issuerState: issuerStatePda,
        admin: adminWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminWallet])
      .rpc();

    return tx;
  }

  /**
   * Issue a document hash
   */
  async issueDocumentHash(
    issuerWallet: Keypair,
    documentHash: Buffer,
    saltHash?: Buffer
  ): Promise<string> {
    const [issuerStatePda] = this.getIssuerPDA(issuerWallet.publicKey);
    const [documentHashPda] = this.getDocumentHashPDA(documentHash);

    const saltArray = saltHash 
      ? Array.from(saltHash) as number[]
      : null;

    const tx = await this.program.methods
      .issueDocumentHash(
        Array.from(documentHash) as number[],
        saltArray
      )
      .accounts({
        issuerState: issuerStatePda,
        documentHashAccount: documentHashPda,
        issuer: issuerWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerWallet])
      .rpc();

    return tx;
  }

  /**
   * Revoke a document
   */
  async revokeDocument(
    issuerWallet: Keypair,
    documentHash: Buffer
  ): Promise<string> {
    const [documentHashPda] = this.getDocumentHashPDA(documentHash);

    const tx = await this.program.methods
      .revokeDocument(Array.from(documentHash) as number[])
      .accounts({
        documentHashAccount: documentHashPda,
        issuer: issuerWallet.publicKey,
      })
      .signers([issuerWallet])
      .rpc();

    return tx;
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    issuerWallet: Keypair,
    documentHash: Buffer,
    newStatus: 'verified' | 'revoked'
  ): Promise<string> {
    const [documentHashPda] = this.getDocumentHashPDA(documentHash);

    const status = newStatus === 'verified' 
      ? { verified: {} } 
      : { revoked: {} };

    const tx = await this.program.methods
      .updateDocumentStatus(
        Array.from(documentHash) as number[],
        status
      )
      .accounts({
        documentHashAccount: documentHashPda,
        issuer: issuerWallet.publicKey,
      })
      .signers([issuerWallet])
      .rpc();

    return tx;
  }

  /**
   * Fetch document information
   */
  async getDocumentInfo(documentHash: Buffer): Promise<DocumentInfo | null> {
    const [documentHashPda] = this.getDocumentHashPDA(documentHash);

    try {
      const account = await this.program.account.documentHash.fetch(
        documentHashPda
      );

      return {
        documentHash: Buffer.from(account.documentHash),
        issuerPubkey: account.issuerPubkey,
        status: account.status.verified !== undefined ? 'verified' : 'revoked',
        createdAt: new Date(account.createdAt.toNumber() * 1000),
        updatedAt: new Date(account.updatedAt.toNumber() * 1000),
        saltHash: account.saltHash 
          ? Buffer.from(account.saltHash) 
          : undefined,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch issuer information
   */
  async getIssuerInfo(issuerPubkey: PublicKey): Promise<IssuerInfo | null> {
    const [issuerStatePda] = this.getIssuerPDA(issuerPubkey);

    try {
      const account = await this.program.account.issuerState.fetch(
        issuerStatePda
      );

      return {
        issuerPubkey: account.issuerPubkey,
        isAuthorized: account.isAuthorized,
        createdAt: new Date(account.createdAt.toNumber() * 1000),
        name: account.name,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a document is verified
   */
  async isDocumentVerified(documentHash: Buffer): Promise<boolean> {
    const info = await this.getDocumentInfo(documentHash);
    return info !== null && info.status === 'verified';
  }

  /**
   * Verify a document by recomputing its hash and checking on-chain
   */
  async verifyDocument(documentContent: Buffer): Promise<{
    isVerified: boolean;
    documentInfo?: DocumentInfo;
  }> {
    const hash = DoublecheckClient.hashDocument(documentContent);
    const info = await this.getDocumentInfo(hash);

    return {
      isVerified: info !== null && info.status === 'verified',
      documentInfo: info || undefined,
    };
  }

  /**
   * Get all issuers (requires fetching all issuer accounts)
   * Note: This can be expensive on-chain. Consider using an indexer.
   */
  async getAllIssuers(): Promise<IssuerInfo[]> {
    const accounts = await this.program.account.issuerState.all();
    
    return accounts.map(account => ({
      issuerPubkey: account.account.issuerPubkey,
      isAuthorized: account.account.isAuthorized,
      createdAt: new Date(account.account.createdAt.toNumber() * 1000),
      name: account.account.name,
    }));
  }
}

/**
 * Example usage:
 * 
 * const connection = new Connection('https://api.devnet.solana.com');
 * const wallet = new Wallet(Keypair.generate());
 * const programId = new PublicKey('DoubLeCHecKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
 * 
 * const client = await DoublecheckClient.create(connection, wallet, programId);
 * 
 * // Initialize admin
 * await client.initializeAdmin(adminKeypair);
 * 
 * // Register issuer
 * await client.registerIssuer(adminKeypair, issuerPubkey, 'IHK München');
 * 
 * // Issue document
 * const docHash = DoublecheckClient.hashDocument(documentBuffer);
 * await client.issueDocumentHash(issuerKeypair, docHash);
 * 
 * // Verify document
 * const result = await client.verifyDocument(documentBuffer);
 * console.log('Document verified:', result.isVerified);
 */
