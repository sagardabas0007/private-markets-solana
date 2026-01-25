/**
 * Market Tracker Service
 *
 * Tracks markets created through Dark Alpha for instant display.
 * Markets show immediately without waiting for PNP SDK to index them.
 */

import { NormalizedMarket } from './pnp';

export interface TrackedMarket {
  publicKey: string;
  question: string;
  creator: string;
  collateralMint: string;
  initialLiquidity: string;
  endTime: number; // Unix timestamp in seconds
  createdAt: number; // Unix timestamp in milliseconds
  transactionSignature: string;
  isCustomOracle: boolean;
  oracleAddress?: string;
  // Computed fields
  yesProbability: number;
  noProbability: number;
}

export interface CreateMarketParams {
  publicKey: string;
  question: string;
  creator: string;
  collateralMint: string;
  initialLiquidity: string;
  endTime: number;
  transactionSignature: string;
  isCustomOracle: boolean;
  oracleAddress?: string;
}

class MarketTrackerService {
  private markets: Map<string, TrackedMarket> = new Map();

  /**
   * Track a newly created market
   */
  trackMarket(params: CreateMarketParams): TrackedMarket {
    const market: TrackedMarket = {
      ...params,
      createdAt: Date.now(),
      yesProbability: 0.5, // Initial 50/50
      noProbability: 0.5,
    };

    this.markets.set(params.publicKey, market);
    console.log(`📝 Tracked new market: ${params.publicKey.slice(0, 8)}...`);
    console.log(`   Question: ${params.question.slice(0, 50)}...`);

    return market;
  }

  /**
   * Get a tracked market by address
   */
  getMarket(publicKey: string): TrackedMarket | undefined {
    return this.markets.get(publicKey);
  }

  /**
   * Get all tracked markets, sorted by creation time (newest first)
   */
  getAllMarkets(): TrackedMarket[] {
    return Array.from(this.markets.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get markets created by a specific wallet
   */
  getMarketsByCreator(creator: string): TrackedMarket[] {
    return Array.from(this.markets.values())
      .filter(m => m.creator === creator)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Convert tracked market to normalized PNP format
   */
  toNormalizedMarket(tracked: TrackedMarket): NormalizedMarket {
    const endTimeHex = tracked.endTime.toString(16);
    const createdAtHex = Math.floor(tracked.createdAt / 1000).toString(16);
    const liquidityHex = BigInt(tracked.initialLiquidity).toString(16);

    return {
      publicKey: tracked.publicKey,
      account: {
        id: tracked.publicKey.slice(0, 8),
        question: tracked.question,
        resolved: false,
        resolvable: true,
        creator: tracked.creator,
        end_time: endTimeHex,
        creation_time: createdAtHex,
        initial_liquidity: liquidityHex,
        yes_token_mint: '', // Will be filled by PNP
        no_token_mint: '',
        yes_token_supply_minted: liquidityHex,
        no_token_supply_minted: liquidityHex,
        collateral_token: tracked.collateralMint,
        market_reserves: liquidityHex,
        winning_token_id: { None: {} },
      },
    };
  }

  /**
   * Merge tracked markets with PNP markets
   * Tracked markets take priority and appear first
   */
  mergeWithPNPMarkets(pnpMarkets: NormalizedMarket[]): NormalizedMarket[] {
    const trackedAddresses = new Set(this.markets.keys());

    // Convert tracked markets to normalized format
    const trackedNormalized = this.getAllMarkets()
      .map(m => this.toNormalizedMarket(m));

    // Filter out PNP markets that we're already tracking (avoid duplicates)
    const filteredPNP = pnpMarkets.filter(m => !trackedAddresses.has(m.publicKey));

    // Return tracked first, then PNP markets
    return [...trackedNormalized, ...filteredPNP];
  }

  /**
   * Update market probabilities based on trading activity
   */
  updateProbabilities(publicKey: string, yesProbability: number, noProbability: number): void {
    const market = this.markets.get(publicKey);
    if (market) {
      market.yesProbability = yesProbability;
      market.noProbability = noProbability;
    }
  }

  /**
   * Check if a market is tracked by us
   */
  isTracked(publicKey: string): boolean {
    return this.markets.has(publicKey);
  }

  /**
   * Get statistics about tracked markets
   */
  getStats(): {
    totalMarkets: number;
    activeMarkets: number;
    customOracleMarkets: number;
    recentMarkets: TrackedMarket[];
  } {
    const now = Date.now();
    const markets = this.getAllMarkets();

    return {
      totalMarkets: markets.length,
      activeMarkets: markets.filter(m => m.endTime * 1000 > now).length,
      customOracleMarkets: markets.filter(m => m.isCustomOracle).length,
      recentMarkets: markets.slice(0, 5),
    };
  }
}

// Singleton instance
export const marketTracker = new MarketTrackerService();
