use anchor_lang::prelude::*;
use crate::state::AdminState;
use crate::constants::*;
use crate::error::DoublecheckError;

#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + AdminState::LEN,
        seeds = [ADMIN_SEED],
        bump
    )]
    pub admin_state: Account<'info, AdminState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeAdmin>) -> Result<()> {
    let admin_state = &mut ctx.accounts.admin_state;
    let clock = Clock::get()?;
    
    admin_state.admin_wallet = ctx.accounts.admin.key();
    admin_state.total_issuers = 0;
    admin_state.created_at = clock.unix_timestamp;
    
    msg!("Admin initialized: {}", admin_state.admin_wallet);
    
    Ok(())
}
