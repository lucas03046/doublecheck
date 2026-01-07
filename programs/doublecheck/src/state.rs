use anchor_lang::prelude::*;

#[account]
pub struct AdminState {
    pub admin_wallet: Pubkey,
    pub total_issuers: u64,
    pub created_at: i64,
}

impl AdminState {
    pub const LEN: usize = 32 + 8 + 8;
}

#[account]
pub struct IssuerState {
    pub issuer_pubkey: Pubkey,
    pub is_authorized: bool,
    pub created_at: i64,
    pub name: String,
}

impl IssuerState {
    pub const MAX_NAME_LENGTH: usize = 128;
    pub const LEN: usize = 32 + 1 + 8 + 4 + Self::MAX_NAME_LENGTH;
}

#[account]
pub struct DocumentHash {
    pub document_hash: [u8; 32],
    pub issuer_pubkey: Pubkey,
    pub status: DocumentStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub salt_hash: Option<[u8; 16]>,
}

impl DocumentHash {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 8 + 1 + 16;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DocumentStatus {
    Verified,
    Revoked,
}
