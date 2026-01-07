# Doublecheck - Project Overview

## 📋 Executive Summary

Doublecheck is a decentralized document verification system built on Solana blockchain using the Anchor framework. It enables authorized issuers to register cryptographic hashes of documents on-chain, allowing anyone to verify document authenticity in a trustless manner.

## 🎯 Problem Statement

Traditional document verification systems face several challenges:
- Centralized control and single points of failure
- Lack of transparency in verification process
- Difficulty in tracking document lifecycle
- No immutable audit trail
- Trust dependencies on centralized authorities

## 💡 Solution

Doublecheck leverages Solana blockchain to provide:
- **Decentralized Verification**: No single point of failure
- **Transparency**: All verifications are on-chain and auditable
- **Immutability**: Document records cannot be altered
- **Trustless**: Cryptographic proof instead of trust
- **Fast & Cheap**: Solana's high throughput and low fees

## 🏗️ Architecture

### Three-Tier Account System

```
┌─────────────────┐
│   AdminState    │  ← Singleton, manages system
│   (PDA: admin)  │
└────────┬────────┘
         │
         │ authorizes
         ↓
┌─────────────────┐
│  IssuerState    │  ← Multiple, one per issuer
│  (PDA: issuer)  │
└────────┬────────┘
         │
         │ issues
         ↓
┌─────────────────┐
│ DocumentHash    │  ← Multiple, one per document
│ (PDA: doc_hash) │
└─────────────────┘
```

### Program Flow

```
1. INITIALIZE
   Admin → initialize_admin() → AdminState created

2. REGISTER
   Admin → register_issuer() → IssuerState created

3. ISSUE
   Issuer → issue_document_hash() → DocumentHash created

4. VERIFY
   Anyone → fetch DocumentHash → Check status

5. REVOKE (if needed)
   Issuer → revoke_document() → Status = Revoked
```

## 🔒 Security Model

### Authorization Hierarchy

```
Admin (Root Authority)
  ├── Can initialize system (once)
  ├── Can register issuers
  └── Cannot modify documents
      
Issuer (Authorized by Admin)
  ├── Can issue document hashes
  ├── Can revoke own documents
  └── Can update own document status
      
Anyone (Public)
  └── Can verify documents (read-only)
```

### Security Guarantees

1. **PDA-Based Security**: All accounts use Program Derived Addresses preventing address spoofing
2. **Constraint Validation**: Anchor's constraint system enforces all access controls
3. **Ownership Verification**: Only original issuer can modify their documents
4. **No Panics**: All errors are handled gracefully with custom error codes
5. **Integer Safety**: Checked arithmetic prevents overflow attacks

## 📊 Data Structures

### AdminState (56 bytes)
```rust
{
  admin_wallet: Pubkey,      // 32 bytes - Admin's public key
  total_issuers: u64,        // 8 bytes  - Counter
  created_at: i64,           // 8 bytes  - Unix timestamp
}
```

### IssuerState (181 bytes)
```rust
{
  issuer_pubkey: Pubkey,     // 32 bytes - Issuer's public key
  is_authorized: bool,       // 1 byte   - Authorization flag
  created_at: i64,           // 8 bytes  - Unix timestamp
  name: String,              // 4+128 bytes - Issuer name
}
```

### DocumentHash (106 bytes)
```rust
{
  document_hash: [u8; 32],   // 32 bytes - SHA3-256/SHA-256 hash
  issuer_pubkey: Pubkey,     // 32 bytes - Who issued it
  status: DocumentStatus,    // 1 byte   - Verified/Revoked
  created_at: i64,           // 8 bytes  - Issue timestamp
  updated_at: i64,           // 8 bytes  - Last update timestamp
  salt_hash: Option<[u8;16]>,// 17 bytes - Optional salt
}
```

## 🔧 Instructions

| Instruction | Signer | Parameters | Purpose |
|-------------|--------|------------|---------|
| `initialize_admin` | Admin | - | Create admin state (once) |
| `register_issuer` | Admin | issuer_pubkey, name | Register new issuer |
| `issue_document_hash` | Issuer | hash, salt? | Issue document hash |
| `revoke_document` | Issuer | hash | Revoke document |
| `update_document_status` | Issuer | hash, status | Update document status |

## 🎨 Use Cases

### 1. Educational Certificates (IHK, University)
```
University issues degree hash → Student verifies with employer → 
Employer confirms authenticity on-chain
```

### 2. Legal Documents (Notary, Contracts)
```
Notary issues document hash → Party verifies document → 
Court can verify authenticity
```

### 3. Identity Documents (Passport, ID)
```
Government issues ID hash → Citizen proves identity → 
Verifier checks on-chain
```

### 4. Supply Chain (Origin Certificates)
```
Manufacturer issues origin certificate → Buyer verifies → 
End customer confirms authenticity
```

### 5. Medical Records (Prescriptions, Lab Results)
```
Doctor issues prescription hash → Pharmacy verifies → 
Patient can share with confidence
```

## 📈 Scalability

### Transaction Costs (Solana Devnet/Mainnet)
- Initialize Admin: ~0.001 SOL (one-time)
- Register Issuer: ~0.002 SOL per issuer
- Issue Document: ~0.002 SOL per document
- Revoke/Update: ~0.00001 SOL per operation
- Verify (Read): FREE

### Performance
- TPS: Limited by Solana network (~65,000 TPS theoretical)
- Confirmation: 400ms average (Solana block time)
- Storage: ~106 bytes per document (efficient)
- Query Speed: Sub-second document lookup

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Blockchain | Solana | 1.17+ |
| Framework | Anchor | 0.29.0 |
| Language | Rust | 2021 Edition |
| Client SDK | TypeScript | Latest |
| Testing | Mocha/Chai | Latest |
| Hashing | SHA3-256/SHA-256 | Standard |

## 📦 Deliverables

### Core Program
- ✅ Anchor program with 5 instructions
- ✅ PDA-based account management
- ✅ Comprehensive error handling
- ✅ Security constraints and validation

### Documentation
- ✅ README.md - Project overview
- ✅ DEVELOPER_GUIDE.md - Technical documentation
- ✅ SECURITY.md - Security policy and threat model
- ✅ QUICKSTART.md - Getting started guide
- ✅ CHANGELOG.md - Version history
- ✅ This file - Project overview

### Development Tools
- ✅ TypeScript SDK for client integration
- ✅ Comprehensive test suite
- ✅ Makefile for common operations
- ✅ Proper .gitignore configuration
- ✅ Anchor and Cargo configurations

### Code Organization
```
programs/doublecheck/src/
├── lib.rs                        # Program entry point
├── state.rs                      # Account schemas
├── error.rs                      # Custom errors
├── constants.rs                  # Seeds and constants
└── instructions/                 # Instruction handlers
    ├── initialize_admin.rs
    ├── register_issuer.rs
    ├── issue_document_hash.rs
    ├── revoke_document.rs
    └── update_document_status.rs
```

## 🔄 Development Workflow

```
1. DEVELOPMENT
   Edit code → anchor build → anchor test

2. LOCAL TESTING
   solana-test-validator → anchor deploy → test SDK

3. DEVNET DEPLOYMENT
   Configure devnet → anchor deploy --provider.cluster devnet

4. INTEGRATION
   Use SDK → Build frontend → Test end-to-end

5. MAINNET (Future)
   Security audit → Final testing → Mainnet deployment
```

## 🚀 Getting Started

```bash
# 1. Clone and setup
git clone <repository>
cd doublecheck
yarn install

# 2. Build
anchor build

# 3. Test
anchor test

# 4. Deploy to devnet
anchor deploy --provider.cluster devnet

# 5. Use the SDK
import { DoublecheckClient } from './sdk/doublecheck-sdk';
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Program | ✅ Complete | All 5 instructions implemented |
| Account Schemas | ✅ Complete | AdminState, IssuerState, DocumentHash |
| Error Handling | ✅ Complete | 9 custom error types |
| Security | ✅ Complete | PDA validation, constraints |
| Tests | ✅ Complete | Full coverage of all instructions |
| TypeScript SDK | ✅ Complete | Client library with examples |
| Documentation | ✅ Complete | Comprehensive docs |
| Deployment | 🟡 Pending | Ready for devnet/mainnet |
| Audit | 🟡 Pending | Security audit recommended |

## 🎯 Roadmap

### Phase 1 - Foundation (Current)
- ✅ Core program implementation
- ✅ Basic instructions and accounts
- ✅ Security model
- ✅ Documentation

### Phase 2 - Enhancement (Next)
- ⏳ Event emissions for indexing
- ⏳ Issuer deauthorization
- ⏳ Batch operations
- ⏳ Account closure and rent reclaim

### Phase 3 - Governance (Future)
- ⏳ Multi-admin support
- ⏳ Governance mechanism
- ⏳ DAO integration
- ⏳ Token-based incentives

### Phase 4 - Integration (Future)
- ⏳ Web frontend
- ⏳ Mobile app
- ⏳ REST API service
- ⏳ GraphQL indexer

## 🤝 Contributing

Contributions welcome! Please:
1. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Follow existing code style
3. Add tests for new features
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Solana Foundation for blockchain platform
- Coral (Anchor) for the framework
- Community contributors and testers

## 📞 Contact & Support

- Documentation: See README.md and DEVELOPER_GUIDE.md
- Issues: GitHub Issues
- Security: See SECURITY.md for responsible disclosure

---

**Built with ❤️ on Solana**
