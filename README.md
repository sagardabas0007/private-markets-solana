# Dark Alpha

Privacy-preserving prediction markets on Solana. Built for the PNP x Inco hackathon.

## What it does

Dark Alpha lets you bet on prediction markets without revealing your position size. When you place a bet, the amount is encrypted using Fully Homomorphic Encryption (FHE) via Inco Network. Other traders can see that activity is happening, but they cannot see how much you are betting.

Regular prediction markets have a problem: large bets move the market before you can finish executing. Everyone can see your order and front-run it. Dark Alpha fixes this by encrypting bet amounts on-chain.

## How it works

1. You connect your Phantom wallet
2. You find a market you want to bet on (Dark Markets use encrypted collateral)
3. You place a bet with USDC - we automatically wrap it to DAC (Dark Alpha Confidential) tokens
4. Your bet amount is encrypted using Inco FHE
5. The market sees aggregated activity, but individual positions stay private
6. When the market resolves, winnings are unwrapped back to USDC

## Tech Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Express.js, TypeScript
- Blockchain: Solana (devnet)
- Privacy: Inco Network FHE (Fully Homomorphic Encryption)
- Markets: PNP Protocol SDK
- Wallet: Phantom (via @phantom/react-sdk)

## Project Structure

```
Dark-Alpha-Solana/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── programs/
│   └── dac-token/    # DAC token Anchor program
└── scripts/          # Deployment and utility scripts
```

## Deployed Addresses (Devnet)

| Component | Address |
|-----------|---------|
| DAC Token Program | `ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq` |
| DAC SPL Mint | `JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo` |
| DAC Mint Authority PDA | `TtFoW2UtEqkVGiGtbwwnzMxyGk1JyneqeNGiZEhcDRJ` |
| Inco Lightning Program | `5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj` |
| USDC (Devnet) | `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` |

### Dark Markets (Live on Devnet)

| Market | Question |
|--------|----------|
| `Bs5fuKjufB7eervAud6E8aRe82CUie7t3tKaA9NiT1Vo` | Will Bitcoin reach $150,000 by end of Q2 2025? |
| `6T3pHe6huaqjegEVRFSmcaBwZic1JyJUsy8vDc8P3XBr` | Will Ethereum flip Bitcoin in market cap by 2026? |
| `74bB7uUGYXi4eMDrmwcyWY8NTM4iSqkGcWxVf3FtGeu6` | Will Solana process over 100,000 TPS in production by mid-2025? |
| `96ZKsnobF4K8otLPo9LYkR1z6q1WFqjXUJj6ESwaEn1Z` | Will the Federal Reserve cut rates by more than 100bps in 2025? |
| `H2idEMXuguKAvokMqvYRWY7YmPDjuLLxVB1nbjAEMQ5S` | Will a major tech company announce Bitcoin holdings in Q1 2025? |

## Running Locally

### Prerequisites

- Node.js 20+
- npm
- Solana CLI (for scripts)
- Phantom wallet browser extension

### Setup

```bash
# Install dependencies for both apps
make install

# Copy environment file
cp apps/api/.env.example apps/api/.env
# Edit .env with your keys

# Run both apps together
make dev-all

# Or run them separately in different terminals:
make dev-api   # API on http://localhost:3001
make dev-web   # Web on http://localhost:3000
```

### Available Commands

```bash
make install      # Install dependencies for both apps
make install-api  # Install API dependencies only
make install-web  # Install Web dependencies only
make dev-all      # Run both API and Web together
make dev-api      # Run API in development mode
make dev-web      # Run Web in development mode
make build        # Build both apps
make clean        # Remove node_modules and build artifacts
```

The web app runs at http://localhost:3000
The API runs at http://localhost:3001

### Environment Variables

The API needs these in `apps/api/.env`:

```
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=<your-base58-private-key>
GOOGLE_API_KEY=<for-ai-agent-features>
```

## Features

### Dark Markets
Markets that use DAC tokens as collateral. Your bet sizes are encrypted. Other traders see that positions exist but cannot see the amounts.

### AI Agent
Scans news and creates prediction markets automatically. Uses Google Gemini for analysis.

### Privacy-Preserving Order Book
Shows aggregate market activity without revealing individual positions. Position sizes are encrypted client-side before submission.

### Client-Side Signing
Users sign their own transactions. The server never holds user private keys.

## API Endpoints

### Markets
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get specific market
- `POST /api/markets/create` - Create new market
- `GET /api/markets/tracked` - Get markets created through Dark Alpha

### Dark Markets
- `GET /api/dark-markets` - List all Dark Markets (DAC collateral)
- `GET /api/dark-markets/:address` - Get specific Dark Market
- `POST /api/dark-markets/prepare-bet` - Prepare encrypted bet transaction
- `GET /api/dark-markets/balance/:wallet` - Get user's encrypted balance

### Trading
- `POST /api/trading/prepare` - Prepare unsigned transaction
- `POST /api/trading/submit` - Submit signed transaction
- `POST /api/trading/execute` - Execute trade (server-signed, deprecated)
- `GET /api/trading/market/:id/info` - Get market prices and liquidity

### Order Book
- `POST /api/orderbook/submit` - Submit encrypted position
- `GET /api/orderbook/market/:id/aggregate` - Get market aggregate
- `GET /api/orderbook/stats` - Get global stats
- `GET /api/orderbook/activity` - Get recent activity feed

### Agent
- `GET /api/agent/status` - Get AI agent status
- `POST /api/agent/scan` - Trigger news scan

## Deployment

Both apps are independent and can be deployed separately to Vercel via the dashboard.

**API:** Import repo → Root Directory: `apps/api` → Framework: Other
**Web:** Import repo → Root Directory: `apps/web` → Framework: Next.js

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

## Documentation

Visit `/docs` on the web app for comprehensive documentation including:
- Getting Started guide
- How the privacy layer works
- System architecture
- Smart contract details
- FAQ

## Limitations

This is a hackathon project running on Solana devnet. It has not been audited. The DAC token program is experimental. Do not use with real funds.

## License

MIT
