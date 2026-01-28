/**
 * Script to create Dark Markets V3 (prediction markets using DAC as collateral)
 * V3 markets properly initialize YES/NO token mints and support trading
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

// DAC SPL Token Mint (OLD mint with existing balance)
// Note: OLD_DAC = JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo (has tokens)
// NEW_DAC = H8dsWNbpfeZMAAxQdQuW2E5BWYQnjk27gfe9dDdwGYiv (no tokens yet)
const DAC_MINT = new PublicKey('JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Dark Markets to create - crypto and real-world events
const DARK_MARKETS = [
  {
    question: '[V3] Will Bitcoin reach $150,000 by end of Q2 2025?',
    daysUntilEnd: 180,
    initialAmount: 10, // DAC tokens to seed
    side: 'yes' as const,
    creatorSideCap: 100, // Max amount creator can bet on their side
  },
  {
    question: '[V3] Will Ethereum flip Bitcoin in market cap by 2026?',
    daysUntilEnd: 365,
    initialAmount: 10,
    side: 'yes' as const,
    creatorSideCap: 100,
  },
  {
    question: '[V3] Will Solana process over 100,000 TPS by mid-2025?',
    daysUntilEnd: 150,
    initialAmount: 10,
    side: 'yes' as const,
    creatorSideCap: 100,
  },
];

async function main() {
  // Load keypair from file or environment
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
  console.log('DAC Mint (collateral):', DAC_MINT.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log('SOL Balance:', balance / 1e9, 'SOL');

  // Verify DAC mint exists
  const dacMintInfo = await connection.getAccountInfo(DAC_MINT);
  if (!dacMintInfo) {
    console.error('DAC Mint not found! Deploy the DAC token program first.');
    process.exit(1);
  }
  console.log('DAC Mint verified on-chain');

  // Initialize PNP client with signer
  const privateKey = bs58.encode(payer.secretKey);
  const client = new PNPClient(RPC_URL, privateKey);

  if (!client.anchorMarketV3?.createMarketV3) {
    console.error('PNP SDK anchorMarketV3.createMarketV3 not available');
    console.log('Available on anchorMarketV3:', Object.keys(client.anchorMarketV3 || {}));
    process.exit(1);
  }

  console.log('\n--- Creating Dark Markets V3 ---\n');

  const createdMarkets: { address: string; question: string; yesMint: string; noMint: string }[] = [];

  for (const market of DARK_MARKETS) {
    console.log(`Creating: "${market.question}"`);

    const endTime = BigInt(Math.floor(Date.now() / 1000) + market.daysUntilEnd * 24 * 60 * 60);
    const initialAmount = BigInt(market.initialAmount * 1_000_000); // 6 decimals
    const creatorSideCap = BigInt(market.creatorSideCap * 1_000_000);

    try {
      const result = await client.anchorMarketV3.createMarketV3({
        question: market.question,
        endTime,
        initialAmount,
        side: market.side,
        creatorSideCap,
        collateralTokenMint: DAC_MINT,
        oddsBps: 5000, // 50% initial odds
      });

      console.log(`  Created! Market: ${result.market.toBase58()}`);
      console.log(`  YES Mint: ${result.yesTokenMint.toBase58()}`);
      console.log(`  NO Mint: ${result.noTokenMint.toBase58()}`);
      console.log(`  Signature: ${result.signature}`);

      createdMarkets.push({
        address: result.market.toBase58(),
        question: market.question,
        yesMint: result.yesTokenMint.toBase58(),
        noMint: result.noTokenMint.toBase58(),
      });
    } catch (error) {
      console.error(`  Failed:`, (error as Error).message);
    }

    // Small delay between market creations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n--- Dark Markets V3 Creation Complete ---');
  console.log('Created markets:');
  console.log(JSON.stringify(createdMarkets, null, 2));

  console.log('\nThese V3 markets use DAC tokens as collateral.');
  console.log('YES/NO token mints are properly initialized for trading.');
}

main().catch(console.error);
