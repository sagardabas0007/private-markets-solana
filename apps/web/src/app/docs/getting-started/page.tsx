'use client';

import Link from 'next/link';
import { ArrowRight, Wallet, Search, MousePointer, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">Getting Started</h1>
      <p className="text-xl text-dark/70 mb-8">
        Place your first private bet in under 2 minutes.
      </p>

      {/* Prerequisites */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 not-prose">
        <h3 className="font-bold mb-2">Prerequisites</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Phantom wallet installed</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Phantom set to Devnet (Settings → Developer Settings → Testnet Mode)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Some Devnet SOL for transaction fees (get from a faucet)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Devnet USDC for betting (optional - you can just explore)</span>
          </li>
        </ul>
      </div>

      <h2 className="font-black text-2xl mt-8 mb-4">Step-by-Step Guide</h2>

      {/* Step 1 */}
      <div className="flex gap-4 my-6 not-prose">
        <div className="flex-shrink-0 w-10 h-10 bg-neon-green border-2 border-dark rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          1
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </h3>
          <p className="text-dark/70 mb-3">
            Click the &quot;Connect Wallet&quot; button in the top right corner. A Phantom popup will appear
            asking you to approve the connection.
          </p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm">
            <p className="text-slate-400 mb-1">Make sure you&apos;re on Devnet:</p>
            <code>Phantom → Settings → Developer Settings → Enable Testnet Mode → Select Devnet</code>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex gap-4 my-6 not-prose">
        <div className="flex-shrink-0 w-10 h-10 bg-neon-green border-2 border-dark rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          2
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Browse Dark Markets
          </h3>
          <p className="text-dark/70 mb-3">
            Navigate to the <Link href="/markets" className="text-neon-green font-bold hover:underline">Markets</Link> page.
            The &quot;Dark Alpha&quot; filter is selected by default, showing only privacy-enabled markets.
          </p>
          <p className="text-dark/70">
            Dark Markets have a purple border and a &quot;Private&quot; badge. These are the markets where your
            bet amounts are encrypted.
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex gap-4 my-6 not-prose">
        <div className="flex-shrink-0 w-10 h-10 bg-neon-green border-2 border-dark rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          3
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Select a Market
          </h3>
          <p className="text-dark/70 mb-3">
            Click on any market card to open the market detail page. You&apos;ll see:
          </p>
          <ul className="list-disc list-inside text-dark/70 space-y-1">
            <li>The prediction question</li>
            <li>Current YES/NO prices (probabilities)</li>
            <li>Time remaining until market closes</li>
            <li>A trading panel to place bets</li>
          </ul>
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex gap-4 my-6 not-prose">
        <div className="flex-shrink-0 w-10 h-10 bg-neon-green border-2 border-dark rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          4
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Place Your Bet
          </h3>
          <p className="text-dark/70 mb-3">
            In the trading panel:
          </p>
          <ol className="list-decimal list-inside text-dark/70 space-y-2 mb-3">
            <li>Choose YES or NO based on your prediction</li>
            <li>Enter the USDC amount you want to bet</li>
            <li>Review the estimated return shown</li>
            <li>Click &quot;Place Bet&quot;</li>
            <li>Approve the transaction in Phantom</li>
          </ol>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              <strong>Privacy note:</strong> Your USDC is automatically wrapped to DAC tokens.
              The bet amount is encrypted before being recorded on-chain.
            </p>
          </div>
        </div>
      </div>

      {/* Step 5 */}
      <div className="flex gap-4 my-6 not-prose">
        <div className="flex-shrink-0 w-10 h-10 bg-neon-green border-2 border-dark rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          5
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Track Your Position
          </h3>
          <p className="text-dark/70 mb-3">
            After your bet is confirmed:
          </p>
          <ul className="list-disc list-inside text-dark/70 space-y-1">
            <li>
              View your positions on the <Link href="/portfolio" className="text-neon-green font-bold hover:underline">Portfolio</Link> page
            </li>
            <li>See aggregate market activity on the <Link href="/orderbook" className="text-neon-green font-bold hover:underline">Order Book</Link> page</li>
            <li>When the market resolves, winnings are automatically converted back to USDC</li>
          </ul>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Understanding Your Transaction</h2>
      <p>
        When you place a bet on a Dark Market, the transaction includes several operations:
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-medium">Initialize DAC Account (if needed)</div>
              <div className="text-sm text-slate-600">Creates your encrypted token account</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-medium">Wrap USDC to DAC</div>
              <div className="text-sm text-slate-600">Deposits USDC and encrypts the amount via Inco</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-medium">Place Bet</div>
              <div className="text-sm text-slate-600">Uses encrypted DAC to purchase YES or NO tokens</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Getting Devnet Tokens</h2>
      <p>To test on Devnet, you need SOL for transaction fees and optionally USDC for betting:</p>

      <h3 className="font-bold text-lg mt-6 mb-2">Devnet SOL</h3>
      <p>Get free Devnet SOL from:</p>
      <ul>
        <li>
          <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">
            Solana Faucet
          </a>
        </li>
        <li>Or use the CLI: <code className="bg-slate-100 px-2 py-1 rounded">solana airdrop 1</code></li>
      </ul>

      <h3 className="font-bold text-lg mt-6 mb-2">Devnet USDC</h3>
      <p>
        Devnet USDC can be obtained from the Solana Devnet USDC faucet or by using the spl-token CLI
        with the devnet USDC mint address:
      </p>
      <div className="bg-slate-900 text-slate-100 rounded-lg p-3 my-3 text-sm font-mono">
        Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
      </div>

      <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-lg not-prose">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium mb-1">Important Reminder</p>
            <p className="text-amber-700 text-sm">
              This is a hackathon project on Devnet. The smart contracts have not been audited.
              Do not use real funds or mainnet assets.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4 not-prose">
        <Link
          href="/docs/how-it-works"
          className="flex-1 p-4 bg-slate-50 hover:bg-neon-green/20 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-dark/60">Next</div>
              <div className="font-bold">How It Works</div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
