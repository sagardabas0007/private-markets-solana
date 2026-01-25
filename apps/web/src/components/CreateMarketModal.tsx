'use client';

import { useState } from 'react';
import { X, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createMarket, CreateMarketResult } from '@/lib/api';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CreateMarketResult) => void;
}

export default function CreateMarketModal({ isOpen, onClose, onSuccess }: CreateMarketModalProps) {
  const [question, setQuestion] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState('1'); // In tokens (display)
  const [endTimeHours, setEndTimeHours] = useState('24');
  const [useCustomOracle, setUseCustomOracle] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateMarketResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createMarket({
        question,
        initialLiquidity: parseFloat(initialLiquidity) * 1_000_000, // Convert to units
        endTimeHours: parseInt(endTimeHours),
        useCustomOracle,
      });
      setSuccess(result);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestion('');
    setInitialLiquidity('1');
    setEndTimeHours('24');
    setUseCustomOracle(true);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white border-4 border-dark rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-dark bg-neon-purple/10">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-neon-purple" />
            <h2 className="font-black text-xl">Create Market</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-dark/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-neon-green rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Market Created!</h3>
                <p className="text-sm text-dark/60">Your market is now live on devnet</p>
              </div>
            </div>

            <div className="bg-gray-50 border-2 border-dark rounded-xl p-4 mb-4">
              <p className="font-medium mb-2 line-clamp-2">{success.question}</p>
              <div className="text-sm text-dark/60 space-y-1">
                <p>
                  <span className="font-bold">Address:</span>{' '}
                  <code className="bg-white px-1 rounded">{success.marketAddress.slice(0, 20)}...</code>
                </p>
                <p>
                  <span className="font-bold">Ends:</span>{' '}
                  {new Date(success.endTime).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-bold">Type:</span>{' '}
                  {success.isCustomOracle ? 'Custom Oracle (Dark Alpha)' : 'PNP Standard'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="heroSecondary" onClick={resetForm} className="flex-1">
                Create Another
              </Button>
              <Button variant="hero" onClick={handleClose} className="flex-1">
                View Markets
              </Button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Question */}
            <div>
              <label className="block font-bold mb-2">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will Bitcoin reach $100,000 by end of 2026?"
                className="w-full p-3 border-2 border-dark rounded-xl resize-none
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                  focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                  focus:translate-x-[2px] focus:translate-y-[2px]
                  transition-all"
                rows={3}
                required
                minLength={10}
              />
              <p className="text-sm text-dark/50 mt-1">Minimum 10 characters</p>
            </div>

            {/* Liquidity & Duration Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">Initial Liquidity</label>
                <div className="relative">
                  <input
                    type="number"
                    value={initialLiquidity}
                    onChange={(e) => setInitialLiquidity(e.target.value)}
                    min="1"
                    step="0.1"
                    className="w-full p-3 pr-16 border-2 border-dark rounded-xl
                      shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                      focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                      focus:translate-x-[2px] focus:translate-y-[2px]
                      transition-all"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-dark/50">
                    tokens
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2">Duration</label>
                <select
                  value={endTimeHours}
                  onChange={(e) => setEndTimeHours(e.target.value)}
                  className="w-full p-3 border-2 border-dark rounded-xl
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                    focus:translate-x-[2px] focus:translate-y-[2px]
                    transition-all bg-white"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">1 week</option>
                  <option value="720">30 days</option>
                </select>
              </div>
            </div>

            {/* Oracle Type */}
            <div className="bg-neon-purple/10 border-2 border-neon-purple/30 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomOracle}
                  onChange={(e) => setUseCustomOracle(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-2 border-dark accent-neon-purple"
                />
                <div>
                  <span className="font-bold">Use Dark Alpha Oracle</span>
                  <p className="text-sm text-dark/60 mt-1">
                    Enable custom settlement control. You&apos;ll be able to resolve the market when the outcome is known.
                  </p>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={loading || question.length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating on Devnet...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Create Market
                </>
              )}
            </Button>

            <p className="text-center text-sm text-dark/50">
              Creates a real market on Solana Devnet using PNP Protocol
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
