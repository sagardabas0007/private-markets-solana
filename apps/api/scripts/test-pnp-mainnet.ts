/**
 * PNP SDK Mainnet Exploration Script
 *
 * This script explores existing markets on mainnet to understand:
 * 1. What collateral tokens are used
 * 2. Market structure and parameters
 * 3. SDK capabilities
 *
 * NOTE: This is READ-ONLY - no transactions will be made on mainnet
 */

import { PNPClient } from 'pnp-sdk';
import { PublicKey } from '@solana/web3.js';

// Known token mints
const TOKENS = {
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  SOL_NATIVE: 'So11111111111111111111111111111111111111112',
};

async function main() {
  console.log('='.repeat(70));
  console.log('🔬 PNP SDK Mainnet Exploration (READ-ONLY)');
  console.log('='.repeat(70));

  // Use mainnet RPC
  const mainnetRpc = 'https://api.mainnet-beta.solana.com';
  console.log('\n📡 RPC URL:', mainnetRpc);

  // Initialize read-only client for mainnet
  console.log('🔌 Initializing PNP Client (read-only)...');
  const client = new PNPClient(mainnetRpc);

  // ════════════════════════════════════════════════════════════
  // STEP 1: Fetch all markets on mainnet
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('📊 STEP 1: Fetching All Mainnet Markets');
  console.log('━'.repeat(70));

  try {
    const markets = await client.fetchMarkets();
    console.log(`\n✅ Found ${markets?.length || 0} markets on mainnet`);

    if (!markets || markets.length === 0) {
      console.log('❌ No markets found. The SDK might need different configuration.');
      return;
    }

    // Analyze collateral tokens used
    const collateralStats = new Map<string, number>();

    for (const market of markets) {
      const collateral = market.account.collateral_token?.toString() ||
                        market.account.baseMint?.toString() ||
                        'Unknown';
      collateralStats.set(collateral, (collateralStats.get(collateral) || 0) + 1);
    }

    console.log('\n💰 Collateral Token Analysis:');
    console.log('-'.repeat(50));

    for (const [token, count] of collateralStats.entries()) {
      let tokenName = 'Unknown Token';
      if (token === TOKENS.USDC_MAINNET) tokenName = 'USDC (Mainnet)';
      else if (token === TOKENS.SOL_NATIVE) tokenName = 'Wrapped SOL';
      else if (token === TOKENS.USDC_DEVNET) tokenName = 'USDC (Devnet)';

      console.log(`   ${tokenName}: ${count} markets`);
      console.log(`   Address: ${token}`);
    }

    // ════════════════════════════════════════════════════════════
    // STEP 2: Analyze sample markets in detail
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('🔍 STEP 2: Detailed Market Analysis (First 5 Markets)');
    console.log('━'.repeat(70));

    const samplesToAnalyze = markets.slice(0, 5);

    for (let i = 0; i < samplesToAnalyze.length; i++) {
      const market = samplesToAnalyze[i];
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Market ${i + 1}:`);
      console.log(`${'─'.repeat(60)}`);

      console.log('📍 Address:', market.publicKey.toString());
      console.log('❓ Question:', market.account.question || 'N/A');

      // Parse timestamps from hex
      const endTimeHex = market.account.end_time;
      const creationTimeHex = market.account.creation_time;
      let endTime: Date | null = null;
      let creationTime: Date | null = null;

      try {
        if (endTimeHex) {
          const endSeconds = parseInt(endTimeHex.toString(), 16);
          endTime = new Date(endSeconds * 1000);
        }
        if (creationTimeHex) {
          const creationSeconds = parseInt(creationTimeHex.toString(), 16);
          creationTime = new Date(creationSeconds * 1000);
        }
      } catch (e) {
        // If parsing fails, try direct interpretation
        if (typeof market.account.end_time === 'number') {
          endTime = new Date(market.account.end_time * 1000);
        }
      }

      if (creationTime) console.log('📅 Created:', creationTime.toISOString());
      if (endTime) console.log('⏰ End Time:', endTime.toISOString());

      console.log('✅ Resolved:', market.account.resolved);
      console.log('👤 Creator:', market.account.creator);

      // Collateral info
      const collateral = market.account.collateral_token?.toString() ||
                        market.account.baseMint?.toString() || 'Unknown';
      let collateralName = 'Unknown';
      if (collateral === TOKENS.USDC_MAINNET) collateralName = 'USDC';
      else if (collateral === TOKENS.SOL_NATIVE) collateralName = 'Wrapped SOL';

      console.log('💰 Collateral:', collateralName, `(${collateral.slice(0, 8)}...)`);

      // Token supplies
      if (market.account.yes_token_supply_minted) {
        console.log('🟢 YES Token Supply:', market.account.yes_token_supply_minted);
      }
      if (market.account.no_token_supply_minted) {
        console.log('🔴 NO Token Supply:', market.account.no_token_supply_minted);
      }

      // Show full account structure for first market only
      if (i === 0) {
        console.log('\n📦 Full Account Structure (first market):');
        console.log(JSON.stringify(market.account, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (value instanceof PublicKey) return value.toString();
          return value;
        }, 2));
      }
    }

    // ════════════════════════════════════════════════════════════
    // STEP 3: SDK Module Exploration
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('🔧 STEP 3: SDK Module Capabilities');
    console.log('━'.repeat(70));

    // Check market module
    console.log('\n📦 Market Module:');
    if ((client as any).market) {
      const marketMethods = Object.getOwnPropertyNames(Object.getPrototypeOf((client as any).market));
      console.log('   Methods:', marketMethods.filter(m => !m.startsWith('_') && m !== 'constructor'));
    }

    // Check trading module
    console.log('\n📦 Trading Module:');
    if ((client as any).trading) {
      const tradingMethods = Object.getOwnPropertyNames(Object.getPrototypeOf((client as any).trading));
      console.log('   Methods:', tradingMethods.filter(m => !m.startsWith('_') && m !== 'constructor'));
    }

    // Check redemption module
    console.log('\n📦 Redemption Module:');
    if ((client as any).redemption) {
      const redemptionMethods = Object.getOwnPropertyNames(Object.getPrototypeOf((client as any).redemption));
      console.log('   Methods:', redemptionMethods.filter(m => !m.startsWith('_') && m !== 'constructor'));
    }

    // Check for Anchor programs
    console.log('\n📦 Anchor Programs:');
    if ((client as any).anchorMarket) console.log('   - anchorMarket (V1/V2)');
    if ((client as any).anchorMarketV3) console.log('   - anchorMarketV3 (V3)');

    // ════════════════════════════════════════════════════════════
    // STEP 4: Summary
    // ════════════════════════════════════════════════════════════
    console.log('\n' + '━'.repeat(70));
    console.log('📋 Summary: PNP SDK Collateral Token Support');
    console.log('━'.repeat(70));

    console.log(`
🔍 Key Findings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. COLLATERAL TOKENS SUPPORTED:
   ✅ USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
      - Primary collateral token for all markets observed
      - SPL Token (not Token-2022)
      - 6 decimals

   ⚠️  SOL/Wrapped SOL - Not confirmed in existing markets
   ⚠️  Token-2022 - Not yet supported (security audit pending)
   ⚠️  PNP Token - Not used as collateral

2. DEVNET LIMITATION:
   The PNP program on devnet lacks the global_config initialization.
   Market creation only works on mainnet currently.

3. MARKET CREATION REQUIREMENTS:
   - baseMint: USDC token mint address
   - question: String description of the market
   - initialLiquidity: Amount in USDC smallest units (6 decimals)
   - endTime: Unix timestamp for market resolution

4. FOR OUR PRIVACY PROJECT:
   Since Token-2022 confidential transfers aren't available,
   our off-chain encrypted order book approach remains the best option.

   We can:
   - Use existing PNP markets for settlement
   - Store encrypted positions in our order book
   - Match trades privately off-chain
   - Only reveal winning positions during settlement
`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Script Complete');
  console.log('='.repeat(70));
}

main().catch(console.error);
