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
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { DacTokenClient, USDC_DEVNET_MINT } from '@/lib/dac/client';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// RPC URL for Solana devnet
const RPC_URL = 'https://api.devnet.solana.com';

export default function WrapPage() {
  const { isConnected } = usePhantom();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get the Solana address from connected accounts
  const solanaAccount = accounts?.find((a) => a.addressType === AddressType.solana);
  const walletAddress = solanaAccount?.address || '';

  // Create connection
  const connection = new Connection(RPC_URL, 'confirmed');

  // Fetch USDC balance
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;

    setLoadingBalance(true);
    try {
      const userPubkey = new PublicKey(walletAddress);
      const usdcAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, userPubkey);

      try {
        const accountInfo = await getAccount(connection, usdcAta);
        // USDC has 6 decimals
        setUsdcBalance(Number(accountInfo.amount) / 1_000_000);
      } catch {
        // Account doesn't exist
        setUsdcBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setUsdcBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, fetchBalance]);

  const handleWrap = async () => {
    if (!walletAddress || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (usdcBalance !== null && parseFloat(amount) > usdcBalance) {
      setError('Insufficient USDC balance');
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

      // Build the deposit transaction
      const transaction = await client.buildDepositTransaction(userPubkey, amountUsdc);

      // Sign and send using Phantom provider
      const { signature } = await phantom.signAndSendTransaction(transaction);

      if (signature) {
        setSuccess(signature);
        setAmount('');
        // Refresh balance after a short delay
        setTimeout(fetchBalance, 2000);
      }
    } catch (err: any) {
      console.error('Wrap failed:', err);
      // Extract detailed error info
      let errorMsg = 'Failed to wrap USDC to DAC';
      if (err?.message) {
        errorMsg = err.message;
      }
      if (err?.logs) {
        console.error('Transaction logs:', err.logs);
        // Try to find a more specific error in logs
        const logError = err.logs.find((log: string) => log.includes('Error') || log.includes('failed'));
        if (logError) {
          errorMsg = `${errorMsg}: ${logError}`;
        }
      }
      // Check for common Solana errors
      if (errorMsg.includes('0x1')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (errorMsg.includes('0x0')) {
        errorMsg = 'Transaction simulation failed - account not found';
      } else if (errorMsg.includes('custom program error')) {
        // Extract the custom error code
        const match = errorMsg.match(/custom program error: (0x[0-9a-f]+)/i);
        if (match) {
          const errorCode = parseInt(match[1], 16);
          const errorMap: Record<number, string> = {
            6000: 'DAC Mint not initialized',
            6001: 'Account not initialized',
            6002: 'Not the owner of this account',
            6003: 'Mint mismatch',
            6004: 'Cannot withdraw zero amount',
            6005: 'Invalid plaintext format',
          };
          errorMsg = errorMap[errorCode] || `Program error ${errorCode}`;
        }
      }
      setError(errorMsg);
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-purple/20 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-neon-purple" />
            </div>
            <h1 className="font-black text-4xl mb-2">Wrap USDC to DAC</h1>
            <p className="text-dark/60">
              Convert USDC to private DAC tokens for encrypted trading
            </p>
          </div>

          {/* Not Connected State */}
          {!isConnected && (
            <div className="bg-white border-2 border-dark rounded-2xl p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-dark/40" />
              <h2 className="font-bold text-2xl mb-2">Connect Your Wallet</h2>
              <p className="text-dark/60 mb-6 max-w-md mx-auto">
                Connect your Phantom wallet to wrap USDC into private DAC tokens.
              </p>
            </div>
          )}

          {/* Connected - Wrap Form */}
          {isConnected && (
            <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Token Flow Visualization */}
              <div className="flex items-center justify-center gap-4 py-6 mb-6 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center justify-center mb-2 mx-auto">
                    <Coins className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="font-bold">USDC</span>
                  <p className="text-xs text-dark/50">Public</p>
                </div>
                <ArrowRight className="w-8 h-8 text-dark/40" />
                <div className="text-center">
                  <div className="w-16 h-16 bg-neon-purple/20 border-2 border-neon-purple rounded-xl flex items-center justify-center mb-2 mx-auto">
                    <Shield className="w-8 h-8 text-neon-purple" />
                  </div>
                  <span className="font-bold">DAC</span>
                  <p className="text-xs text-dark/50">Private</p>
                </div>
              </div>

              {/* Balance Display */}
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold">Amount (USDC)</label>
                <div className="text-sm text-dark/60">
                  {loadingBalance ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : usdcBalance !== null ? (
                    <>
                      Balance: <span className="font-bold">{usdcBalance.toFixed(2)} USDC</span>
                    </>
                  ) : (
                    'Unable to fetch balance'
                  )}
                </div>
              </div>

              {/* Amount Input */}
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
                  disabled={loading}
                />
                {usdcBalance !== null && usdcBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(usdcBalance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-dark/10 hover:bg-dark/20 rounded-lg text-sm font-bold transition-colors"
                  >
                    MAX
                  </button>
                )}
              </div>

              {/* Get USDC Link */}
              {(usdcBalance === 0 || usdcBalance === null) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    You need USDC to wrap
                  </p>
                  <a
                    href="https://spl-token-faucet.com/?token-name=USDC-Dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-yellow-700 hover:text-yellow-900 underline flex items-center gap-1"
                  >
                    Get USDC Devnet tokens from faucet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

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
                    <span className="font-bold text-green-700">USDC Wrapped to DAC!</span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Your DAC balance is now encrypted on the Inco network.
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

              {/* Wrap Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full bg-neon-purple hover:bg-neon-purple/90"
                onClick={handleWrap}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Wrapping...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Wrap to DAC
                  </>
                )}
              </Button>

              {/* Privacy Notice */}
              <div className="mt-4 p-3 bg-neon-purple/10 rounded-xl border border-neon-purple/30">
                <p className="text-xs text-dark/70 text-center">
                  <Lock className="w-3 h-3 inline mr-1" />
                  <strong>Privacy:</strong> Your DAC balance is encrypted. Only you can see your actual balance.
                </p>
              </div>

              {/* Unwrap Link */}
              <div className="mt-4 text-center">
                <Link
                  href="/unwrap"
                  className="text-sm text-neon-purple hover:underline inline-flex items-center gap-1"
                >
                  Need to unwrap DAC back to USDC?
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
