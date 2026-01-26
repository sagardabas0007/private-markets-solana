/**
 * Complete DAC setup:
 * 1. Create SPL token mint for DAC
 * 2. Mint initial tokens for market creation
 * 3. Transfer mint authority to program PDA
 * 4. Create vault for USDC backing
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Our DAC program ID
const DAC_PROGRAM_ID = new PublicKey('ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq');

// USDC Devnet mint
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

const RPC_URL = 'https://api.devnet.solana.com';

// Initial token supply to mint (for testing market creation)
// 10,000 DAC tokens
const INITIAL_SUPPLY = 10_000_000_000n; // 10,000 * 10^6 (6 decimals)

function findMintAuthorityPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint_authority')],
    DAC_PROGRAM_ID
  );
}

async function main() {
  const keypairPath = path.join(process.env.HOME!, '.config/solana/id.json');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  const payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log('Payer:', payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(payer.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL');

  const [mintAuthority] = findMintAuthorityPda();
  console.log('\nMint Authority PDA:', mintAuthority.toBase58());

  // Generate new mint
  const dacMintKeypair = Keypair.generate();
  const dacMint = dacMintKeypair.publicKey;

  console.log('\n=== Step 1: Create DAC Mint ===');
  console.log('DAC Mint:', dacMint.toBase58());

  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const createMintTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: dacMint,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      dacMint,
      6,
      payer.publicKey, // Payer as initial authority
      null,
      TOKEN_PROGRAM_ID,
    ),
  );

  const createSig = await sendAndConfirmTransaction(connection, createMintTx, [payer, dacMintKeypair]);
  console.log('Mint created:', createSig);

  console.log('\n=== Step 2: Create Token Account & Mint Initial Supply ===');

  const payerAta = await getAssociatedTokenAddress(dacMint, payer.publicKey);
  console.log('Payer ATA:', payerAta.toBase58());

  const mintTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      payerAta,
      payer.publicKey,
      dacMint,
    ),
    createMintToInstruction(
      dacMint,
      payerAta,
      payer.publicKey,
      INITIAL_SUPPLY,
    ),
  );

  const mintSig = await sendAndConfirmTransaction(connection, mintTx, [payer]);
  console.log('Tokens minted:', mintSig);

  // Verify
  const accountInfo = await getAccount(connection, payerAta);
  console.log('Balance:', Number(accountInfo.amount) / 1_000_000, 'DAC');

  console.log('\n=== Step 3: Transfer Mint Authority to Program PDA ===');

  const authTx = new Transaction().add(
    createSetAuthorityInstruction(
      dacMint,
      payer.publicKey,
      AuthorityType.MintTokens,
      mintAuthority, // Transfer to our program's PDA
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const authSig = await sendAndConfirmTransaction(connection, authTx, [payer]);
  console.log('Authority transferred:', authSig);

  // Verify final state
  const mintInfo = await getMint(connection, dacMint);
  console.log('\n=== DAC Token Ready ===');
  console.log('Mint:', dacMint.toBase58());
  console.log('Decimals:', mintInfo.decimals);
  console.log('Supply:', Number(mintInfo.supply) / 1_000_000, 'DAC');
  console.log('Mint Authority:', mintInfo.mintAuthority?.toBase58());
  console.log('Creator Balance:', Number(accountInfo.amount) / 1_000_000, 'DAC');

  console.log('\n=== Update your configs ===');
  console.log(`DAC_SPL_MINT=${dacMint.toBase58()}`);
  console.log(`\nCreator has ${Number(accountInfo.amount) / 1_000_000} DAC for creating markets.`);
}

main().catch(console.error);
