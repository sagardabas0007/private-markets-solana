"use client";

import { useState, useEffect, useCallback } from "react";
import { usePhantom, useConnect, useDisconnect, useAccounts, useIsExtensionInstalled, AddressType } from "@phantom/react-sdk";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { ChevronDown, ExternalLink, RefreshCw, Coins, Shield, Lock } from "lucide-react";
import { DacTokenClient, DAC_TOKEN_PROGRAM_ID, findDacMintPda, findDacAccountPda } from "@/lib/dac/client";

// USDC Devnet mint address
const USDC_DEVNET_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
const RPC_URL = "https://api.devnet.solana.com";

interface WalletBalances {
  sol: number;
  usdc: number;
  dacInitialized: boolean;
  dacBalanceHandle: string | null; // Encrypted - we can't show the actual balance
  loading: boolean;
}

/**
 * Phantom Wallet Button - Shows balances and faucet links
 */
export function PhantomWalletButton() {
  const { isConnected } = usePhantom();
  const { isInstalled, isLoading: isCheckingExtension } = useIsExtensionInstalled();
  const { connect, isConnecting, error: connectError } = useConnect();
  const { disconnect, isDisconnecting } = useDisconnect();
  const accounts = useAccounts();

  const [balances, setBalances] = useState<WalletBalances>({
    sol: 0,
    usdc: 0,
    dacInitialized: false,
    dacBalanceHandle: null,
    loading: false
  });
  const [showDropdown, setShowDropdown] = useState(false);

  // Get Solana address
  const solanaAccount = accounts?.find((a) => a.addressType === AddressType.solana);
  const address = solanaAccount?.address || "";
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "";

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address) return;

    setBalances(prev => ({ ...prev, loading: true }));

    try {
      const connection = new Connection(RPC_URL);
      const publicKey = new PublicKey(address);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);

      // Fetch USDC balance
      let usdcBalance = 0;
      try {
        const usdcAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, publicKey);
        const accountInfo = await getAccount(connection, usdcAta);
        usdcBalance = Number(accountInfo.amount) / 1_000_000; // 6 decimals
      } catch {
        // Token account doesn't exist - balance is 0
      }

      // Fetch DAC token status
      let dacInitialized = false;
      let dacBalanceHandle: string | null = null;
      try {
        const dacClient = new DacTokenClient(connection);
        const dacAccount = await dacClient.getUserAccount(publicKey);
        if (dacAccount && dacAccount.state === 'Initialized') {
          dacInitialized = true;
          // Store the handle as hex (the actual balance is encrypted)
          if (dacAccount.balanceHandle > BigInt(0)) {
            dacBalanceHandle = dacAccount.balanceHandle.toString(16).slice(0, 12) + '...';
          }
        }
      } catch {
        // DAC account doesn't exist
      }

      setBalances({
        sol: solBalance / LAMPORTS_PER_SOL,
        usdc: usdcBalance,
        dacInitialized,
        dacBalanceHandle,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalances(prev => ({ ...prev, loading: false }));
    }
  }, [address]);

  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
      // Refresh every 30 seconds
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalances]);

  // Handle connection
  const handleConnect = async () => {
    try {
      await connect({ provider: "injected" });
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // Loading state
  if (isCheckingExtension) {
    return (
      <button
        disabled
        className="bg-dark/50 text-white rounded-3xl px-6 py-3 text-sm font-bold border-2 border-dark/50"
      >
        Checking...
      </button>
    );
  }

  // Extension not installed
  if (!isInstalled) {
    return (
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-neon-purple text-white rounded-3xl px-6 py-3 text-sm font-bold border-2 border-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 inline-block"
      >
        Install Phantom
      </a>
    );
  }

  // Connected state
  if (isConnected && accounts && accounts.length > 0) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Balance Display */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono bg-white/80 px-3 py-2 rounded-xl border border-dark/20">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
              {balances.loading ? "..." : `${balances.sol.toFixed(2)} SOL`}
            </span>
            <span className="text-dark/30">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {balances.loading ? "..." : `${balances.usdc.toFixed(2)} USDC`}
            </span>
          </div>

          {/* Wallet Address Button */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-sm font-mono bg-neon-green/20 px-3 py-2 rounded-full border border-neon-green text-dark font-bold hover:bg-neon-green/30 transition-colors"
          >
            {shortAddress}
            <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Disconnect Button */}
          <button
            onClick={() => disconnect()}
            disabled={isDisconnecting}
            className="bg-red-500 text-white rounded-2xl px-4 py-2 text-xs font-bold border-2 border-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDisconnecting ? "..." : "Disconnect"}
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-dark rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden">
            {/* Balance Section */}
            <div className="p-4 border-b border-dark/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold">Balances (Devnet)</span>
                <button
                  onClick={fetchBalances}
                  disabled={balances.loading}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${balances.loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-dark/60 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                    SOL
                  </span>
                  <span className="font-bold">{balances.sol.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark/60 text-sm flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    USDC (Devnet)
                  </span>
                  <span className="font-bold">{balances.usdc.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* DAC Confidential Token Section */}
            <div className="p-4 border-b border-dark/10 bg-gradient-to-r from-neon-purple/5 to-neon-green/5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-neon-purple" />
                <span className="text-sm font-bold">DAC Token (Confidential)</span>
              </div>
              {balances.dacInitialized ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-dark/60 text-xs flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Encrypted Balance
                    </span>
                    <span className="font-mono text-xs text-neon-green">
                      {balances.dacBalanceHandle || 'Empty'}
                    </span>
                  </div>
                  <p className="text-xs text-dark/50">
                    Balance is encrypted. Only you can decrypt it.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-dark/50">
                  <p>No DAC account initialized yet.</p>
                  <p className="mt-1">Deposit USDC to create a private balance.</p>
                </div>
              )}
            </div>

            {/* Faucet Links */}
            <div className="p-4">
              <span className="text-xs font-bold text-dark/60 uppercase mb-2 block">Get Devnet Tokens</span>
              <div className="space-y-2">
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                >
                  <Coins className="w-4 h-4 text-purple-500" />
                  <span>SOL Faucet</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-dark/40" />
                </a>
                <a
                  href="https://spl-token-faucet.com/?token-name=USDC-Dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                >
                  <Coins className="w-4 h-4 text-green-500" />
                  <span>USDC Devnet Faucet</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-dark/40" />
                </a>
              </div>
            </div>

            {/* Explorer Link */}
            <div className="p-4 pt-0">
              <a
                href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-dark/5 hover:bg-dark/10 text-sm transition-colors"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-dark text-white rounded-3xl px-6 py-3 text-sm font-bold border-2 border-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
      >
        {isConnecting ? "Connecting..." : "Connect Phantom"}
      </button>
      {connectError && (
        <span className="text-xs text-red-500">{connectError.message}</span>
      )}
    </div>
  );
}
