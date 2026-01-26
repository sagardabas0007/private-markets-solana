"use client";

import { usePhantom, useConnect, useDisconnect, useAccounts, useIsExtensionInstalled, AddressType } from "@phantom/react-sdk";

/**
 * Phantom Wallet Button - Using official Phantom React SDK hooks
 *
 * Hooks used:
 * - usePhantom: Get connection state (isConnected)
 * - useIsExtensionInstalled: Check if Phantom extension is available
 * - useConnect: Connect to wallet
 * - useDisconnect: Disconnect from wallet
 * - useAccounts: Get wallet addresses
 */
export function PhantomWalletButton() {
  const { isConnected } = usePhantom();
  const { isInstalled, isLoading: isCheckingExtension } = useIsExtensionInstalled();
  const { connect, isConnecting, error: connectError } = useConnect();
  const { disconnect, isDisconnecting } = useDisconnect();
  const accounts = useAccounts();

  // Handle connection with error handling
  const handleConnect = async () => {
    try {
      await connect({ provider: "injected" });
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // Show loading only while checking for extension (brief check)
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

  // Extension not installed - show install link
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

  // Connected state - show address and disconnect button
  // Note: AddressType returns "Solana" (capitalized)
  if (isConnected && accounts && accounts.length > 0) {
    const solanaAccount = accounts.find((a) => a.addressType === AddressType.solana);
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
