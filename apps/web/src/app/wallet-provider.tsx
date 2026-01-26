"use client";

import { ReactNode } from "react";
import { PhantomProvider, lightTheme, AddressType } from "@phantom/react-sdk";

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Phantom Wallet Provider - Using official Phantom React SDK
 *
 * This is a complete replacement for @solana/wallet-adapter-*
 * It's simpler, more reliable, and designed specifically for Phantom.
 */
export function WalletContextProvider({ children }: WalletProviderProps) {
  return (
    <PhantomProvider
      config={{
        // Only use injected provider (browser extension)
        // No OAuth needed for hackathon demo
        providers: ["injected"],
        // Required: Specify which address types to support
        addressTypes: [AddressType.solana],
      }}
      theme={lightTheme}
      appName="Dark Alpha"
    >
      {children}
    </PhantomProvider>
  );
}
