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

// Known V3 Dark Markets (these use PNP V3 format with proper token initialization)
// V3 markets don't show up in fetchMarkets(), so we need to track them explicitly
export const V3_DARK_MARKETS = [
  {
    address: '6SSj451YJjniHr79baxSdZ2vJxgJZAdj4B6EEqCFXyq7',
    question: '[V3] Will Bitcoin reach $150,000 by end of Q2 2025?',
    yesMint: 'HUXdQ3pbMeuBe6S6UidnQfjv5i76uuUPSjTnmn2Pz13f',
    noMint: '2UKELvG27TbhZbCFP7qjANXmpBpAQWbBcqc3KhQosZCg',
  },
  {
    address: 'bkSZH6kY2bdCbRfry6QRvqnD3dehrEMYqj4xz63Kp46',
    question: '[V3] Will Ethereum flip Bitcoin in market cap by 2026?',
    yesMint: '5N3jcPWwB52sptjbzaAkGLeYL3DdDrn3KZEHdzu8xUCr',
    noMint: 'EvaGQRqZ2KjLJFnzhDwrgoRMD8LU6wD72TPK7Tfrvr9W',
  },
  {
    address: 'DugnJKvPQGYzyCut5PPsZNDNLYXrf6SdUDmdfCZ5gcsH',
    question: '[V3] Will Solana process over 100,000 TPS by mid-2025?',
    yesMint: 'Fc5sbkbVmrFjPJrtaM4Go1x5YMpB2CtwHkYf3cxB96gM',
    noMint: '91D53xWathxnxwJXKewvGibsqHBFvkjrPasaWYtzMJH4',
  },
  // New DAC V3 markets created 2025-01-28
  {
    address: '8hNtfctyJ5n1T5f4kBEMwXsUkrxeikGZR8T5Ed2SyFSv',
    question: '[DAC-V3] Will a top-10 crypto exchange fail in 2025?',
    yesMint: '8fkLFdSLvnAxJ3nz6d98L8oqe98YVWYuJDMGqmqcWSWh',
    noMint: '3cNC4pCWtectFB8K2SrGmr3nvmxQ25TKtzTywbbR5c5q',
  },
  {
    address: 'DgVN55mUjZgcXRJZLMtqeZstbfxDPFD8LnTLtXC5X1vq',
    question: '[DAC-V3] Will Solana surpass Ethereum in daily transactions by Q4 2025?',
    yesMint: '2L6H9ydpV3V7DNgJL4rocvdj7LNzTtv5r3QfamoQbqGr',
    noMint: '3cXNXZyL7g36swXMMsyr2QJEbEGexh68tra5U67NrhK7',
  },
];

// Known V3 USDC Markets (regular tradeable markets with USDC collateral)
export const V3_USDC_MARKETS = [
  {
    address: 'G8WPkiXPAnsNnpwEdkwinSD4HTVscHxmSmnbpUMK5T2Q',
    question: '[USDC-V3] Will the S&P 500 close above 6000 by March 2025?',
    yesMint: 'GDqNHeUWLvPBnvAH3DR93DLZqLuyueBUDaCG5SPRotdX',
    noMint: 'DHncC6MK131UT7vd4MdZFsrPVfn31wrGRyiZnurquCxQ',
  },
  {
    address: 'Be7CZRk3ecWpRGhApeMWHyiqZ5xcEzF5vZTsqXfeoYWp',
    question: '[USDC-V3] Will there be a major AI regulation passed in the US by 2025?',
    yesMint: '9fPiGS7GeZtA4dcLutSLekhWV6ovUPL3v9KsMiKsaPye',
    noMint: 'AsksMWZc5MZ6zaN3f3x9baRVcqNRDrHQfmD8EDk44Nrh',
  },
];

// Combined list of all V3 markets
export const ALL_V3_MARKETS = [...V3_DARK_MARKETS, ...V3_USDC_MARKETS];

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
   * Includes both V2 and V3 markets. V3 markets support trading.
   */
  async getDarkMarkets() {
    const allMarkets = await pnpService.getAllMarkets();

    // Filter V2 markets to those using DAC as collateral
    const v2DarkMarkets = allMarkets.data.filter(
      (market) => isDarkMarket(market.account.collateral_token)
    ).map((market) => ({
      ...market,
      isDarkMarket: true,
      isV3: false,
      tradingEnabled: false, // V2 markets have broken token mints
      privacyNote: 'Uses DAC tokens - legacy market (trading disabled)',
    }));

    // Add V3 Dark Markets (these support trading)
    const v3DarkMarkets = V3_DARK_MARKETS.map((m) => ({
      publicKey: m.address,
      account: {
        id: '',
        question: m.question,
        resolved: false,
        resolvable: true,
        creator: '',
        end_time: '0',
        creation_time: '0',
        initial_liquidity: '0',
        yes_token_mint: m.yesMint,
        no_token_mint: m.noMint,
        yes_token_supply_minted: '0',
        no_token_supply_minted: '0',
        collateral_token: DAC_MINT.toBase58(),
        market_reserves: '0',
        winning_token_id: { None: {} } as { None: Record<string, never> } | { Some: string },
      },
      isDarkMarket: true,
      isV3: true,
      tradingEnabled: true,
      privacyNote: 'V3 market with DAC tokens - trading enabled',
    }));

    // Combine, putting V3 (tradeable) markets first
    const allDarkMarkets = [...v3DarkMarkets, ...v2DarkMarkets];

    return {
      count: allDarkMarkets.length,
      data: allDarkMarkets,
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
