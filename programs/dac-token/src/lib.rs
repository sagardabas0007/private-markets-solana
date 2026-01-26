use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use inco_lightning::{
    cpi::accounts::{Operation, Allow, VerifySignature},
    cpi::{e_add, e_sub, new_euint128, allow, is_validsignature},
    types::{Euint128, Ebool},
    ID as INCO_LIGHTNING_ID,
};

declare_id!("ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq");

/// Dark Alpha Confidential (DAC) Token Program
///
/// This program provides privacy-preserving collateral for prediction markets.
/// Users deposit USDC to mint encrypted DAC tokens. Their positions remain
/// confidential until market resolution, when they can withdraw winnings
/// by providing proof of their encrypted position.

#[program]
pub mod dac_token {
    use super::*;

    /// Initialize the DAC token mint
    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        decimals: u8,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.dac_mint;
        mint.authority = ctx.accounts.authority.key();
        mint.usdc_mint = ctx.accounts.usdc_mint.key();
        mint.decimals = decimals;
        mint.is_initialized = true;
        mint.total_supply_handle = 0;
        mint.vault_bump = ctx.bumps.vault_usdc;

        msg!("DAC Mint initialized with {} decimals", decimals);
        Ok(())
    }

    /// Initialize a confidential token account for a user
    pub fn initialize_account(ctx: Context<InitializeAccount>) -> Result<()> {
        let account = &mut ctx.accounts.dac_account;
        account.mint = ctx.accounts.dac_mint.key();
        account.owner = ctx.accounts.owner.key();
        account.balance_handle = 0;
        account.state = AccountState::Initialized;
        account.bump = ctx.bumps.dac_account;

        msg!("DAC Account initialized for {}", ctx.accounts.owner.key());
        Ok(())
    }

    /// Deposit USDC and mint encrypted DAC tokens
    /// The amount minted is encrypted - only the depositor knows their true balance
    pub fn deposit<'info>(
        ctx: Context<'_, '_, '_, 'info, Deposit<'info>>,
        usdc_amount: u64,
        encrypted_amount: Vec<u8>,
    ) -> Result<()> {
        // Transfer USDC from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc.to_account_info(),
            to: ctx.accounts.vault_usdc.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, usdc_amount)?;

        // Create encrypted amount handle via Inco Lightning
        let inco_program = ctx.accounts.inco_lightning_program.to_account_info();
        let signer = ctx.accounts.user.to_account_info();

        let cpi_ctx = CpiContext::new(
            inco_program.clone(),
            Operation { signer: signer.clone() },
        );

        let new_handle: Euint128 = new_euint128(cpi_ctx, encrypted_amount, 0)?;

        // Add to user's balance using encrypted addition
        let account = &mut ctx.accounts.dac_account;
        if account.balance_handle == 0 {
            // First deposit - just set the handle
            account.balance_handle = new_handle.0;
        } else {
            // Add to existing balance
            let cpi_ctx = CpiContext::new(
                inco_program.clone(),
                Operation { signer: signer.clone() },
            );
            let new_balance: Euint128 = e_add(
                cpi_ctx,
                Euint128(account.balance_handle),
                new_handle,
                0,
            )?;
            account.balance_handle = new_balance.0;
        }

        // Grant decryption access to owner via remaining_accounts
        if ctx.remaining_accounts.len() >= 2 {
            let allowance_account = &ctx.remaining_accounts[0];
            let allowed_address = &ctx.remaining_accounts[1];

            let cpi_ctx = CpiContext::new(
                inco_program.clone(),
                Allow {
                    allowance_account: allowance_account.clone(),
                    signer: signer.clone(),
                    allowed_address: allowed_address.clone(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            );
            allow(cpi_ctx, account.balance_handle, true, ctx.accounts.user.key())?;
        }

        msg!("Deposited {} USDC, minted encrypted DAC tokens", usdc_amount);
        Ok(())
    }

    /// Transfer encrypted DAC tokens between accounts
    pub fn transfer_tokens<'info>(
        ctx: Context<'_, '_, '_, 'info, TransferDac<'info>>,
        encrypted_amount: Vec<u8>,
    ) -> Result<()> {
        let inco_program = ctx.accounts.inco_lightning_program.to_account_info();
        let signer = ctx.accounts.authority.to_account_info();

        // Create encrypted amount handle
        let cpi_ctx = CpiContext::new(
            inco_program.clone(),
            Operation { signer: signer.clone() },
        );

        let transfer_amount: Euint128 = new_euint128(cpi_ctx, encrypted_amount, 0)?;

        // Subtract from source (encrypted subtraction)
        let source = &mut ctx.accounts.source;
        let cpi_ctx = CpiContext::new(
            inco_program.clone(),
            Operation { signer: signer.clone() },
        );
        let new_source_balance: Euint128 = e_sub(
            cpi_ctx,
            Euint128(source.balance_handle),
            transfer_amount,
            0,
        )?;
        source.balance_handle = new_source_balance.0;

        // Add to destination (encrypted addition)
        let destination = &mut ctx.accounts.destination;
        let cpi_ctx = CpiContext::new(
            inco_program.clone(),
            Operation { signer: signer.clone() },
        );

        if destination.balance_handle == 0 {
            destination.balance_handle = transfer_amount.0;
        } else {
            let new_dest_balance: Euint128 = e_add(
                cpi_ctx,
                Euint128(destination.balance_handle),
                transfer_amount,
                0,
            )?;
            destination.balance_handle = new_dest_balance.0;
        }

        // Grant allowances via remaining_accounts
        // [0] source_allowance, [1] source_owner, [2] dest_allowance, [3] dest_owner
        if ctx.remaining_accounts.len() >= 4 {
            // Source allowance
            let cpi_ctx = CpiContext::new(
                inco_program.clone(),
                Allow {
                    allowance_account: ctx.remaining_accounts[0].clone(),
                    signer: signer.clone(),
                    allowed_address: ctx.remaining_accounts[1].clone(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            );
            allow(cpi_ctx, new_source_balance.0, true, source.owner)?;

            // Destination allowance
            let cpi_ctx = CpiContext::new(
                inco_program.clone(),
                Allow {
                    allowance_account: ctx.remaining_accounts[2].clone(),
                    signer: signer.clone(),
                    allowed_address: ctx.remaining_accounts[3].clone(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            );
            allow(cpi_ctx, destination.balance_handle, true, destination.owner)?;
        }

        msg!("Transferred encrypted DAC tokens");
        Ok(())
    }

    /// Withdraw USDC by proving ownership of encrypted DAC balance
    /// This is the key privacy feature - users provide a verified decryption
    /// proof to withdraw their funds
    pub fn withdraw(
        ctx: Context<Withdraw>,
        balance_handle: Vec<u8>,
        plaintext_amount: Vec<u8>,
    ) -> Result<()> {
        let inco_program = ctx.accounts.inco_lightning_program.to_account_info();
        let signer = ctx.accounts.user.to_account_info();

        // Verify the decryption signature on-chain
        // This proves the user knows the plaintext of their encrypted balance
        let cpi_ctx = CpiContext::new(
            inco_program,
            VerifySignature {
                instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                signer: signer.clone(),
            },
        );

        is_validsignature(
            cpi_ctx,
            1,
            Some(vec![balance_handle]),
            Some(vec![plaintext_amount.clone()]),
        )?;

        // Parse the verified plaintext to get the actual amount
        let amount = parse_plaintext_to_u64(&plaintext_amount)?;
        require!(amount > 0, DacError::ZeroAmount);

        // Transfer USDC from vault to user
        let dac_mint_key = ctx.accounts.dac_mint.key();
        let seeds = &[
            b"vault",
            dac_mint_key.as_ref(),
            &[ctx.accounts.dac_mint.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;

        // Zero out the user's balance (they've withdrawn everything)
        let account = &mut ctx.accounts.dac_account;
        account.balance_handle = 0;

        msg!("Withdrew {} USDC (privacy-verified)", amount);
        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct DacMint {
    /// Authority that can mint tokens (market program)
    pub authority: Pubkey,
    /// The underlying USDC mint
    pub usdc_mint: Pubkey,
    /// Token decimals (matches USDC - 6)
    pub decimals: u8,
    /// Is initialized
    pub is_initialized: bool,
    /// Encrypted total supply
    pub total_supply_handle: u128,
    /// Vault PDA bump
    pub vault_bump: u8,
}

impl DacMint {
    pub const LEN: usize = 32 + 32 + 1 + 1 + 16 + 1; // 83 bytes
}

#[account]
pub struct DacAccount {
    /// The mint this account belongs to
    pub mint: Pubkey,
    /// Owner of this account
    pub owner: Pubkey,
    /// Encrypted balance (Inco handle)
    pub balance_handle: u128,
    /// Account state
    pub state: AccountState,
    /// PDA bump
    pub bump: u8,
}

impl DacAccount {
    pub const LEN: usize = 32 + 32 + 16 + 1 + 1; // 82 bytes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AccountState {
    Uninitialized,
    Initialized,
    Frozen,
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DacMint::LEN,
        seeds = [b"dac_mint"],
        bump
    )]
    pub dac_mint: Account<'info, DacMint>,

    /// The underlying USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// The USDC vault for holding deposited funds
    #[account(
        init,
        payer = authority,
        seeds = [b"vault", dac_mint.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = vault_usdc,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializeAccount<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + DacAccount::LEN,
        seeds = [b"dac_account", dac_mint.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub dac_account: Account<'info, DacAccount>,

    #[account(constraint = dac_mint.is_initialized @ DacError::UninitializedMint)]
    pub dac_mint: Account<'info, DacMint>,

    /// CHECK: The owner of the new account
    pub owner: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub dac_mint: Account<'info, DacMint>,

    #[account(
        mut,
        constraint = dac_account.owner == user.key() @ DacError::NotOwner,
        constraint = dac_account.state == AccountState::Initialized @ DacError::AccountNotInitialized,
    )]
    pub dac_account: Account<'info, DacAccount>,

    #[account(
        mut,
        constraint = user_usdc.owner == user.key(),
        constraint = user_usdc.mint == dac_mint.usdc_mint,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", dac_mint.key().as_ref()],
        bump = dac_mint.vault_bump,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct TransferDac<'info> {
    #[account(
        mut,
        constraint = source.owner == authority.key() @ DacError::NotOwner,
        constraint = source.state == AccountState::Initialized @ DacError::AccountNotInitialized,
    )]
    pub source: Account<'info, DacAccount>,

    #[account(
        mut,
        constraint = destination.state == AccountState::Initialized @ DacError::AccountNotInitialized,
        constraint = destination.mint == source.mint @ DacError::MintMismatch,
    )]
    pub destination: Account<'info, DacAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub dac_mint: Account<'info, DacMint>,

    #[account(
        mut,
        constraint = dac_account.owner == user.key() @ DacError::NotOwner,
        constraint = dac_account.state == AccountState::Initialized @ DacError::AccountNotInitialized,
    )]
    pub dac_account: Account<'info, DacAccount>,

    #[account(
        mut,
        constraint = user_usdc.owner == user.key(),
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", dac_mint.key().as_ref()],
        bump = dac_mint.vault_bump,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    /// CHECK: Vault authority PDA
    #[account(seeds = [b"vault", dac_mint.key().as_ref()], bump = dac_mint.vault_bump)]
    pub vault_authority: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Sysvar instructions for signature verification
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub sysvar_instructions: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_lightning_program: AccountInfo<'info>,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum DacError {
    #[msg("Mint is not initialized")]
    UninitializedMint,
    #[msg("Account is not initialized")]
    AccountNotInitialized,
    #[msg("Not the owner of this account")]
    NotOwner,
    #[msg("Mint mismatch")]
    MintMismatch,
    #[msg("Cannot withdraw zero amount")]
    ZeroAmount,
    #[msg("Invalid plaintext format")]
    InvalidPlaintext,
}

// ============================================================================
// Helpers
// ============================================================================

/// Parse a plaintext bytes array to u64
fn parse_plaintext_to_u64(plaintext: &[u8]) -> Result<u64> {
    if plaintext.len() < 8 {
        let mut padded = [0u8; 8];
        padded[..plaintext.len()].copy_from_slice(plaintext);
        Ok(u64::from_le_bytes(padded))
    } else {
        let bytes: [u8; 8] = plaintext[..8]
            .try_into()
            .map_err(|_| DacError::InvalidPlaintext)?;
        Ok(u64::from_le_bytes(bytes))
    }
}
