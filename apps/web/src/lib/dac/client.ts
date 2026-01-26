import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// DAC Token Program ID (deployed on devnet)
export const DAC_TOKEN_PROGRAM_ID = new PublicKey('ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq');

// Inco Lightning Program ID
export const INCO_LIGHTNING_PROGRAM_ID = new PublicKey('5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj');

// USDC Devnet Mint
export const USDC_DEVNET_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Inco co-validator endpoint for encryption/decryption
export const INCO_COVALIDATOR_ENDPOINT = 'https://grpc.solana-devnet.alpha.devnet.inco.org';

// Inco server public key for ECIES encryption
export const INCO_SERVER_PUBLIC_KEY = '0486ca2bbf34bea44c6043f23ebc5b67ca7ccefc3710498385ecc161460a1f8729db2a361cb0d7f40847a99a75572bc10e36a365218f4bae450dc61348330bb717';

/**
 * Find the DAC mint PDA
 */
export function findDacMintPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dac_mint')],
    DAC_TOKEN_PROGRAM_ID
  );
}

/**
 * Find the vault PDA for a given DAC mint
 */
export function findVaultPda(dacMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), dacMint.toBuffer()],
    DAC_TOKEN_PROGRAM_ID
  );
}

/**
 * Find the DAC account PDA for a given user
 */
export function findDacAccountPda(dacMint: PublicKey, owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dac_account'), dacMint.toBuffer(), owner.toBuffer()],
    DAC_TOKEN_PROGRAM_ID
  );
}

/**
 * Find the allowance PDA for granting decryption access
 */
export function findAllowancePda(handle: bigint, allowedAddress: PublicKey): PublicKey {
  const handleBuffer = Buffer.alloc(16);
  handleBuffer.writeBigUInt64LE(handle & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
  handleBuffer.writeBigUInt64LE(handle >> BigInt(64), 8);

  const [allowanceAccount] = PublicKey.findProgramAddressSync(
    [handleBuffer, allowedAddress.toBuffer()],
    INCO_LIGHTNING_PROGRAM_ID
  );

  return allowanceAccount;
}

/**
 * DAC Account structure
 */
export interface DacAccount {
  mint: PublicKey;
  owner: PublicKey;
  balanceHandle: bigint;
  state: 'Uninitialized' | 'Initialized' | 'Frozen';
  bump: number;
}

/**
 * DAC Mint structure
 */
export interface DacMint {
  authority: PublicKey;
  usdcMint: PublicKey;
  decimals: number;
  isInitialized: boolean;
  totalSupplyHandle: bigint;
  vaultBump: number;
}

/**
 * Parse a DAC account from account data
 */
export function parseDacAccount(data: Buffer): DacAccount {
  // Skip 8-byte discriminator
  let offset = 8;

  const mint = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const owner = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const balanceHandle = data.readBigUInt64LE(offset) + (data.readBigUInt64LE(offset + 8) << BigInt(64));
  offset += 16;

  const stateValue = data[offset];
  const state = stateValue === 0 ? 'Uninitialized' : stateValue === 1 ? 'Initialized' : 'Frozen';
  offset += 1;

  const bump = data[offset];

  return { mint, owner, balanceHandle, state, bump };
}

/**
 * Parse a DAC mint from account data
 */
export function parseDacMint(data: Buffer): DacMint {
  // Skip 8-byte discriminator
  let offset = 8;

  const authority = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const usdcMint = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const decimals = data[offset];
  offset += 1;

  const isInitialized = data[offset] === 1;
  offset += 1;

  const totalSupplyHandle = data.readBigUInt64LE(offset) + (data.readBigUInt64LE(offset + 8) << BigInt(64));
  offset += 16;

  const vaultBump = data[offset];

  return { authority, usdcMint, decimals, isInitialized, totalSupplyHandle, vaultBump };
}

/**
 * Check if DAC mint is initialized
 */
export async function isDacMintInitialized(connection: Connection): Promise<boolean> {
  const [dacMint] = findDacMintPda();
  const accountInfo = await connection.getAccountInfo(dacMint);
  return accountInfo !== null && accountInfo.data.length > 0;
}

/**
 * Get a user's DAC account info
 */
export async function getDacAccount(
  connection: Connection,
  owner: PublicKey
): Promise<DacAccount | null> {
  const [dacMint] = findDacMintPda();
  const [dacAccount] = findDacAccountPda(dacMint, owner);

  const accountInfo = await connection.getAccountInfo(dacAccount);
  if (!accountInfo || accountInfo.data.length === 0) {
    return null;
  }

  return parseDacAccount(accountInfo.data);
}

/**
 * Get the DAC mint info
 */
export async function getDacMint(connection: Connection): Promise<DacMint | null> {
  const [dacMint] = findDacMintPda();
  const accountInfo = await connection.getAccountInfo(dacMint);

  if (!accountInfo || accountInfo.data.length === 0) {
    return null;
  }

  return parseDacMint(accountInfo.data);
}

/**
 * Encrypt an amount using Inco ECIES encryption
 * This should be called client-side before depositing
 */
export async function encryptAmount(amount: bigint): Promise<Uint8Array> {
  // For now, return a mock encrypted value
  // In production, this would use the @inco/solana-sdk to encrypt
  // with the co-validator's public key
  const amountBuffer = Buffer.alloc(16);
  amountBuffer.writeBigUInt64LE(amount & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
  amountBuffer.writeBigUInt64LE(amount >> BigInt(64), 8);

  // TODO: Implement actual ECIES encryption with Inco SDK
  // const { encrypt } = await import('@inco/solana-sdk');
  // return encrypt(amountBuffer, INCO_SERVER_PUBLIC_KEY);

  return amountBuffer;
}

/**
 * Request decryption of a handle from the co-validator
 * Returns the plaintext amount and signature for on-chain verification
 */
export async function requestDecryption(
  handle: bigint,
  ownerAddress: PublicKey
): Promise<{ plaintext: Uint8Array; signature: Uint8Array }> {
  // TODO: Implement actual decryption request to Inco co-validator
  // This would make a gRPC call to INCO_COVALIDATOR_ENDPOINT
  // The co-validator verifies the owner has allowance to decrypt
  // and returns a signed plaintext value

  throw new Error('Not implemented: Decryption requires Inco SDK integration');
}

/**
 * DAC Token Client for interacting with the program
 */
export class DacTokenClient {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Check if the DAC system is initialized
   */
  async isInitialized(): Promise<boolean> {
    return isDacMintInitialized(this.connection);
  }

  /**
   * Get the user's DAC account
   */
  async getUserAccount(owner: PublicKey): Promise<DacAccount | null> {
    return getDacAccount(this.connection, owner);
  }

  /**
   * Get the DAC mint info
   */
  async getMint(): Promise<DacMint | null> {
    return getDacMint(this.connection);
  }

  /**
   * Check if a user has a DAC account initialized
   */
  async hasAccount(owner: PublicKey): Promise<boolean> {
    const account = await this.getUserAccount(owner);
    return account !== null && account.state === 'Initialized';
  }

  /**
   * Get the encrypted balance handle for a user
   * Returns null if user doesn't have an account
   */
  async getBalanceHandle(owner: PublicKey): Promise<bigint | null> {
    const account = await this.getUserAccount(owner);
    if (!account) return null;
    return account.balanceHandle;
  }

  /**
   * Build a deposit transaction (USDC -> DAC)
   * The user deposits USDC and receives encrypted DAC tokens
   */
  async buildDepositTransaction(
    owner: PublicKey,
    amountUsdc: number
  ): Promise<Transaction> {
    const [dacMint] = findDacMintPda();
    const [vault] = findVaultPda(dacMint);
    const [dacAccount] = findDacAccountPda(dacMint, owner);

    // Get user's USDC token account
    const userUsdcAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, owner);

    // Convert amount to base units (6 decimals)
    const amountBaseUnits = BigInt(Math.floor(amountUsdc * 1_000_000));

    // Build the deposit instruction
    // Discriminator for deposit: first 8 bytes of sha256("global:deposit")
    const discriminator = Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]);

    // Amount as u64 LE
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amountBaseUnits);

    const data = Buffer.concat([discriminator, amountBuffer]);

    const transaction = new Transaction();

    // Check if DAC account exists, if not add initialize instruction
    const existingAccount = await this.getUserAccount(owner);
    if (!existingAccount) {
      // Add initialize_account instruction first
      const initDiscriminator = Buffer.from([108, 227, 130, 130, 252, 109, 75, 218]);
      const initInstruction = {
        keys: [
          { pubkey: dacAccount, isSigner: false, isWritable: true },
          { pubkey: dacMint, isSigner: false, isWritable: false },
          { pubkey: owner, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: INCO_LIGHTNING_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: DAC_TOKEN_PROGRAM_ID,
        data: initDiscriminator,
      };
      transaction.add(initInstruction);
    }

    // Add the deposit instruction
    const depositInstruction = {
      keys: [
        { pubkey: dacMint, isSigner: false, isWritable: true },
        { pubkey: dacAccount, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: userUsdcAta, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: INCO_LIGHTNING_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: DAC_TOKEN_PROGRAM_ID,
      data,
    };

    transaction.add(depositInstruction);

    // Set transaction properties
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    return transaction;
  }

  /**
   * Build a withdraw transaction (DAC -> USDC)
   * The user redeems encrypted DAC tokens for USDC
   * Requires a decryption proof from the Inco co-validator
   */
  async buildWithdrawTransaction(
    owner: PublicKey,
    amountUsdc: number,
    decryptionProof?: Uint8Array
  ): Promise<Transaction> {
    const [dacMint] = findDacMintPda();
    const [vault] = findVaultPda(dacMint);
    const [dacAccount] = findDacAccountPda(dacMint, owner);

    // Get user's USDC token account
    const userUsdcAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, owner);

    // Convert amount to base units (6 decimals)
    const amountBaseUnits = BigInt(Math.floor(amountUsdc * 1_000_000));

    // Build the withdraw instruction
    // Discriminator for withdraw: first 8 bytes of sha256("global:withdraw")
    const discriminator = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34]);

    // Amount as u64 LE
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amountBaseUnits);

    const data = Buffer.concat([discriminator, amountBuffer]);

    const withdrawInstruction = {
      keys: [
        { pubkey: dacMint, isSigner: false, isWritable: true },
        { pubkey: dacAccount, isSigner: false, isWritable: true },
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: userUsdcAta, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: INCO_LIGHTNING_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: DAC_TOKEN_PROGRAM_ID,
      data,
    };

    const transaction = new Transaction();
    transaction.add(withdrawInstruction);

    // Set transaction properties
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    return transaction;
  }
}
