'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: 'general' | 'privacy' | 'trading' | 'technical';
}

const faqs: FAQItem[] = [
  // General
  {
    category: 'general',
    question: 'What is Dark Alpha?',
    answer: (
      <>
        <p>
          Dark Alpha is a privacy layer for prediction markets on Solana. It encrypts your bet
          amounts so that other traders cannot see how much you are betting, preventing
          front-running and strategy leakage.
        </p>
        <p className="mt-2">
          When you bet on a Dark Market, your USDC is wrapped into DAC (Dark Alpha Confidential)
          tokens, and the amount is encrypted using Fully Homomorphic Encryption.
        </p>
      </>
    ),
  },
  {
    category: 'general',
    question: 'How is this different from regular prediction markets?',
    answer: (
      <>
        <p>
          On regular prediction markets, every transaction is public. When you place a large bet,
          bots can see it in the mempool, copy your trade, and push the price against you before
          your order executes.
        </p>
        <p className="mt-2">
          Dark Markets encrypt individual bet amounts. Other traders can see that activity is
          happening, but they cannot see the size of your position. This protects you from
          front-running and allows you to trade with conviction without revealing your strategy.
        </p>
      </>
    ),
  },
  {
    category: 'general',
    question: 'Is this live on mainnet?',
    answer: (
      <p>
        No. Dark Alpha is a hackathon project currently running on Solana Devnet. The smart
        contracts have not been audited. Do not use with real funds. If we pursue mainnet
        deployment, it will only happen after a thorough security audit.
      </p>
    ),
  },
  // Privacy
  {
    category: 'privacy',
    question: 'What exactly is hidden vs. public?',
    answer: (
      <>
        <p><strong>Hidden (encrypted):</strong></p>
        <ul className="list-disc list-inside mt-1 mb-3">
          <li>The exact amount you bet</li>
          <li>Your total position size</li>
          <li>Your running profit/loss</li>
        </ul>
        <p><strong>Public:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>The market question and odds</li>
          <li>Aggregate trading volume</li>
          <li>That a bet occurred (but not the amount)</li>
          <li>Your wallet address (connected to transactions)</li>
        </ul>
      </>
    ),
  },
  {
    category: 'privacy',
    question: 'How does the encryption work?',
    answer: (
      <>
        <p>
          We use Fully Homomorphic Encryption (FHE) provided by Inco Network. When you deposit
          USDC into DAC tokens, the amount is encrypted into a &quot;handle&quot; - a reference to
          ciphertext stored by Inco.
        </p>
        <p className="mt-2">
          The key property of FHE is that operations can be performed on encrypted data without
          decrypting it. Your balance can be updated (deposits added, withdrawals subtracted)
          without anyone ever seeing the actual numbers.
        </p>
      </>
    ),
  },
  {
    category: 'privacy',
    question: 'Who can decrypt my balance?',
    answer: (
      <p>
        Only you can decrypt your balance. Decryption requires a signature from your wallet
        and goes through Inco&apos;s co-validator service. The co-validator verifies that you are
        the account owner before returning the decrypted value. Even the Dark Alpha team
        cannot see your encrypted balances.
      </p>
    ),
  },
  {
    category: 'privacy',
    question: 'Can the government or regulators see my trades?',
    answer: (
      <p>
        The encryption protects against other traders seeing your positions for front-running
        purposes. It is not designed for evading legal obligations. The Inco co-validator could
        theoretically be compelled to assist with decryption under legal process. Additionally,
        your wallet address is still public, so on-chain activity can be linked to you.
      </p>
    ),
  },
  // Trading
  {
    category: 'trading',
    question: 'How do I place a bet?',
    answer: (
      <>
        <ol className="list-decimal list-inside space-y-1">
          <li>Connect your Phantom wallet (set to Devnet)</li>
          <li>Go to the Markets page and select a Dark Market</li>
          <li>Choose YES or NO and enter your bet amount in USDC</li>
          <li>Click Place Bet and approve the transaction in Phantom</li>
        </ol>
        <p className="mt-2">
          Your USDC is automatically wrapped to DAC tokens and the bet is placed with the
          encrypted amount. You only need to think about USDC - we handle the privacy layer.
        </p>
      </>
    ),
  },
  {
    category: 'trading',
    question: 'What happens when a market resolves?',
    answer: (
      <p>
        When a market resolves, the outcome is determined (YES or NO wins). If you hold the
        winning token, your DAC collateral is returned. The DAC is then unwrapped back to USDC
        and you receive your winnings in USDC directly.
      </p>
    ),
  },
  {
    category: 'trading',
    question: 'Are there any fees?',
    answer: (
      <p>
        Yes, there are standard prediction market fees charged by the PNP protocol (typically
        a small percentage of trades). There are also Solana transaction fees (a few cents
        worth of SOL per transaction). Dark Alpha does not charge additional fees on top of
        these.
      </p>
    ),
  },
  {
    category: 'trading',
    question: 'How do I get Devnet tokens to test?',
    answer: (
      <>
        <p><strong>Devnet SOL:</strong> Use the{' '}
          <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">
            Solana Faucet
          </a>
          {' '}or run <code className="bg-slate-100 px-1 rounded">solana airdrop 1</code> in the CLI.
        </p>
        <p className="mt-2">
          <strong>Devnet USDC:</strong> You can get test USDC from various Devnet faucets. The
          USDC mint address on Devnet is: <code className="bg-slate-100 px-1 rounded text-xs">Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr</code>
        </p>
      </>
    ),
  },
  // Technical
  {
    category: 'technical',
    question: 'What is the DAC token?',
    answer: (
      <>
        <p>
          DAC (Dark Alpha Confidential) is our privacy-preserving token. It is a standard SPL
          token on Solana with an additional layer that tracks encrypted balances via Inco
          Network.
        </p>
        <p className="mt-2">
          When you deposit USDC, it goes into a vault and you receive an encrypted DAC balance.
          The DAC token is 1:1 backed by USDC in the vault at all times.
        </p>
      </>
    ),
  },
  {
    category: 'technical',
    question: 'Why do you use a wrapper token instead of native confidential transfers?',
    answer: (
      <p>
        Solana&apos;s Token-2022 has a ConfidentialTransfer extension, but it is not yet widely
        supported by wallets and DeFi protocols. PNP Protocol uses the standard SPL token
        interface, so we created DAC as a standard SPL token with an Inco-powered privacy
        layer on top. This allows us to integrate with existing prediction market infrastructure
        while still providing position privacy.
      </p>
    ),
  },
  {
    category: 'technical',
    question: 'Is the code open source?',
    answer: (
      <p>
        Yes, Dark Alpha is open source. You can find the repository on GitHub. The codebase
        includes the Next.js frontend, Express backend, and Anchor smart contracts.
      </p>
    ),
  },
  {
    category: 'technical',
    question: 'What happens if Inco goes down?',
    answer: (
      <p>
        If the Inco co-validator is unavailable, you would not be able to decrypt your balance
        or withdraw funds until it comes back online. This is a limitation of the current
        architecture. In production, multiple co-validators or a decentralized validator
        network would provide better availability guarantees.
      </p>
    ),
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));

  const toggleItem = (index: number) => {
    const newSet = new Set(openItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setOpenItems(newSet);
  };

  const categories = [
    { key: 'general', label: 'General' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'trading', label: 'Trading' },
    { key: 'technical', label: 'Technical' },
  ];

  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">Frequently Asked Questions</h1>
      <p className="text-xl text-dark/70 mb-8">
        Common questions about Dark Alpha, privacy, and how it all works.
      </p>

      {categories.map(({ key, label }) => {
        const categoryFaqs = faqs.filter((f) => f.category === key);
        if (categoryFaqs.length === 0) return null;

        return (
          <div key={key} className="mb-8">
            <h2 className="font-black text-xl mb-4 not-prose">{label}</h2>
            <div className="space-y-3 not-prose">
              {categoryFaqs.map((faq) => {
                const globalIndex = faqs.indexOf(faq);
                const isOpen = openItems.has(globalIndex);

                return (
                  <div
                    key={globalIndex}
                    className="border-2 border-dark rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(globalIndex)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-dark/70 text-sm border-t border-slate-200 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-10 p-4 bg-slate-50 border border-slate-200 rounded-lg not-prose">
        <h3 className="font-bold mb-2">Still have questions?</h3>
        <p className="text-sm text-dark/70">
          Check out the{' '}
          <Link href="/docs/architecture" className="text-neon-green hover:underline">
            Architecture
          </Link>
          {' '}and{' '}
          <Link href="/docs/contracts" className="text-neon-green hover:underline">
            Smart Contracts
          </Link>
          {' '}documentation for more technical details, or reach out on GitHub.
        </p>
      </div>

      <div className="mt-10 not-prose">
        <Link
          href="/docs/contracts"
          className="inline-flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <div>
            <div className="text-sm text-dark/60">Previous</div>
            <div className="font-bold">Smart Contracts</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
