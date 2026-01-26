'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft, Code, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ContractsPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="font-black text-4xl mb-4">Smart Contracts</h1>
      <p className="text-xl text-dark/70 mb-8">
        Technical documentation for the DAC token program and PNP integration.
      </p>

      <h2 className="font-black text-2xl mt-8 mb-4">Deployed Addresses</h2>
      <p>All contracts are deployed on Solana Devnet:</p>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="pb-2 text-slate-400">Component</th>
              <th className="pb-2 text-slate-400">Address</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-2 text-slate-300">DAC Program</td>
              <td className="py-2">ByaYNFzb2fPCkWLJCMEY4tdrfNqEAKAPJB3kDX86W5Rq</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 text-slate-300">DAC SPL Mint</td>
              <td className="py-2">JBxiN5BBM8ottNaUUpWw6EFtpMRd6iTnmLYrhZB5ArMo</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 text-slate-300">Mint Authority PDA</td>
              <td className="py-2">TtFoW2UtEqkVGiGtbwwnzMxyGk1JyneqeNGiZEhcDRJ</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="py-2 text-slate-300">Inco Lightning</td>
              <td className="py-2">5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-300">USDC (Devnet)</td>
              <td className="py-2">Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">DAC Token Program</h2>
      <p>
        The DAC (Dark Alpha Confidential) token program is an Anchor program that provides
        encrypted token balances by integrating with Inco Lightning for FHE operations.
      </p>

      <h3 className="font-bold text-xl mt-6 mb-3">Account Structures</h3>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`// DacMint - The mint configuration account
#[account]
pub struct DacMint {
    pub usdc_mint: Pubkey,          // USDC mint address
    pub vault: Pubkey,              // Vault holding USDC collateral
    pub total_supply_handle: u64,   // Encrypted total supply
    pub bump: u8,
}

// DacAccount - User's encrypted balance
#[account]
pub struct DacAccount {
    pub mint: Pubkey,               // The DAC mint
    pub owner: Pubkey,              // Account owner
    pub balance_handle: u64,        // Encrypted balance (Inco handle)
    pub bump: u8,
}`}
        </pre>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">Instructions</h3>

      <div className="space-y-4 my-4 not-prose">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold">initialize_account</h4>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Creates a DacAccount for a user to hold encrypted balances.
          </p>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded">
            Accounts: dac_account (init), mint, owner (signer), system_program, inco_program
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-green-600" />
            <h4 className="font-bold">deposit</h4>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Wraps USDC to DAC. Transfers USDC to vault and encrypts amount via Inco CPI.
          </p>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded mb-2">
            Accounts: mint, dac_account, vault, user_usdc_ata, owner (signer), token_program, inco_program
          </div>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded">
            Args: amount: u64
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-yellow-600" />
            <h4 className="font-bold">withdraw</h4>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Unwraps DAC to USDC. Requires decryption proof from Inco co-validator.
          </p>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded mb-2">
            Accounts: mint, dac_account, vault, user_usdc_ata, owner (signer), token_program, inco_program
          </div>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded">
            Args: amount: u64, decryption_proof: Vec&lt;u8&gt;
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold">transfer</h4>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Transfers encrypted balance between DacAccounts. Amount stays encrypted throughout.
          </p>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded mb-2">
            Accounts: mint, from_account, to_account, owner (signer), inco_program
          </div>
          <div className="text-xs font-mono bg-slate-100 p-2 rounded">
            Args: encrypted_amount_handle: u64
          </div>
        </div>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">PDA Seeds</h3>
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`// DacAccount PDA
seeds = [b"dac_account", mint.key().as_ref(), owner.key().as_ref()]

// Vault PDA
seeds = [b"vault", mint.key().as_ref()]

// Mint Authority PDA
seeds = [b"mint_authority", dac_program_id.as_ref()]`}
        </pre>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">PNP Protocol Integration</h2>
      <p>
        PNP Protocol provides the prediction market infrastructure. We integrate with their
        SDK and programs to create and trade on markets.
      </p>

      <h3 className="font-bold text-xl mt-6 mb-3">Current Limitation</h3>
      <p>
        PNP&apos;s current architecture has a constraint that all markets must use the same
        collateral token specified in the GlobalConfig:
      </p>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <pre className="text-sm">
{`// PNP's GlobalConfig (simplified)
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub collateral_token_mint: Pubkey,  // Single collateral for all markets
    pub fee: u64,
    // ...
}

// Market creation constraint
#[account(
    constraint = collateral_token_mint.key() == global_config.collateral_token_mint
)]
pub collateral_token_mint: InterfaceAccount<'info, Mint>`}
        </pre>
      </div>

      <p>
        This means a PNP protocol instance configured with USDC cannot create markets using
        DAC as collateral, and vice versa.
      </p>

      <h3 className="font-bold text-xl mt-6 mb-3">Current Workaround</h3>
      <p>
        We work around this by using a separate PNP protocol instance that is configured with
        DAC as the collateral token. This allows us to create Dark Markets using the existing
        PNP infrastructure.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4 not-prose">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">This works because:</p>
            <ul className="text-green-700 text-sm mt-2 space-y-1">
              <li>DAC is a standard SPL token (owned by Token Program)</li>
              <li>Our program PDA is the mint authority (controls minting/burning)</li>
              <li>PNP only needs the token to be SPL-compatible for transfers</li>
            </ul>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-xl mt-6 mb-3">Proposed Native Support</h3>
      <p>
        For native private market support in PNP, we propose the following changes:
      </p>

      <div className="space-y-4 my-4 not-prose">
        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="font-bold mb-2">Phase 1: Multi-Collateral Support</h4>
          <p className="text-sm text-dark/70 mb-3">
            Allow multiple approved collateral tokens instead of a single fixed one.
          </p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`pub struct GlobalConfig {
    pub default_collateral_mint: Pubkey,
    pub approved_collateral_mints: Vec<Pubkey>,  // Allow multiple
    // ...
}

#[account(
    constraint = approved_collateral_mints.contains(&collateral_token_mint.key())
)]`}
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="font-bold mb-2">Phase 2: Token-2022 Confidential Transfers</h4>
          <p className="text-sm text-dark/70 mb-3">
            Add support for tokens with the ConfidentialTransfer extension from Token-2022.
          </p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`use anchor_spl::token_2022::spl_token_2022::extension::confidential_transfer;

pub fn transfer_confidential<'info>(
    ctx: Context<TransferConfidential>,
    new_decryptable_available_balance: AeCiphertext,
    proof_instruction_offset: i8,
) -> Result<()> {
    // Use confidential transfer instruction
}`}
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="font-bold mb-2">Phase 3: Inco FHE Integration</h4>
          <p className="text-sm text-dark/70 mb-3">
            Native support for Inco handles and encrypted arithmetic in market operations.
          </p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`pub struct Market {
    // ... existing fields
    pub is_confidential: bool,
    pub encrypted_reserves_handle: Option<u64>,
}

pub fn place_confidential_bet(
    ctx: Context<PlaceConfidentialBet>,
    encrypted_amount_handle: u64,
    side: bool,
) -> Result<()> {
    // Inco CPI for encrypted operations
}`}
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Dark Markets on Devnet</h2>
      <p>
        The following prediction markets are live on Devnet using DAC as collateral:
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="pb-2 font-bold">Address</th>
              <th className="pb-2 font-bold">Question</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">Bs5fuKjufB7e...T1Vo</td>
              <td className="py-2 font-sans text-sm">Will Bitcoin reach $150,000 by end of Q2 2025?</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">6T3pHe6huaqj...3XBr</td>
              <td className="py-2 font-sans text-sm">Will Ethereum flip Bitcoin in market cap by 2026?</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">74bB7uUGYXi4...Geu6</td>
              <td className="py-2 font-sans text-sm">Will Solana process over 100,000 TPS by mid-2025?</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 text-slate-600">96ZKsnobF4K8...En1Z</td>
              <td className="py-2 font-sans text-sm">Will the Fed cut rates by more than 100bps in 2025?</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-600">H2idEMXuguKA...MQ5S</td>
              <td className="py-2 font-sans text-sm">Will a major tech company announce BTC holdings in Q1 2025?</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Security Considerations</h2>

      <div className="grid md:grid-cols-2 gap-4 my-6 not-prose">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-800 mb-2">What We Do</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>Client-side transaction signing</li>
            <li>PDA-controlled vault (no EOA)</li>
            <li>1:1 USDC collateral backing</li>
            <li>FHE for balance encryption</li>
            <li>Co-validator for decryption</li>
          </ul>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-bold text-amber-800 mb-2">Limitations</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>Devnet only - not audited</li>
            <li>Inco uses alpha endpoints</li>
            <li>Co-validator is trusted</li>
            <li>Not production ready</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg not-prose">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium mb-1">Do Not Use With Real Funds</p>
            <p className="text-red-700 text-sm">
              This is a hackathon project. The smart contracts have not been audited and may
              contain vulnerabilities. Only use on Devnet with test tokens.
            </p>
          </div>
        </div>
      </div>

      <h2 className="font-black text-2xl mt-10 mb-4">Resources</h2>
      <div className="flex flex-wrap gap-4 not-prose">
        <a
          href="https://github.com/pnp-protocol/pnp_protocol_solana"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Code className="w-4 h-4" />
          <span className="font-medium">PNP Protocol</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://docs.inco.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Code className="w-4 h-4" />
          <span className="font-medium">Inco Network Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://spl.solana.com/token-2022"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Code className="w-4 h-4" />
          <span className="font-medium">Token-2022</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="mt-10 flex gap-4 not-prose">
        <Link
          href="/docs/architecture"
          className="flex-1 p-4 bg-slate-50 hover:bg-slate-100 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div>
              <div className="text-sm text-dark/60">Previous</div>
              <div className="font-bold">Architecture</div>
            </div>
          </div>
        </Link>
        <Link
          href="/docs/faq"
          className="flex-1 p-4 bg-slate-50 hover:bg-neon-green/20 border-2 border-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-dark/60">Next</div>
              <div className="font-bold">FAQ</div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
