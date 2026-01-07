use anchor_lang::prelude::*;
use crate::state::{AdminState, IssuerState};
use crate::constants::*;
use crate::error::DoublecheckError;

#[derive(Accounts)]
#[instruction(issuer_pubkey: Pubkey, issuer_name: String)]
pub struct RegisterIssuer<'info> {
    #[account(
        mut,
        seeds = [ADMIN_SEED],
        bump,
        constraint = admin_state.admin_wallet == admin.key() @ DoublecheckError::UnauthorizedAdmin
    )]
    pub admin_state: Account<'info, AdminState>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + IssuerState::LEN,
        seeds = [ISSUER_SEED, issuer_pubkey.as_ref()],
        bump
    )]
    pub issuer_state: Account<'info, IssuerState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterIssuer>,
    issuer_pubkey: Pubkey,
    issuer_name: String,
) -> Result<()> {
    require!(
        issuer_name.len() <= IssuerState::MAX_NAME_LENGTH,
        DoublecheckError::IssuerNameTooLong
    );
    
    let issuer_state = &mut ctx.accounts.issuer_state;
    let admin_state = &mut ctx.accounts.admin_state;
    let clock = Clock::get()?;
    
    issuer_state.issuer_pubkey = issuer_pubkey;
    issuer_state.is_authorized = true;
    issuer_state.created_at = clock.unix_timestamp;
    issuer_state.name = issuer_name.clone();
    
    admin_state.total_issuers = admin_state.total_issuers.checked_add(1).unwrap();
    
    msg!("Issuer registered: {} - {}", issuer_pubkey, issuer_name);
    
    Ok(())
}
