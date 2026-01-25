import { PNPClient } from 'pnp-sdk';
import { PublicKey } from '@solana/web3.js';

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
  private clientWithSigner?: PNPClient;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

    // Read-only client
    this.client = new PNPClient(rpcUrl);

    // Client with signer for write operations (if private key provided)
    if (process.env.SOLANA_PRIVATE_KEY) {
      this.clientWithSigner = new PNPClient(rpcUrl, process.env.SOLANA_PRIVATE_KEY);
    }
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
    if (!this.clientWithSigner?.trading) {
      throw new Error('Signer required for trading');
    }

    const market = new PublicKey(params.market);

    return await this.clientWithSigner.trading.buyTokensUsdc({
      market,
      buyYesToken: params.side === 'yes',
      amountUsdc: Number(params.amount) / 1_000_000, // Convert to USDC units
    });
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
}

export const pnpService = new PNPService();