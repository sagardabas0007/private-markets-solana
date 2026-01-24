'use client';

import { useState } from 'react';
import { usePhantom, useAccounts } from '@phantom/react-sdk';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { encryptTrade, executeTrade, MarketPrices } from '@/lib/api';

interface TradePanelProps {
  marketAddress: string;
  prices: MarketPrices;
  onTradeComplete?: () => void;
}

export default function TradePanel({
  marketAddress,
  prices,
  onTradeComplete,
}: TradePanelProps) {
  const { isConnected } = usePhantom();
  const accounts = useAccounts();

  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);

  // Get the Solana address from connected accounts
  const solanaAccount = accounts?.find((a) => a.addressType === 'solana');
  const publicKeyString = solanaAccount?.address || '';

  const handleEncrypt = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert to lamports/smallest unit (6 decimals for USDC)
      const amountInSmallestUnit = (parseFloat(amount) * 1_000_000).toString();

      const encrypted = await encryptTrade({
        amount: amountInSmallestUnit,
        side,
        marketAddress,
      });

      setEncryptedData(encrypted.encryptedAmount);
      setShowEncrypted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const amountInSmallestUnit = (parseFloat(amount) * 1_000_000).toString();

      await executeTrade({
        market: marketAddress,
        side,
        amount: amountInSmallestUnit,
      });

      setSuccess(true);
      setAmount('');
      setEncryptedData(null);
      onTradeComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const estimatedShares = amount
    ? (parseFloat(amount) / (side === 'yes' ? prices.yes : prices.no)).toFixed(2)
    : '0';

  if (!isConnected) {
    return (
      <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center py-8">
          <Lock className="w-12 h-12 mx-auto mb-4 text-dark/40" />
          <h3 className="font-bold text-lg mb-2">Connect Wallet to Trade</h3>
          <p className="text-dark/60 text-sm">
            Your positions will be encrypted for privacy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl">Place Trade</h3>
        <div className="flex items-center gap-2 text-sm text-neon-green font-medium">
          <Lock className="w-4 h-4" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Side Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setSide('yes')}
          className={`
            py-4 rounded-xl border-2 border-dark font-bold text-lg
            transition-all
            ${
              side === 'yes'
                ? 'bg-neon-green shadow-none translate-x-[2px] translate-y-[2px]'
                : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
            }
          `}
        >
          YES
          <span className="block text-sm font-normal mt-1">
            {(prices.yes * 100).toFixed(0)}%
          </span>
        </button>
        <button
          onClick={() => setSide('no')}
          className={`
            py-4 rounded-xl border-2 border-dark font-bold text-lg
            transition-all
            ${
              side === 'no'
                ? 'bg-red-400 shadow-none translate-x-[2px] translate-y-[2px]'
                : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
            }
          `}
        >
          NO
          <span className="block text-sm font-normal mt-1">
            {(prices.no * 100).toFixed(0)}%
          </span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2">Amount (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border-2 border-dark bg-white
              shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
              focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
              focus:translate-x-[2px] focus:translate-y-[2px]
              transition-all font-medium text-lg"
          />
          <button
            onClick={() => setShowEncrypted(!showEncrypted)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg"
            title={showEncrypted ? 'Hide encrypted data' : 'Show encrypted data'}
          >
            {showEncrypted ? (
              <EyeOff className="w-5 h-5 text-dark/40" />
            ) : (
              <Eye className="w-5 h-5 text-dark/40" />
            )}
          </button>
        </div>
      </div>

      {/* Encrypted Preview */}
      {showEncrypted && encryptedData && (
        <div className="mb-6 p-4 bg-dark/5 rounded-xl border border-dark/20">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Lock className="w-4 h-4 text-neon-green" />
            <span>Encrypted Amount</span>
          </div>
          <code className="text-xs break-all text-dark/60">
            {encryptedData.slice(0, 50)}...
          </code>
        </div>
      )}

      {/* Estimate */}
      <div className="bg-dark/5 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark/60">Estimated shares</span>
          <span className="font-bold">{estimatedShares}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark/60">Price per share</span>
          <span className="font-bold">
            ${(side === 'yes' ? prices.yes : prices.no).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark/60">Potential return</span>
          <span className="font-bold text-neon-green">
            ${amount ? parseFloat(amount).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-100 border border-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-green-100 border border-green-300 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700">Trade submitted successfully!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleEncrypt}
          disabled={loading || !amount}
        >
          <Lock className="w-5 h-5 mr-2" />
          {loading ? 'Encrypting...' : 'Encrypt & Preview'}
        </Button>

        <Button
          variant="heroSecondary"
          size="xl"
          className="w-full"
          onClick={handleTrade}
          disabled={loading || !amount}
        >
          {loading ? 'Processing...' : `Trade ${side.toUpperCase()}`}
        </Button>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-dark/40 mt-4 text-center">
        Your position size is encrypted using Inco Network.
        <br />
        Only you can decrypt your positions.
      </p>
    </div>
  );
}
