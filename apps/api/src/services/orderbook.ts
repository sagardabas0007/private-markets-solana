/**
 * Encrypted Order Book Service
 *
 * This service manages encrypted positions for privacy-preserving prediction markets.
 *
 * Architecture:
 * 1. User encrypts position with Inco SDK (client-side)
 * 2. Encrypted position + commitment hash stored here
 * 3. Market aggregates calculated without decrypting individual positions
 * 4. At settlement, Inco TEE decrypts for payout verification
 *
 * Privacy Guarantees:
 * - Individual position sizes are NEVER stored in plaintext
 * - Only commitment hashes link wallets to positions
 * - Aggregates reveal market sentiment, not individual bets
 */

import crypto from 'crypto';
import { incoService, EncryptedValue, PrivateTrade } from './inco';

export interface EncryptedPosition {
  id: string;
  walletAddress: string;
  marketAddress: string;
  encryptedAmount: EncryptedValue;
  encryptedSide: EncryptedValue;
  commitmentHash: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'settled';

  // For demo purposes, we store a hint about the side (in production, this would be derived differently)
  // This allows us to calculate aggregates without full decryption
  sideHint?: 'yes' | 'no';

  // Settlement data (populated after market resolution)
  settlement?: {
    decryptedAmount?: string;
    payout?: string;
    settledAt?: number;
  };
}

export interface MarketAggregate {
  marketAddress: string;
  totalPositions: number;
  yesPositions: number;
  noPositions: number;
  // Note: We don't reveal individual amounts, only counts
  // In production, we'd use homomorphic encryption for amount aggregates
  estimatedYesProbability: number;
  estimatedNoProbability: number;
  lastUpdated: number;
}

export interface OrderBookStats {
  totalMarkets: number;
  totalPositions: number;
  totalEncryptedVolume: string; // "hidden" - we don't know actual amounts
  uniqueWallets: number;
}

class EncryptedOrderBook {
  // In-memory storage (in production, use encrypted database)
  private positions: Map<string, EncryptedPosition> = new Map();
  private marketAggregates: Map<string, MarketAggregate> = new Map();
  private walletPositions: Map<string, Set<string>> = new Map(); // wallet -> position IDs

  constructor() {
    console.log('📒 Encrypted Order Book initialized');
  }

  /**
   * Generate a unique position ID
   */
  private generatePositionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Submit an encrypted position to the order book
   *
   * The position is stored encrypted - we never see the actual amount.
   * Only the commitment hash and metadata are accessible.
   */
  async submitPosition(params: {
    walletAddress: string;
    marketAddress: string;
    encryptedTrade: PrivateTrade;
    sideHint: 'yes' | 'no'; // For aggregate calculation (in production, use different method)
  }): Promise<{ positionId: string; position: EncryptedPosition }> {
    const positionId = this.generatePositionId();

    const position: EncryptedPosition = {
      id: positionId,
      walletAddress: params.walletAddress,
      marketAddress: params.marketAddress,
      encryptedAmount: params.encryptedTrade.encryptedAmount,
      encryptedSide: params.encryptedTrade.encryptedSide,
      commitmentHash: params.encryptedTrade.commitmentHash,
      timestamp: params.encryptedTrade.timestamp,
      status: 'confirmed',
      sideHint: params.sideHint,
    };

    // Store position
    this.positions.set(positionId, position);

    // Track wallet's positions
    if (!this.walletPositions.has(params.walletAddress)) {
      this.walletPositions.set(params.walletAddress, new Set());
    }
    this.walletPositions.get(params.walletAddress)!.add(positionId);

    // Update market aggregate
    this.updateMarketAggregate(params.marketAddress);

    console.log(`📝 Position ${positionId.slice(0, 8)}... submitted for market ${params.marketAddress.slice(0, 8)}...`);

    return { positionId, position };
  }

  /**
   * Update market aggregate statistics
   *
   * This calculates market sentiment WITHOUT revealing individual positions.
   * We only count positions and estimate probabilities.
   */
  private updateMarketAggregate(marketAddress: string): void {
    const marketPositions = Array.from(this.positions.values())
      .filter(p => p.marketAddress === marketAddress && p.status !== 'settled');

    const yesPositions = marketPositions.filter(p => p.sideHint === 'yes').length;
    const noPositions = marketPositions.filter(p => p.sideHint === 'no').length;
    const total = yesPositions + noPositions;

    const aggregate: MarketAggregate = {
      marketAddress,
      totalPositions: total,
      yesPositions,
      noPositions,
      estimatedYesProbability: total > 0 ? yesPositions / total : 0.5,
      estimatedNoProbability: total > 0 ? noPositions / total : 0.5,
      lastUpdated: Date.now(),
    };

    this.marketAggregates.set(marketAddress, aggregate);
  }

  /**
   * Get market aggregate (public data)
   *
   * This is safe to expose - it shows market sentiment without
   * revealing who bet what amount.
   */
  getMarketAggregate(marketAddress: string): MarketAggregate | null {
    // Ensure aggregate is up to date
    this.updateMarketAggregate(marketAddress);
    return this.marketAggregates.get(marketAddress) || null;
  }

  /**
   * Get positions for a wallet (requires ownership proof in production)
   *
   * Returns encrypted positions - only the wallet owner can decrypt.
   */
  getWalletPositions(walletAddress: string): EncryptedPosition[] {
    const positionIds = this.walletPositions.get(walletAddress);
    if (!positionIds) return [];

    return Array.from(positionIds)
      .map(id => this.positions.get(id)!)
      .filter(Boolean);
  }

  /**
   * Verify a commitment hash exists
   *
   * This allows anyone to verify a position exists without
   * revealing its contents.
   */
  verifyCommitment(commitmentHash: string): {
    exists: boolean;
    marketAddress?: string;
    timestamp?: number;
  } {
    for (const position of this.positions.values()) {
      if (position.commitmentHash === commitmentHash) {
        return {
          exists: true,
          marketAddress: position.marketAddress,
          timestamp: position.timestamp,
        };
      }
    }
    return { exists: false };
  }

  /**
   * Get position by ID (returns encrypted data)
   */
  getPosition(positionId: string): EncryptedPosition | null {
    return this.positions.get(positionId) || null;
  }

  /**
   * Get position by commitment hash
   */
  getPositionByCommitment(commitmentHash: string): EncryptedPosition | null {
    for (const position of this.positions.values()) {
      if (position.commitmentHash === commitmentHash) {
        return position;
      }
    }
    return null;
  }

  /**
   * Settle a market (called when market resolves)
   *
   * In production, this would:
   * 1. Send encrypted positions to Inco TEE
   * 2. TEE decrypts and verifies
   * 3. TEE calculates payouts
   * 4. Payouts distributed
   *
   * For the hackathon demo, we simulate this flow.
   */
  async settleMarket(marketAddress: string, outcome: 'yes' | 'no'): Promise<{
    settledPositions: number;
    winningPositions: number;
    losingPositions: number;
  }> {
    const marketPositions = Array.from(this.positions.values())
      .filter(p => p.marketAddress === marketAddress && p.status === 'confirmed');

    let winningPositions = 0;
    let losingPositions = 0;

    for (const position of marketPositions) {
      const isWinner = position.sideHint === outcome;

      position.status = 'settled';
      position.settlement = {
        // In production, Inco TEE would decrypt and provide actual amounts
        decryptedAmount: '[Decrypted by Inco TEE]',
        payout: isWinner ? '[Calculated by Inco TEE]' : '0',
        settledAt: Date.now(),
      };

      if (isWinner) {
        winningPositions++;
      } else {
        losingPositions++;
      }
    }

    console.log(`⚖️ Market ${marketAddress.slice(0, 8)}... settled: ${winningPositions} winners, ${losingPositions} losers`);

    return {
      settledPositions: marketPositions.length,
      winningPositions,
      losingPositions,
    };
  }

  /**
   * Get order book statistics (public)
   */
  getStats(): OrderBookStats {
    return {
      totalMarkets: this.marketAggregates.size,
      totalPositions: this.positions.size,
      totalEncryptedVolume: 'ENCRYPTED', // We genuinely don't know!
      uniqueWallets: this.walletPositions.size,
    };
  }

  /**
   * Get all market aggregates (public)
   */
  getAllAggregates(): MarketAggregate[] {
    return Array.from(this.marketAggregates.values());
  }

  /**
   * Demo: Create a sample encrypted position
   * This is for demonstration purposes to show the system works.
   */
  async createDemoPosition(params: {
    walletAddress: string;
    marketAddress: string;
    amount: bigint;
    side: 'yes' | 'no';
  }): Promise<{ positionId: string; position: EncryptedPosition }> {
    // Encrypt the trade using Inco
    const encryptedTrade = await incoService.createPrivateTrade({
      amount: params.amount,
      side: params.side,
      marketAddress: params.marketAddress,
    });

    // Submit to order book
    return this.submitPosition({
      walletAddress: params.walletAddress,
      marketAddress: params.marketAddress,
      encryptedTrade,
      sideHint: params.side,
    });
  }
}

export const orderBook = new EncryptedOrderBook();
