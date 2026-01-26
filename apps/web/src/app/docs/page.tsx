'use client';

import Link from 'next/link';
import { Shield, Lock, Zap, ArrowRight, ExternalLink, Github, FileText } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">Dark Alpha Documentation</h1>
      <p className="text-xl text-dark/70 mb-8">
        Privacy-preserving prediction markets on Solana. Hide your bet sizes from front-runners.
      </p>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4 mb-12 not-prose">
        <QuickCard
          href="/docs/getting-started"
          icon={<Zap className="w-6 h-6" />}
          title="Quick Start"
          description="Connect wallet and place your first private bet"
        />
        <QuickCard
          href="/docs/how-it-works"
          icon={<Lock className="w-6 h-6" />}
          title="How Privacy Works"
          description="Learn how FHE encrypts your positions"
        />
        <QuickCard
          href="/docs/architecture"
          icon={<Shield className="w-6 h-6" />}
          title="Architecture"
          description="Technical deep-dive into the system"
        />
      </div>

      <h2 className="font-black text-2xl mt-8 mb-4">What is Dark Alpha?</h2>
      <p>
        Dark Alpha is a privacy layer for prediction markets on Solana. When you place a bet on a traditional
        prediction market, everyone can see your position size. This creates problems:
      </p>
      <ul>
        <li><strong>Front-running</strong> - Bots see your order and copy it before you finish</li>
        <li><strong>Strategy leakage</strong> - Competitors learn your trading patterns</li>
        <li><strong>Price impact</strong> - Large orders move the market against you</li>
      </ul>
      <p>
        Dark Alpha solves this by encrypting bet amounts using Fully Homomorphic Encryption (FHE).
        Other traders can see that activity is happening, but they cannot see how much you are betting.
      </p>

      <h2 className="font-black text-2xl mt-8 mb-4">Key Concepts</h2>

      <h3 className="font-bold text-xl mt-6 mb-3">DAC Tokens</h3>
      <p>
        DAC (Dark Alpha Confidential) is our privacy-preserving token. When you bet on a Dark Market:
      </p>
      <ol>
        <li>Your USDC is wrapped into DAC tokens</li>
        <li>The amount is encrypted using Inco Network&apos;s FHE</li>
        <li>Your bet is placed with the encrypted amount</li>
        <li>When the market resolves, DAC is unwrapped back to USDC</li>
      </ol>
      <p>
        You interact with USDC. The DAC wrapping happens automatically.
      </p>

      <h3 className="font-bold text-xl mt-6 mb-3">Dark Markets</h3>
      <p>
        Dark Markets are prediction markets that use DAC as collateral instead of USDC.
        This means all positions are encrypted.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="pb-2 font-bold">Aspect</th>
              <th className="pb-2 font-bold">Regular Market</th>
              <th className="pb-2 font-bold">Dark Market</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2">Bet sizes</td>
              <td className="py-2 text-red-600">Visible to everyone</td>
              <td className="py-2 text-green-600">Encrypted</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2">Front-running</td>
              <td className="py-2 text-red-600">Easy</td>
              <td className="py-2 text-green-600">Not possible</td>
            </tr>
            <tr>
              <td className="py-2">Market odds</td>
              <td className="py-2">Public</td>
              <td className="py-2">Public</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">Inco Network FHE</h3>
      <p>
        Inco Network provides the encryption infrastructure. Their Lightning program on Solana handles:
      </p>
      <ul>
        <li>Creating encrypted values (ciphertext)</li>
        <li>Arithmetic on encrypted values (add, subtract)</li>
        <li>Decryption (only by the owner, through co-validator)</li>
      </ul>
      <p>
        The encryption is homomorphic, meaning operations can be performed on encrypted data
        without decrypting it first. Your balance can be updated without revealing the actual numbers.
      </p>

      <h2 className="font-black text-2xl mt-8 mb-4">Deployed Contracts</h2>
      <p>All contracts are deployed on Solana Devnet:</p>
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <tbody>
            <tr>
              <td className="py-1 pr-4 text-slate-400">DAC Program</td>
              <td className="py-1">ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-slate-400">DAC Mint</td>
              <td className="py-1">JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-slate-400">Mint Authority</td>
              <td className="py-1">TtFoW2UtEqkVGiGtbwwnzMxyGk1JyneqeNGiZEhcDRJ</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-slate-400">Inco Lightning</td>
              <td className="py-1">5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-black text-2xl mt-8 mb-4">Resources</h2>
      <div className="grid md:grid-cols-2 gap-4 not-prose">
        <a
          href="https://github.com/your-repo/dark-alpha"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <Github className="w-5 h-5" />
          <div>
            <div className="font-bold">GitHub Repository</div>
            <div className="text-sm text-slate-600">View the source code</div>
          </div>
          <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
        </a>
        <a
          href="https://docs.inco.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <FileText className="w-5 h-5" />
          <div>
            <div className="font-bold">Inco Network Docs</div>
            <div className="text-sm text-slate-600">Learn about FHE</div>
          </div>
          <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
        </a>
      </div>

      <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded-lg not-prose">
        <p className="text-amber-800 font-medium">
          This is a hackathon project running on Solana Devnet. The DAC program has not been
          audited. Do not use with real funds.
        </p>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-4 bg-slate-50 hover:bg-neon-green/20 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white border border-dark rounded-lg">{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-dark group-hover:text-dark">{title}</div>
          <div className="text-sm text-dark/60">{description}</div>
        </div>
        <ArrowRight className="w-5 h-5 text-dark/40 group-hover:text-dark group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
