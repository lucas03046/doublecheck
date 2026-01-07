use anchor_lang::prelude::*;
use crate::state::{IssuerState, DocumentHash, DocumentStatus};
use crate::constants::*;
use crate::error::DoublecheckError;

#[derive(Accounts)]
#[instruction(document_hash: [u8; 32], salt_hash: Option<[u8; 16]>)]
pub struct IssueDocumentHash<'info> {
    #[account(
        seeds = [ISSUER_SEED, issuer.key().as_ref()],
        bump,
        constraint = issuer_state.is_authorized @ DoublecheckError::IssuerNotAuthorized
    )]
    pub issuer_state: Account<'info, IssuerState>,
    
    #[account(
        init,
        payer = issuer,
        space = 8 + DocumentHash::LEN,
        seeds = [DOCUMENT_HASH_SEED, document_hash.as_ref()],
        bump
    )]
    pub document_hash_account: Account<'info, DocumentHash>,
    
    #[account(mut)]
    pub issuer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<IssueDocumentHash>,
    document_hash: [u8; 32],
    salt_hash: Option<[u8; 16]>,
) -> Result<()> {
    let document_hash_account = &mut ctx.accounts.document_hash_account;
    let clock = Clock::get()?;
    
    document_hash_account.document_hash = document_hash;
    document_hash_account.issuer_pubkey = ctx.accounts.issuer.key();
    document_hash_account.status = DocumentStatus::Verified;
    document_hash_account.created_at = clock.unix_timestamp;
    document_hash_account.updated_at = clock.unix_timestamp;
    document_hash_account.salt_hash = salt_hash;
    
    msg!("Document hash issued: {:?}", document_hash);
    
    Ok(())
}
