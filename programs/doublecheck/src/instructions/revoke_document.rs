use anchor_lang::prelude::*;
use crate::state::{DocumentHash, DocumentStatus};
use crate::constants::*;
use crate::error::DoublecheckError;

#[derive(Accounts)]
#[instruction(document_hash: [u8; 32])]
pub struct RevokeDocument<'info> {
    #[account(
        mut,
        seeds = [DOCUMENT_HASH_SEED, document_hash.as_ref()],
        bump,
        constraint = document_hash_account.issuer_pubkey == issuer.key() @ DoublecheckError::UnauthorizedIssuer
    )]
    pub document_hash_account: Account<'info, DocumentHash>,
    
    pub issuer: Signer<'info>,
}

pub fn handler(
    ctx: Context<RevokeDocument>,
    _document_hash: [u8; 32],
) -> Result<()> {
    let document_hash_account = &mut ctx.accounts.document_hash_account;
    let clock = Clock::get()?;
    
    document_hash_account.status = DocumentStatus::Revoked;
    document_hash_account.updated_at = clock.unix_timestamp;
    
    msg!("Document revoked: {:?}", document_hash_account.document_hash);
    
    Ok(())
}
