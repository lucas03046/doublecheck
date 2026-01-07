# Developer Guide - Doublecheck

This guide provides detailed information for developers working with the Doublecheck Solana program.

## Account Architecture

### PDA Derivation

All accounts in Doublecheck use Program Derived Addresses (PDAs) for deterministic address generation:

#### AdminState PDA
```
Seeds: ["admin"]
Bump: Canonical bump
```

#### IssuerState PDA
```
Seeds: ["issuer", <issuer_pubkey>]
Bump: Canonical bump
```

#### DocumentHash PDA
```
Seeds: ["document_hash", <document_hash_bytes>]
Bump: Canonical bump
```

### Space Allocation

Each account type has carefully calculated space requirements:

- **AdminState**: 56 bytes (8 discriminator + 32 pubkey + 8 u64 + 8 i64)
- **IssuerState**: 181 bytes (8 discriminator + 32 pubkey + 1 bool + 8 i64 + 4 string length + 128 string data)
- **DocumentHash**: 106 bytes (8 discriminator + 32 hash + 32 pubkey + 1 enum + 8 i64 + 8 i64 + 1 option + 16 bytes)

## Instruction Flow

### 1. System Initialization

```
Admin → initialize_admin() → AdminState created
```

The first step is to initialize the admin account. This can only be done once.

**Example TypeScript:**
```typescript
const [adminStatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("admin")],
  program.programId
);

await program.methods
  .initializeAdmin()
  .accounts({
    adminState: adminStatePda,
    admin: adminWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Issuer Registration

```
Admin → register_issuer(issuer_pubkey, name) → IssuerState created
```

The admin registers trusted issuers who can then issue document hashes.

**Example TypeScript:**
```typescript
const [issuerStatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("issuer"), issuerPubkey.toBuffer()],
  program.programId
);

await program.methods
  .registerIssuer(issuerPubkey, "IHK München")
  .accounts({
    adminState: adminStatePda,
    issuerState: issuerStatePda,
    admin: adminWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. Document Hash Issuance

```
Issuer → issue_document_hash(hash, salt?) → DocumentHash created
```

Registered issuers can issue document hashes for verification.

**Example TypeScript:**
```typescript
const documentHash = Buffer.from(
  sha3_256(documentContent),
  'hex'
);

const [documentHashPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("document_hash"), documentHash],
  program.programId
);

await program.methods
  .issueDocumentHash(Array.from(documentHash), null)
  .accounts({
    issuerState: issuerStatePda,
    documentHashAccount: documentHashPda,
    issuer: issuerWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([issuerWallet])
  .rpc();
```

### 4. Document Management

#### Revoke Document
```typescript
await program.methods
  .revokeDocument(Array.from(documentHash))
  .accounts({
    documentHashAccount: documentHashPda,
    issuer: issuerWallet.publicKey,
  })
  .signers([issuerWallet])
  .rpc();
```

#### Update Status
```typescript
await program.methods
  .updateDocumentStatus(Array.from(documentHash), { verified: {} })
  .accounts({
    documentHashAccount: documentHashPda,
    issuer: issuerWallet.publicKey,
  })
  .signers([issuerWallet])
  .rpc();
```

## Security Considerations

### 1. PDA Validation

All PDAs are validated using Anchor's `seeds` and `bump` constraints:
- Prevents account substitution attacks
- Ensures deterministic address derivation
- Validates account ownership by program

### 2. Signer Verification

**Admin Operations:**
```rust
constraint = admin_state.admin_wallet == admin.key() @ DoublecheckError::UnauthorizedAdmin
```

**Issuer Operations:**
```rust
constraint = issuer_state.is_authorized @ DoublecheckError::IssuerNotAuthorized
constraint = document_hash_account.issuer_pubkey == issuer.key() @ DoublecheckError::UnauthorizedIssuer
```

### 3. Account Initialization

Using Anchor's `init` constraint ensures:
- Account doesn't already exist
- Correct space allocation
- Proper rent exemption
- System program ownership transfer

### 4. Integer Overflow Protection

All arithmetic uses checked operations:
```rust
admin_state.total_issuers = admin_state.total_issuers.checked_add(1).unwrap();
```

## Error Handling

### Custom Error Codes

| Error | Code | Description |
|-------|------|-------------|
| IssuerAlreadyRegistered | 6000 | Issuer PDA already exists |
| IssuerNotAuthorized | 6001 | Issuer is not authorized or doesn't exist |
| DocumentAlreadyExists | 6002 | Document hash PDA already exists |
| DocumentNotFound | 6003 | Document hash PDA doesn't exist |
| UnauthorizedIssuer | 6004 | Signer is not the original issuer |
| UnauthorizedAdmin | 6005 | Signer is not the admin |
| AdminAlreadyInitialized | 6006 | Admin state already initialized |
| InvalidHash | 6007 | Hash format or length is invalid |
| IssuerNameTooLong | 6008 | Issuer name exceeds 128 characters |

### Error Handling in TypeScript

```typescript
try {
  await program.methods
    .issueDocumentHash(...)
    .rpc();
} catch (error) {
  if (error.toString().includes("IssuerNotAuthorized")) {
    console.error("Issuer is not authorized");
  } else if (error.toString().includes("DocumentAlreadyExists")) {
    console.error("Document hash already registered");
  }
}
```

## Testing

### Local Testing with Anchor

```bash
# Start local validator
anchor test

# Or separately:
solana-test-validator
anchor test --skip-local-validator
```

### Test Coverage

Ensure tests cover:
1. ✅ Admin initialization
2. ✅ Issuer registration
3. ✅ Document hash issuance
4. ✅ Document revocation
5. ✅ Status updates
6. ✅ Unauthorized access attempts
7. ✅ PDA collision prevention
8. ✅ Error conditions

### Sample Test Structure

```typescript
describe("doublecheck", () => {
  before(async () => {
    // Setup: Derive PDAs, airdrop SOL
  });

  it("initializes admin", async () => {
    // Test admin initialization
  });

  it("registers issuer", async () => {
    // Test issuer registration
  });

  it("fails on unauthorized access", async () => {
    // Test security constraints
  });
});
```

## Integration Patterns

### Frontend Integration

#### 1. Hash Document Client-Side
```typescript
import { sha3_256 } from 'js-sha3';

const documentBuffer = await file.arrayBuffer();
const hash = sha3_256(new Uint8Array(documentBuffer));
```

#### 2. Verify Document
```typescript
const [documentHashPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("document_hash"), Buffer.from(hash, 'hex')],
  program.programId
);

try {
  const docAccount = await program.account.documentHash.fetch(documentHashPda);
  if (docAccount.status.verified) {
    console.log("Document is verified!");
    console.log("Issued by:", docAccount.issuerPubkey.toString());
  } else {
    console.log("Document was revoked");
  }
} catch (error) {
  console.log("Document not found in registry");
}
```

### Backend Integration

#### Express.js API Example
```typescript
app.post('/api/verify-document', async (req, res) => {
  const { documentHash } = req.body;
  
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("document_hash"), Buffer.from(documentHash, 'hex')],
    program.programId
  );
  
  try {
    const account = await program.account.documentHash.fetch(pda);
    res.json({
      verified: account.status.verified !== undefined,
      issuer: account.issuerPubkey.toString(),
      issuedAt: account.createdAt.toNumber(),
    });
  } catch {
    res.status(404).json({ error: "Document not found" });
  }
});
```

## Deployment

### Local Deployment

```bash
# Build the program
anchor build

# Deploy to local validator
anchor deploy
```

### Devnet Deployment

```bash
# Configure for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

### Mainnet Deployment

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy (ensure sufficient SOL)
anchor deploy --provider.cluster mainnet-beta
```

## Performance Optimization

### 1. Batch Operations

For multiple document issuances, use transaction batching:
```typescript
const tx = new Transaction();
for (const hash of documentHashes) {
  tx.add(
    await program.methods
      .issueDocumentHash(hash, null)
      .accounts({...})
      .instruction()
  );
}
await provider.sendAndConfirm(tx);
```

### 2. Account Caching

Cache frequently accessed accounts:
```typescript
const cache = new Map<string, IssuerState>();

async function getIssuer(pubkey: PublicKey) {
  const key = pubkey.toString();
  if (!cache.has(key)) {
    const account = await program.account.issuerState.fetch(
      deriveIssuerPda(pubkey)
    );
    cache.set(key, account);
  }
  return cache.get(key);
}
```

### 3. Parallel Fetching

Use Promise.all for multiple account fetches:
```typescript
const [admin, issuer, document] = await Promise.all([
  program.account.adminState.fetch(adminPda),
  program.account.issuerState.fetch(issuerPda),
  program.account.documentHash.fetch(documentPda),
]);
```

## Upgradeability

The program can be upgraded using Solana's upgrade authority:

```bash
# Build new version
anchor build

# Upgrade program
solana program deploy \
  --program-id <PROGRAM_ID> \
  --upgrade-authority <AUTHORITY_KEYPAIR> \
  target/deploy/doublecheck.so
```

## Monitoring & Analytics

### On-Chain Events

Emit events in instructions for indexing:
```rust
emit!(DocumentIssued {
    document_hash: document_hash,
    issuer: ctx.accounts.issuer.key(),
    timestamp: clock.unix_timestamp,
});
```

### Metrics to Track

- Total documents issued
- Documents per issuer
- Revocation rate
- Average transaction cost
- Failed transaction reasons

## Common Issues & Solutions

### Issue: "Account already exists"
**Solution**: Check if PDA is already initialized before calling `init`

### Issue: "Unauthorized admin/issuer"
**Solution**: Verify signer matches the authorized wallet

### Issue: "Account not found"
**Solution**: Ensure PDA derivation uses correct seeds and program ID

### Issue: "Transaction too large"
**Solution**: Split into multiple transactions or reduce data size

## Best Practices

1. ✅ Always validate PDAs with correct seeds
2. ✅ Use constraint checks instead of manual validation
3. ✅ Emit events for important state changes
4. ✅ Test all error conditions
5. ✅ Cache frequently accessed accounts
6. ✅ Use batch operations when possible
7. ✅ Monitor transaction costs
8. ✅ Keep issuer names under 128 characters
9. ✅ Use SHA3-256 or SHA-256 for document hashes
10. ✅ Store salt hashes securely if used

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Anchor TypeScript Client](https://www.anchor-lang.com/docs/javascript-anchor-types)
