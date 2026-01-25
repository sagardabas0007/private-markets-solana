# PNP SDK Exploration Findings

## Executive Summary

After thorough exploration of the PNP (Permissionless Prediction Markets) SDK, we have successfully created markets on devnet and documented the collateral token requirements, market creation process, and confirmed our architecture decision for Dark Alpha's privacy layer.

## ✅ SUCCESSFUL MARKET CREATION (January 24, 2026)

| Method | Market Address | Question |
|--------|---------------|----------|
| `createMarketWithCustomOracle` | `4oyQb4Rzk5ZGceAS69LsqCrwWW4xPCvdatHt3uHBuEYP` | Will SOL reach $300 in 5 hours? |
| `client.market.createMarket` (V2 AMM) | `8wD3uPJEQ8GEpdJNtaxdbNiEnZeV6cJYxii85gKbe5XF` | Will BTC reach $150K by Feb 2026? |

**Key Fix:** Updated SDK from v0.2.3 to **v0.2.6** which uses the correct devnet program (`pnpkv2qnh4bfpGvTugGDSEhvZC7DP4pVxTuDykV3BGz`).

## Key Findings

### 1. Collateral Token Analysis

**PNP accepts ANY SPL token as collateral!** This was confirmed by:
1. Successfully creating a market with token `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
2. PNP documentation stating baseMint can be any SPL token

**Supported Collateral Types:**
- ✅ USDC (mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
- ✅ Any custom SPL token
- ✅ Wrapped SOL
- ⚠️ Token-2022 (supported but confidential transfers not yet available)

**Note:** The old devnet markets used `2KHoiTvJ2HhqChwE53DRoJYLJ4LcAuM1yKY7qnBRiyLF` as stub data.

### 2. Global Configuration (Devnet)

```javascript
{
  publicKey: '8NE8xRxotAoJY3eDqDF6C3e5YPuANRABxhjMP5GZGW3r',
  admin: 'G13DaAN6BCWAcbVhTiP6zM88azVdG4jfUoyKHUxpzKFY',
  collateral_token_mint: '2KHoiTvJ2HhqChwE53DRoJYLJ4LcAuM1yKY7qnBRiyLF',
  min_liquidity: 989680,  // ~0.98 tokens
  fee: 200,               // 0.2% protocol fee
  creator_fee: 3000,      // 3% creator fee
  burn_fee: 1000,         // 0.1% burn fee
  buffer_period: 900,     // 15 min buffer
  trading_paused: false
}
```

### 3. SDK Structure

**Client Initialization:**
```typescript
// Read-only
const client = new PNPClient(rpcUrl);

// With signer for transactions
const signerClient = new PNPClient(rpcUrl, privateKey);
```

**Available Modules:**
- `client.market` - Market creation and fetching
- `client.trading` - Buy/sell operations
- `client.redemption` - Claim winnings
- `client.anchorMarket` - V2 program interface
- `client.anchorMarketV3` - V3 program interface

**Market Module Methods:**
- `createMarket()` - Create new market
- `createMarketDerived()` - Create with derived addresses
- `createMarketIdl()` - Create using IDL
- `fetchMarket()` - Get single market
- `fetchGlobalConfig()` - Get global settings

### 4. Market Creation Requirements

```typescript
const params = {
  question: string,           // Market question
  initialLiquidity: bigint,   // Min: 989,680 units (~0.98 tokens)
  endTime: bigint,            // Unix timestamp
  baseMint: PublicKey,        // Must be PNP devnet token
};

await client.market.createMarket(params);
```

**Why Our Creation Failed:**
- We have 0 balance of PNP devnet tokens
- Need to acquire tokens from PNP faucet or team
- SOL balance (14 SOL) is sufficient for transaction fees

### 5. Token-2022 / Confidential Transfers

**Current Status: NOT SUPPORTED**

- PNP uses standard SPL Token program
- All markets use `spl-token` (not `spl-token-2022`)
- Confidential transfers are not available
- This confirms our architecture decision

### 6. Existing Markets Available

**Devnet Statistics:**
- Total Markets: 4,754
- Active (unresolved): ~4,000+
- All using same collateral token

**Sample Active Markets:**
```
1. 3MufZfWSHRij9bMQE9ZQLF8tqutFV2Q2GbodBTrHL9os
   "Will Jerome Powell be fired by 11/18/2025"

2. Cq4Y9SFAGeRY2w3E8WgS89uD55QKh191yZJSrPN7XSD1
   "Litecoin to reach a new all time high before August 1 2025"

3. 9n12fA9pMt5Qg4c6NVodT5azAqu2GcFcNbTyb1cbzGAd
   "Will Helium Mobile cross 100K users by August 22, 2025?"

4. HFa4MVqoVfgunnnmDB6YrXQVwV54bvg71bQKVbA7QY2k
   "Will UK rejoin the EU by December 31, 2027?"
```

## Architecture Confirmation

### Why Our Off-Chain Encrypted Order Book is Correct

1. **PNP transactions are transparent** - All trades are visible on-chain
2. **Token-2022 not supported** - No confidential transfer capability
3. **Direct integration impossible** - Inco encrypts, PNP expects plaintext
4. **Privacy must be added as a layer** - Our order book provides this

### Dark Alpha Privacy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DARK ALPHA                              │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │   User Wallet   │───▶│  Inco ECIES Encryption      │    │
│  └─────────────────┘    └─────────────────────────────┘    │
│                                    │                        │
│                                    ▼                        │
│                         ┌─────────────────────────────┐    │
│                         │  Encrypted Order Book       │    │
│                         │  - Positions hidden         │    │
│                         │  - Only aggregates visible  │    │
│                         │  - Commitment hashes public │    │
│                         └─────────────────────────────┘    │
│                                    │                        │
│                                    ▼ (on settlement)        │
│                         ┌─────────────────────────────┐    │
│                         │  PNP Markets (Devnet)       │    │
│                         │  - 4,754 markets available  │    │
│                         │  - Execute winning trades   │    │
│                         └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Integration Strategy

### For Hackathon POC:

1. **Use Existing Markets**
   - Connect to 4,754+ devnet markets
   - Display in our frontend
   - No need to create new markets

2. **Store Encrypted Positions**
   - Inco ECIES encryption on trade data
   - Store in our order book service
   - Commitment hashes for verification

3. **Privacy Features**
   - Individual positions hidden
   - Only market aggregates visible
   - Settlement reveals winners only

4. **Settlement Flow**
   - When PNP market resolves
   - Decrypt winning positions
   - Execute via PNP SDK

### For Production (Future):

1. Request PNP devnet/mainnet tokens for market creation
2. Explore PNP program modifications for native privacy
3. Wait for Token-2022 confidential transfers (post-security audit)
4. Build Inco TEE integration for on-chain settlement

## Conclusion

Our exploration confirms that the off-chain encrypted order book architecture is the optimal solution for adding privacy to PNP prediction markets. Token-2022 confidential transfers are not yet available, and PNP's current implementation uses standard SPL tokens.

The 4,754 existing markets on devnet provide ample opportunity for demonstrating our privacy layer without needing to create new markets.
