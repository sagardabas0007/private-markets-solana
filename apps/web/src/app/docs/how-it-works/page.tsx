'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Lock, Shield, Eye, EyeOff, Server, Key } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">How Privacy Works</h1>
      <p className="text-xl text-dark/70 mb-8">
        A deep dive into how Dark Alpha encrypts your positions and protects against front-running.
      </p>

      <h2 className="font-black text-2xl mt-8 mb-4">The Problem with Transparent Markets</h2>
      <p>
        In traditional prediction markets on public blockchains, every transaction is visible to everyone.
        When you place a bet, the following information is exposed:
      </p>

      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-800">Visible on Traditional Markets</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            <li>Your wallet address</li>
            <li>The exact amount you bet</li>
            <li>Which side (YES/NO) you took</li>
            <li>The timestamp of your order</li>
          </ul>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <EyeOff className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-green-800">Hidden on Dark Markets</h4>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>The exact amount you bet</li>
            <li>Your total position size</li>
            <li>Running P&L on your position</li>
            <li>Your trading patterns</li>
          </ul>
        </div>
      </div>

      <p>
        This transparency enables several attack vectors:
      </p>
      <ul>
        <li>
          <strong>Front-running:</strong> MEV bots detect your large order in the mempool and
          execute trades before you, moving the price against you
        </li>
        <li>
          <strong>Copy trading:</strong> Competitors identify successful traders and automatically
          copy their positions
        </li>
        <li>
          <strong>Order flow analysis:</strong> Sophisticated actors analyze patterns to predict
          future moves and trade against you
        </li>
      </ul>

      <h2 className="font-black text-2xl mt-10 mb-4">Fully Homomorphic Encryption (FHE)</h2>
      <p>
        Dark Alpha uses Fully Homomorphic Encryption to solve this problem. FHE is a form of
        encryption that allows computations to be performed on encrypted data without decrypting
        it first.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6 not-prose">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          How FHE Works
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <div className="font-medium">Encryption</div>
              <div className="text-sm text-slate-600">
                Your bet amount (e.g., 1000 USDC) is encrypted into a ciphertext that looks like random data
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <div className="font-medium">Computation</div>
              <div className="text-sm text-slate-600">
                Operations like adding to your balance happen on the encrypted values directly
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <div className="font-medium">Decryption</div>
              <div className="text-sm text-slate-600">
                Only you (with your private key) can decrypt the result through the co-validator
              </div>
            </div>
          </div>
        </div>
      </div>

      <p>
        The key insight is that the blockchain stores encrypted balances. Your balance can be
        updated (deposits added, withdrawals subtracted) without anyone ever seeing the actual
        numbers.
      </p>

      <h2 className="font-black text-2xl mt-10 mb-4">The DAC Token Flow</h2>
      <p>
        DAC (Dark Alpha Confidential) is the privacy layer between USDC and prediction markets.
        Here is the complete flow when you place a bet:
      </p>

      <div className="my-6 not-prose">
        <div className="relative">
          {/* Flow Diagram */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2">
            <FlowStep
              step={1}
              title="User has USDC"
              description="Standard SPL token in your wallet"
              color="blue"
            />
            <FlowArrow />
            <FlowStep
              step={2}
              title="Wrap to DAC"
              description="USDC deposited to vault, encrypted balance created"
              color="purple"
            />
            <FlowArrow />
            <FlowStep
              step={3}
              title="Place Encrypted Bet"
              description="DAC used as collateral, amount hidden"
              color="green"
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2 mt-6">
            <FlowStep
              step={4}
              title="Market Resolves"
              description="Outcome determined, winners identified"
              color="yellow"
            />
            <FlowArrow />
            <FlowStep
              step={5}
              title="Unwrap to USDC"
              description="DAC converted back, you receive USDC"
              color="blue"
            />
          </div>
        </div>
      </div>

      <p>
        From the user perspective, you only interact with USDC. The DAC wrapping and encryption
        happen automatically in the background.
      </p>

      <h2 className="font-black text-2xl mt-10 mb-4">Inco Network Integration</h2>
      <p>
        We use Inco Network for the FHE infrastructure. Inco provides two key components:
      </p>

      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5" />
            <h4 className="font-bold">Inco Lightning Program</h4>
          </div>
          <p className="text-sm text-dark/70 mb-2">
            On-chain Solana program that handles:
          </p>
          <ul className="text-sm text-dark/70 space-y-1">
            <li>Creating encrypted values</li>
            <li>Adding/subtracting encrypted amounts</li>
            <li>Comparison operations (balance checks)</li>
          </ul>
          <div className="mt-3 text-xs font-mono text-dark/50 break-all">
            5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj
          </div>
        </div>
        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5" />
            <h4 className="font-bold">Inco Co-Validator</h4>
          </div>
          <p className="text-sm text-dark/70 mb-2">
            Off-chain service that handles:
          </p>
          <ul className="text-sm text-dark/70 space-y-1">
            <li>Decryption requests (for withdrawals)</li>
            <li>Signature verification</li>
            <li>Returning signed plaintext for on-chain verification</li>
          </ul>
          <div className="mt-3 text-xs font-mono text-dark/50 break-all">
            grpc.solana-devnet.alpha.devnet.inco.org
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">What Remains Public</h2>
      <p>
        Privacy is not about hiding everything. Dark Markets still expose certain information
        that is necessary for market function:
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="pb-2 font-bold">Information</th>
              <th className="pb-2 font-bold">Status</th>
              <th className="pb-2 font-bold">Why</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2">Market question</td>
              <td className="py-2 text-blue-600">Public</td>
              <td className="py-2 text-slate-600">Users need to know what they&apos;re betting on</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">Current prices/odds</td>
              <td className="py-2 text-blue-600">Public</td>
              <td className="py-2 text-slate-600">Price discovery requires visible odds</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">Aggregate volume</td>
              <td className="py-2 text-blue-600">Public</td>
              <td className="py-2 text-slate-600">Shows market activity/interest</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">That a bet occurred</td>
              <td className="py-2 text-blue-600">Public</td>
              <td className="py-2 text-slate-600">Transaction is on-chain</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">Individual bet amounts</td>
              <td className="py-2 text-green-600">Private</td>
              <td className="py-2 text-slate-600">Prevents front-running</td>
            </tr>
            <tr>
              <td className="py-2">Your total position</td>
              <td className="py-2 text-green-600">Private</td>
              <td className="py-2 text-slate-600">Protects strategy</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Security Model</h2>
      <p>
        The security of Dark Alpha relies on several layers:
      </p>

      <ul>
        <li>
          <strong>Client-side signing:</strong> Your private key never leaves your wallet.
          Transactions are built on the server but signed locally in Phantom.
        </li>
        <li>
          <strong>FHE encryption:</strong> Balance handles are encrypted using Inco&apos;s FHE scheme.
          Breaking the encryption is computationally infeasible.
        </li>
        <li>
          <strong>Co-validator trust:</strong> Decryption requires the Inco co-validator.
          This is a trusted component, but only the account owner can request decryption.
        </li>
        <li>
          <strong>Collateral backing:</strong> The USDC vault is controlled by a PDA (Program
          Derived Address). Every DAC token is backed 1:1 by USDC.
        </li>
      </ul>

      <div className="mt-10 flex gap-4 not-prose">
        <Link
          href="/docs/getting-started"
          className="flex-1 p-4 bg-slate-50 hover:bg-slate-100 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div>
              <div className="text-sm text-dark/60">Previous</div>
              <div className="font-bold">Getting Started</div>
            </div>
          </div>
        </Link>
        <Link
          href="/docs/architecture"
          className="flex-1 p-4 bg-slate-50 hover:bg-neon-green/20 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-dark/60">Next</div>
              <div className="font-bold">Architecture</div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function FlowStep({
  step,
  title,
  description,
  color,
}: {
  step: number;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-100 border-blue-300',
    purple: 'bg-purple-100 border-purple-300',
    green: 'bg-green-100 border-green-300',
    yellow: 'bg-yellow-100 border-yellow-300',
  };

  return (
    <div className={`flex-1 p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold border">
          {step}
        </div>
        <div className="font-bold text-sm">{title}</div>
      </div>
      <div className="text-xs text-slate-600">{description}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden md:flex items-center justify-center w-8">
      <ArrowRight className="w-5 h-5 text-slate-400" />
    </div>
  );
}
