/**
 * Encrypted Order Book API Routes
 *
 * These endpoints manage the privacy-preserving order book.
 * Individual positions are stored encrypted - only aggregates are public.
 */

import { Router } from 'express';
import { z } from 'zod';
import { orderBook } from '../services/orderbook';
import { incoService } from '../services/inco';

const router = Router();

/**
 * Submit an encrypted position
 *
 * POST /api/orderbook/submit
 *
 * The user has already encrypted their position client-side.
 * We store it encrypted and only use the commitment hash publicly.
 */
const submitPositionSchema = z.object({
  walletAddress: z.string(),
  marketAddress: z.string(),
  encryptedAmount: z.object({
    handle: z.string(),
    timestamp: z.number(),
    type: z.enum(['uint256', 'bool']),
  }),
  encryptedSide: z.object({
    handle: z.string(),
    timestamp: z.number(),
    type: z.enum(['uint256', 'bool']),
  }),
  commitmentHash: z.string(),
  side: z.enum(['yes', 'no']), // Hint for aggregates (in production, derived differently)
});

router.post('/submit', async (req, res) => {
  try {
    const data = submitPositionSchema.parse(req.body);

    const result = await orderBook.submitPosition({
      walletAddress: data.walletAddress,
      marketAddress: data.marketAddress,
      encryptedTrade: {
        encryptedAmount: data.encryptedAmount,
        encryptedSide: data.encryptedSide,
        marketAddress: data.marketAddress,
        timestamp: data.encryptedAmount.timestamp,
        commitmentHash: data.commitmentHash,
      },
      sideHint: data.side,
    });

    res.json({
      success: true,
      data: {
        positionId: result.positionId,
        commitmentHash: result.position.commitmentHash,
        status: result.position.status,
        message: 'Position stored encrypted. Only you can decrypt your position.',
      },
    });
  } catch (error) {
    console.error('Submit position error:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get market aggregate (PUBLIC)
 *
 * GET /api/orderbook/market/:marketId/aggregate
 *
 * Returns aggregated market data WITHOUT revealing individual positions.
 * This is the key privacy feature - market sentiment is visible,
 * but who bet what amount is hidden.
 */
router.get('/market/:marketId/aggregate', async (req, res) => {
  try {
    const { marketId } = req.params;

    const aggregate = orderBook.getMarketAggregate(marketId);

    if (!aggregate) {
      // No positions yet - return default
      res.json({
        success: true,
        data: {
          marketAddress: marketId,
          totalPositions: 0,
          yesPositions: 0,
          noPositions: 0,
          estimatedYesProbability: 0.5,
          estimatedNoProbability: 0.5,
          privacyNote: 'Individual positions are encrypted. Only aggregates are visible.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...aggregate,
        privacyNote: 'Individual positions are encrypted. Only aggregates are visible.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get my positions (PRIVATE - requires wallet ownership)
 *
 * POST /api/orderbook/my-positions
 *
 * Returns encrypted positions for a wallet.
 * In production, this would require a signed message to prove ownership.
 */
const myPositionsSchema = z.object({
  walletAddress: z.string(),
  // In production: signature proving wallet ownership
  // signature: z.string(),
});

router.post('/my-positions', async (req, res) => {
  try {
    const { walletAddress } = myPositionsSchema.parse(req.body);

    // In production, verify signature here
    // const isValidSignature = await verifyWalletSignature(walletAddress, signature);

    const positions = orderBook.getWalletPositions(walletAddress);

    res.json({
      success: true,
      data: {
        walletAddress,
        positionCount: positions.length,
        positions: positions.map(p => ({
          id: p.id,
          marketAddress: p.marketAddress,
          commitmentHash: p.commitmentHash,
          status: p.status,
          timestamp: p.timestamp,
          // Encrypted data - only wallet owner can decrypt
          encryptedAmount: p.encryptedAmount,
          encryptedSide: p.encryptedSide,
          settlement: p.settlement,
        })),
        note: 'Your positions are encrypted. Use your wallet to decrypt amounts.',
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Verify a commitment exists (PUBLIC)
 *
 * GET /api/orderbook/verify/:commitmentHash
 *
 * Anyone can verify a position exists without seeing its contents.
 * This is useful for proving you have a position without revealing details.
 */
router.get('/verify/:commitmentHash', async (req, res) => {
  try {
    const { commitmentHash } = req.params;

    const result = orderBook.verifyCommitment(commitmentHash);

    res.json({
      success: true,
      data: {
        commitmentHash,
        ...result,
        note: result.exists
          ? 'This commitment hash corresponds to a valid encrypted position.'
          : 'No position found with this commitment hash.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get recent activity feed (PUBLIC)
 *
 * GET /api/orderbook/activity
 *
 * Returns recent orders with masked addresses for live visualization.
 * Privacy is preserved - no actual amounts or full addresses are revealed.
 */
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = orderBook.getRecentActivity(Math.min(limit, 100));

    res.json({
      success: true,
      data: {
        count: activity.length,
        activity,
        note: 'Wallet addresses are masked. Amounts are encrypted and not shown.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get order book statistics (PUBLIC)
 *
 * GET /api/orderbook/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = orderBook.getStats();
    const aggregates = orderBook.getAllAggregates();

    res.json({
      success: true,
      data: {
        ...stats,
        markets: aggregates.map(a => ({
          marketAddress: a.marketAddress,
          totalPositions: a.totalPositions,
          yesProbability: Math.round(a.estimatedYesProbability * 100),
          noProbability: Math.round(a.estimatedNoProbability * 100),
        })),
        privacyFeatures: [
          'Individual position sizes are encrypted with Inco ECIES',
          'Only position counts are visible, not amounts',
          'Commitment hashes allow verification without revealing contents',
          'Settlement uses Inco TEE for secure decryption',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Demo: Create a test position
 *
 * POST /api/orderbook/demo/create
 *
 * For hackathon demonstration - creates an encrypted position.
 */
const demoCreateSchema = z.object({
  walletAddress: z.string(),
  marketAddress: z.string(),
  amount: z.string(), // In smallest units (e.g., 1000000 for $1 USDC)
  side: z.enum(['yes', 'no']),
});

router.post('/demo/create', async (req, res) => {
  try {
    const data = demoCreateSchema.parse(req.body);

    const result = await orderBook.createDemoPosition({
      walletAddress: data.walletAddress,
      marketAddress: data.marketAddress,
      amount: BigInt(data.amount),
      side: data.side,
    });

    res.json({
      success: true,
      data: {
        positionId: result.positionId,
        commitmentHash: result.position.commitmentHash,
        encryptedAmount: result.position.encryptedAmount.handle.slice(0, 50) + '...',
        encryptedSide: result.position.encryptedSide.handle.slice(0, 50) + '...',
        status: result.position.status,
        message: 'Demo position created with real Inco encryption!',
      },
    });
  } catch (error) {
    console.error('Demo create error:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Demo: Settle a market
 *
 * POST /api/orderbook/demo/settle
 *
 * For hackathon demonstration - simulates market settlement.
 */
const demoSettleSchema = z.object({
  marketAddress: z.string(),
  outcome: z.enum(['yes', 'no']),
});

router.post('/demo/settle', async (req, res) => {
  try {
    const { marketAddress, outcome } = demoSettleSchema.parse(req.body);

    const result = await orderBook.settleMarket(marketAddress, outcome);

    res.json({
      success: true,
      data: {
        marketAddress,
        outcome,
        ...result,
        message: `Market settled. In production, Inco TEE would decrypt positions and calculate payouts.`,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
