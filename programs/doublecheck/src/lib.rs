use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::DocumentStatus;

declare_id!("DoubLeCHecKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod doublecheck {
    use super::*;

    pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
        instructions::initialize_admin::handler(ctx)
    }

    pub fn register_issuer(
        ctx: Context<RegisterIssuer>,
        issuer_pubkey: Pubkey,
        issuer_name: String,
    ) -> Result<()> {
        instructions::register_issuer::handler(ctx, issuer_pubkey, issuer_name)
    }

    pub fn issue_document_hash(
        ctx: Context<IssueDocumentHash>,
        document_hash: [u8; 32],
        salt_hash: Option<[u8; 16]>,
    ) -> Result<()> {
        instructions::issue_document_hash::handler(ctx, document_hash, salt_hash)
    }

    pub fn revoke_document(
        ctx: Context<RevokeDocument>,
        document_hash: [u8; 32],
    ) -> Result<()> {
        instructions::revoke_document::handler(ctx, document_hash)
    }

    pub fn update_document_status(
        ctx: Context<UpdateDocumentStatus>,
        document_hash: [u8; 32],
        new_status: DocumentStatus,
    ) -> Result<()> {
        instructions::update_document_status::handler(ctx, document_hash, new_status)
    }
}
