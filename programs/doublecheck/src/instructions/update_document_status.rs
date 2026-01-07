use anchor_lang::prelude::*;
use crate::state::{DocumentHash, DocumentStatus};
use crate::constants::*;
use crate::error::DoublecheckError;

#[derive(Accounts)]
#[instruction(document_hash: [u8; 32], new_status: DocumentStatus)]
pub struct UpdateDocumentStatus<'info> {
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
    ctx: Context<UpdateDocumentStatus>,
    _document_hash: [u8; 32],
    new_status: DocumentStatus,
) -> Result<()> {
    let document_hash_account = &mut ctx.accounts.document_hash_account;
    let clock = Clock::get()?;
    
    document_hash_account.status = new_status;
    document_hash_account.updated_at = clock.unix_timestamp;
    
    msg!("Document status updated: {:?} to {:?}", document_hash_account.document_hash, new_status);
    
    Ok(())
}
