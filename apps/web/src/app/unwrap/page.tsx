'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePhantom, useAccounts, AddressType } from '@phantom/react-sdk';
import {
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  ExternalLink,
  ArrowLeft,
  Lock,
  Coins,
  Eye,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { DacTokenClient, getDacAccount } from '@/lib/dac/client';
import { Connection, PublicKey } from '@solana/web3.js';

// RPC URL for Solana devnet
const RPC_URL = 'https://api.devnet.solana.com';

export default function UnwrapPage() {
  const { isConnected } = usePhantom();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [dacBalanceHandle, setDacBalanceHandle] = useState<string | null>(null);
  const [hasDacAccount, setHasDacAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get the Solana address from connected accounts
  const solanaAccount = accounts?.find((a) => a.addressType === AddressType.solana);
  const walletAddress = solanaAccount?.address || '';

  // Create connection
  const connection = new Connection(RPC_URL, 'confirmed');

  // Fetch DAC balance handle
  const fetchDacInfo = useCallback(async () => {
    if (!walletAddress) return;

    setLoadingBalance(true);
    try {
      const userPubkey = new PublicKey(walletAddress);
      const dacAccount = await getDacAccount(connection, userPubkey);

      if (dacAccount) {
        setHasDacAccount(true);
        // Convert balance handle to hex string for display
        if (dacAccount.balanceHandle > BigInt(0)) {
          setDacBalanceHandle(`0x${dacAccount.balanceHandle.toString(16)}`);
        } else {
          setDacBalanceHandle(null);
        }
      } else {
        setHasDacAccount(false);
        setDacBalanceHandle(null);
      }
    } catch (err) {
      console.error('Failed to fetch DAC info:', err);
      setHasDacAccount(false);
      setDacBalanceHandle(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    if (walletAddress) {
      fetchDacInfo();
    }
  }, [walletAddress, fetchDacInfo]);

  const handleUnwrap = async () => {
    if (!walletAddress || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!hasDacAccount) {
      setError('No DAC account found. Wrap USDC first.');
      return;
    }

    // Check if Phantom is available
    const phantom = (window as any).phantom?.solana;
    if (!phantom) {
      setError('Phantom wallet not found');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const client = new DacTokenClient(connection);
      const userPubkey = new PublicKey(walletAddress);
      const amountUsdc = parseFloat(amount);

      // Build the withdraw transaction
      const transaction = await client.buildWithdrawTransaction(userPubkey, amountUsdc);

      // Sign and send using Phantom provider
      const { signature } = await phantom.signAndSendTransaction(transaction);

      if (signature) {
        setSuccess(signature);
        setAmount('');
        // Refresh balance after a short delay
        setTimeout(fetchDacInfo, 2000);
      }
    } catch (err) {
      console.error('Unwrap failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to unwrap DAC to USDC';
      // Provide helpful error messages
      if (errorMsg.includes('insufficient') || errorMsg.includes('balance')) {
        setError('Insufficient DAC balance. Your encrypted balance may be lower than requested.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto">
          {/* Back Link */}
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-dark/60 hover:text-dark mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <Coins className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="font-black text-4xl mb-2">Unwrap DAC to USDC</h1>
            <p className="text-dark/60">
              Convert private DAC tokens back to public USDC
            </p>
          </div>

          {/* Not Connected State */}
          {!isConnected && (
            <div className="bg-white border-2 border-dark rounded-2xl p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-dark/40" />
              <h2 className="font-bold text-2xl mb-2">Connect Your Wallet</h2>
              <p className="text-dark/60 mb-6 max-w-md mx-auto">
                Connect your Phantom wallet to unwrap DAC back to USDC.
              </p>
            </div>
          )}

          {/* Connected - Unwrap Form */}
          {isConnected && (
            <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Token Flow Visualization */}
              <div className="flex items-center justify-center gap-4 py-6 mb-6 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neon-purple/20 border-2 border-neon-purple rounded-xl flex items-center justify-center mb-2 mx-auto">
                    <Shield className="w-8 h-8 text-neon-purple" />
                  </div>
                  <span className="font-bold">DAC</span>
                  <p className="text-xs text-dark/50">Private</p>
                </div>
                <ArrowRight className="w-8 h-8 text-dark/40" />
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center justify-center mb-2 mx-auto">
                    <Coins className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="font-bold">USDC</span>
                  <p className="text-xs text-dark/50">Public</p>
                </div>
              </div>

              {/* DAC Balance Display */}
              <div className="mb-4 p-4 bg-neon-purple/10 rounded-xl border border-neon-purple/30">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-neon-purple" />
                  <span className="font-bold text-neon-purple">Encrypted Balance</span>
                </div>
                {loadingBalance ? (
                  <div className="flex items-center gap-2 text-dark/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : hasDacAccount ? (
                  dacBalanceHandle ? (
                    <div>
                      <p className="text-xs text-dark/60 mb-1">Balance Handle:</p>
                      <code className="text-xs text-dark/70 break-all block bg-white/50 p-2 rounded">
                        {dacBalanceHandle.slice(0, 24)}...
                      </code>
                      <p className="text-xs text-dark/50 mt-2 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Only you can decrypt your actual balance
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-dark/60">
                      DAC account exists but has no balance
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-sm text-dark/60 mb-2">
                      No DAC account found
                    </p>
                    <Link
                      href="/wrap"
                      className="text-sm text-neon-purple hover:underline inline-flex items-center gap-1"
                    >
                      Wrap USDC to create DAC account
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="mb-2">
                <label className="block font-bold mb-2">Amount to Unwrap (USDC equivalent)</label>
              </div>
              <div className="relative mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-4 rounded-xl border-2 border-dark bg-white
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                    focus:translate-x-[2px] focus:translate-y-[2px]
                    transition-all font-medium text-xl"
                  disabled={loading || !hasDacAccount}
                />
              </div>

              {/* Warning about encrypted balance */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  <strong>Note:</strong> Since your balance is encrypted, make sure you don&apos;t request
                  more than you have. The transaction will fail if insufficient.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-green-700">DAC Unwrapped to USDC!</span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Your USDC has been transferred to your wallet.
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${success}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-800 bg-green-200 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-green-300 transition-colors"
                  >
                    View Transaction
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Unwrap Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleUnwrap}
                disabled={loading || !amount || parseFloat(amount) <= 0 || !hasDacAccount}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Unwrapping...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5 mr-2" />
                    Unwrap to USDC
                  </>
                )}
              </Button>

              {/* Privacy Notice */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-dark/70 text-center">
                  <Lock className="w-3 h-3 inline mr-1" />
                  <strong>Note:</strong> Unwrapping reveals your position size. USDC balances are public.
                </p>
              </div>

              {/* Wrap Link */}
              <div className="mt-4 text-center">
                <Link
                  href="/wrap"
                  className="text-sm text-neon-purple hover:underline inline-flex items-center gap-1"
                >
                  Need to wrap more USDC to DAC?
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
