import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { darkMarketsService, DAC_MINT, isDarkMarket } from '../services/darkMarkets';
import { pnpService } from '../services/pnp';

const router = Router();

/**
 * Get all Dark Markets (privacy-preserving markets using DAC collateral)
 */
router.get('/', async (req, res) => {
  try {
    const darkMarkets = await darkMarketsService.getDarkMarkets();

    res.json({
      success: true,
      data: {
        ...darkMarkets,
        collateralInfo: {
          token: 'DAC (Dark Alpha Confidential)',
          mint: DAC_MINT.toBase58(),
          privacy: 'Balances are encrypted using Fully Homomorphic Encryption',
        },
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
 * Get a specific Dark Market by address
 */
router.get('/:marketAddress', async (req, res) => {
  try {
    const { marketAddress } = req.params;
    const market = await pnpService.getMarketInfo(marketAddress);

    if (!market) {
      res.status(404).json({
        success: false,
        error: 'Market not found',
      });
      return;
    }

    if (!isDarkMarket(market.account.collateral_token)) {
      res.status(400).json({
        success: false,
        error: 'This is not a Dark Market. Use /api/markets for regular markets.',
      });
      return;
    }

    // Calculate prices
    const yesSupply = parseInt(market.account.yes_token_supply_minted, 16) || 1;
    const noSupply = parseInt(market.account.no_token_supply_minted, 16) || 1;
    const total = yesSupply + noSupply;

    const prices = total > 2
      ? {
          yes: Math.round((noSupply / total) * 100) / 100,
          no: Math.round((yesSupply / total) * 100) / 100,
        }
      : { yes: 0.5, no: 0.5 };

    res.json({
      success: true,
      data: {
        market,
        isDarkMarket: true,
        prices,
        liquidity: {
          yesSupply: yesSupply.toString(),
          noSupply: noSupply.toString(),
          totalSupply: total.toString(),
        },
        privacyInfo: {
          note: 'All bets on this market are encrypted',
          collateral: 'DAC (Dark Alpha Confidential)',
          encryption: 'Inco FHE (Fully Homomorphic Encryption)',
        },
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
 * Prepare a Dark Market bet transaction for client-side signing
 * This wraps USDC -> DAC and places the bet in one transaction
 */
const prepareBetSchema = z.object({
  marketAddress: z.string(),
  side: z.enum(['yes', 'no']),
  amountUsdc: z.number().positive(),
  walletAddress: z.string(),
});

router.post('/prepare-bet', async (req, res) => {
  try {
    const { marketAddress, side, amountUsdc, walletAddress } = prepareBetSchema.parse(req.body);

    console.log(`[DarkMarkets] Preparing bet: market=${marketAddress}, side=${side}, amount=${amountUsdc} USDC`);

    // Verify this is a Dark Market
    const market = await pnpService.getMarketInfo(marketAddress);
    if (!market) {
      res.status(404).json({ success: false, error: 'Market not found' });
      return;
    }

    if (!isDarkMarket(market.account.collateral_token)) {
      res.status(400).json({
        success: false,
        error: 'This is not a Dark Market. Use /api/trading/prepare for regular markets.',
      });
      return;
    }

    const userWallet = new PublicKey(walletAddress);

    // Build the transaction (USDC -> DAC wrap + bet)
    const transaction = await darkMarketsService.buildDarkBetTransaction({
      marketAddress,
      side,
      amountUsdc,
      userWallet,
    });

    // Serialize for client
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base64 = Buffer.from(serialized).toString('base64');

    res.json({
      success: true,
      data: {
        transaction: base64,
        message: `Buy ${side.toUpperCase()} on Dark Market for ${amountUsdc} USDC (auto-wrapped to DAC)`,
        estimatedFee: 0.000015, // ~15000 lamports for multiple instructions
        privacyNote: 'Your bet amount will be encrypted using FHE',
      },
    });
  } catch (error) {
    console.error('[DarkMarkets] Prepare bet failed:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * Get user's DAC (encrypted) balance info
 */
router.get('/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const userWallet = new PublicKey(walletAddress);

    const balanceInfo = await darkMarketsService.getUserDacBalance(userWallet);

    res.json({
      success: true,
      data: balanceInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
