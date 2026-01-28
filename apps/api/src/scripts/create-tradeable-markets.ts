/**
 * Script to create tradeable V3 markets
 * - USDC markets: Regular markets users can trade with USDC
 * - DAC markets: Dark markets with encrypted bets
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

// Token mints
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
const DAC_MINT = new PublicKey('JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Markets to create
const MARKETS_TO_CREATE = [
  // USDC Markets (Regular tradeable)
  {
    question: '[USDC-V3] Will the S&P 500 close above 6000 by March 2025?',
    collateral: USDC_MINT,
    type: 'USDC',
    daysUntilEnd: 60,
    initialAmount: 5,
  },
  {
    question: '[USDC-V3] Will there be a major AI regulation passed in the US by 2025?',
    collateral: USDC_MINT,
    type: 'USDC',
    daysUntilEnd: 365,
    initialAmount: 5,
  },
  // DAC Markets (Dark/Privacy)
  {
    question: '[DAC-V3] Will a top-10 crypto exchange fail in 2025?',
    collateral: DAC_MINT,
    type: 'DAC',
    daysUntilEnd: 365,
    initialAmount: 5,
  },
  {
    question: '[DAC-V3] Will Solana surpass Ethereum in daily transactions by Q4 2025?',
    collateral: DAC_MINT,
    type: 'DAC',
    daysUntilEnd: 300,
    initialAmount: 5,
  },
];

async function main() {
  // Load keypair
  let payer: Keypair;

  if (process.env.SOLANA_PRIVATE_KEY) {
    const privateKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
    payer = Keypair.fromSecretKey(privateKeyBytes);
  } else {
    const keypairPath = path.join(process.env.HOME!, '.config/solana/id.json');
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  }

  console.log('Creator wallet:', payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log('SOL Balance:', balance / 1e9, 'SOL');

  // Initialize PNP client
  const privateKey = bs58.encode(payer.secretKey);
  const client = new PNPClient(RPC_URL, privateKey);

  if (!client.anchorMarketV3?.createMarketV3) {
    console.error('PNP SDK anchorMarketV3.createMarketV3 not available');
    console.log('Available on client:', Object.keys(client));
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('Creating Tradeable V3 Markets');
  console.log('========================================\n');

  const results: { address: string; question: string; type: string; yesMint: string; noMint: string }[] = [];

  for (const market of MARKETS_TO_CREATE) {
    console.log(`\n[${market.type}] Creating: "${market.question}"`);
    console.log(`  Collateral: ${market.collateral.toBase58()}`);

    const endTime = BigInt(Math.floor(Date.now() / 1000) + market.daysUntilEnd * 24 * 60 * 60);
    const initialAmount = BigInt(market.initialAmount * 1_000_000); // 6 decimals
    const creatorSideCap = BigInt(100 * 1_000_000); // 100 tokens max

    try {
      const result = await client.anchorMarketV3.createMarketV3({
        question: market.question,
        endTime,
        initialAmount,
        side: 'yes',
        creatorSideCap,
        collateralTokenMint: market.collateral,
        oddsBps: 5000, // 50% initial odds
      });

      console.log(`  SUCCESS!`);
      console.log(`  Market Address: ${result.market.toBase58()}`);
      console.log(`  YES Mint: ${result.yesTokenMint.toBase58()}`);
      console.log(`  NO Mint: ${result.noTokenMint.toBase58()}`);
      console.log(`  Tx: ${result.signature}`);

      results.push({
        address: result.market.toBase58(),
        question: market.question,
        type: market.type,
        yesMint: result.yesTokenMint.toBase58(),
        noMint: result.noTokenMint.toBase58(),
      });
    } catch (error) {
      console.error(`  FAILED:`, (error as Error).message);
    }

    // Delay between creates
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n========================================');
  console.log('Market Creation Complete!');
  console.log('========================================\n');

  console.log('USDC Markets (Regular - trade with USDC):');
  results.filter(r => r.type === 'USDC').forEach(r => {
    console.log(`  ${r.address}`);
    console.log(`    Question: ${r.question}`);
  });

  console.log('\nDAC Markets (Dark - encrypted bets):');
  results.filter(r => r.type === 'DAC').forEach(r => {
    console.log(`  ${r.address}`);
    console.log(`    Question: ${r.question}`);
  });

  console.log('\n\nAdd these to V3_DARK_MARKETS in darkMarkets.ts:');
  console.log(JSON.stringify(results.filter(r => r.type === 'DAC').map(r => ({
    address: r.address,
    question: r.question,
    yesMint: r.yesMint,
    noMint: r.noMint,
  })), null, 2));
}

main().catch(console.error);
