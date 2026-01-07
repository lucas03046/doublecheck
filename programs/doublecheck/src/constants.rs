use anchor_lang::prelude::*;

// PDA Seeds
pub const ADMIN_SEED: &[u8] = b"admin";
pub const ISSUER_SEED: &[u8] = b"issuer";
pub const DOCUMENT_HASH_SEED: &[u8] = b"document_hash";

// Account Size Constraints
pub const MAX_ISSUER_NAME_LENGTH: usize = 128;

// Space calculations for accounts
// AdminState: 8 (discriminator) + 32 (admin_wallet) + 8 (total_issuers) + 8 (created_at) = 56
pub const ADMIN_STATE_SIZE: usize = 8 + 32 + 8 + 8;

// IssuerState: 8 (discriminator) + 32 (issuer_pubkey) + 1 (is_authorized) + 8 (created_at) + 4 (string len) + 128 (name) = 181
pub const ISSUER_STATE_SIZE: usize = 8 + 32 + 1 + 8 + 4 + MAX_ISSUER_NAME_LENGTH;

// DocumentHash: 8 (discriminator) + 32 (document_hash) + 32 (issuer_pubkey) + 1 (status) + 8 (created_at) + 8 (updated_at) + 1 (option) + 16 (salt_hash) = 106
pub const DOCUMENT_HASH_SIZE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 1 + 16;
