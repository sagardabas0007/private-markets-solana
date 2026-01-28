import { Router } from 'express';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { incoService } from '../services/inco';
import { pnpService } from '../services/pnp';
import { z } from 'zod';

const router = Router();

// USDC Devnet mint address
const USDC_DEVNET_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Encrypt trade data for privacy
const encryptTradeSchema = z.object({
  amount: z.string(),
  side: z.enum(['yes', 'no']),
  marketAddress: z.string()
});

router.post('/encrypt', async (req, res) => {
  try {
    const { amount, side, marketAddress } = encryptTradeSchema.parse(req.body);

    const encryptedTrade = await incoService.createPrivateTrade({
      amount: BigInt(amount),
      side,
      marketAddress
    });

    res.json({
      success: true,
      data: encryptedTrade
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Execute trade (with encrypted parameters)
const executeTradeSchema = z.object({
  market: z.string(),
  side: z.enum(['yes', 'no']),
  amount: z.string()
});

router.post('/execute', async (req, res) => {
  try {
    const { market, side, amount } = executeTradeSchema.parse(req.body);

    console.log(`[Trading] Executing trade: market=${market}, side=${side}, amount=${amount}`);

    // Check if this is a V3 market (has proper token mints)
    const isV3 = await pnpService.isV3Market(market);
    console.log(`[Trading] Market is V3: ${isV3}`);

    let result;
    if (isV3) {
      // Use V3 trading method for V3 markets
      result = await pnpService.executeV3Trade({
        market,
        side,
        amount: BigInt(amount)
      });
    } else {
      // Use legacy method for V2 markets (may fail if mints aren't initialized)
      result = await pnpService.executeTrade({
        market,
        side,
        amount: BigInt(amount)
      });
    }

    console.log(`[Trading] Trade executed successfully:`, result);

    res.json({
      success: true,
      data: {
        signature: result?.signature || null,
        market,
        side,
        amount,
        isV3,
        executedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error(`[Trading] Trade execution failed:`, error);
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Get market prices and liquidity
router.get('/market/:marketId/info', async (req, res) => {
  try {
    const { marketId } = req.params;

    const marketInfo = await pnpService.getMarketInfo(marketId);

    if (!marketInfo) {
      res.status(404).json({
        success: false,
        error: 'Market not found'
      });
      return;
    }

    // Calculate prices from token supplies using AMM formula
    // Price of YES = NO_supply / (YES_supply + NO_supply)
    // Price of NO = YES_supply / (YES_supply + NO_supply)
    const yesSupply = parseInt(marketInfo.account.yes_token_supply_minted, 16) || 1;
    const noSupply = parseInt(marketInfo.account.no_token_supply_minted, 16) || 1;
    const total = yesSupply + noSupply;

    // If no trading has occurred, default to 50/50
    const prices = total > 2
      ? {
          yes: Math.round((noSupply / total) * 100) / 100,
          no: Math.round((yesSupply / total) * 100) / 100,
        }
      : { yes: 0.5, no: 0.5 };

    res.json({
      success: true,
      data: {
        market: marketInfo,
        prices,
        liquidity: {
          yesSupply: yesSupply.toString(),
          noSupply: noSupply.toString(),
          totalSupply: total.toString(),
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// Client-Side Signing Endpoints
// ============================================================================

// Prepare a transaction for client-side signing
const prepareTradeSchema = z.object({
  market: z.string(),
  side: z.enum(['yes', 'no']),
  amountUsdc: z.number(),
  walletAddress: z.string()
});

router.post('/prepare', async (req, res) => {
  try {
    const { market, side, amountUsdc, walletAddress } = prepareTradeSchema.parse(req.body);

    console.log(`[Trading] Preparing transaction for ${walletAddress}: market=${market}, side=${side}, amount=${amountUsdc} USDC`);

    // Build the transaction using PNP SDK (without signing)
    const transaction = await pnpService.prepareTradeTransaction({
      market,
      side,
      amountUsdc,
      walletAddress,
    });

    // Serialize the transaction (unsigned) for the client
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base64 = Buffer.from(serialized).toString('base64');

    res.json({
      success: true,
      data: {
        transaction: base64,
        message: `Buy ${side.toUpperCase()} tokens for ${amountUsdc} USDC`,
        estimatedFee: 0.000005, // ~5000 lamports
      }
    });
  } catch (error) {
    console.error(`[Trading] Prepare failed:`, error);
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Submit a signed transaction
const submitTransactionSchema = z.object({
  signedTransaction: z.string() // Base64 encoded signed transaction
});

router.post('/submit', async (req, res) => {
  try {
    const { signedTransaction } = submitTransactionSchema.parse(req.body);

    console.log(`[Trading] Submitting signed transaction`);

    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // Decode the signed transaction
    const transactionBuffer = Buffer.from(signedTransaction, 'base64');

    // Send to network
    const signature = await connection.sendRawTransaction(transactionBuffer, {
      skipPreflight: false,
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    console.log(`[Trading] Transaction confirmed: ${signature}`);

    res.json({
      success: true,
      data: {
        signature,
        market: 'unknown', // We'd need to parse the tx to get this
        side: 'unknown',
        amount: 'unknown',
        executedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error(`[Trading] Submit failed:`, error);
    res.status(400).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ============================================================================
// Diagnostic Endpoints
// ============================================================================

// Diagnostic endpoint to check server wallet status
router.get('/status', async (req, res) => {
  try {
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

    if (!privateKey) {
      res.json({
        success: true,
        data: {
          configured: false,
          error: 'SOLANA_PRIVATE_KEY not set in environment',
        },
      });
      return;
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const connection = new Connection(rpcUrl);
    const walletAddress = keypair.publicKey.toString();

    // Get SOL balance
    const solBalance = await connection.getBalance(keypair.publicKey);

    // Get USDC balance
    let usdcBalance = 0;
    let usdcAccount = null;
    try {
      const usdcAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, keypair.publicKey);
      const accountInfo = await getAccount(connection, usdcAta);
      usdcBalance = Number(accountInfo.amount) / 1_000_000; // 6 decimals
      usdcAccount = usdcAta.toString();
    } catch {
      // Token account doesn't exist
    }

    res.json({
      success: true,
      data: {
        configured: true,
        wallet: walletAddress,
        solBalance: solBalance / LAMPORTS_PER_SOL,
        usdcMint: USDC_DEVNET_MINT.toString(),
        usdcAccount,
        usdcBalance,
        canTrade: usdcBalance > 0,
        note: usdcBalance === 0
          ? 'Server wallet needs USDC devnet tokens for trading. Get some from a devnet faucet.'
          : 'Server wallet is ready for trading.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;