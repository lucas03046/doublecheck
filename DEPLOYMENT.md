# Deployment Guide - Doublecheck

This guide walks through deploying the Doublecheck program to Solana networks.

## Prerequisites Checklist

Before deploying, ensure:

- [ ] Solana CLI installed and configured
- [ ] Anchor CLI installed (v0.29.0+)
- [ ] Program built successfully (`anchor build`)
- [ ] All tests passing (`anchor test`)
- [ ] Sufficient SOL in deployment wallet
- [ ] Security review completed (for mainnet)

## Deployment Environments

### 1. Local (Development)

**Use Case**: Local development and quick testing

```bash
# Start local validator
solana-test-validator

# In another terminal
anchor build
anchor deploy

# Get program ID
solana program show <PROGRAM_ID>
```

**Costs**: Free (local)

### 2. Devnet (Testing)

**Use Case**: Integration testing, frontend development

```bash
# Configure for devnet
solana config set --url devnet

# Check balance
solana balance

# Airdrop SOL if needed
solana airdrop 2

# Deploy
anchor build
anchor deploy --provider.cluster devnet
```

**Costs**: Free (airdrop available)

**Devnet RPC**: `https://api.devnet.solana.com`

### 3. Mainnet-Beta (Production)

**Use Case**: Production deployment

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Verify balance (need real SOL)
solana balance

# Deploy
anchor build --verifiable
anchor deploy --provider.cluster mainnet-beta
```

**Costs**: ~2-5 SOL for deployment + rent

**Mainnet RPC**: `https://api.mainnet-beta.solana.com`

## Step-by-Step Deployment

### Phase 1: Pre-Deployment

#### 1.1 Build and Verify

```bash
# Clean build
make clean
make build

# Verify compilation
ls -la target/deploy/

# Should see:
# - doublecheck.so (program binary)
# - doublecheck-keypair.json (program keypair)
```

#### 1.2 Run Tests

```bash
# Run all tests
anchor test

# Verify all tests pass
# Should see: X passing (Xs)
```

#### 1.3 Generate Program ID

```bash
# The program ID is in target/deploy/doublecheck-keypair.json
solana address -k target/deploy/doublecheck-keypair.json

# Update lib.rs with the actual program ID
# declare_id!("YourProgramIdHere");
```

#### 1.4 Security Checklist

For mainnet deployment:

- [ ] Code review completed
- [ ] Security audit performed
- [ ] Test coverage > 90%
- [ ] All error cases handled
- [ ] PDA seeds validated
- [ ] Access controls verified
- [ ] Integer overflow checks in place
- [ ] No panics in code
- [ ] Documentation complete

### Phase 2: Devnet Deployment

#### 2.1 Configure Environment

```bash
# Set cluster
solana config set --url devnet

# Generate deployment wallet (or use existing)
solana-keygen new -o ~/.config/solana/devnet-deployer.json

# Set as default
solana config set --keypair ~/.config/solana/devnet-deployer.json

# Airdrop SOL
solana airdrop 2
```

#### 2.2 Update Anchor.toml

```toml
[programs.devnet]
doublecheck = "YourProgramIdHere"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/devnet-deployer.json"
```

#### 2.3 Deploy

```bash
# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Save output:
# Program Id: YourProgramIdHere
```

#### 2.4 Verify Deployment

```bash
# Check program info
solana program show YourProgramIdHere

# Should show:
# - Program Id
# - Owner: BPFLoaderUpgradeable
# - ProgramData Address
# - Authority
# - Last Deployed Slot
# - Data Length
```

#### 2.5 Initialize System

```bash
# Create initialization script: scripts/initialize.ts
```

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Doublecheck } from "../target/types/doublecheck";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Doublecheck as Program<Doublecheck>;
  
  // Initialize admin
  const [adminPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("admin")],
    program.programId
  );

  console.log("Initializing admin...");
  const tx = await program.methods
    .initializeAdmin()
    .accounts({
      adminState: adminPda,
      admin: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Admin initialized!");
  console.log("Transaction:", tx);
  console.log("Admin PDA:", adminPda.toString());
}

main().catch(console.error);
```

```bash
# Run initialization
ts-node scripts/initialize.ts
```

### Phase 3: Mainnet Deployment

#### 3.1 Final Preparations

```bash
# Create mainnet deployer wallet with sufficient SOL
solana-keygen new -o ~/.config/solana/mainnet-deployer.json

# Transfer SOL to deployer
# Estimate: 2-5 SOL for deployment + operations

# Verify balance
solana balance ~/.config/solana/mainnet-deployer.json
```

#### 3.2 Verifiable Build

```bash
# Build verifiable program
anchor build --verifiable

# This creates a Docker image for reproducible builds
```

#### 3.3 Update Configuration

```toml
# Anchor.toml
[programs.mainnet]
doublecheck = "YourFinalProgramIdHere"

[provider]
cluster = "Mainnet"
wallet = "~/.config/solana/mainnet-deployer.json"
```

#### 3.4 Deploy to Mainnet

```bash
# Set cluster
solana config set --url mainnet-beta

# Set keypair
solana config set --keypair ~/.config/solana/mainnet-deployer.json

# Final check
solana config get

# Deploy
anchor deploy --provider.cluster mainnet-beta

# ⚠️ THIS WILL COST REAL SOL
```

#### 3.5 Verify Mainnet Deployment

```bash
# Verify program
solana program show YourProgramIdHere --url mainnet-beta

# Test read operations
solana account YourProgramIdHere --url mainnet-beta
```

#### 3.6 Initialize Mainnet

```bash
# Run initialization on mainnet
ts-node scripts/initialize.ts

# Verify admin state
# Check transaction on Solana Explorer
```

## Post-Deployment

### 1. Update Documentation

```bash
# Update README.md with program ID
# Update SDK with program ID
# Update frontend configuration
```

### 2. Register Issuers

```typescript
// scripts/register-issuer.ts
await program.methods
  .registerIssuer(issuerPubkey, "IHK München")
  .accounts({...})
  .rpc();
```

### 3. Monitor Program

```bash
# Check program logs
solana logs YourProgramIdHere

# Monitor transactions
# Use Solana Explorer: https://explorer.solana.com
```

### 4. Setup Monitoring

```bash
# Monitor program account changes
solana account YourProgramIdHere --watch

# Setup alerts for:
# - Failed transactions
# - Unusual activity
# - Account size changes
```

## Program Upgrade

To upgrade the program after deployment:

```bash
# Build new version
anchor build

# Upgrade (requires upgrade authority)
solana program deploy \
  --program-id YourProgramIdHere \
  --upgrade-authority ~/.config/solana/mainnet-deployer.json \
  target/deploy/doublecheck.so

# Or with anchor
anchor upgrade target/deploy/doublecheck.so \
  --program-id YourProgramIdHere \
  --provider.cluster mainnet-beta
```

## Costs Breakdown

### Devnet
- Deployment: Free (airdrop)
- Operations: Free (airdrop)
- Testing: Free

### Mainnet
- Initial Deployment: ~2-5 SOL
- Program Account Rent: ~0.5 SOL (one-time, refundable)
- Per Transaction: ~0.00001 SOL
- Account Creation: ~0.002 SOL per account

### Rent Calculation

```bash
# Calculate rent for account
solana rent <SIZE_IN_BYTES>

# AdminState (56 bytes)
solana rent 56

# IssuerState (181 bytes)
solana rent 181

# DocumentHash (106 bytes)
solana rent 106
```

## Troubleshooting

### Issue: "insufficient funds"

```bash
# Check balance
solana balance

# For devnet
solana airdrop 2

# For mainnet
# Transfer SOL to deployer wallet
```

### Issue: "Program already deployed"

```bash
# Either use existing program or generate new keypair
solana-keygen new -o target/deploy/doublecheck-keypair.json --force
```

### Issue: "Account already initialized"

```bash
# Admin can only be initialized once
# Use existing admin account or deploy new program
```

### Issue: "Transaction simulation failed"

```bash
# Check program logs
solana logs

# Verify account addresses
# Check constraints in code
```

## Rollback Plan

If deployment fails or issues are discovered:

### Option 1: Upgrade Program

```bash
# Fix issue in code
# Build and upgrade
anchor build
anchor upgrade --program-id <ID>
```

### Option 2: Deploy New Program

```bash
# Generate new program ID
solana-keygen new -o target/deploy/doublecheck-keypair.json --force

# Update lib.rs with new ID
# Rebuild and deploy
anchor build
anchor deploy
```

### Option 3: Close Program (if needed)

```bash
# Close program and reclaim rent
solana program close <PROGRAM_ID> \
  --authority ~/.config/solana/mainnet-deployer.json
```

## Security Best Practices

1. **Protect Upgrade Authority**
   - Use hardware wallet or multisig
   - Never commit private keys
   - Store in secure location

2. **Verify Program ID**
   - Double-check program ID in all configurations
   - Verify on Solana Explorer
   - Document in all integration points

3. **Test Thoroughly**
   - Test on devnet extensively
   - Simulate all operations
   - Test error conditions

4. **Monitor Continuously**
   - Watch program logs
   - Track transaction patterns
   - Alert on anomalies

5. **Backup Configuration**
   - Save all deployment details
   - Document program IDs
   - Keep keypair backups secure

## Checklist: Ready for Mainnet?

- [ ] Security audit completed
- [ ] All tests passing (100% coverage)
- [ ] Devnet deployment tested
- [ ] Integration tests successful
- [ ] Documentation complete
- [ ] Frontend integration tested
- [ ] Monitoring setup ready
- [ ] Sufficient SOL in deployer wallet
- [ ] Upgrade authority secured
- [ ] Rollback plan documented
- [ ] Team trained on operations
- [ ] Legal/compliance review (if applicable)

## Support

For deployment issues:
- Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Review [Anchor Docs](https://www.anchor-lang.com/)
- Ask in Solana Discord

## Resources

- [Solana CLI Reference](https://docs.solana.com/cli)
- [Anchor Deploy Guide](https://www.anchor-lang.com/docs/cli)
- [Solana Explorer](https://explorer.solana.com)
- [Solana Status](https://status.solana.com)

---

**Remember**: Always test on devnet before mainnet deployment!
