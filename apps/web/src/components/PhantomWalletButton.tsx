"use client";

import { usePhantom, useConnect, useDisconnect, useAccounts } from "@phantom/react-sdk";

/**
 * Phantom Wallet Button - Using official Phantom React SDK hooks
 *
 * Hooks used:
 * - usePhantom: Get connection state (isConnected, isLoading)
 * - useConnect: Connect to wallet
 * - useDisconnect: Disconnect from wallet
 * - useAccounts: Get wallet addresses
 */
export function PhantomWalletButton() {
  const { isConnected, isLoading } = usePhantom();
  const { connect, isConnecting } = useConnect();
  const { disconnect, isDisconnecting } = useDisconnect();
  const accounts = useAccounts();

  // Show loading while SDK initializes
  if (isLoading) {
    return (
      <button
        disabled
        className="bg-dark/50 text-white rounded-3xl px-6 py-3 text-sm font-bold border-2 border-dark/50"
      >
        Loading...
      </button>
    );
  }

  // Connected state - show address and disconnect button
  if (isConnected && accounts && accounts.length > 0) {
    const solanaAccount = accounts.find((a) => a.addressType === "solana");
    const address = solanaAccount?.address || accounts[0]?.address || "";
    const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connected";

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono bg-neon-green/20 px-3 py-2 rounded-full border border-neon-green text-dark font-bold">
          {shortAddress}
        </span>
        <button
          onClick={() => disconnect()}
          disabled={isDisconnecting}
          className="bg-red-500 text-white rounded-2xl px-4 py-2 text-xs font-bold border-2 border-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isDisconnecting ? "..." : "Disconnect"}
        </button>
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <button
      onClick={() => connect({ provider: "injected" })}
      disabled={isConnecting}
      className="bg-dark text-white rounded-3xl px-6 py-3 text-sm font-bold border-2 border-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
    >
      {isConnecting ? "Connecting..." : "Connect Phantom"}
    </button>
  );
}
