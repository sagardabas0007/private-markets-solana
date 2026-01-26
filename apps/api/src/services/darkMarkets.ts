/**
 * Dark Markets Service
 * Handles privacy-preserving prediction markets using DAC tokens
 *
 * Key abstraction: Users interact with USDC, we handle DAC wrapping/unwrapping
 * - On bet: USDC -> DAC (wrap) -> Place bet with DAC
 * - On resolution: Winnings in DAC -> USDC (unwrap) -> User receives USDC
 */

import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { pnpService } from './pnp';

// DAC Token addresses (deployed on devnet)
// DAC SPL Token - standard SPL token compatible with PNP
export const DAC_MINT = new PublicKey('JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo');
export const DAC_PROGRAM_ID = new PublicKey('ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq');
export const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Inco Lightning for FHE operations
export const INCO_LIGHTNING_PROGRAM_ID = new PublicKey('5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj');

/**
 * Check if a market is a Dark Market (uses DAC as collateral)
 * Dark Markets use DAC tokens as collateral instead of USDC
 */
export function isDarkMarket(collateralMint: string): boolean {
  return collateralMint === DAC_MINT.toBase58();
}

/**
 * Find PDAs for DAC token operations
 */
export function findDacAccountPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dac_account'), DAC_MINT.toBuffer(), owner.toBuffer()],
    DAC_PROGRAM_ID
  );
}

export function findVaultPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), DAC_MINT.toBuffer()],
    DAC_PROGRAM_ID
  );
}

export class DarkMarketsService {
  private connection: Connection;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get all Dark Markets (markets using DAC as collateral)
   * These markets provide privacy because DAC is a confidential token
   */
  async getDarkMarkets() {
    const allMarkets = await pnpService.getAllMarkets();

    // Filter to markets using DAC as collateral
    const darkMarkets = allMarkets.data.filter(
      (market) => isDarkMarket(market.account.collateral_token)
    );

    return {
      count: darkMarkets.length,
      data: darkMarkets.map((market) => ({
        ...market,
        isDarkMarket: true,
        privacyNote: 'Bets use DAC tokens - a confidential collateral layer',
      })),
    };
  }

  /**
   * Build a transaction that:
   * 1. Wraps user's USDC to DAC
   * 2. Places a bet on a Dark Market
   *
   * The user signs this transaction with their wallet.
   */
  async buildDarkBetTransaction(params: {
    marketAddress: string;
    side: 'yes' | 'no';
    amountUsdc: number;
    userWallet: PublicKey;
  }): Promise<Transaction> {
    const { marketAddress, side, amountUsdc, userWallet } = params;
    const amountBaseUnits = BigInt(Math.floor(amountUsdc * 1_000_000));

    const transaction = new Transaction();

    // Step 1: Check if user has DAC account, create if needed
    const [dacAccount] = findDacAccountPda(userWallet);
    const dacAccountInfo = await this.connection.getAccountInfo(dacAccount);

    if (!dacAccountInfo) {
      // Add initialize DAC account instruction
      const initDiscriminator = Buffer.from([108, 227, 130, 130, 252, 109, 75, 218]);
      transaction.add({
        keys: [
          { pubkey: dacAccount, isSigner: false, isWritable: true },
          { pubkey: DAC_MINT, isSigner: false, isWritable: false },
          { pubkey: userWallet, isSigner: true, isWritable: true },
          { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
          { pubkey: INCO_LIGHTNING_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: DAC_PROGRAM_ID,
        data: initDiscriminator,
      });
    }

    // Step 2: Wrap USDC to DAC (deposit instruction)
    const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, userWallet);
    const [vault] = findVaultPda();

    const depositDiscriminator = Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]);
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amountBaseUnits);

    transaction.add({
      keys: [
        { pubkey: DAC_MINT, isSigner: false, isWritable: true },
        { pubkey: dacAccount, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: userUsdcAta, isSigner: false, isWritable: true },
        { pubkey: userWallet, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: INCO_LIGHTNING_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: DAC_PROGRAM_ID,
      data: Buffer.concat([depositDiscriminator, amountBuffer]),
    });

    // Step 3: Place bet on the Dark Market using DAC
    // This would be the PNP buyTokens instruction with DAC as collateral
    // For now, we mark this as needing PNP SDK support for building unsigned transactions

    // Set transaction metadata
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = userWallet;

    return transaction;
  }

  /**
   * Get a user's encrypted DAC balance handle
   * The actual balance is encrypted - only the user can decrypt it
   */
  async getUserDacBalance(userWallet: PublicKey): Promise<{
    hasAccount: boolean;
    balanceHandle: string | null;
    note: string;
  }> {
    const [dacAccount] = findDacAccountPda(userWallet);
    const accountInfo = await this.connection.getAccountInfo(dacAccount);

    if (!accountInfo) {
      return {
        hasAccount: false,
        balanceHandle: null,
        note: 'No DAC account. Will be created on first Dark Market bet.',
      };
    }

    // Parse DAC account to get balance handle
    // Skip 8-byte discriminator, 32-byte mint, 32-byte owner
    const balanceOffset = 8 + 32 + 32;
    const balanceHandle = accountInfo.data.readBigUInt64LE(balanceOffset);

    return {
      hasAccount: true,
      balanceHandle: balanceHandle > BigInt(0) ? `0x${balanceHandle.toString(16)}` : null,
      note: 'Balance is encrypted. Only you can decrypt it using Inco.',
    };
  }
}

export const darkMarketsService = new DarkMarketsService();
