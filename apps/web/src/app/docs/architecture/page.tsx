'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Database, Server, Globe, Smartphone, Lock, Cpu } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">System Architecture</h1>
      <p className="text-xl text-dark/70 mb-8">
        Technical overview of Dark Alpha&apos;s components and how they interact.
      </p>

      <h2 className="font-black text-2xl mt-8 mb-4">High-Level Overview</h2>
      <p>
        Dark Alpha consists of four main layers that work together to provide private prediction markets:
      </p>

      {/* Architecture Diagram */}
      <div className="my-8 not-prose">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ArchLayer
              icon={<Smartphone className="w-6 h-6" />}
              title="Frontend"
              subtitle="Next.js App"
              items={['Phantom integration', 'Market browser', 'Trading UI', 'Portfolio view']}
              color="blue"
            />
            <ArchLayer
              icon={<Server className="w-6 h-6" />}
              title="Backend"
              subtitle="Express API"
              items={['Market service', 'Trade preparation', 'Order book', 'AI agent']}
              color="green"
            />
            <ArchLayer
              icon={<Database className="w-6 h-6" />}
              title="Blockchain"
              subtitle="Solana"
              items={['DAC program', 'PNP markets', 'Token accounts', 'PDAs']}
              color="purple"
            />
            <ArchLayer
              icon={<Lock className="w-6 h-6" />}
              title="Privacy Layer"
              subtitle="Inco Network"
              items={['FHE encryption', 'Lightning program', 'Co-validator', 'Decryption']}
              color="yellow"
            />
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Frontend (Next.js)</h2>
      <p>
        The web frontend is built with Next.js 14, using React Server Components where possible
        and client components for interactive elements.
      </p>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`apps/web/
├── src/
│   ├── app/           # Next.js pages
│   │   ├── markets/   # Market listing and details
│   │   ├── portfolio/ # User positions
│   │   ├── orderbook/ # Privacy-preserving order book
│   │   ├── docs/      # Documentation pages
│   │   └── agent/     # AI agent interface
│   ├── components/    # React components
│   │   ├── Navbar.tsx
│   │   ├── MarketCard.tsx
│   │   ├── TradePanel.tsx
│   │   └── PhantomWalletButton.tsx
│   ├── lib/
│   │   ├── api.ts     # API client
│   │   └── trading.ts # Trading utilities
│   └── hooks/         # React hooks`}
        </pre>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">Key Components</h3>
      <ul>
        <li>
          <strong>PhantomWalletButton:</strong> Handles wallet connection using @phantom/react-sdk.
          Fetches SOL, USDC, and DAC balances on connect.
        </li>
        <li>
          <strong>MarketCard:</strong> Displays market info with special styling for Dark Markets
          (purple border, &quot;Private&quot; badge).
        </li>
        <li>
          <strong>TradePanel:</strong> Trading interface that prepares transactions and sends them
          to Phantom for signing.
        </li>
      </ul>

      <h2 className="font-black text-2xl mt-10 mb-4">Backend (Express)</h2>
      <p>
        The API server handles market operations, transaction building, and the privacy-preserving
        order book.
      </p>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`apps/api/
├── src/
│   ├── routes/
│   │   ├── markets.ts      # Market CRUD
│   │   ├── trading.ts      # Trade execution
│   │   ├── darkMarkets.ts  # Dark Market operations
│   │   ├── orderbook.ts    # Privacy order book
│   │   └── agent.ts        # AI market creation
│   ├── services/
│   │   ├── pnp.ts          # PNP SDK wrapper
│   │   ├── darkMarkets.ts  # DAC market service
│   │   ├── inco.ts         # Inco SDK wrapper
│   │   └── ai-provider.ts  # AI for market generation
│   └── index.ts            # Express app`}
        </pre>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">API Endpoints</h3>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="pb-2 font-bold">Endpoint</th>
              <th className="pb-2 font-bold">Method</th>
              <th className="pb-2 font-bold">Description</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <tr className="border-b border-slate-100">
              <td className="py-2">/api/markets</td>
              <td className="py-2">GET</td>
              <td className="py-2 font-sans">List all markets</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">/api/dark-markets</td>
              <td className="py-2">GET</td>
              <td className="py-2 font-sans">List Dark Markets only</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">/api/dark-markets/prepare-bet</td>
              <td className="py-2">POST</td>
              <td className="py-2 font-sans">Build unsigned bet transaction</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">/api/trading/submit</td>
              <td className="py-2">POST</td>
              <td className="py-2 font-sans">Submit signed transaction</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">/api/orderbook/submit</td>
              <td className="py-2">POST</td>
              <td className="py-2 font-sans">Submit encrypted position</td>
            </tr>
            <tr>
              <td className="py-2">/api/orderbook/market/:id/aggregate</td>
              <td className="py-2">GET</td>
              <td className="py-2 font-sans">Get market aggregate stats</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">Client-Side Signing Flow</h3>
      <p>
        The server never holds user private keys. All transactions are signed client-side:
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex-1">
              <span className="font-mono text-sm">POST /api/dark-markets/prepare-bet</span>
              <div className="text-sm text-slate-600">Client requests unsigned transaction</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div className="flex-1">
              <span className="font-medium">Server builds transaction</span>
              <div className="text-sm text-slate-600">Returns base64-encoded unsigned transaction</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div className="flex-1">
              <span className="font-medium">Phantom signs</span>
              <div className="text-sm text-slate-600">User approves in wallet popup</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div className="flex-1">
              <span className="font-mono text-sm">POST /api/trading/submit</span>
              <div className="text-sm text-slate-600">Client submits signed transaction</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">On-Chain Programs</h2>

      <h3 className="font-bold text-xl mt-6 mb-3">DAC Token Program</h3>
      <p>
        The DAC token program is built with Anchor 0.31.1. It manages encrypted token balances
        via integration with Inco Lightning.
      </p>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`programs/dac-token/
├── src/
│   └── lib.rs       # Program logic
├── Cargo.toml
└── Anchor.toml

// Key accounts:
DacMint       - Stores mint config, vault reference
DacAccount    - User's encrypted balance (handle)
Vault         - PDA holding USDC collateral`}
        </pre>
      </div>

      <h4 className="font-bold mt-4 mb-2">Instructions</h4>
      <ul>
        <li><strong>initialize_account:</strong> Creates a DacAccount for a user</li>
        <li><strong>deposit:</strong> Wraps USDC to DAC, encrypts via Inco CPI</li>
        <li><strong>withdraw:</strong> Unwraps DAC to USDC, requires decryption proof</li>
        <li><strong>transfer:</strong> Moves encrypted balance between accounts</li>
      </ul>

      <h3 className="font-bold text-xl mt-6 mb-3">PNP Protocol</h3>
      <p>
        PNP Protocol provides the prediction market infrastructure. We use their SDK
        to create markets and execute trades.
      </p>
      <ul>
        <li><strong>GlobalConfig:</strong> Protocol-wide settings, fee structure</li>
        <li><strong>Market:</strong> Individual market state (question, outcome, reserves)</li>
        <li><strong>YES/NO Tokens:</strong> Decision tokens minted for each market</li>
      </ul>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4 not-prose">
        <p className="text-amber-800 text-sm">
          <strong>Integration note:</strong> PNP currently requires markets to use the same
          collateral token specified in GlobalConfig. We work around this by using a separate
          protocol instance configured with DAC as collateral.
          See <Link href="/docs/contracts" className="underline">Smart Contracts</Link> for
          details on the proposed native support.
        </p>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Inco Network</h2>
      <p>
        Inco provides the FHE infrastructure for encrypted computations.
      </p>

      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5" />
            <h4 className="font-bold">Lightning Program (On-Chain)</h4>
          </div>
          <div className="text-xs font-mono text-dark/50 mb-3 break-all">
            5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj
          </div>
          <ul className="text-sm text-dark/70 space-y-1">
            <li>CPI target for encryption operations</li>
            <li>Returns handles (ciphertext references)</li>
            <li>Supports add, subtract, compare</li>
          </ul>
        </div>
        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5" />
            <h4 className="font-bold">Co-Validator (Off-Chain)</h4>
          </div>
          <div className="text-xs font-mono text-dark/50 mb-3 break-all">
            grpc.solana-devnet.alpha.devnet.inco.org
          </div>
          <ul className="text-sm text-dark/70 space-y-1">
            <li>Handles decryption requests</li>
            <li>Verifies owner signatures</li>
            <li>Returns signed plaintext</li>
          </ul>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Data Flow Example</h2>
      <p>Here is the complete data flow when a user places a 100 USDC bet on YES:</p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose text-sm">
        <div className="space-y-2 font-mono">
          <div className="text-slate-500"># 1. Frontend prepares request</div>
          <div>POST /api/dark-markets/prepare-bet</div>
          <div className="text-slate-600 pl-4">{`{ market: "Bs5fu...", side: "yes", amountUsdc: 100 }`}</div>

          <div className="text-slate-500 mt-4"># 2. Server builds transaction</div>
          <div className="text-slate-600 pl-4">- Checks if user has DacAccount (create if not)</div>
          <div className="text-slate-600 pl-4">- Adds deposit instruction (100 USDC → DAC)</div>
          <div className="text-slate-600 pl-4">- Adds buy YES tokens instruction</div>
          <div className="text-slate-600 pl-4">- Returns base64 transaction</div>

          <div className="text-slate-500 mt-4"># 3. User signs in Phantom</div>
          <div className="text-slate-600 pl-4">- Phantom displays transaction details</div>
          <div className="text-slate-600 pl-4">- User approves</div>

          <div className="text-slate-500 mt-4"># 4. Transaction submitted to Solana</div>
          <div className="text-slate-600 pl-4">- DAC program CPIs to Inco Lightning</div>
          <div className="text-slate-600 pl-4">- 100 USDC encrypted to handle 0xABC...</div>
          <div className="text-slate-600 pl-4">- Handle stored in user&apos;s DacAccount</div>
          <div className="text-slate-600 pl-4">- YES tokens minted to user</div>

          <div className="text-slate-500 mt-4"># 5. Confirmation</div>
          <div className="text-slate-600 pl-4">- Frontend shows success</div>
          <div className="text-slate-600 pl-4">- Position appears in portfolio (encrypted)</div>
        </div>
      </div>

      <div className="mt-10 flex gap-4 not-prose">
        <Link
          href="/docs/how-it-works"
          className="flex-1 p-4 bg-slate-50 hover:bg-slate-100 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div>
              <div className="text-sm text-dark/60">Previous</div>
              <div className="font-bold">How It Works</div>
            </div>
          </div>
        </Link>
        <Link
          href="/docs/contracts"
          className="flex-1 p-4 bg-slate-50 hover:bg-neon-green/20 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-dark/60">Next</div>
              <div className="font-bold">Smart Contracts</div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function ArchLayer({
  icon,
  title,
  subtitle,
  items,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: string[];
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-100 border-blue-300',
    green: 'bg-green-100 border-green-300',
    purple: 'bg-purple-100 border-purple-300',
    yellow: 'bg-yellow-100 border-yellow-300',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div>
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs text-slate-600">{subtitle}</div>
        </div>
      </div>
      <ul className="mt-3 text-xs text-slate-700 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
