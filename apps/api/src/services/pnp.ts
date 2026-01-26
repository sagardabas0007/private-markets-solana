import { PNPClient } from 'pnp-sdk';
import { PublicKey, Transaction, Connection, Keypair, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';

// PNP market response types
interface PNPMarketAccount {
  id: string;
  question: string;
  resolved: boolean;
  resolvable?: boolean;
  creator: string | PublicKey;
  end_time: string;
  creation_time?: string;
  initial_liquidity: string;
  yes_token_mint: string;
  no_token_mint: string;
  yes_token_supply_minted: string;
  no_token_supply_minted: string;
  collateral_token: string | PublicKey;
  market_reserves?: string;
  winning_token_id?: { None: Record<string, never> } | { Some: string };
}

interface PNPMarket {
  publicKey: PublicKey | string;
  account: PNPMarketAccount;
}

interface PNPMarketsResponse {
  count: number;
  data: PNPMarket[];
}

export interface NormalizedMarket {
  publicKey: string;
  account: {
    id: string;
    question: string;
    resolved: boolean;
    resolvable: boolean;
    creator: string;
    end_time: string;
    creation_time: string;
    initial_liquidity: string;
    yes_token_mint: string;
    no_token_mint: string;
    yes_token_supply_minted: string;
    no_token_supply_minted: string;
    collateral_token: string;
    market_reserves: string;
    winning_token_id: { None: Record<string, never> } | { Some: string };
  };
}

export class PNPService {
  private client: PNPClient;
  private _clientWithSigner?: PNPClient;
  private _initialized = false;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    // Read-only client
    this.client = new PNPClient(rpcUrl);
  }

  // Lazy initialization of signer client
  private get clientWithSigner(): PNPClient | undefined {
    if (!this._initialized) {
      this._initialized = true;
      const privateKey = process.env.SOLANA_PRIVATE_KEY;
      if (privateKey) {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        try {
          this._clientWithSigner = new PNPClient(rpcUrl, privateKey);
          console.log('[PNPService] Initialized client with signer');
        } catch (error) {
          console.error('[PNPService] Failed to initialize signer:', error);
        }
      } else {
        console.warn('[PNPService] SOLANA_PRIVATE_KEY not set');
      }
    }
    return this._clientWithSigner;
  }

  async createPrivacyMarket(params: {
    question: string;
    initialLiquidity: bigint;
    endTime: bigint;
    privacyTokenMint: PublicKey;
  }) {
    if (!this.clientWithSigner?.market) {
      throw new Error('Signer required for market creation');
    }

    return await this.clientWithSigner.market.createMarket({
      question: params.question,
      initialLiquidity: params.initialLiquidity,
      endTime: params.endTime,
      baseMint: params.privacyTokenMint,
    });
  }

  async getMarketInfo(marketAddress: string): Promise<NormalizedMarket | null> {
    try {
      const market = new PublicKey(marketAddress);
      const result = await this.client.fetchMarket(market) as unknown as PNPMarket;

      if (!result) return null;

      return this.normalizeMarket(result);
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  async getAllMarkets(): Promise<{ count: number; data: NormalizedMarket[] }> {
    try {
      const response = await this.client.fetchMarkets() as unknown as PNPMarketsResponse;

      // Handle both array and object responses
      if (Array.isArray(response)) {
        return {
          count: response.length,
          data: response.map(m => this.normalizeMarket(m)),
        };
      }

      if (response && typeof response === 'object' && 'data' in response) {
        return {
          count: response.count || response.data.length,
          data: response.data.map(m => this.normalizeMarket(m)),
        };
      }

      return { count: 0, data: [] };
    } catch (error) {
      console.error('Error fetching markets:', error);
      return { count: 0, data: [] };
    }
  }

  async executeTrade(params: {
    market: string;
    side: 'yes' | 'no';
    amount: bigint;
  }) {
    const client = this.clientWithSigner;

    if (!client) {
      throw new Error('Trading service not configured: SOLANA_PRIVATE_KEY not set');
    }

    if (!client.trading) {
      console.error('[PNPService] PNPClient trading module not available');
      throw new Error('Trading module not available on PNP client');
    }

    const market = new PublicKey(params.market);
    const amountUsdc = Number(params.amount) / 1_000_000; // Convert to USDC units

    console.log(`[PNPService] Executing trade: market=${params.market}, side=${params.side}, amount=${amountUsdc} USDC`);

    try {
      const result = await client.trading.buyTokensUsdc({
        market,
        buyYesToken: params.side === 'yes',
        amountUsdc,
      });
      console.log(`[PNPService] Trade executed:`, result);
      return result;
    } catch (error) {
      console.error(`[PNPService] Trade failed:`, error);
      throw error;
    }
  }

  /**
   * Normalize a PNP market to a consistent format
   */
  private normalizeMarket(market: PNPMarket): NormalizedMarket {
    const account = market.account;

    return {
      publicKey: market.publicKey.toString(),
      account: {
        id: account.id || '',
        question: account.question || '',
        resolved: account.resolved || false,
        resolvable: account.resolvable || false,
        creator: account.creator?.toString() || '',
        end_time: account.end_time || '0',
        creation_time: account.creation_time || '0',
        initial_liquidity: account.initial_liquidity || '0',
        yes_token_mint: account.yes_token_mint?.toString() || '',
        no_token_mint: account.no_token_mint?.toString() || '',
        yes_token_supply_minted: account.yes_token_supply_minted || '0',
        no_token_supply_minted: account.no_token_supply_minted || '0',
        collateral_token: account.collateral_token?.toString() || '',
        market_reserves: account.market_reserves || '0',
        winning_token_id: account.winning_token_id || { None: {} },
      },
    };
  }

  /**
   * Get global configuration for the PNP program
   */
  async getGlobalConfig() {
    try {
      if ((this.client as any).market?.fetchGlobalConfig) {
        return await (this.client as any).market.fetchGlobalConfig();
      }
      return null;
    } catch (error) {
      console.error('Error fetching global config:', error);
      return null;
    }
  }

  /**
   * Prepare a trade transaction for client-side signing.
   * The transaction is built but NOT signed - the user signs it with their wallet.
   */
  async prepareTradeTransaction(params: {
    market: string;
    side: 'yes' | 'no';
    amountUsdc: number;
    walletAddress: string;
  }): Promise<Transaction> {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const userWallet = new PublicKey(params.walletAddress);
    const marketPubkey = new PublicKey(params.market);

    console.log(`[PNPService] Preparing transaction for ${params.walletAddress}`);

    // Create a temporary client for the user's wallet to build the transaction
    // The PNP SDK needs a keypair to build transactions, but we won't use it to sign
    // Instead we create a dummy keypair and replace the fee payer
    const tempClient = new PNPClient(rpcUrl);

    // Fetch market info to get token mints
    const marketInfo = await this.getMarketInfo(params.market);
    if (!marketInfo) {
      throw new Error('Market not found');
    }

    // Build the transaction using PNP SDK's transaction builder if available
    // Otherwise, we need to construct the instructions manually
    if ((tempClient.trading as any)?.buildBuyTransaction) {
      const tx = await (tempClient.trading as any).buildBuyTransaction({
        market: marketPubkey,
        buyYesToken: params.side === 'yes',
        amountUsdc: params.amountUsdc,
        buyer: userWallet,
      });
      return tx;
    }

    // Fallback: Build transaction manually using market data
    // This is a simplified version - the actual PNP SDK handles more complexity
    const transaction = new Transaction();

    // Get the recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = userWallet;

    // The actual buy instruction would need to be constructed based on PNP program's IDL
    // For now, we'll throw an error if the SDK doesn't support building transactions
    console.log(`[PNPService] Market info:`, {
      yesMint: marketInfo.account.yes_token_mint,
      noMint: marketInfo.account.no_token_mint,
      collateral: marketInfo.account.collateral_token,
    });

    // Check if user has USDC token account
    const USDC_MINT = new PublicKey(marketInfo.account.collateral_token || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
    const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, userWallet);

    try {
      await getAccount(connection, userUsdcAta);
    } catch {
      // Create ATA instruction if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userWallet,
          userUsdcAta,
          userWallet,
          USDC_MINT
        )
      );
    }

    // For the actual trade, we need the PNP SDK to expose transaction building
    // This is a placeholder that shows the infrastructure is in place
    throw new Error(
      'PNP SDK does not expose transaction building. ' +
      'Client-side signing requires SDK support for building unsigned transactions. ' +
      'Please use the server-side execute endpoint or contact PNP for SDK updates.'
    );
  }
}

export const pnpService = new PNPService();