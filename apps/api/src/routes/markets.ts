import { Router } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';
import bs58 from 'bs58';
import { z } from 'zod';
import { pnpService } from '../services/pnp';
import { marketTracker } from '../services/marketTracker';

const router = Router();

// ════════════════════════════════════════════════════════════════════
// GET /api/markets - Get all markets (tracked + PNP)
// ════════════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    // Get markets from PNP SDK
    const pnpMarkets = await pnpService.getAllMarkets();

    // Merge with our tracked markets (tracked appear first)
    const mergedMarkets = marketTracker.mergeWithPNPMarkets(pnpMarkets.data);

    res.json({
      success: true,
      data: {
        count: mergedMarkets.length,
        trackedCount: marketTracker.getStats().totalMarkets,
        data: mergedMarkets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/markets/tracked - Get only our tracked markets
// ════════════════════════════════════════════════════════════════════
router.get('/tracked', async (req, res) => {
  try {
    const markets = marketTracker.getAllMarkets();
    const stats = marketTracker.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        markets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /api/markets/:marketId - Get specific market info
// ════════════════════════════════════════════════════════════════════
router.get('/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;

    // Check if it's a tracked market first
    const tracked = marketTracker.getMarket(marketId);
    if (tracked) {
      res.json({
        success: true,
        data: marketTracker.toNormalizedMarket(tracked),
        isTracked: true,
      });
      return;
    }

    // Otherwise fetch from PNP
    const market = await pnpService.getMarketInfo(marketId);

    res.json({
      success: true,
      data: market,
      isTracked: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /api/markets/create - Create new market
// ════════════════════════════════════════════════════════════════════
const createMarketSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  initialLiquidity: z.number().min(1000000, 'Minimum 1 token (1000000 units)'),
  endTimeHours: z.number().min(1).max(8760), // 1 hour to 1 year
  collateralMint: z.string().optional(), // Optional - uses default if not provided
  useCustomOracle: z.boolean().optional().default(false),
});

router.post('/create', async (req, res) => {
  try {
    const { question, initialLiquidity, endTimeHours, collateralMint, useCustomOracle } =
      createMarketSchema.parse(req.body);

    // Get private key from environment
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Server not configured for market creation');
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

    // Initialize PNP client
    const client = new PNPClient(rpcUrl, privateKey);

    // Calculate end time
    const endTime = BigInt(Math.floor(Date.now() / 1000) + endTimeHours * 60 * 60);

    // Default collateral mint (the devnet token we've been using)
    const baseMint = new PublicKey(
      collateralMint || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
    );

    // Get creator address
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const creator = keypair.publicKey.toString();

    console.log(`\n🏗️  Creating market: "${question.slice(0, 50)}..."`);

    let result: any;

    if (useCustomOracle && typeof (client as any).createMarketWithCustomOracle === 'function') {
      // Create with custom oracle (we control settlement)
      result = await (client as any).createMarketWithCustomOracle({
        question,
        initialLiquidity: BigInt(initialLiquidity),
        endTime,
        collateralMint: baseMint,
        settlerAddress: keypair.publicKey,
        yesOddsBps: 5000, // 50/50 odds
      });

      // Enable trading immediately
      if (result.market && typeof (client as any).setMarketResolvable === 'function') {
        try {
          await (client as any).setMarketResolvable(result.market, true);
          console.log('   ✅ Trading enabled');
        } catch (e) {
          console.log('   ⚠️  Could not enable trading:', (e as Error).message);
        }
      }
    } else {
      // Create standard V2 AMM market
      result = await client.market!.createMarket({
        question,
        initialLiquidity: BigInt(initialLiquidity),
        endTime,
        baseMint,
      });
    }

    const marketAddress = result.market?.toString() || result.market;

    // Track the market
    const tracked = marketTracker.trackMarket({
      publicKey: marketAddress,
      question,
      creator,
      collateralMint: baseMint.toString(),
      initialLiquidity: initialLiquidity.toString(),
      endTime: Number(endTime),
      transactionSignature: result.signature,
      isCustomOracle: useCustomOracle || false,
      oracleAddress: useCustomOracle ? creator : undefined,
    });

    console.log(`   ✅ Market created: ${marketAddress}`);

    res.json({
      success: true,
      data: {
        marketAddress,
        signature: result.signature,
        question,
        creator,
        endTime: new Date(Number(endTime) * 1000).toISOString(),
        isCustomOracle: useCustomOracle,
        tracked,
      },
    });
  } catch (error) {
    console.error('❌ Market creation failed:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// Legacy endpoint (kept for backward compatibility)
// ════════════════════════════════════════════════════════════════════
const legacyCreateMarketSchema = z.object({
  question: z.string().min(10),
  initialLiquidity: z.string(),
  endTime: z.string(),
  privacyTokenMint: z.string(),
});

router.post('/', async (req, res) => {
  try {
    const { question, initialLiquidity, endTime, privacyTokenMint } =
      legacyCreateMarketSchema.parse(req.body);

    const result = await pnpService.createPrivacyMarket({
      question,
      initialLiquidity: BigInt(initialLiquidity),
      endTime: BigInt(endTime),
      privacyTokenMint: new PublicKey(privacyTokenMint),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
