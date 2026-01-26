'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePhantom, useAccounts, AddressType } from '@phantom/react-sdk';
import {
  Shield,
  Lock,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  fetchMyPositions,
  fetchMarket,
  Position,
  Market,
} from '@/lib/api';

interface PositionWithMarket extends Position {
  market?: Market;
}

export default function PortfolioPage() {
  const { isConnected } = usePhantom();
  const accounts = useAccounts();

  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the Solana address from connected accounts
  // Note: AddressType.solana returns "Solana" (capitalized)
  const solanaAccount = accounts?.find((a) => a.addressType === AddressType.solana);
  const walletAddress = solanaAccount?.address || '';

  const loadPositions = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchMyPositions(walletAddress);

      // Fetch market details for each position
      const positionsWithMarkets = await Promise.all(
        data.positions.map(async (pos) => {
          try {
            const market = await fetchMarket(pos.marketAddress);
            return { ...pos, market: market || undefined };
          } catch {
            return pos;
          }
        })
      );

      setPositions(positionsWithMarkets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadPositions();
    } else {
      setLoading(false);
    }
  }, [walletAddress, loadPositions]);

  // Stats
  const activePositions = positions.filter((p) => p.status === 'active').length;
  const settledPositions = positions.filter((p) => p.status === 'settled').length;
  const winningPositions = positions.filter((p) => p.settlement?.isWinner).length;

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-black text-4xl mb-2">My Portfolio</h1>
              <p className="text-dark/60">
                Your{' '}
                <span className="inline-flex items-center gap-1 text-neon-green font-bold">
                  <Shield className="w-4 h-4" /> encrypted positions
                </span>{' '}
                are private
              </p>
            </div>

            {isConnected && (
              <Button
                variant="heroSecondary"
                size="sm"
                onClick={loadPositions}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {/* Not Connected State */}
          {!isConnected && (
            <div className="bg-white border-2 border-dark rounded-2xl p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-dark/40" />
              <h2 className="font-bold text-2xl mb-2">Connect Your Wallet</h2>
              <p className="text-dark/60 mb-6 max-w-md mx-auto">
                Connect your Phantom wallet to view your encrypted positions and trading history.
              </p>
              <p className="text-sm text-neon-green font-medium">
                <Lock className="w-4 h-4 inline mr-1" />
                Your positions remain encrypted even when viewing
              </p>
            </div>
          )}

          {/* Connected with positions */}
          {isConnected && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Total Positions"
                  value={positions.length.toString()}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <StatCard
                  label="Active"
                  value={activePositions.toString()}
                  icon={<Clock className="w-5 h-5 text-neon-green" />}
                />
                <StatCard
                  label="Settled"
                  value={settledPositions.toString()}
                  icon={<CheckCircle className="w-5 h-5 text-blue-500" />}
                />
                <StatCard
                  label="Wins"
                  value={winningPositions.toString()}
                  icon={<TrendingUp className="w-5 h-5 text-yellow-500" />}
                />
              </div>

              {/* Privacy Notice */}
              <div className="bg-neon-green/10 border-2 border-neon-green/30 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-neon-green mb-1">Privacy Protected</h3>
                    <p className="text-sm text-dark/70">
                      Your position sizes are encrypted with Inco ECIES. Only you can see the actual amounts.
                      Market observers can only see that you have positions, not how much.
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white border-2 border-dark rounded-2xl p-6 animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                        <div className="flex-1">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-8">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                  <Button
                    variant="heroSecondary"
                    size="sm"
                    onClick={loadPositions}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Positions List */}
              {!loading && positions.length > 0 && (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <PositionCard key={position.id} position={position} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && positions.length === 0 && (
                <div className="bg-white border-2 border-dark rounded-2xl p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-dark/40" />
                  <h2 className="font-bold text-2xl mb-2">No Positions Yet</h2>
                  <p className="text-dark/60 mb-6 max-w-md mx-auto">
                    Start trading on prediction markets with encrypted positions for privacy.
                  </p>
                  <Link href="/markets">
                    <Button variant="hero">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Explore Markets
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border-2 border-dark rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 text-dark/60 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  );
}

function PositionCard({ position }: { position: PositionWithMarket }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    active: 'bg-green-100 text-green-700 border-green-300',
    settled: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Market Question */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2">
            {position.market?.account.question || 'Loading market...'}
          </h3>

          {/* Status & Date Row */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[position.status]}`}
            >
              {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
            </span>
            <span className="text-sm text-dark/60">
              <Clock className="w-4 h-4 inline mr-1" />
              {formatDate(position.timestamp)}
            </span>
          </div>

          {/* Encrypted Data Preview */}
          <div className="bg-dark/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-neon-green" />
              <span className="font-medium">Encrypted Position</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark/50">Amount:</span>
                <code className="block text-dark/70 truncate">
                  {position.encryptedAmount.handle.slice(0, 24)}...
                </code>
              </div>
              <div>
                <span className="text-dark/50">Side:</span>
                <code className="block text-dark/70 truncate">
                  {position.encryptedSide.handle.slice(0, 24)}...
                </code>
              </div>
            </div>
            <div className="text-xs">
              <span className="text-dark/50">Commitment:</span>
              <code className="ml-1 text-neon-green">
                {position.commitmentHash.slice(0, 32)}...
              </code>
            </div>
          </div>

          {/* Settlement Info */}
          {position.settlement && (
            <div
              className={`mt-3 p-3 rounded-xl border ${
                position.settlement.isWinner
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {position.settlement.isWinner ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-green-700">Winner!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-bold text-red-700">Not a Winner</span>
                  </>
                )}
              </div>
              <p className="text-sm text-dark/60 mt-1">
                Outcome: <span className="font-bold uppercase">{position.settlement.outcome}</span>
              </p>
            </div>
          )}
        </div>

        {/* View Market Link */}
        <Link href={`/markets/${position.marketAddress}`}>
          <Button variant="heroSecondary" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
