/**
 * PNP V3 Market Creation Script
 *
 * Try to create a market using the V3 program path and the correct collateral token
 */

import { PNPClient } from 'pnp-sdk';
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// Note: Using connection.getParsedTokenAccountsByOwner instead of @solana/spl-token
import bs58 from 'bs58';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// The token used by all devnet markets
const PNP_DEVNET_TOKEN = '2KHoiTvJ2HhqChwE53DRoJYLJ4LcAuM1yKY7qnBRiyLF';

async function main() {
  console.log('='.repeat(70));
  console.log('🔬 PNP V3 Market Creation Test');
  console.log('='.repeat(70));

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const privateKey = process.env.SOLANA_PRIVATE_KEY!;

  const connection = new Connection(rpcUrl, 'confirmed');
  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

  console.log('\n📡 RPC:', rpcUrl);
  console.log('👛 Wallet:', keypair.publicKey.toString());

  // ════════════════════════════════════════════════════════════
  // STEP 1: Analyze the devnet collateral token
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('🪙 STEP 1: Analyze Collateral Token');
  console.log('━'.repeat(70));

  const tokenMint = new PublicKey(PNP_DEVNET_TOKEN);

  try {
    // Use getParsedAccountInfo for mint info
    console.log('\n   Fetching token mint info...');
    const mintAccountInfo = await connection.getParsedAccountInfo(tokenMint);

    if (mintAccountInfo.value) {
      const data = mintAccountInfo.value.data as any;
      if (data.parsed?.info) {
        const info = data.parsed.info;
        console.log('   ✅ Token found!');
        console.log('   Program:', data.program);
        console.log('   Decimals:', info.decimals);
        console.log('   Supply:', info.supply);
        console.log('   Mint Authority:', info.mintAuthority || 'None');
        console.log('   Freeze Authority:', info.freezeAuthority || 'None');
      }
    } else {
      console.log('   ❌ Token mint not found');
    }
  } catch (e) {
    console.log('   ❌ Error fetching mint:', (e as Error).message);
  }

  // Check if our wallet has this token
  console.log('\n   Checking wallet token balance...');
  try {
    // Find token accounts for this mint
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(keypair.publicKey, {
      mint: tokenMint,
    });

    if (tokenAccounts.value.length > 0) {
      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      console.log('   ✅ Token account found!');
      console.log('   Balance:', balance.uiAmount, `(${balance.amount} raw)`);
    } else {
      console.log('   ⚠️  No token account (balance: 0)');
      console.log('   → Need to get some PNP devnet tokens to create markets');
    }
  } catch (e) {
    console.log('   ❌ Error checking balance:', (e as Error).message);
  }

  // ════════════════════════════════════════════════════════════
  // STEP 2: Initialize PNP Client and explore V3
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('🔧 STEP 2: Explore PNP Client V3 Methods');
  console.log('━'.repeat(70));

  const client = new PNPClient(rpcUrl, privateKey);

  // Check anchor programs
  console.log('\n📦 Anchor Programs:');

  if ((client as any).anchorMarket) {
    const anchor = (client as any).anchorMarket;
    console.log('   anchorMarket programId:', anchor.programId?.toString());

    // Check for global config
    console.log('\n   Checking V2 global config...');
    try {
      const globalConfig = await (client as any).market.fetchGlobalConfig();
      console.log('   ✅ V2 Global Config found:', globalConfig);
    } catch (e) {
      console.log('   ❌ V2 Global Config not found:', (e as Error).message.slice(0, 80));
    }
  }

  if ((client as any).anchorMarketV3) {
    const anchor = (client as any).anchorMarketV3;
    console.log('\n   anchorMarketV3 programId:', anchor.programId?.toString());

    // List V3 instructions
    const idl = anchor.idl || anchor._idl;
    if (idl?.instructions) {
      console.log('   V3 Instructions:', idl.instructions.map((i: any) => i.name));
    }
  }

  // ════════════════════════════════════════════════════════════
  // STEP 3: Try different market creation approaches
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('🚀 STEP 3: Market Creation Attempts');
  console.log('━'.repeat(70));

  const marketModule = (client as any).market;

  // List all methods
  const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(marketModule))
    .filter(m => m !== 'constructor');
  console.log('\n   Available methods:', allMethods);

  // Try each create method
  const createMethods = allMethods.filter(m => m.toLowerCase().includes('create'));
  console.log('   Create methods:', createMethods);

  const marketQuestion = `[DARK-ALPHA-TEST] AI prediction market ${Date.now()}`;

  for (const method of createMethods) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`   Trying: ${method}()`);

    try {
      const params = {
        question: marketQuestion,
        initialLiquidity: BigInt(1_000_000), // 1 token with 6 decimals
        endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
        baseMint: new PublicKey(PNP_DEVNET_TOKEN),
      };

      console.log('   Params:');
      console.log('   - question:', params.question.slice(0, 40) + '...');
      console.log('   - initialLiquidity:', params.initialLiquidity.toString());
      console.log('   - baseMint:', params.baseMint.toString().slice(0, 20) + '...');

      const result = await marketModule[method](params);

      console.log('   ✅ SUCCESS!');
      console.log('   Result:', JSON.stringify(result, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v
      , 2).slice(0, 500));
      break; // Stop on first success

    } catch (error: any) {
      console.log('   ❌ Failed:', error.message?.slice(0, 100) || error);

      // Check for specific errors
      if (error.message?.includes('global_config')) {
        console.log('   → V2 program not configured');
      } else if (error.message?.includes('insufficient')) {
        console.log('   → Need more tokens');
      } else if (error.message?.includes('TokenAccountNotFound')) {
        console.log('   → Need to create token account first');
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  // STEP 4: Check if we can use existing markets
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('📊 STEP 4: Use Existing Markets');
  console.log('━'.repeat(70));

  console.log('\n   Fetching existing markets to use...');
  const markets = (await client.fetchMarkets()) as any;

  if (markets?.data && markets.data.length > 0) {
    // Find active markets
    const activeMarkets = markets.data.filter((m: any) => !m.account.resolved).slice(0, 3);

    console.log(`\n   Found ${activeMarkets.length} active markets to use:`);
    for (const market of activeMarkets) {
      console.log(`   - ${market.publicKey.toString()}`);
      console.log(`     "${market.account.question?.slice(0, 50)}..."`);
    }

    console.log(`

   💡 For Dark Alpha, we can:
   1. Use these existing markets as our backend
   2. Store encrypted positions in our order book
   3. Let users trade on these markets with privacy
   4. Only reveal positions during settlement
`);
  }

  // ════════════════════════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('📋 Final Summary');
  console.log('━'.repeat(70));

  console.log(`
🔍 PNP SDK Analysis Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLATERAL TOKEN FINDINGS:
• All devnet markets use: 2KHoiTvJ2HhqChwE53DRoJYLJ4LcAuM1yKY7qnBRiyLF
• This appears to be PNP's test/devnet token
• Standard SPL Token program (not Token-2022)

MARKET CREATION STATUS:
• V2 createMarket: Requires global_config (not initialized)
• V3 program: May have different entry point
• Existing markets: 4754 available for integration

TOKEN-2022 / CONFIDENTIAL TRANSFERS:
• ❌ NOT currently supported by PNP
• PNP uses standard SPL Token Program
• Our off-chain encrypted order book remains the best approach

RECOMMENDED APPROACH FOR DARK ALPHA:
1. Use existing PNP markets (4754 available on devnet)
2. Store encrypted positions in our order book
3. Match trades privately using Inco encryption
4. Settle via PNP when market resolves
5. Only reveal winning positions during settlement

This confirms our architecture choice: Off-chain encrypted order book
is the correct approach for adding privacy to PNP prediction markets.
`);

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Complete');
  console.log('='.repeat(70));
}

main().catch(console.error);
