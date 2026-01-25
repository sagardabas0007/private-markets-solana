/**
 * PNP SDK Exploration Script
 *
 * This script explores the PNP SDK capabilities:
 * 1. Lists existing markets on devnet
 * 2. Examines market structure and collateral tokens
 * 3. Attempts to create a new V2 AMM market
 * 4. Documents supported features and limitations
 */

import { PNPClient } from 'pnp-sdk';
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Known token mints
const TOKENS = {
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  SOL_NATIVE: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  PNP_TOKEN: '2Cq2bPCnnphRPvtYtfMPjMPkK8iu14nH3sGXMSYoTWgf', // PNP Token (if exists)
};

async function main() {
  console.log('='.repeat(60));
  console.log('🔬 PNP SDK Exploration Script');
  console.log('='.repeat(60));

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  console.log('\n📡 RPC URL:', rpcUrl);

  // Create connection
  const connection = new Connection(rpcUrl, 'confirmed');

  // Initialize PNP Client (read-only first)
  console.log('\n🔌 Initializing PNP Client...');
  const readOnlyClient = new PNPClient(rpcUrl);

  // ════════════════════════════════════════════════════════════
  // STEP 1: Fetch and analyze existing markets
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('📊 STEP 1: Fetching Existing Markets');
  console.log('━'.repeat(60));

  try {
    const markets = await readOnlyClient.fetchMarkets();
    console.log(`\n✅ Found ${markets.length} markets on ${rpcUrl.includes('devnet') ? 'devnet' : 'mainnet'}`);

    if (markets.length > 0) {
      console.log('\n📝 Sample Market Analysis:');

      // Analyze first 3 markets
      const samplesToAnalyze = markets.slice(0, 3);

      for (const market of samplesToAnalyze) {
        console.log('\n' + '-'.repeat(40));
        console.log('Market Address:', market.publicKey.toString());
        console.log('Question:', market.account.question || 'N/A');
        console.log('Collateral Token (baseMint):', market.account.collateral_token || market.account.baseMint || 'Unknown');
        console.log('Resolved:', market.account.resolved);
        console.log('Creator:', market.account.creator);

        // Check what collateral tokens are being used
        const collateralToken = (market.account.collateral_token || market.account.baseMint || '').toString();
        if (collateralToken === TOKENS.USDC_MAINNET) {
          console.log('💰 Collateral Type: USDC (Mainnet)');
        } else if (collateralToken === TOKENS.USDC_DEVNET) {
          console.log('💰 Collateral Type: USDC (Devnet)');
        } else if (collateralToken === TOKENS.SOL_NATIVE) {
          console.log('💰 Collateral Type: Wrapped SOL');
        } else {
          console.log('💰 Collateral Type: Other/Custom Token');
        }

        // Log full account structure for inspection
        console.log('\nFull Account Structure:');
        console.log(JSON.stringify(market.account, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        , 2));
      }
    }
  } catch (error) {
    console.error('❌ Error fetching markets:', error);
  }

  // ════════════════════════════════════════════════════════════
  // STEP 2: Analyze PNP Client structure
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('🔍 STEP 2: Analyzing PNP Client Structure');
  console.log('━'.repeat(60));

  console.log('\nAvailable client properties:');
  console.log(Object.keys(readOnlyClient));

  // Check if market module exists
  if ('market' in readOnlyClient) {
    console.log('\n✅ market module available');
    console.log('Market module methods:', Object.keys((readOnlyClient as any).market || {}));
  }

  // Check if trading module exists
  if ('trading' in readOnlyClient) {
    console.log('\n✅ trading module available');
    console.log('Trading module methods:', Object.keys((readOnlyClient as any).trading || {}));
  }

  // ════════════════════════════════════════════════════════════
  // STEP 3: Initialize client with signer for write operations
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('🔑 STEP 3: Initialize Client with Signer');
  console.log('━'.repeat(60));

  if (!privateKey) {
    console.log('❌ No SOLANA_PRIVATE_KEY found in environment');
    console.log('   Cannot proceed with market creation');
    return;
  }

  // Decode private key
  let keypair: Keypair;
  try {
    const decoded = bs58.decode(privateKey);
    keypair = Keypair.fromSecretKey(decoded);
    console.log('✅ Keypair loaded');
    console.log('   Wallet Address:', keypair.publicKey.toString());
  } catch (error) {
    console.error('❌ Failed to decode private key:', error);
    return;
  }

  // Check wallet balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`   Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    console.log('\n⚠️  Low SOL balance. Requesting airdrop...');
    try {
      const signature = await connection.requestAirdrop(keypair.publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      const newBalance = await connection.getBalance(keypair.publicKey);
      console.log(`✅ Airdrop successful! New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.log('❌ Airdrop failed (rate limited?):', (error as Error).message);
    }
  }

  // Initialize PNP Client with signer
  console.log('\n🔌 Initializing PNP Client with signer...');
  const signerClient = new PNPClient(rpcUrl, privateKey);
  console.log('✅ Signer client initialized');

  // ════════════════════════════════════════════════════════════
  // STEP 4: Attempt to create a new market
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('🏗️  STEP 4: Create New Market (V2 AMM)');
  console.log('━'.repeat(60));

  // Market parameters
  const marketParams = {
    question: `[TEST] Will BTC reach $100k by end of Q1 2025? (Created: ${new Date().toISOString()})`,
    initialLiquidity: BigInt(1_000_000), // 1 USDC (6 decimals)
    endTime: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), // 7 days from now
    baseMint: new PublicKey(TOKENS.USDC_DEVNET), // Try devnet USDC first
  };

  console.log('\n📋 Market Parameters:');
  console.log('   Question:', marketParams.question);
  console.log('   Initial Liquidity:', marketParams.initialLiquidity.toString(), '(in smallest units)');
  console.log('   End Time:', new Date(Number(marketParams.endTime) * 1000).toISOString());
  console.log('   Base Mint (Collateral):', marketParams.baseMint.toString());

  // Check if market module has createMarket method
  if (!(signerClient as any).market?.createMarket) {
    console.log('\n⚠️  createMarket method not found on market module');
    console.log('   Checking alternative methods...');

    // List all available methods
    if ((signerClient as any).market) {
      console.log('   Available market methods:', Object.keys((signerClient as any).market));
    }

    // Try alternative approaches
    console.log('\n🔍 Exploring SDK structure...');
    console.log('   Client prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(signerClient)));

    // Check if there are createMarket alternatives
    const clientMethods = Object.keys(signerClient).concat(
      Object.getOwnPropertyNames(Object.getPrototypeOf(signerClient))
    );
    const createMethods = clientMethods.filter(m =>
      m.toLowerCase().includes('create') || m.toLowerCase().includes('market')
    );
    console.log('   Potential market creation methods:', createMethods);
  }

  // Try creating the market
  console.log('\n🚀 Attempting market creation...');

  try {
    // Method 1: Direct createMarket call
    if ((signerClient as any).market?.createMarket) {
      const result = await (signerClient as any).market.createMarket(marketParams);
      console.log('\n✅ Market created successfully!');
      console.log('   Result:', JSON.stringify(result, null, 2));
    }
    // Method 2: Try createV2Market if it exists
    else if ((signerClient as any).createV2Market) {
      const result = await (signerClient as any).createV2Market(marketParams);
      console.log('\n✅ V2 Market created successfully!');
      console.log('   Result:', JSON.stringify(result, null, 2));
    }
    // Method 3: Try with slightly different parameter structure
    else if ((signerClient as any).market?.create) {
      const result = await (signerClient as any).market.create(marketParams);
      console.log('\n✅ Market created successfully!');
      console.log('   Result:', JSON.stringify(result, null, 2));
    }
    else {
      console.log('\n❌ No suitable market creation method found');
      console.log('   The SDK might require different initialization or parameters');

      // Print entire client structure for debugging
      console.log('\n📦 Full SDK Structure:');
      const printStructure = (obj: any, prefix = '') => {
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          const type = typeof value;
          if (type === 'function') {
            console.log(`${prefix}${key}: [Function]`);
          } else if (type === 'object' && value !== null) {
            console.log(`${prefix}${key}: {`);
            printStructure(value, prefix + '  ');
            console.log(`${prefix}}`);
          } else {
            console.log(`${prefix}${key}: ${type}`);
          }
        }
      };
      printStructure(signerClient);
    }
  } catch (error) {
    console.error('\n❌ Market creation failed:', error);

    // Try with different collateral tokens
    console.log('\n🔄 Trying with different collateral tokens...');

    const tokensToTry = [
      { name: 'USDC Mainnet', mint: TOKENS.USDC_MAINNET },
      { name: 'Wrapped SOL', mint: TOKENS.SOL_NATIVE },
    ];

    for (const token of tokensToTry) {
      console.log(`\n   Trying with ${token.name}...`);
      try {
        const altParams = {
          ...marketParams,
          baseMint: new PublicKey(token.mint),
        };

        if ((signerClient as any).market?.createMarket) {
          const result = await (signerClient as any).market.createMarket(altParams);
          console.log(`   ✅ Market created with ${token.name}!`);
          console.log('   Result:', result);
          break;
        }
      } catch (altError) {
        console.log(`   ❌ Failed with ${token.name}:`, (altError as Error).message);
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // STEP 5: Summary of Findings
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('📋 STEP 5: Summary of PNP SDK Findings');
  console.log('━'.repeat(60));

  console.log(`
🔍 SDK Exploration Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Client Initialization:
   - Read-only: PNPClient(rpcUrl)
   - With signer: PNPClient(rpcUrl, privateKey)

2. Available Modules:
   - client.fetchMarkets() - Get all markets
   - client.fetchMarket(address) - Get specific market
   - client.market - Market operations module
   - client.trading - Trading operations module

3. Collateral Tokens (baseMint):
   - USDC is the primary collateral token
   - Token-2022 might be supported (needs verification)
   - SOL/Wrapped SOL support unclear

4. Market Structure:
   - question: string
   - initialLiquidity: bigint
   - endTime: bigint (Unix timestamp)
   - baseMint: PublicKey (collateral token)
   - creator: PublicKey
   - resolved: boolean

5. Trading Functions:
   - buyTokensUsdc(market, buyYesToken, amountUsdc)
   - Additional methods TBD

Next Steps:
- Check for Token-2022 confidential transfer support
- Verify which tokens work as collateral
- Test actual market creation on devnet
`);

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Script Complete');
  console.log('='.repeat(60));
}

// Run the script
main().catch(console.error);
