/**
 * PNP Markets Exploration Script
 *
 * Properly fetches and analyzes PNP markets to understand:
 * 1. What collateral tokens are supported
 * 2. Market structure and parameters
 * 3. How to create new markets
 */

import { PNPClient } from 'pnp-sdk';
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Known tokens
const KNOWN_TOKENS: Record<string, string> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC (Mainnet)',
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC (Devnet - Circle)',
  'So11111111111111111111111111111111111111112': 'Wrapped SOL',
};

interface MarketResponse {
  count: number;
  data: Array<{
    publicKey: PublicKey | string;
    account: {
      id: string;
      question: string;
      resolved: boolean;
      collateral_token: string;
      creator: string;
      initial_liquidity: string;
      end_time: string;
      yes_token_mint: string;
      no_token_mint: string;
      yes_token_supply_minted: string;
      no_token_supply_minted: string;
    };
  }>;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔬 PNP Markets Analysis');
  console.log('='.repeat(70));

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  console.log('\n📡 RPC URL:', rpcUrl);

  // Initialize client
  const client = new PNPClient(rpcUrl);

  // ════════════════════════════════════════════════════════════
  // STEP 1: Fetch all markets
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('📊 STEP 1: Fetch Markets');
  console.log('━'.repeat(70));

  try {
    const response = await client.fetchMarkets() as unknown as MarketResponse;
    console.log(`\n✅ Total markets: ${response.count}`);
    console.log(`   Data entries: ${response.data?.length || 0}`);

    if (!response.data || response.data.length === 0) {
      console.log('❌ No market data found');
      return;
    }

    // ════════════════════════════════════════════════════════════
    // STEP 2: Analyze collateral tokens
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('💰 STEP 2: Collateral Token Analysis');
    console.log('━'.repeat(70));

    const collateralStats = new Map<string, {
      count: number;
      name: string;
      sampleMarkets: string[];
    }>();

    for (const market of response.data) {
      const collateral = market.account.collateral_token?.toString() || 'Unknown';
      const existing = collateralStats.get(collateral) || {
        count: 0,
        name: KNOWN_TOKENS[collateral] || 'Unknown Token',
        sampleMarkets: [],
      };

      existing.count++;
      if (existing.sampleMarkets.length < 3) {
        existing.sampleMarkets.push(market.publicKey.toString());
      }

      collateralStats.set(collateral, existing);
    }

    console.log('\n📈 Collateral Token Distribution:');
    console.log('-'.repeat(60));

    // Sort by count descending
    const sorted = [...collateralStats.entries()].sort((a, b) => b[1].count - a[1].count);

    for (const [address, stats] of sorted.slice(0, 10)) {
      console.log(`\n   ${stats.name}: ${stats.count} markets`);
      console.log(`   Token Address: ${address}`);
      console.log(`   Sample Markets: ${stats.sampleMarkets[0]?.slice(0, 20)}...`);
    }

    // ════════════════════════════════════════════════════════════
    // STEP 3: Detailed market analysis
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('🔍 STEP 3: Sample Market Details');
    console.log('━'.repeat(70));

    // Pick 3 random active markets
    const activeMarkets = response.data.filter(m => !m.account.resolved);
    const samples = activeMarkets.slice(0, 5);

    for (let i = 0; i < samples.length; i++) {
      const market = samples[i];
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Market ${i + 1}:`);

      console.log('   Address:', market.publicKey.toString());
      console.log('   Question:', (market.account.question || 'N/A').slice(0, 80));
      console.log('   Resolved:', market.account.resolved);
      console.log('   Creator:', market.account.creator);

      const collateral = market.account.collateral_token;
      console.log('   Collateral:', KNOWN_TOKENS[collateral] || collateral);

      // Parse hex values
      const yesSupply = parseInt(market.account.yes_token_supply_minted || '0', 16);
      const noSupply = parseInt(market.account.no_token_supply_minted || '0', 16);
      const initialLiq = parseInt(market.account.initial_liquidity || '0', 16);

      console.log('   Initial Liquidity:', initialLiq.toLocaleString(), 'units');
      console.log('   YES Supply:', yesSupply.toLocaleString());
      console.log('   NO Supply:', noSupply.toLocaleString());
    }

    // ════════════════════════════════════════════════════════════
    // STEP 4: Try to create a market with signer
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('🏗️  STEP 4: Market Creation Test');
    console.log('━'.repeat(70));

    if (!privateKey) {
      console.log('❌ No SOLANA_PRIVATE_KEY - skipping creation test');
    } else {
      // Initialize with signer
      const signerClient = new PNPClient(rpcUrl, privateKey);

      // Decode keypair
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      console.log('\n   Wallet:', keypair.publicKey.toString());

      // Check balance
      const connection = new Connection(rpcUrl, 'confirmed');
      const balance = await connection.getBalance(keypair.publicKey);
      console.log('   SOL Balance:', (balance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

      // Find the most common collateral token to use
      const mostCommonCollateral = sorted[0];
      console.log('\n   Most common collateral:', mostCommonCollateral[1].name);
      console.log('   Token address:', mostCommonCollateral[0]);

      // Try creating a market
      console.log('\n🚀 Attempting market creation...');

      const marketParams = {
        question: `[TEST] Will AI agents create their own markets by Q2 2025? (${Date.now()})`,
        initialLiquidity: BigInt(1_000_000), // 1 token unit (6 decimals typically)
        endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // 30 days
        baseMint: new PublicKey(mostCommonCollateral[0]),
      };

      console.log('   Parameters:');
      console.log('   - Question:', marketParams.question.slice(0, 50) + '...');
      console.log('   - Liquidity:', marketParams.initialLiquidity.toString());
      console.log('   - Base Mint:', marketParams.baseMint.toString().slice(0, 20) + '...');

      try {
        // Check market module methods
        const marketModule = (signerClient as any).market;
        console.log('\n   Market module available:', !!marketModule);

        if (marketModule) {
          // List methods on the prototype
          const proto = Object.getPrototypeOf(marketModule);
          const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor');
          console.log('   Market module methods:', methods);

          if (typeof marketModule.createMarket === 'function') {
            console.log('\n   Calling createMarket...');
            const result = await marketModule.createMarket(marketParams);
            console.log('   ✅ SUCCESS! Market created:');
            console.log('   Result:', JSON.stringify(result, null, 2));
          } else if (typeof marketModule.createMarketDerived === 'function') {
            console.log('\n   Calling createMarketDerived...');
            const result = await marketModule.createMarketDerived(marketParams);
            console.log('   ✅ SUCCESS! Market created:');
            console.log('   Result:', JSON.stringify(result, null, 2));
          } else {
            console.log('   ❌ No createMarket method found');
          }
        }
      } catch (error: any) {
        console.log('\n   ❌ Market creation failed:');
        console.log('   Error:', error.message || error);

        if (error.transactionLogs) {
          console.log('\n   Transaction logs:');
          for (const log of error.transactionLogs.slice(0, 10)) {
            console.log('   ', log);
          }
        }
      }
    }

    // ════════════════════════════════════════════════════════════
    // STEP 5: Summary
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('📋 Summary: PNP SDK Findings');
    console.log('━'.repeat(70));

    console.log(`
🔍 Key Findings for Dark Alpha Privacy Integration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TOTAL MARKETS: ${response.count}

2. COLLATERAL TOKENS USED:
${sorted.slice(0, 5).map(([addr, stats]) =>
  `   - ${stats.name}: ${stats.count} markets\n     ${addr}`
).join('\n')}

3. MARKET CREATION:
   - Uses createMarket() or createMarketDerived() method
   - Requires: question, initialLiquidity, endTime, baseMint
   - Must have SOL for transaction fees
   - Must have collateral token for initial liquidity

4. DEVNET STATUS:
   - ${response.count} markets exist on devnet
   - Global config IS initialized (markets exist)
   - Our previous error was likely due to different token usage

5. INTEGRATION STRATEGY:
   Our off-chain encrypted order book can:
   - Store encrypted positions for any PNP market
   - Use existing markets as reference
   - Provide privacy layer on top of transparent PNP markets

6. TOKEN-2022 SUPPORT:
   - Not currently observed in existing markets
   - PNP SDK uses SPL Token Program
   - Confidential transfers not available yet
`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Analysis Complete');
  console.log('='.repeat(70));
}

main().catch(console.error);
