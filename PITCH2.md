# Dark Alpha - Privacy-Preserving Prediction Markets

## Executive Summary

Dark Alpha is a privacy-preserving prediction market platform that solves **alpha leakage** through encrypted position management. We combine Inco Network's confidential computing with PNP Exchange's prediction markets to create a system where individual positions remain hidden while market efficiency is preserved.

---

## The Problem: Alpha Leakage in Prediction Markets

Current prediction markets suffer from **complete position transparency**, enabling:

| Problem | Impact | Who's Affected |
|---------|--------|----------------|
| **Front-running** | Whales see retail orders, trade ahead | Retail traders lose edge |
| **Strategy copying** | Competitors clone successful strategies | Alpha generators |
| **Whale watching** | Large positions signal information | Institutional traders |
| **Market manipulation** | Visible positions enable targeted attacks | All participants |

**Example:** A trader with $100,000 conviction on "BTC > $50k" places their bet. Within seconds, bots see the large position and copy it, diluting the trader's potential returns. The original trader's alpha is extracted by faster actors.

---

## Our Solution: Encrypted Order Book Architecture

### Why Not Direct Integration?

Our initial approach was to encrypt values with Inco SDK and submit them directly to PNP's on-chain program. **This doesn't work because:**

1. **PNP's program expects plaintext amounts** - The on-chain program processes raw USDC amounts
2. **No program-level Inco integration** - PNP wasn't built to decrypt Inco ciphertext
3. **Transaction transparency** - Even with client-side encryption, the actual Solana transaction reveals amounts

We evaluated three alternatives:

| Approach | Feasibility | Why We Chose/Rejected |
|----------|-------------|----------------------|
| **Token-2022 Confidential Transfers** | Currently disabled | Security audit in progress on mainnet/devnet |
| **Modified PNP Program** | Requires protocol changes | Out of scope for hackathon |
| **Off-Chain Encrypted Order Book** | Implementable now | **Our chosen approach** |

### The Architecture We Built

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DARK ALPHA - ENCRYPTED ORDER BOOK                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER FLOW                                                              │
│   ─────────                                                              │
│                                                                          │
│   ┌──────────────┐      ┌─────────────────────┐      ┌───────────────┐  │
│   │ 1. User      │      │ 2. Inco SDK         │      │ 3. Dark Alpha │  │
│   │    enters    │─────▶│    encrypts         │─────▶│    stores     │  │
│   │    trade     │      │    position         │      │    encrypted  │  │
│   │              │      │                     │      │    position   │  │
│   │ Amount: $500 │      │ → 04a7f3c9d2e...   │      │               │  │
│   │ Side: YES    │      │ → Commitment hash   │      │               │  │
│   └──────────────┘      └─────────────────────┘      └───────────────┘  │
│                                                              │           │
│                                                              ▼           │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                     ON-CHAIN (Solana/PNP)                         │  │
│   │                                                                   │  │
│   │   What's PUBLIC:                 What's PRIVATE:                  │  │
│   │   • Market question              • Individual position sizes      │  │
│   │   • Aggregated YES/NO odds       • Who bet what amount            │  │
│   │   • Total liquidity              • Wallet ↔ position mapping      │  │
│   │   • Commitment hashes            • Trading strategies             │  │
│   │                                                                   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   SETTLEMENT FLOW                                                        │
│   ───────────────                                                        │
│                                                                          │
│   ┌──────────────┐      ┌─────────────────────┐      ┌───────────────┐  │
│   │ 4. Market    │      │ 5. Inco TEE         │      │ 6. Winners    │  │
│   │    resolves  │─────▶│    decrypts         │─────▶│    receive    │  │
│   │    (YES/NO)  │      │    positions        │      │    payouts    │  │
│   │              │      │    verifies proofs  │      │               │  │
│   └──────────────┘      └─────────────────────┘      └───────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### How Privacy is Achieved

| Layer | Technology | What It Protects |
|-------|------------|------------------|
| **Encryption** | Inco ECIES | Position amounts, trade direction |
| **Storage** | Dark Alpha Backend | Encrypted positions until settlement |
| **Verification** | Commitment Hashes | Prove position exists without revealing |
| **Settlement** | Inco TEE | Decrypt only at market resolution |

### Technical Flow

```typescript
// 1. User creates encrypted trade
const encryptedTrade = await incoService.createPrivateTrade({
  amount: BigInt(500_000_000),  // $500 USDC
  side: 'yes',
  marketAddress: 'FQ4TVs...'
});

// 2. Returns encrypted data + commitment
{
  encryptedAmount: { handle: "04a7f3c9d2e8b1..." },  // ECIES ciphertext
  encryptedSide: { handle: "04b2e8f1a3c7..." },
  commitmentHash: "9bad3081c9e79b890d7ce97ace96d0d8...",  // SHA-256
  timestamp: 1706123456789
}

// 3. Commitment hash can be posted on-chain (optional)
// 4. Individual position stays encrypted in our backend
// 5. At settlement, Inco TEE decrypts for payout calculation
```

---

## Privacy Guarantees

### What's Hidden
- **Position size**: "$500" becomes `04a7f3c9d2e8b1...`
- **Trade direction**: "YES" becomes `04b2e8f1a3c7...`
- **Wallet-position link**: Only commitment hash is public
- **Strategy patterns**: Trading behavior is obscured

### What's Public (for market efficiency)
- **Aggregated odds**: Market shows 65% YES / 35% NO
- **Total liquidity**: "$50,000 total volume"
- **Market question**: "Will BTC exceed $50,000 by Feb 2026?"
- **Resolution**: Market outcome (YES/NO)

### Cryptographic Proofs
- **Commitment hash**: Proves position exists without revealing contents
- **Inco attestation**: Ed25519 signatures prove decryption validity
- **Zero-knowledge verification**: Verify position validity without decrypting

---

## Long-Term Roadmap

### Phase 1: Hackathon POC (Current)
- Off-chain encrypted order book
- Inco SDK encryption working
- PNP market integration for aggregated views
- Demo of privacy-preserving trade flow

### Phase 2: Confidential Token Integration
When Solana re-enables Token-2022 confidential transfers:
- Use confidential tokens as collateral
- Native on-chain privacy for token balances
- Transparent market mechanics with hidden positions

### Phase 3: PNP Program Integration
Working with PNP team to:
- Add encrypted position support to PNP program
- Inco covalidator integration for on-chain decryption
- Fully decentralized privacy-preserving markets

### Phase 4: AI-Powered Private Markets
- Claude AI generates markets from news/price data
- Encrypted strategy parameters for AI agents
- Private alpha generation without information leakage

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 | User interface |
| **Wallet** | Phantom React SDK | Solana wallet connection |
| **Encryption** | @inco/solana-sdk | ECIES encryption via TEE |
| **Markets** | @pnp-sdk/sdk | Prediction market operations |
| **Backend** | Express.js | Encrypted order book service |
| **AI** | Gemini/Claude | Market generation |
| **Chain** | Solana Devnet | Blockchain layer |

---

## Demo Flow

### 1. Connect Wallet
User connects Phantom wallet (devnet mode)

### 2. Browse Markets
View 4,754+ prediction markets from PNP

### 3. Place Encrypted Trade
- Enter amount and side (YES/NO)
- Click "Encrypt & Preview"
- See encrypted ciphertext + commitment hash

### 4. Submit Private Position
- Position stored encrypted in Dark Alpha backend
- Commitment hash recorded for verification
- Market odds updated (aggregated, no individual reveal)

### 5. Settlement
- Market resolves (YES or NO wins)
- Inco TEE decrypts positions
- Winners receive payouts based on verified positions

---

## Why This Matters

### For Retail Traders
- Place bets without whales front-running
- Strategy remains private
- Fair market participation

### For Institutional Traders
- Hide large position sizes
- No signal leakage to competitors
- Maintain information advantage

### For Market Makers
- Private liquidity provision strategies
- Reduced adverse selection
- Sustainable market making

---

## Competitive Advantage

| Feature | Dark Alpha | Traditional Markets |
|---------|------------|---------------------|
| Position privacy | Encrypted | Fully transparent |
| Front-running protection | Yes | No |
| Strategy protection | Yes | No |
| Market efficiency | Preserved (aggregates visible) | N/A |
| Decentralization | Hybrid (moving to full) | Varies |

---

## Hackathon Deliverables

1. **Working Frontend** - Next.js app with wallet connection
2. **Inco Integration** - Real encryption producing valid ciphertext
3. **PNP Integration** - 4,754 live markets from devnet
4. **Encrypted Order Book** - Store and manage private positions
5. **Privacy Demo** - Full flow from encryption to commitment
6. **AI Agent** - Market generation from news/prices

---

## Team & Contact

Built for the Solana Privacy Hackathon

**Technologies Used:**
- Inco Network (@inco/solana-sdk)
- PNP Exchange (@pnp-sdk/sdk)
- Solana Token-2022 (future integration)
- Anthropic Claude / Google Gemini

---

## Appendix: API Endpoints

### Privacy Endpoints
```bash
# Encrypt a trade
POST /api/privacy/encrypt-trade
{
  "amount": "500000000",
  "side": "yes",
  "marketAddress": "FQ4TVs..."
}

# Encrypt portfolio
POST /api/privacy/encrypt-portfolio

# Check privacy service status
GET /api/privacy/status
```

### Order Book Endpoints
```bash
# Submit encrypted position
POST /api/orderbook/submit
{
  "encryptedTrade": {...},
  "walletAddress": "7xKX..."
}

# Get market aggregate (no individual positions)
GET /api/orderbook/market/:id/aggregate

# Get my positions (requires wallet signature)
POST /api/orderbook/my-positions
```

### Market Endpoints
```bash
# List all markets
GET /api/markets

# Get market details
GET /api/markets/:id

# Get market prices (aggregated)
GET /api/trading/market/:id/info
```

---

*Dark Alpha: Where your alpha stays dark.*
