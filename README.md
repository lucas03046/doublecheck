# Doublecheck - Solana Document Verification System

A Solana Anchor program for decentralized document verification using cryptographic hashes.

## Overview

Doublecheck allows authorized issuers to register document hashes on-chain for verification purposes. The system uses PDAs (Program Derived Addresses) to manage admin authority, issuer registrations, and document hashes.

## Architecture

### Account Structures

#### AdminState (PDA: "admin")
- `admin_wallet: Pubkey` - The authorized admin address
- `total_issuers: u64` - Total number of registered issuers
- `created_at: i64` - Unix timestamp of creation

#### IssuerState (PDA: "issuer" + issuer_pubkey)
- `issuer_pubkey: Pubkey` - The issuer's public key
- `is_authorized: bool` - Authorization status
- `created_at: i64` - Unix timestamp of registration
- `name: String` - Issuer name (max 128 chars)

#### DocumentHash (PDA: "document_hash" + sha3_256_hash)
- `document_hash: [u8; 32]` - SHA3-256 or SHA-256 hash of document
- `issuer_pubkey: Pubkey` - Who registered the document
- `status: DocumentStatus` - Verified or Revoked
- `created_at: i64` - Unix timestamp of issuance
- `updated_at: i64` - Unix timestamp of last update
- `salt_hash: Option<[u8; 16]>` - Optional salt hash

#### DocumentStatus Enum
- `Verified = 0` - Document is verified
- `Revoked = 1` - Document has been revoked

## Instructions

### 1. initialize_admin
Initializes the admin state account. Can only be called once.

**Accounts:**
- `admin_state` - PDA account to initialize
- `admin` - Signer who becomes the admin
- `system_program` - System program

**Errors:**
- `AdminAlreadyInitialized` - If admin state already exists

### 2. register_issuer
Registers a new issuer. Only callable by admin.

**Parameters:**
- `issuer_pubkey: Pubkey` - Public key of the issuer to register
- `issuer_name: String` - Name of the issuer (max 128 chars)

**Accounts:**
- `admin_state` - Admin state PDA (must match signer)
- `issuer_state` - New issuer state PDA to create
- `admin` - Admin signer
- `system_program` - System program

**Errors:**
- `UnauthorizedAdmin` - If signer is not the admin
- `IssuerAlreadyRegistered` - If issuer already exists
- `IssuerNameTooLong` - If name exceeds 128 characters

### 3. issue_document_hash
Issues a new document hash. Only callable by authorized issuers.

**Parameters:**
- `document_hash: [u8; 32]` - SHA3-256 or SHA-256 hash of document
- `salt_hash: Option<[u8; 16]>` - Optional salt hash

**Accounts:**
- `issuer_state` - Issuer's state PDA
- `document_hash_account` - New document hash PDA to create
- `issuer` - Issuer signer
- `system_program` - System program

**Errors:**
- `IssuerNotAuthorized` - If issuer is not authorized
- `DocumentAlreadyExists` - If document hash already registered

### 4. revoke_document
Revokes a document. Only callable by the original issuer.

**Parameters:**
- `document_hash: [u8; 32]` - Hash of document to revoke

**Accounts:**
- `document_hash_account` - Document hash PDA to update
- `issuer` - Original issuer signer

**Errors:**
- `DocumentNotFound` - If document doesn't exist
- `UnauthorizedIssuer` - If signer is not the original issuer

### 5. update_document_status
Updates document status. Only callable by the original issuer.

**Parameters:**
- `document_hash: [u8; 32]` - Hash of document to update
- `new_status: DocumentStatus` - New status to set

**Accounts:**
- `document_hash_account` - Document hash PDA to update
- `issuer` - Original issuer signer

**Errors:**
- `DocumentNotFound` - If document doesn't exist
- `UnauthorizedIssuer` - If signer is not the original issuer

## Security Features

- **PDA Validation**: All accounts use PDAs with specific seeds to prevent address collisions
- **Signer Checks**: Admin and issuer signatures are validated on all privileged operations
- **Authorization**: Issuers must be registered and authorized before issuing documents
- **Ownership**: Only original issuers can modify their documents
- **No Panics**: All errors use custom error codes instead of panicking

## Development

### Prerequisites
- Rust 1.70+
- Solana CLI 1.17+
- Anchor 0.29.0
- Node.js 16+

### Build
```bash
anchor build
```

### Test
```bash
anchor test
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

## Project Structure

```
doublecheck/
├── programs/
│   └── doublecheck/
│       ├── src/
│       │   ├── lib.rs                    # Program entrypoint
│       │   ├── state.rs                  # Account structures
│       │   ├── error.rs                  # Error definitions
│       │   ├── constants.rs              # Constants and seeds
│       │   └── instructions/
│       │       ├── mod.rs
│       │       ├── initialize_admin.rs
│       │       ├── register_issuer.rs
│       │       ├── issue_document_hash.rs
│       │       ├── revoke_document.rs
│       │       └── update_document_status.rs
│       └── Cargo.toml
├── tests/                                # TypeScript tests
├── Anchor.toml                           # Anchor configuration
├── Cargo.toml                            # Workspace configuration
└── package.json                          # Node dependencies
```

## License

MIT

## Next Steps

- Add TypeScript SDK for frontend integration
- Implement comprehensive test suite
- Add event emissions for indexing
- Deploy to Devnet/Mainnet
- Build frontend application
