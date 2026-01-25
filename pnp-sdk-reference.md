> ## Documentation Index
> Fetch the complete documentation index at: https://docs.pnp.exchange/llms.txt
> Use this file to discover all available pages before exploring further.

# PNP SDK

> Client libraries for integrating with PNP Exchange

# PnP SDK Documentation

## Table of Contents

* [Overview](#overview)
  * [Features](#features)
  * [Installation](#installation)
  * [Quick Start](#quick-start)
* [How to Create a Market](#how-to-create-a-market)
  * [Creating a V2 AMM Market](#creating-a-v2-amm-market)
  * [Creating a P2P Market](#creating-a-p2p-market)
  * [Creating a Twitter Market](#creating-a-twitter-market)
  * [Creating a YouTube Market](#creating-a-youtube-market)
  * [Creating a Market with Custom Oracle](#creating-a-market-with-custom-oracle)
* [Custom Oracles](#custom-oracles)
  * [Why Custom Oracles?](#why-custom-oracles)
  * [How It Works](#how-it-works)
  * [The 15-Minute Buffer Period](#the-15-minute-buffer-period)
  * [Oracle Lifecycle](#oracle-lifecycle)
  * [Full Mainnet Example](#full-mainnet-example)
* [How to Get Refund Initial Liquidity](#how-to-get-refund-initial-liquidity)
  * [Claiming Refund for V2 AMM Market](#claiming-refund-for-v2-amm-market)
  * [Claiming Refund for P2P Market](#claiming-refund-for-p2p-market)
* [How to Fetch Market Addresses](#how-to-fetch-market-addresses)
  * [Fetching V2 Market Addresses](#fetching-v2-market-addresses)
  * [Fetching P2P Market Addresses](#fetching-p2p-market-addresses)
* [How to Trade](#how-to-trade)
  * [Trading on V2 AMM Markets](#trading-on-v2-amm-markets)
  * [Trading on P2P Markets](#trading-on-p2p-markets)
* [How to Redeem Winnings](#how-to-redeem-winnings)
* [API Reference](#api-reference)
  * [Core Client](#core-client)
  * [Main SDK Methods](#main-sdk-methods)
  * [Proxy Server Integration](#proxy-server-integration)
  * [Read-Only Helpers](#read-only-helpers)
  * [Advanced Functions](#advanced-functions)
  * [Types](#types)
* [Usage Examples](#usage-examples)
  * [Creating a Market](#creating-a-market)
  * [Placing an Order](#placing-an-order)
  * [Redeeming Positions](#redeeming-positions)
  * [Fetching Settlement Criteria](#fetching-settlement-criteria)
  * [Claiming Creator Refund](#claiming-creator-refund)
* [CLI Usage](#cli-usage)
  * [Environment Variables](#environment-variables)
  * [Commands](#commands)
    * [Create a New Market](#create-a-new-market)
    * [Trading](#trading)
    * [Market Information](#market-information)
* [Best Practices](#best-practices)
* [FAQ](#frequently-asked-questions)
* [Contributing](#contributing)
* [Changelog](#changelog)

## Overview

The PnP SDK is a TypeScript library for interacting with Solana-based prediction markets. It provides a clean, type-safe interface for creating markets, trading positions, and managing market operations on the Solana blockchain.

### Features

* Create and manage prediction markets on Solana
* Trade YES/NO tokens
* Redeem positions for resolved markets
* Claim creator refunds for unresolved markets
* Interact with on-chain market data
* Fetch settlement criteria from proxy server
* TypeScript-first development experience
* Comprehensive error handling
* Built on top of `@solana/web3.js` and supports both SPL Token and Token-2022 programs

### Prerequisites

* Node.js 16+
* npm or yarn
* Solana CLI (for local development)
* Basic understanding of Solana and blockchain concepts

### Installation

```bash  theme={null}
npm install pnp-sdk
# or
yarn add pnp-sdk
```

### Quick Start

1. Install the package:
   ```bash  theme={null}
   npm install pnp-sdk
   ```

2. Import the SDK - Two methods are supported:

   **Method 1: ESM Direct Import (Recommended)**

   ```typescript  theme={null}
   // For TypeScript/ES modules
   import { PNPClient } from 'pnp-sdk';
   ```

   **Method 2: CommonJS Require (For compatibility)**

   ```typescript  theme={null}
   // For CommonJS environments or when using the built package
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
   const { PNPClient } = require('pnp-sdk');
   // Or when developing locally
   const { PNPClient } = require('../dist/index.cjs');
   ```

3. Initialize the client:
   ```typescript  theme={null}
   import { PNPClient } from 'pnp-sdk';
   import { PublicKey } from '@solana/web3.js';

   // Initialize with RPC URL and private key (if write operations are needed)
   const rpcUrl = 'https://api.mainnet-beta.solana.com';

   // For read-only operations
   const readOnlyClient = new PNPClient(rpcUrl);

   // For write operations (with private key)
   const privateKey = [...]; // Uint8Array of your private key or base58 encoded string
   const client = new PNPClient(rpcUrl, privateKey);
   ```

4. Example operation - fetching market info:
   ```typescript  theme={null}
   async function getMarketInfo(marketAddress: string) {
     try {
       const market = new PublicKey(marketAddress);
       const { account } = await client.fetchMarket(market);
       
       console.log('Market Question:', account.question);
       console.log('Market Creator:', new PublicKey(account.creator).toBase58());
       console.log('Market Resolved:', account.resolved);
       
       return account;
     } catch (error) {
       console.error('Error fetching market:', error);
       throw error;
     }
   }
   ```

## How to Create a Market

This section provides complete working scripts for creating prediction markets using the PNP SDK. There are two types of markets you can create:

1. **V2 AMM Markets**: Traditional automated market maker (AMM) pools where liquidity is provided upfront
2. **P2P Markets**: Peer-to-peer markets where the creator takes a position on one side

### Creating a V2 AMM Market

V2 markets use an AMM model where you provide initial liquidity that gets split between YES and NO tokens. This script demonstrates how to create a V2 market with USDC as collateral.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will Bitcoin reach $100K by end of 2025?';
  const initialLiquidity = 1_000_000n; // 1 USDC (6 decimals)
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create the market
  const result = await client.market.createMarket({
    question,
    initialLiquidity,
    endTime,
    baseMint: collateralMint,
  });

  console.log('Market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market.toBase58());
}

main().catch(console.error);
```

**Key Points for V2 Markets:**

* Initial liquidity is split equally between YES and NO tokens in the AMM pool
* The creator doesn't take a position; they provide liquidity for others to trade against
* Use `client.market.createMarket()` for V2 markets

### Creating a P2P Market

P2P markets are peer-to-peer markets where the creator takes a position on one side (YES or NO) with a specified cap. This script demonstrates how to create a P2P market.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will I get 1 million dollars by the end of 2025';
  const side = 'yes'; // 'yes' or 'no'
  const initialAmount = 1_000_000n; // 1 USDC (6 decimals)
  const creatorSideCap = 5_000_000n; // 5 USDC max for creator's side
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create P2P market
  const result = await client.createP2PMarketGeneral({
    question,
    initialAmount,
    side,
    creatorSideCap,
    endTime,
    collateralTokenMint: collateralMint,
  });

  console.log('P2P market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market);
  console.log('Yes Token Mint:', result.yesTokenMint);
  console.log('No Token Mint:', result.noTokenMint);
}

main().catch(console.error);
```

**Key Points for P2P Markets:**

* The creator takes a position on one side (YES or NO) with an initial amount
* `creatorSideCap` defines the maximum amount the creator is willing to bet on their chosen side
* Other users can take the opposite position
* Use `client.createP2PMarketGeneral()` for P2P markets

**Comparison: V2 AMM vs P2P Markets**

| Feature           | V2 AMM Market                    | P2P Market                        |
| ----------------- | -------------------------------- | --------------------------------- |
| Market Type       | Automated Market Maker           | Peer-to-Peer                      |
| Creator Position  | No position (provides liquidity) | Takes YES or NO position          |
| Initial Liquidity | Split equally between YES/NO     | Goes to creator's chosen side     |
| SDK Method        | `client.market.createMarket()`   | `client.createP2PMarketGeneral()` |
| Side Selection    | N/A                              | Required (yes/no)                 |
| Creator Cap       | N/A                              | Required (`creatorSideCap`)       |
| Use Case          | Traditional prediction markets   | Targeted position markets         |

### Creating a Twitter Market

Twitter markets are linked to specific tweets. The SDK can automatically detect tweet IDs from URLs and fetch settlement criteria.

#### Creating a V2 Twitter Market

This script demonstrates how to create a V2 AMM market linked to a Twitter post.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will this tweet cross 5000 replies?';
  const tweetUrl = 'https://x.com/0xJeff/status/2003733328093151716';
  const initialLiquidity = 1_000_000n; // 1 USDC (6 decimals)
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create Twitter-linked V2 market
  const result = await client.createMarketTwitter({
    question,
    tweetUrl,
    initialLiquidity,
    endTime,
    collateralTokenMint: collateralMint,
  });

  console.log('Twitter V2 market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market);
}

main().catch(console.error);
```

#### Creating a P2P Twitter Market

This script demonstrates how to create a P2P market linked to a Twitter post.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will this tweet cross 500 replies?';
  const tweetUrl = 'https://twitter.com/cuomo/status/1234567890';
  const side = 'yes'; // 'yes' or 'no'
  const initialAmount = 1_000_000n; // 1 USDC (6 decimals)
  const creatorSideCap = 5_000_000n; // 5 USDC max for creator's side
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create Twitter-linked P2P market
  const result = await client.createP2PMarketTwitter({
    question,
    tweetUrl,
    initialAmount,
    side,
    creatorSideCap,
    endTime,
    collateralTokenMint: collateralMint,
  });

  console.log('Twitter P2P market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market);
  console.log('Yes Token Mint:', result.yesTokenMint);
  console.log('No Token Mint:', result.noTokenMint);
}

main().catch(console.error);
```

### Creating a YouTube Market

YouTube markets are linked to specific videos. The SDK handles YouTube URL parsing and settlement integration.

#### Creating a V2 YouTube Market

This script demonstrates how to create a V2 AMM market linked to a YouTube video.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will this video cross 1B views?';
  const youtubeUrl = 'https://youtu.be/rNv8K8AYGi8';
  const initialLiquidity = 1_000_000n; // 1 USDC (6 decimals)
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create YouTube-linked V2 market
  const result = await client.createMarketYoutube({
    question,
    youtubeUrl,
    initialLiquidity,
    endTime,
    collateralTokenMint: collateralMint,
  });

  console.log('YouTube V2 market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market);
}

main().catch(console.error);
```

#### Creating a P2P YouTube Market

This script demonstrates how to create a P2P market linked to a YouTube video.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];

async function main() {
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));

  // Market parameters
  const question = 'Will this video cross 40M views by the end of 2025?';
  const youtubeUrl = 'https://youtube.com/watch?v=abcd1234';
  const side = 'yes'; // 'yes' or 'no'
  const initialAmount = 1_000_000n; // 1 USDC (6 decimals)
  const creatorSideCap = 5_000_000n; // 5 USDC max for creator's side
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

  // Create YouTube-linked P2P market
  const result = await client.createP2PMarketYoutube({
    question,
    youtubeUrl,
    initialAmount,
    side,
    creatorSideCap,
    endTime,
    collateralTokenMint: collateralMint,
  });

  console.log('YouTube P2P market created successfully!');
  console.log('Signature:', result.signature);
  console.log('Market Address:', result.market);
  console.log('Yes Token Mint:', result.yesTokenMint);
  console.log('No Token Mint:', result.noTokenMint);
}

main().catch(console.error);
```

### Creating a Market with Custom Oracle

Custom Oracles allow you to bypass PNP's AI-powered global oracle and designate **your own wallet or service** to resolve markets. This is a powerful feature for builders who want full control over market resolution.

> **New in v0.2.6**: The `createMarketWithCustomOracle` function is now live on both **Devnet** and **Mainnet**!

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array */];

async function main() {
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  
  // Your oracle address (can be your wallet or a dedicated oracle service)
  const ORACLE_ADDRESS = client.signer!.publicKey;
  
  const result = await client.createMarketWithCustomOracle({
    question: 'Will our product launch by Q2 2026?',
    initialLiquidity: 10_000_000n, // 10 USDC (6 decimals)
    endTime: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
    collateralMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    settlerAddress: ORACLE_ADDRESS,  // 👈 Your custom oracle!
    yesOddsBps: 5000,  // Optional: 50/50 odds (range: 100-9900)
  });

  console.log('Market created:', result.market.toBase58());
  console.log('TX:', result.signature);
}

main().catch(console.error);
```

## Custom Oracles

Custom Oracles give you **sovereign control** over prediction market resolution. Instead of relying on PNP's AI oracle, you become the authority that decides market outcomes.

### Why Custom Oracles?

Custom Oracles unlock powerful use cases that weren't possible before:

| Use Case                  | Description                                                                                                   |
| :------------------------ | :------------------------------------------------------------------------------------------------------------ |
| **🤖 AI Agents**          | Build autonomous agents that create and resolve their own prediction markets based on real-world data feeds   |
| **🏠 Community Markets**  | DAOs and communities can create markets around internal events, governance decisions, or community milestones |
| **🎮 Gaming & Esports**   | Game studios can create markets for in-game events with their own verification systems                        |
| **📊 Private Enterprise** | Companies can run internal prediction markets for forecasting with proprietary data sources                   |
| **🔗 Custom Data Feeds**  | Integrate with any API or data source—sports feeds, weather data, stock prices, or custom sensors             |

> **For Builders**: If you're building an AI agent, a community platform, or any application that needs programmatic control over market outcomes—Custom Oracles are for you.

### How It Works

When you create a market with a custom oracle:

1. **You specify a `settlerAddress`** — This is the wallet that has exclusive authority to resolve the market
2. **PNP's global AI oracle is bypassed** — Only YOUR oracle can determine the outcome
3. **You control the timeline** — Mark the market resolvable when you're ready, then settle it

```typescript  theme={null}
// The key parameter is `settlerAddress`
const market = await client.createMarketWithCustomOracle({
  question: "Your market question",
  initialLiquidity: 5_000_000n,
  endTime: BigInt(Math.floor(Date.now() / 1000) + 86400),
  collateralMint: USDC_MINT,
  settlerAddress: YOUR_ORACLE_PUBKEY,  // 👈 This wallet controls resolution
});
```

### The 15-Minute Buffer Period

> ⚠️ **Critical**: After market creation, you have a **15-minute buffer window** to activate your market.

Here's how the buffer period works:

| Timeline                           | Market State    | What to Do                                                     |
| :--------------------------------- | :-------------- | :------------------------------------------------------------- |
| **0 - 15 minutes**                 | `NOT_TRADEABLE` | Oracle must call `setMarketResolvable(true)` to enable trading |
| **If activated within 15 min**     | `TRADEABLE`     | Users can buy/sell YES and NO tokens                           |
| **If NOT activated within 15 min** | `UNRESOLVABLE`  | Market is permanently frozen, users cannot trade               |

**Why this matters:**

* The buffer period protects users from trading on markets that may never be resolved
* It ensures the oracle is actively monitoring the market
* You can activate trading instantly (even in seconds) by calling `setMarketResolvable(true)` right after creation

```typescript  theme={null}
// Immediately after creating the market, enable trading:
await client.setMarketResolvable(marketAddress, true);
```

### Oracle Lifecycle

As a custom oracle operator, you're responsible for the full market lifecycle:

#### Step 1: Create Market

```typescript  theme={null}
const result = await client.createMarketWithCustomOracle({
  question: 'Will BTC hit $150K by Dec 2026?',
  initialLiquidity: 50_000_000n, // 50 USDC
  endTime: BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60),
  collateralMint: USDC_MINT,
  settlerAddress: ORACLE_WALLET,
});

console.log('Market:', result.market.toBase58());
```

#### Step 2: Enable Trading (Within 15 Minutes!)

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

const MARKET = 'YourMarketAddressHere';

async function enableTrading() {
  const client = new PNPClient(RPC_URL, PNPClient.parseSecretKey(ORACLE_PRIVATE_KEY));
  
  console.log('🔧 Setting market resolvable to TRUE...');
  
  const result = await client.setMarketResolvable(new PublicKey(MARKET), true);
  
  console.log('✅ SUCCESS! Trading is now enabled!');
  console.log(`   TX: ${result.signature}`);
  console.log(`   Explorer: https://explorer.solana.com/tx/${result.signature}`);
}

enableTrading().catch(console.error);
```

#### Step 3: Settle the Market

Once the event concludes and you know the outcome:

```typescript  theme={null}
async function settleMarket() {
  const client = new PNPClient(RPC_URL, PNPClient.parseSecretKey(ORACLE_PRIVATE_KEY));
  
  console.log('⚖️ Settling market...');
  
  const result = await client.settleMarket({
    market: new PublicKey(MARKET),
    yesWinner: true,  // Set to `false` if NO wins
  });
  
  console.log('✅ Market settled!');
  console.log(`   Winner: YES`);
  console.log(`   TX: ${result.signature}`);
}

settleMarket().catch(console.error);
```

### Full Mainnet Example

Here's a production-ready script for creating a custom oracle market on mainnet:

```typescript  theme={null}
/**
 * Mainnet Script: Create V2 AMM Market with Custom Oracle
 * 
 * Creates a prediction market on Solana mainnet with YOUR own oracle.
 * Only your oracle wallet can resolve/settle this market.
 * 
 * Usage:
 *   tsx scripts/createMarketCustomOracle.ts
 * 
 * Environment Variables:
 *   PNP_PRIVATE_KEY - Your wallet private key (base58 or JSON array)
 *   ORACLE_ADDRESS  - (Optional) Custom oracle address. Defaults to your wallet.
 */

import { createRequire } from 'module';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { config } from 'dotenv';

config();

const require = createRequire(import.meta.url);
const { PNPClient } = require('pnp-sdk');

// =====================================================
// ========== MAINNET CONFIGURATION ===================
// =====================================================

const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

const PRIVATE_KEY = process.env.PNP_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ Private key not found in environment');
  console.log('\nSet it in your .env file:');
  console.log('  PNP_PRIVATE_KEY=your_base58_private_key_here');
  process.exit(1);
}

// Collateral token (USDC on mainnet)
const COLLATERAL_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// ========== MARKET PARAMETERS =======================

const QUESTION = process.env.MARKET_QUESTION || 
  'Will this event happen? (Custom Oracle Market)';

const INITIAL_LIQUIDITY = BigInt(
  process.env.INITIAL_LIQUIDITY || '10000000'  // 10 USDC (6 decimals)
);

const DAYS_UNTIL_END = Number(process.env.DAYS_UNTIL_END || '30');
const END_TIME = BigInt(Math.floor(Date.now() / 1000) + DAYS_UNTIL_END * 24 * 60 * 60);

// Optional: Custom YES odds in basis points (100-9900). Default is 5000 (50/50)
const YES_ODDS_BPS = process.env.YES_ODDS_BPS ? Number(process.env.YES_ODDS_BPS) : undefined;

// =====================================================

async function main() {
  console.log('\n🚀 PNP SDK - Mainnet Market Creation with Custom Oracle\n');
  console.log('═'.repeat(55));

  const secretKey = PNPClient.parseSecretKey(PRIVATE_KEY);
  const client = new PNPClient(RPC_URL, secretKey);

  console.log('✓ Connected to Solana');
  console.log(`  Program ID: ${client.client.programId.toBase58()}`);
  console.log(`  Network: ${client.client.isDevnet ? 'DEVNET' : 'MAINNET'}`);

  if (!client.anchorMarket) {
    throw new Error('AnchorMarket module not available. Check your private key.');
  }

  const walletPubkey = client.signer!.publicKey;

  // Custom oracle: use env var or default to your own wallet
  const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS
    ? new PublicKey(process.env.ORACLE_ADDRESS)
    : walletPubkey;  // Default: you are the oracle

  console.log('\n📋 Market Configuration:');
  console.log(`  Wallet: ${walletPubkey.toBase58()}`);
  console.log(`  Question: ${QUESTION}`);
  console.log(`  Collateral Mint: ${COLLATERAL_MINT.toBase58()}`);
  console.log(`  Initial Liquidity: ${INITIAL_LIQUIDITY.toString()} (raw units)`);
  console.log(`  End Time: ${new Date(Number(END_TIME) * 1000).toISOString()}`);
  console.log(`  🔮 Custom Oracle: ${ORACLE_ADDRESS.toBase58()}`);
  if (YES_ODDS_BPS) {
    console.log(`  YES Odds: ${YES_ODDS_BPS / 100}%`);
  }

  // Check collateral balance
  const tokenAta = getAssociatedTokenAddressSync(COLLATERAL_MINT, walletPubkey);
  console.log('\n💰 Checking collateral balance...');
  
  try {
    const balance = await client.client.connection.getTokenAccountBalance(tokenAta);
    const balanceAmount = BigInt(balance.value.amount);
    console.log(`  Balance: ${balance.value.uiAmountString} (${balanceAmount} raw)`);

    if (balanceAmount < INITIAL_LIQUIDITY) {
      console.error(`\n❌ Insufficient balance!`);
      console.log(`  Have: ${balance.value.uiAmountString}`);
      console.log(`  Need: ${Number(INITIAL_LIQUIDITY) / 1_000_000}`);
      process.exit(1);
    }
    console.log('  ✓ Sufficient balance');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Token account not found: ${msg}`);
    process.exit(1);
  }

  // Create market with custom oracle
  console.log('\n🚀 Creating market with custom oracle...');

  const createRes = await client.createMarketWithCustomOracle({
    question: QUESTION,
    initialLiquidity: INITIAL_LIQUIDITY,
    endTime: END_TIME,
    collateralMint: COLLATERAL_MINT,
    settlerAddress: ORACLE_ADDRESS,
    yesOddsBps: YES_ODDS_BPS,
  });

  console.log('⏳ Confirming transaction...');
  await client.client.connection.confirmTransaction(createRes.signature, 'confirmed');

  // Output result
  const result = {
    success: true,
    network: client.client.isDevnet ? 'devnet' : 'mainnet',
    market: createRes.market.toBase58(),
    signature: createRes.signature,
    question: QUESTION,
    customOracle: ORACLE_ADDRESS.toBase58(),
    collateralMint: COLLATERAL_MINT.toBase58(),
    initialLiquidity: INITIAL_LIQUIDITY.toString(),
    endTime: new Date(Number(END_TIME) * 1000).toISOString(),
    explorerUrl: `https://explorer.solana.com/address/${createRes.market.toBase58()}`,
    txUrl: `https://explorer.solana.com/tx/${createRes.signature}`
  };

  console.log('\n' + '═'.repeat(55));
  console.log('✅ MARKET CREATED SUCCESSFULLY WITH CUSTOM ORACLE!');
  console.log('═'.repeat(55));
  console.log(JSON.stringify(result, null, 2));

  console.log('\n📝 Important Next Steps:');
  console.log(`  1. Call setMarketResolvable(true) within 15 minutes to enable trading`);
  console.log(`  2. Only ${ORACLE_ADDRESS.toBase58()} can resolve this market`);
  console.log(`  3. PNP's AI oracle has NO authority over this market`);
  console.log(`  4. After end time, your oracle must settle the market`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message || err);
  if (err.logs) {
    console.error('Program logs:', err.logs);
  }
  process.exit(1);
});
```

**Environment Variables (.env file):**

```bash  theme={null}
# Required
PNP_PRIVATE_KEY=your_base58_private_key_here

# Optional
RPC_URL=https://api.mainnet-beta.solana.com
ORACLE_ADDRESS=your_oracle_pubkey  # Defaults to your wallet
MARKET_QUESTION="Will X happen?"
INITIAL_LIQUIDITY=10000000  # 10 USDC
DAYS_UNTIL_END=30
YES_ODDS_BPS=5000  # 50% (range: 100-9900)
```

> 💡 **Pro Tip**: For production deployments, consider running your oracle as a dedicated service with automated resolution logic tied to external data sources.

## How to Get Refund Initial Liquidity

If a market cannot be resolved or becomes unresolvable, the market creator can claim a refund of their initial liquidity. This section provides complete working scripts for claiming refunds from both V2 AMM markets and P2P markets.

> \[!IMPORTANT]
> Only the market creator can claim refunds, and the market must meet specific conditions (such as being unresolvable or past a buffer period).

### Claiming Refund for V2 AMM Market

For V2 AMM markets, the creator who provided the initial liquidity can claim a refund if the market is deemed unresolvable. This script demonstrates the refund process for V2 markets.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];
const MARKET_ADDRESS = 'YourMarketAddressHere';

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  const market = new PublicKey(MARKET_ADDRESS);

  // Claim refund for unresolvable market
  const result = await client.claimMarketRefund(market);

  console.log('Refund claimed successfully!');
  console.log('Signature:', result.signature);
}

main().catch(console.error);
```

**Key Points for V2 Market Refunds:**

* Only the market creator can claim a refund
* The market must be unresolvable
* Uses `client.claimMarketRefund()` method

### Claiming Refund for P2P Market

For P2P markets, creators can claim refunds with additional checks including buffer period validation. This script demonstrates the complete refund process for P2P markets with detailed error handling.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];
const MARKET_ADDRESS = 'YourMarketAddressHere';

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  const market = new PublicKey(MARKET_ADDRESS);

  // Claim P2P market refund
  // Note: The SDK handles all PDA derivations and account validations internally
  const result = await client.claimP2PMarketRefund(market);

  console.log('P2P refund claimed successfully!');
  console.log('Signature:', result.signature);
}

main().catch(console.error);
```

**Key Points for P2P Market Refunds:**

* Only the market creator can claim a refund
* Must wait for the buffer period to pass before claiming
* Uses `client.claimP2PMarketRefund()` for simplified refund claiming
* SDK handles creator validation and token program detection automatically

**Common Refund Errors:**

| Error                             | Description                                                | Solution                                            |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `BufferPeriodNotPassed`           | The required waiting period hasn't elapsed                 | Wait until the buffer period passes before retrying |
| `Signer is not the creator`       | The wallet attempting the refund is not the market creator | Use the creator's wallet to claim the refund        |
| `Market account not found`        | Invalid market address provided                            | Verify the market address is correct                |
| `Redemption module not available` | No wallet/signer configured in the client                  | Initialize PNPClient with a valid private key       |

**Comparison: V2 AMM vs P2P Refund Process**

| Feature               | V2 AMM Market Refund         | P2P Market Refund                     |
| --------------------- | ---------------------------- | ------------------------------------- |
| SDK Method            | `client.claimMarketRefund()` | `client.claimP2PMarketRefund()`       |
| Buffer Period         | May apply                    | Required waiting period               |
| Creator Validation    | Automatic                    | Explicit check in script              |
| Token Program Support | Standard SPL Token           | Both SPL Token and Token-2022         |
| Error Details         | Basic error messages         | Advanced error parsing with codes     |
| Complexity            | Simple, single method call   | More complex, requires PDA derivation |

## How to Fetch Market Addresses

Before trading, you may want to fetch the addresses of available markets. This section provides scripts to fetch both V2 AMM and P2P market addresses.

### Fetching V2 Market Addresses

This script demonstrates how to fetch V2 market addresses from the proxy server.

```typescript  theme={null}
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';

async function main() {
  // Initialize the client
  const client = new PNPClient(RPC_URL);
  
  // Fetch market addresses from proxy
  const addresses = await client.fetchMarketAddresses();

  console.log(`Found ${addresses.length} V2 markets:`);
  addresses.forEach((addr) => console.log(addr));
}

main().catch(console.error);
```

### Fetching P2P Market Addresses

This script demonstrates how to fetch the list of available P2P market addresses.

```typescript  theme={null}
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';

async function main() {
  // Initialize client
  const client = new PNPClient(RPC_URL);
  
  // Fetch P2P market addresses
  const marketAddresses = await client.fetchV3MarketAddresses();
  
  console.log(`Found ${marketAddresses.length} P2P markets:`);
  marketAddresses.forEach((address) => console.log(address));
}

main().catch(console.error);
```

## How to Trade

Once markets are created, users can trade by buying or selling outcome tokens (YES/NO). This section provides simple examples for trading on both V2 AMM and P2P markets.

### Trading on V2 AMM Markets

V2 AMM markets allow you to buy YES or NO tokens using USDC as collateral. The AMM automatically determines the price based on the current liquidity pools.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];
const MARKET_ADDRESS = 'YourMarketAddressHere';

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  const marketPublicKey = new PublicKey(MARKET_ADDRESS);

  // Buy YES tokens with 1 USDC
  const buyResult = await client.trading.buyTokensUsdc({
    market: marketPublicKey,
    buyYesToken: true,  // true for YES, false for NO
    amountUsdc: 1,      // Amount in USDC
  });

  console.log('Trade successful!');
  console.log('Signature:', buyResult.signature);
  console.log('Tokens received:', buyResult.tokensReceived);
}

main().catch(console.error);
```

**Key Points for V2 AMM Trading:**

* Use `client.trading.buyTokensUsdc()` to buy outcome tokens
* Set `buyYesToken: true` for YES tokens, `false` for NO tokens
* Amount is specified in USDC (e.g., `1` = 1 USDC)
* The AMM automatically calculates token price based on liquidity

### Trading on P2P Markets

P2P markets work differently - you can fetch available markets and trade directly with the market creator or other participants.

#### Fetching Available P2P Markets

```typescript  theme={null}
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';

async function main() {
  // Initialize read-only client (no private key needed)
  const client = new PNPClient(RPC_URL);
  
  // Fetch all P2P market addresses
  const marketAddresses = await client.fetchV3MarketAddresses();
  
  console.log(`Found ${marketAddresses.length} P2P markets:`);
  marketAddresses.forEach((address, index) => {
    console.log(`${index + 1}. ${address}`);
  });
}

main().catch(console.error);
```

#### Trading on P2P Markets

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];
const MARKET_ADDRESS = 'YourP2PMarketAddressHere';

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  const market = new PublicKey(MARKET_ADDRESS);

  // Buy tokens on P2P market
  const result = await client.tradeP2PMarket({
    market,
    side: 'yes',  // 'yes' or 'no'
    amount: 1_000_000n,  // Amount in base units (e.g., 1 USDC with 6 decimals)
  });

  console.log('P2P trade successful!');
  console.log('Signature:', result.signature);
}

main().catch(console.error);
```

**Key Points for P2P Market Trading:**

* Use `client.fetchV3MarketAddresses()` to get all available P2P markets (no auth required)
* Use `client.tradeP2PMarket()` to execute trades
* Specify `side` as `'yes'` or `'no'`
* Amount is in base units (for USDC: 1\_000\_000 = 1 USDC)

**Comparison: V2 AMM vs P2P Trading**

| Feature          | V2 AMM Market                      | P2P Market                                 |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| Trading Method   | `client.trading.buyTokensUsdc()`   | `client.tradeP2PMarket()`                  |
| Price Discovery  | Automated via AMM                  | Direct peer-to-peer                        |
| Liquidity        | Pool-based                         | Creator/participant-based                  |
| Amount Format    | USDC amount (e.g., `1` for 1 USDC) | Base units (e.g., `1_000_000n` for 1 USDC) |
| Market Discovery | Via `client.fetchMarkets()`        | Via `client.fetchV3MarketAddresses()`      |

## How to Redeem Winnings

After a market has been resolved, users holding winning positions (YES or NO tokens) can redeem them for the collateral asset (e.g., USDC).

### Redeeming from Resolved Markets

This script demonstrates how to check if a market is resolved and redeem winning positions.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const WALLET_SECRET_ARRAY = [/* Your 64-byte private key array goes here */];
const MARKET_ADDRESS = 'YourMarketAddressHere';

async function main() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, Uint8Array.from(WALLET_SECRET_ARRAY));
  const market = new PublicKey(MARKET_ADDRESS);

  // Check market status
  const { account: marketAccount } = await client.fetchMarket(market);
  
  if (!marketAccount.resolved) {
    console.log('Market is not yet resolved. Cannot redeem position.');
    return;
  }
  
  console.log('Market is resolved!');
  console.log('Winning Token ID:', marketAccount.winning_token_id);

  // Redeem winning position
  // This works for both V2 AMM and P2P markets
  const result = await client.redeemPosition(market);

  console.log('Position redeemed successfully!');
  console.log('Signature:', result.signature);
}

main().catch(console.error);
```

**Key Points for Redemption:**

* Market must be resolved (`marketAccount.resolved === true`)
* You must hold the winning token (YES or NO)
* `client.redeemPosition()` handles the complexity of burning tokens and transferring collateral
* Works for both V2 AMM and P2P markets

## API Reference

### Core Client

#### `PNPClient`

Main client class for interacting with the PNP protocol. This is the primary entry point for all SDK operations.

```typescript  theme={null}
class PNPClient {
  readonly client: Client;            // Low-level client for direct program interactions
  readonly signer?: SignerLike;       // Optional signer for write operations
  readonly market?: MarketModule;     // Market creation operations
  readonly trading?: TradingModule;   // Trading operations
  readonly redemption?: RedemptionModule; // Redemption operations
  readonly anchorMarket?: AnchorMarketModule; // Anchor-based market operations
  readonly anchorClient?: AnchorClient; // Anchor-based client

  /**
   * Creates a new PNP client instance
   * @param rpcUrl - The URL of the Solana RPC endpoint
   * @param privateKey - Optional private key (required for write operations)
   */
  constructor(rpcUrl: string, privateKey?: Uint8Array | string | { secretKey: Uint8Array });
}
```

**Constructor Parameters:**

* `rpcUrl`: The URL of the Solana RPC endpoint (e.g., '[https://api.mainnet-beta.solana.com](https://api.mainnet-beta.solana.com)')
* `privateKey`: (Optional) Private key for signing transactions, provided as:
  * Base58-encoded string
  * Uint8Array containing raw bytes
  * Object with secretKey property containing Uint8Array

**Example:**

```typescript  theme={null}
// Read-only client (can only fetch data)
const readOnlyClient = new PNPClient('https://api.mainnet-beta.solana.com');

// Full client with signing capabilities
const fullClient = new PNPClient(
  'https://api.mainnet-beta.solana.com',
  'base58EncodedPrivateKey...'
);
```

**Usage Notes:**

* Without a private key, only read-only methods will be available
* With a valid private key, all modules (market, trading, redemption) are initialized
* The client automatically detects and supports both SPL Token and Token-2022 programs

### SDK Module Structure

The PNP SDK is organized into modules for different functionality areas:

1. **Core Client Methods** - Available directly on the `PNPClient` instance:
   * `redeemPosition` - Redeem winning positions after market resolution
   * `claimMarketRefund` - Claim refund for unresolvable markets
   * `fetchMarket`, `fetchMarkets`, `fetchGlobalConfig` - Read-only data methods
   * `fetchSettlementCriteria`, `getSettlementCriteria` - Proxy server integration
   * `fetchSettlementData`, `getSettlementData` - Get market settlement details
   * `fetchMarketAddresses` - Get all market addresses from proxy

2. **Market Module** - Available via `client.market` (requires signer):
   * `createMarket` - Create new prediction markets

3. **Trading Module** - Available via `client.trading` (requires signer):
   * `buyOutcome` - Buy YES/NO tokens with collateral
   * `sellOutcome` - Sell YES/NO tokens for collateral
   * `getMarketInfo` - Get detailed market information

4. **Redemption Module** - Available via `client.redemption` (requires signer):
   * `redeemPositionV2` - Low-level position redemption (used by core `redeemPosition`)
   * `creatorRefund`, `creatorRefundV2` - Low-level refund methods

5. **Anchor-based Modules** - Available via `client.anchorMarket` and `client.anchorClient` (optional):
   * Provides Anchor program interfaces for advanced use cases

**Example of module usage:**

```typescript  theme={null}
// Core client method (available without signer)
const marketData = await client.fetchMarket(marketPublicKey);

// Module method (requires signer)
const buyResult = await client.trading.buyOutcome({
  market: marketPublicKey,
  outcome: 'YES',
  amountUsdc: 5_000_000, // 5 USDC
});
```

### Main SDK Methods

#### `redeemPosition(market: PublicKey, options?: RedeemPositionOptions): Promise<{ signature: string }>`

Redeems a winning position in a resolved market. This is used to claim your winnings after a market has been resolved.

**Parameters:**

* `market`: PublicKey - The market where the position was created
* `options`: (Optional) Configuration object
  * `admin`: PublicKey - Override the admin account from global config
  * `marketCreator`: PublicKey - Override the market creator from market account
  * `creatorFeeTreasury`: PublicKey - Override the creator fee treasury account

**Returns:** Promise that resolves to an object containing the transaction signature

**Example:**

```typescript  theme={null}
const marketAddress = '7pDJi7pVZMSCZY97QLcCLc7AQrJW9g2GVBcoiPE8PtuZ';
const market = new PublicKey(marketAddress);

try {
  // First check market status to verify it's resolved
  const { account: marketAccount } = await client.fetchMarket(market);
  
  if (!marketAccount.resolved) {
    throw new Error('Market is not yet resolved. Cannot redeem position.');
  }
  
  console.log('Market status:', { 
    resolved: marketAccount.resolved,
    winningToken: marketAccount.winning_token_id 
  });

  // Redeem the winning position
  const result = await client.redeemPosition(market);
  console.log('Position redeemed successfully! Signature:', result.signature);
} catch (error) {
  console.error('Error redeeming position:', error);
}
```

#### `claimMarketRefund(market: PublicKey): Promise<{ signature: string }>`

Claims a refund for a market creator if the market is not resolvable. This method allows creators to retrieve their initial liquidity if the market cannot be resolved.

**Parameters:**

* `market`: PublicKey - The market to claim the refund for

**Returns:** Promise that resolves to an object containing the transaction signature

**Eligibility:**

* Market must not be resolvable (checked via on-chain flag or proxy server)
* The caller (signer) must be the market creator

**Example:**

```typescript  theme={null}
const marketAddress = 'BgXHNrCuAhi3Dv5KpSybTzDbRgVBeEKEwDAwGhQSEpAL';
const market = new PublicKey(marketAddress);

try {
  const result = await client.claimMarketRefund(market);
  console.log('Creator refund claimed successfully! Signature:', result.signature);
} catch (error) {
  console.error('Error claiming creator refund:', error);
}
```

### Read-Only Helpers

These methods are available even without providing a private key to the client constructor.

#### `fetchMarket(market: PublicKey): Promise<{ publicKey: PublicKey; account: MarketType }>`

Fetches detailed information about a specific market.

**Parameters:**

* `market`: PublicKey - The market to fetch information for

**Returns:** Promise that resolves to an object containing:

* `publicKey`: PublicKey - The market's public key
* `account`: MarketType - The market account data

**Example:**

```typescript  theme={null}
const marketAddress = '3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd';
const market = new PublicKey(marketAddress);

try {
  const { publicKey, account } = await client.fetchMarket(market);
  console.log('Market Question:', account.question);
  console.log('Creator:', new PublicKey(account.creator).toBase58());
  console.log('Resolved:', account.resolved);
  console.log('Winning Token:', account.winning_token_id || 'Not yet resolved');
} catch (error) {
  console.error('Error fetching market:', error);
}
```

#### `fetchMarkets(): Promise<MarketsResponse>`

Fetches all available markets.

**Returns:** Promise that resolves to an object containing:

* `count`: number - The number of markets found
* `data`: Array of market objects with:
  * `publicKey`: string - The market's public key as a base58 string
  * `account`: MarketType - The market account data

**Example:**

```typescript  theme={null}
try {
  const { count, data } = await client.fetchMarkets();
  console.log(`Found ${count} markets`);
  
  // Display basic info for each market
  data.forEach(({ publicKey, account }) => {
    console.log('--------------------------');
    console.log('Market:', publicKey);
    console.log('Question:', account.question);
    console.log('Resolved:', account.resolved);
    console.log('End Time:', new Date(Number(account.end_time) * 1000).toISOString());
  });
} catch (error) {
  console.error('Error fetching markets:', error);
}
```

#### `fetchGlobalConfig(): Promise<{ publicKey: PublicKey; account: GlobalConfigType }>`

Fetches the global configuration account for the PNP program.

**Returns:** Promise that resolves to an object containing:

* `publicKey`: PublicKey - The global config account's public key
* `account`: GlobalConfigType - The global config account data

**Example:**

```typescript  theme={null}
try {
  const { publicKey, account } = await client.fetchGlobalConfig();
  console.log('Global Config Address:', publicKey.toBase58());
  console.log('Admin Address:', new PublicKey(account.admin).toBase58());
  // Access other global config fields as needed
} catch (error) {
  console.error('Error fetching global config:', error);
}
```

### Proxy Server Integration

The SDK provides methods to interact with the PNP proxy server for fetching market data and settlement information.

#### `fetchSettlementCriteria(market: string | PublicKey, baseUrl?: string): Promise<SettlementCriteria>`

Fetches settlement criteria for a market from the proxy server.

**Parameters:**

* `market`: string | PublicKey - Market address (as string or PublicKey)
* `baseUrl`: string (Optional) - Base URL for the proxy server. Defaults to environment variable or hardcoded value.

**Returns:** Promise that resolves to a SettlementCriteria object

**Example:**

```typescript  theme={null}
const marketAddress = '5ehmgehNxViAhUF9mfTeMHN1JLDqQtipwKup18AuZH7Q';

try {
  const criteria = await client.fetchSettlementCriteria(marketAddress);
  console.log('Settlement Criteria:');
  console.log(JSON.stringify(criteria, null, 2));
} catch (error) {
  console.error('Error fetching settlement criteria:', error);
}
```

#### `getSettlementCriteria(market: string | PublicKey, baseUrl?: string, options?: { retryDelayMs?: number; maxRetryTimeMs?: number }): Promise<SettlementCriteria>`

Gets settlement criteria with automatic retry logic. This is useful for waiting for criteria to become available.

**Parameters:**

* `market`: string | PublicKey - Market address (as string or PublicKey)
* `baseUrl`: string (Optional) - Base URL for the proxy server
* `options`: (Optional) Retry configuration
  * `retryDelayMs`: number - Milliseconds to wait between retries (default: 2000)
  * `maxRetryTimeMs`: number - Maximum time to retry in milliseconds (default: 15 minutes)

**Returns:** Promise that resolves to a SettlementCriteria object

**Example:**

```typescript  theme={null}
const marketAddress = '5ehmgehNxViAhUF9mfTeMHN1JLDqQtipwKup18AuZH7Q';

try {
  console.log('Waiting for settlement criteria (timeout: 15 minutes)');
  const criteria = await client.getSettlementCriteria(marketAddress);
  console.log('Settlement Criteria:');
  console.log(JSON.stringify(criteria, null, 2));
} catch (error) {
  console.error('Error getting settlement criteria:', error);
}
```

#### `fetchSettlementData(market: string | PublicKey, baseUrl?: string): Promise<SettlementData>`

Fetches settlement data for a market from the proxy server.

**Parameters:**

* `market`: string | PublicKey - Market address (as string or PublicKey)
* `baseUrl`: string (Optional) - Base URL for the proxy server

**Returns:** Promise that resolves to a SettlementData object with answer and reasoning

**Example:**

```typescript  theme={null}
const marketAddress = '5ehmgehNxViAhUF9mfTeMHN1JLDqQtipwKup18AuZH7Q';

try {
  const data = await client.fetchSettlementData(marketAddress);
  console.log('Settlement Data:');
  console.log('Answer:', data.answer);
  console.log('Reasoning:', data.reasoning);
} catch (error) {
  console.error('Error fetching settlement data:', error);
}
```

#### `getSettlementData(market: string | PublicKey, baseUrl?: string): Promise<SettlementData>`

Alias for `fetchSettlementData`.

#### `fetchMarketAddresses(baseUrl?: string): Promise<string[]>`

Fetches all market addresses from the proxy server.

**Parameters:**

* `baseUrl`: string (Optional) - Base URL for the proxy server

**Returns:** Promise that resolves to an array of market address strings

**Example:**

```typescript  theme={null}
try {
  const addresses = await client.fetchMarketAddresses();
  console.log(`Found ${addresses.length} markets on the proxy server:`);
  addresses.forEach((address, index) => {
    console.log(`${index + 1}. ${address}`);
  });
} catch (error) {
  console.error('Error fetching market addresses:', error);
}
```

### Types

#### Core Types

```typescript  theme={null}
// Market account data structure
interface MarketType {
  creator: Uint8Array;           // Market creator's public key
  question: string;              // Market question/description
  end_time: bigint;              // End time as Unix timestamp (seconds)
  resolved: boolean;             // Whether the market has been resolved
  winning_token_id: string;      // ID of the winning token ('yes' or 'no')
  resolvable: boolean;           // Whether the market can be resolved
  yes_token_mint: Uint8Array;    // YES token mint address
  no_token_mint: Uint8Array;     // NO token mint address
  collateral_token: Uint8Array;  // Collateral token mint address
  // ... other fields
}

// Response from fetchMarkets()
interface MarketsResponse {
  count: number;                        // Number of markets found
  data: Array<{
    publicKey: string;                  // Market public key (base58)
    account: MarketType;                // Market account data
  }>;
}

// Global config account data
interface GlobalConfigType {
  admin: Uint8Array;                   // Admin public key
  // ... other fields
}

// Settlement criteria returned from proxy
interface SettlementCriteria {
  resolvable: boolean;               // Whether market can be resolved
  winning_token_id?: string;         // 'yes', 'no', or undefined
  reasoning?: string;                // Explanation for the resolution
  // ... potentially other fields depending on proxy
}

// Settlement data returned from proxy
interface SettlementData {
  answer: string;                     // 'YES', 'NO', or other resolution
  reasoning: string;                  // Explanation for the resolution
  // ... potentially other fields
}
```

#### Function Parameters

```typescript  theme={null}
// Parameters for redeemPosition
interface RedeemPositionOptions {
  admin?: PublicKey;                // Override admin from global config
  marketCreator?: PublicKey;        // Override market creator
  creatorFeeTreasury?: PublicKey;   // Override creator fee treasury account
}

// Parameters for getSettlementCriteria retries
interface SettlementCriteriaOptions {
  retryDelayMs?: number;            // Delay between retries (default: 2000ms)
  maxRetryTimeMs?: number;          // Maximum retry time (default: 15min)
}
```

## Usage Examples

### Creating a Market

This example demonstrates how to create a new prediction market using the SDK.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const PRIVATE_KEY = [...]; // Your private key as Uint8Array or base58 string

async function createMarket() {
  // Initialize client with private key (required for write operations)
  const client = new PNPClient(RPC_URL, PRIVATE_KEY);

  // Check if market module is available (requires valid signer)
  if (!client.market) {
    throw new Error(
      'PNPClient.market is undefined. Ensure your wallet secret is valid.'
    );
  }

  // Market parameters
  const question = 'Will Bitcoin reach $100k by end of 2023?';
  const initialLiquidity = 2_000_000n; // 2 USDC with 6 decimals
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
  
  // USDC on mainnet as collateral token
  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  console.log('Creating market with parameters:');
  console.log('Question:', question);
  console.log('Initial Liquidity:', initialLiquidity.toString());
  console.log('End Time:', new Date(Number(endTime) * 1000).toISOString());

  try {
    // Create the market
    const res = await client.market.createMarket({
      question,
      initialLiquidity,
      endTime,
      baseMint: collateralMint, // explicitly set to USDC
    });

    console.log('✅ Market created successfully!');
    console.log('Signature:', res.signature || res);

    // Extract market public key from response
    const market = res.market;
    if (market) {
      const marketAddress = typeof market.toBase58 === 'function' ? 
        market.toBase58() : market.toString();
      console.log('Market Address:', marketAddress);
      
      // Optional: Fetch the market details
      try {
        const { account } = await client.fetchMarket(market);
        console.log('Market Details:', {
          question: account.question,
          creator: new PublicKey(account.creator).toBase58(),
          endTime: new Date(Number(account.end_time) * 1000).toISOString(),
          resolved: account.resolved
        });
      } catch (e) {
        console.log('Could not fetch market details:', e);
      }
    }
    
    return res;
  } catch (error) {
    console.error('Error creating market:', error);
    throw error;
  }
}

createMarket().catch(console.error);
```

**Key Points:**

* You must initialize the client with a valid private key to create markets
* The `baseMint` parameter specifies the collateral token (e.g., USDC)
* Initial liquidity should be specified in the base units of the collateral token
* End time is a Unix timestamp in seconds

### Trading Tokens

#### Buying and Selling Tokens

The trading module allows you to buy and sell YES/NO outcome tokens in a market.

```typescript  theme={null}
import { PublicKey } from '@solana/web3.js';
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const PRIVATE_KEY = [...]; // Your private key
const MARKET_ADDRESS = '3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd';

async function executeTradeExample() {
  // Initialize client with private key
  const client = new PNPClient(RPC_URL, PRIVATE_KEY);

  if (!client.trading) {
    throw new Error('Trading module not available. Check your private key.');
  }

  const market = new PublicKey(MARKET_ADDRESS);
  
  // First, get market information and check prices
  const info = await client.trading.getMarketInfo(market);
  console.log('Market Info:', {
    question: info.question,
    creator: info.creator.toBase58(),
    yesPrice: info.yesPrice,
    noPrice: info.noPrice,
    resolveableUntil: new Date(Number(info.resolveableUntil) * 1000).toISOString()
  });

  // Buy YES tokens
  console.log('Buying YES tokens...');
  try {
    // Buy 10 USDC worth of YES tokens
    const buyResult = await client.trading.buyOutcome({
      market,
      outcome: 'YES', // or 'NO'
      amountUsdc: 10_000_000, // 10 USDC in base units (6 decimals)
    });

    console.log('✅ Buy transaction successful');
    console.log('Signature:', buyResult.signature);
    console.log('Tokens received:', buyResult.tokensReceived);
  } catch (error) {
    console.error('Error buying tokens:', error);
  }

  // Sell YES tokens
  console.log('\nSelling YES tokens...');
  try {
    // Sell 5 YES tokens
    const sellResult = await client.trading.sellOutcome({
      market, 
      outcome: 'YES',
      tokenAmount: 5_000_000, // 5 tokens in base units
    });

    console.log('✅ Sell transaction successful');
    console.log('Signature:', sellResult.signature);
    console.log('USDC received:', sellResult.usdcReceived);
  } catch (error) {
    console.error('Error selling tokens:', error);
  }
}

executeTradeExample().catch(console.error);
```

### Fetching Settlement Criteria

You can fetch settlement criteria from the proxy server to check if a market is resolvable.

```typescript  theme={null}
import { PNPClient } from 'pnp-sdk';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const MARKET_ADDRESS = '5ehmgehNxViAhUF9mfTeMHN1JLDqQtipwKup18AuZH7Q';

async function fetchCriteriaExample() {
  // Initialize read-only client (no private key needed)
  const client = new PNPClient(RPC_URL);
  
  try {
    console.log('Fetching settlement criteria...');
    // For immediate fetch without retries:
    const criteria = await client.fetchSettlementCriteria(MARKET_ADDRESS);
    
    // Or with automatic retrying (waits up to 15 minutes):
    // const criteria = await client.getSettlementCriteria(MARKET_ADDRESS);
    
    console.log('✅ Settlement Criteria:', JSON.stringify(criteria, null, 2));
    console.log('Resolvable:', criteria.resolvable);
    
    if (criteria.winning_token_id) {
      console.log('Winning Token:', criteria.winning_token_id);
    }
    
    if (criteria.reasoning) {
      console.log('Reasoning:', criteria.reasoning);
    }
  } catch (error) {
    console.error('Error fetching settlement criteria:', error);
  }
}

fetchCriteriaExample().catch(console.error);
```

### Getting Comprehensive Market Information

This example shows how to gather all available information about a market from both on-chain data and the proxy server, similar to what's used in the `market-info.ts` script.

```typescript  theme={null}
import { PNPClient } from 'pnp-sdk';
import { PublicKey } from '@solana/web3.js';

// Configuration
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const MARKET_ADDRESS = 'F1g31z3KhACaJDLUFEBQwLiSxm6BdcSHCXDYK2jVNAPU';

async function getComprehensiveMarketInfo(marketId: string) {
  // Initialize a read-only client (no private key needed)
  const client = new PNPClient(RPC_URL);
  const results: any = { marketInfo: null, settlementCriteria: null, settlementData: null };
  
  try {
    console.log(`Fetching comprehensive information for market: ${marketId}`);
    
    // 1. Get on-chain market data
    try {
      const marketPK = new PublicKey(marketId);
      const marketStatus = await client.fetchMarket(marketPK);
      
      results.marketInfo = {
        market: marketStatus.publicKey.toString(),
        question: marketStatus.account.question,
        creator: new PublicKey(marketStatus.account.creator).toString(),
        resolvable: marketStatus.account.resolvable,
        resolved: marketStatus.account.resolved,
        endTime: new Date(Number(marketStatus.account.end_time) * 1000),
        creationTime: marketStatus.account.creation_time 
          ? new Date(Number(marketStatus.account.creation_time) * 1000)
          : undefined,
        winningToken: marketStatus.account.winning_token_id || null,
      };
      
      console.log('\nMarket Information:');
      console.log(results.marketInfo);
    } catch (err) {
      console.error(`Error fetching market data: ${err.message}`);
    }
    
    // 2. Get settlement criteria from proxy
    try {
      results.settlementCriteria = await client.fetchSettlementCriteria(marketId);
      console.log('\nSettlement Criteria:');
      console.log(results.settlementCriteria);
    } catch (err) {
      console.error(`Error fetching settlement criteria: ${err.message}`);
    }
    
    // 3. Get settlement data from proxy
    try {
      results.settlementData = await client.fetchSettlementData(marketId);
      console.log('\nSettlement Data:');
      console.log({
        answer: results.settlementData.answer || 'Not provided',
        reasoning: results.settlementData.reasoning || 'Not provided'
      });
    } catch (err) {
      console.error(`Error fetching settlement data: ${err.message}`);
    }
    
    // 4. Determine market state
    let marketState = 'Unknown';
    if (results.marketInfo) {
      if (results.marketInfo.resolved) {
        marketState = 'RESOLVED';
      } else if (!results.marketInfo.resolvable) {
        marketState = 'NOT RESOLVABLE';
      } else {
        const endTime = results.marketInfo.endTime.getTime();
        if (Date.now() > endTime) {
          marketState = 'ENDED (pending resolution)';
        } else {
          marketState = 'ACTIVE';
        }
      }
    }
    
    console.log('\nMarket State Summary:');
    console.log(`State: ${marketState}`);
    if (results.settlementData?.answer) {
      console.log(`Resolution: ${results.settlementData.answer}`);
    }
    
    return results;
  } catch (err) {
    console.error(`Error getting market info: ${err.message}`);
    throw err;
  }
}

getComprehensiveMarketInfo(MARKET_ADDRESS).catch(console.error);
```

## CLI Usage

The PNP CLI provides a convenient way to interact with prediction markets. Below are the available commands and their usage.

### Environment Variables

```bash  theme={null}
# Required: Solana RPC endpoint
RPC_URL=https://api.devnet.solana.com

# Required: Wallet configuration (choose one)
WALLET_SECRET_ARRAY=[1,2,3,...]  # Array of numbers
WALLET_BS58=your_base58_private_key
WALLET_FILE=/path/to/wallet.json

# Optional: Path to IDL file
PNP_IDL_PATH=./path/to/idl.json
```

### Commands

#### Create a New Market

```bash  theme={null}
pnp create market "<question>" [--liquidity <lamports>] [--end <iso|days>]
```

**Examples:**

```bash  theme={null}
# Create market with default liquidity and end time (30 days from now)
pnp create market "Will BTC reach $100K by 2025?"

# Create market with custom liquidity (in lamports)
pnp create market "Will ETH reach $10K?" --liquidity 1000000000

# Create market with specific end date (ISO format or days from now)
pnp create market "Will SOL reach $500?" --end "2025-12-31T23:59:59Z"
pnp create market "Will DOT reach $100?" --end 14  # 14 days from now
```

#### Trading

```bash  theme={null}
# Buy tokens with USDC
pnp trade <marketId> buy <YES|NO> <amount_usdc>

# Sell tokens for USDC
pnp trade <marketId> sell <YES|NO> <amount_base_units>

# Check token balances
pnp trade <marketId> balance

# View current market prices
pnp trade <marketId> prices
```

**Examples:**

```bash  theme={null}
# Buy $20 worth of YES tokens
pnp trade 3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd buy YES 20

# Sell 10.5 NO tokens
pnp trade 3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd sell NO 10.5

# Check balances
pnp trade 3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd balance
```

#### Market Information

```bash  theme={null}
# Get market status
pnp status <marketId>

# List all available markets
pnp fetchMarkets

# Get settlement criteria from proxy server
pnp settlementCriteria <marketId>
```

The `settlementCriteria` command prints only the settlement criteria JSON returned by the proxy for the provided `<marketId>`.

**Examples:**

```bash  theme={null}
# Check if a market can be resolved or is settled
pnp status 3p7ZUwvn9S2FtRxGMSPsvRe17bf4JzSc6ex21kqhxdmd

# List all available markets
pnp fetchMarkets

# Fetch settlement criteria for a market via proxy
pnp settlementCriteria H6juzjuc6oqMFos8svRE54WKNmBwVK7MyTyAaVUES62T
```

## Best Practices

### Error Handling

Always wrap SDK calls in try-catch blocks and check for specific error conditions:

```typescript  theme={null}
try {
  const result = await client.redeemPosition(market);
  console.log('Success! Signature:', result.signature);
} catch (error) {
  // Check for specific error conditions
  if (error.message?.includes('Market is not yet resolved')) {
    console.error('This market has not been resolved yet');
  } else if (error.message?.includes('Invalid token account')) {
    console.error('You may not have the correct tokens in your wallet');
  } else {
    console.error('Transaction failed:', error.message || error);
  }
  
  // If error has program logs, display them for debugging
  if (error.logs && Array.isArray(error.logs)) {
    console.log('Program logs:', error.logs);
  }
}
```

### SDK Initialization

1. **Read-only operations**: Initialize without a private key
   ```typescript  theme={null}
   const readOnlyClient = new PNPClient('https://api.mainnet-beta.solana.com');
   ```

2. **Write operations**: Initialize with a private key
   ```typescript  theme={null}
   const client = new PNPClient(
     'https://api.mainnet-beta.solana.com', 
     'base58EncodedPrivateKeyString'
   );
   ```

3. **Always verify that required modules are available**
   ```typescript  theme={null}
   if (!client.trading) {
     throw new Error('Trading module not available. Check your private key.');
   }
   ```

### Performance Optimization

* Batch transactions when possible
* Use commitment levels appropriately
* Cache frequently accessed accounts
* Use connection commitment level 'confirmed' for better performance

### Security Considerations

* Never expose private keys in client-side code
* Validate all user inputs
* Use the latest version of the SDK
* Verify transaction details before signing

## Frequently Asked Questions

### How do I get started with the SDK?

See the [Quick Start](#quick-start) section for installation and basic usage.

### What networks are supported?

The SDK supports all Solana networks: mainnet-beta, devnet, and testnet.

### How do I handle transaction timeouts?

Implement retry logic with exponential backoff:

```typescript  theme={null}
async function retryTransaction(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### How can I monitor market events?

Use Solana's websocket API to subscribe to program accounts and logs.

### What's the difference between market and limit orders?

* Market orders execute immediately at the best available price
* Limit orders only execute at the specified price or better

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash  theme={null}
   npm install
   ```
3. Build the project:
   ```bash  theme={null}
   npm run build
   ```
4. Run tests:
   ```bash  theme={null}
   npm test
   ```

### Code Style

* Follow TypeScript best practices
* Use ESLint and Prettier for consistent formatting
* Write tests for new features
* Document public APIs with JSDoc

## Changelog

### v0.1.0 (2025-02-15)

* Initial release
* Basic market creation and trading functionality
* TypeScript type definitions
* Comprehensive documentation

## License

Apache-2.0

## Support

For support, please open an issue on [GitHub](https://github.com/your-org/pnp-sdk/issues).

## Acknowledgments

* PNP team
* Solana Team
* Anchor Framework
* All contributors
