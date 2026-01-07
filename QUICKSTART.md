# Quickstart Guide - Doublecheck

Get started with Doublecheck in 5 minutes!

## Prerequisites

Ensure you have the following installed:

```bash
# Check Rust
rustc --version  # Should be 1.70+

# Check Solana CLI
solana --version  # Should be 1.17+

# Check Anchor
anchor --version  # Should be 0.29.0+

# Check Node.js
node --version  # Should be 16+
```

### Install Prerequisites (if needed)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
```

## Step 1: Setup Project

```bash
# Clone repository (or navigate to project directory)
cd doublecheck

# Install Node dependencies
yarn install
# or
npm install
```

## Step 2: Build the Program

```bash
# Build the Anchor program
anchor build

# Or use make
make build
```

Expected output:
```
Building doublecheck...
✓ Built successfully
```

## Step 3: Run Tests (Local)

```bash
# Start local test validator and run tests
anchor test

# Or use make
make test
```

Expected output:
```
doublecheck
  ✓ Initializes admin (312ms)
  ✓ Registers an issuer (245ms)
  ✓ Issues a document hash (198ms)
  ✓ Revokes a document (187ms)
  ✓ Updates document status back to verified (201ms)
  ✓ Fails when unauthorized issuer tries to modify document (156ms)

6 passing (1.3s)
```

## Step 4: Deploy to Devnet

```bash
# Configure Solana for devnet
solana config set --url devnet

# Create a new wallet (if you don't have one)
solana-keygen new

# Airdrop SOL for deployment
solana airdrop 2

# Deploy the program
anchor deploy --provider.cluster devnet

# Or use make
make deploy-devnet
```

Expected output:
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: /path/to/your/keypair.json
Deploying program "doublecheck"...
Program Id: DoubLeCHecKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Deploy success
```

## Step 5: Use the SDK

Create a new file `example.ts`:

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import { DoublecheckClient } from './sdk/doublecheck-sdk';

async function main() {
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load your wallet
  const wallet = new Wallet(Keypair.generate());
  
  // Program ID (replace with your deployed program)
  const programId = new PublicKey('DoubLeCHecKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  
  // Create client
  const client = await DoublecheckClient.create(connection, wallet, programId);
  
  // Initialize admin (only once)
  const adminKeypair = Keypair.generate();
  await client.initializeAdmin(adminKeypair);
  console.log('Admin initialized!');
  
  // Register an issuer
  const issuerKeypair = Keypair.generate();
  await client.registerIssuer(
    adminKeypair,
    issuerKeypair.publicKey,
    'Test Issuer - IHK München'
  );
  console.log('Issuer registered!');
  
  // Issue a document hash
  const documentContent = Buffer.from('My important document');
  const docHash = DoublecheckClient.hashDocument(documentContent);
  
  await client.issueDocumentHash(issuerKeypair, docHash);
  console.log('Document issued!');
  
  // Verify the document
  const result = await client.verifyDocument(documentContent);
  console.log('Document verified:', result.isVerified);
  console.log('Document info:', result.documentInfo);
}

main().catch(console.error);
```

Run it:
```bash
ts-node example.ts
```

## Common Use Cases

### Use Case 1: Issue a Document

```typescript
import { DoublecheckClient } from './sdk/doublecheck-sdk';
import { readFileSync } from 'fs';

// Read document file
const documentBuffer = readFileSync('./document.pdf');

// Hash the document
const docHash = DoublecheckClient.hashDocument(documentBuffer);

// Issue it on-chain
await client.issueDocumentHash(issuerKeypair, docHash);
```

### Use Case 2: Verify a Document

```typescript
// User uploads document
const uploadedFile = req.file;
const documentBuffer = Buffer.from(uploadedFile.buffer);

// Verify against blockchain
const result = await client.verifyDocument(documentBuffer);

if (result.isVerified) {
  console.log('✓ Document is authentic');
  console.log('Issued by:', result.documentInfo.issuerPubkey.toString());
  console.log('Issued at:', result.documentInfo.createdAt);
} else {
  console.log('✗ Document not found or revoked');
}
```

### Use Case 3: Revoke a Document

```typescript
// Issuer decides to revoke a document
const docHash = DoublecheckClient.hashDocument(documentBuffer);

await client.revokeDocument(issuerKeypair, docHash);
console.log('Document revoked');
```

### Use Case 4: Check Document Status

```typescript
const docHash = Buffer.from('your_document_hash_hex', 'hex');

const info = await client.getDocumentInfo(docHash);

if (info) {
  console.log('Status:', info.status);
  console.log('Issuer:', info.issuerPubkey.toString());
  console.log('Issued:', info.createdAt);
  console.log('Updated:', info.updatedAt);
} else {
  console.log('Document not found');
}
```

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy and test
anchor build
anchor deploy
anchor test --skip-local-validator
```

### 2. Devnet Testing

```bash
# Deploy to devnet
make deploy-devnet

# Run integration tests against devnet
anchor test --provider.cluster devnet
```

### 3. Code Changes

```bash
# Format code
make format

# Check for issues
make check

# Run linter
make lint

# Build
make build
```

## Troubleshooting

### Error: "anchor: command not found"

Install Anchor CLI:
```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli
```

### Error: "insufficient funds"

Airdrop more SOL:
```bash
solana airdrop 2
```

### Error: "AdminAlreadyInitialized"

Admin can only be initialized once. Use existing admin account.

### Error: "IssuerNotAuthorized"

Ensure the issuer is registered first:
```bash
await client.registerIssuer(adminKeypair, issuerPubkey, issuerName);
```

### Error: "DocumentAlreadyExists"

Each document hash can only be issued once. Check if document already exists:
```bash
const exists = await client.getDocumentInfo(docHash);
```

### Build fails with "unknown feature"

Update Rust:
```bash
rustup update
```

### Tests fail to connect

Ensure local validator is running:
```bash
solana-test-validator
```

## Next Steps

1. **Read the Documentation**
   - [README.md](./README.md) - Project overview
   - [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Technical details
   - [SECURITY.md](./SECURITY.md) - Security best practices

2. **Customize the Program**
   - Add your own business logic
   - Extend with additional fields
   - Implement event emissions

3. **Build a Frontend**
   - Use the TypeScript SDK
   - Create a web interface for document verification
   - Build mobile app integration

4. **Deploy to Mainnet**
   - Complete security audit
   - Test thoroughly on devnet
   - Deploy to mainnet-beta

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [TypeScript SDK Examples](./sdk/doublecheck-sdk.ts)

## Support

Need help? 
- Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Review test examples in [tests/](./tests/)
- Open an issue on GitHub

Happy building! 🚀
