'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, RefreshCw, TrendingUp, Shield, Plus, Zap, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MarketCard from '@/components/MarketCard';
import CreateMarketModal from '@/components/CreateMarketModal';
import { Button } from '@/components/ui/button';
import { fetchMarkets, fetchTrackedMarkets, fetchDarkMarkets, Market, isMarketActive, isDarkMarket, CreateMarketResult } from '@/lib/api';

type FilterType = 'all' | 'active' | 'dark' | 'resolved';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [darkMarkets, setDarkMarkets] = useState<Market[]>([]);
  const [trackedAddresses, setTrackedAddresses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('dark');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all markets, dark markets, and tracked info in parallel
      const [allData, darkData, trackedData] = await Promise.all([
        fetchMarkets(),
        fetchDarkMarkets().catch(() => []),
        fetchTrackedMarkets().catch(() => null),
      ]);
      setMarkets(allData);
      setDarkMarkets(darkData);

      // Track which markets are ours
      if (trackedData?.markets) {
        setTrackedAddresses(new Set(trackedData.markets.map(m => m.publicKey)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const handleMarketCreated = (result: CreateMarketResult) => {
    // Add the new market address to tracked set
    setTrackedAddresses(prev => new Set(Array.from(prev).concat([result.marketAddress])));
    // Reload markets to get the new one
    loadMarkets();
  };

  // Filter and search markets
  const filteredMarkets = (filter === 'dark' ? darkMarkets : markets)
    .filter((market) => {
      if (filter === 'active') return isMarketActive(market) && !isDarkMarket(market);
      if (filter === 'resolved') return market.account.resolved;
      if (filter === 'dark') return true; // Already filtered to darkMarkets
      return true;
    })
    .filter((market) =>
      market.account.question.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 50); // Limit to 50 for performance

  const activeCount = markets.filter(m => isMarketActive(m) && !isDarkMarket(m)).length;
  const resolvedCount = markets.filter((m) => m.account.resolved).length;
  const darkCount = darkMarkets.length;

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-black text-4xl mb-2">Prediction Markets</h1>
              <p className="text-dark/60">
                Trade on outcomes with{' '}
                <span className="inline-flex items-center gap-1 text-neon-green font-bold">
                  <Shield className="w-4 h-4" /> encrypted positions
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="heroSecondary"
                size="sm"
                onClick={loadMarkets}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4" />
                Create Market
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Markets"
              value={markets.length.toLocaleString()}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              label="Public Markets"
              value={activeCount.toLocaleString()}
              icon={<TrendingUp className="w-5 h-5 text-neon-green" />}
            />
            <StatCard
              label="Dark Markets"
              value={darkCount.toLocaleString()}
              icon={<Lock className="w-5 h-5 text-neon-purple" />}
              highlight
            />
            <StatCard
              label="Network"
              value="Devnet"
              icon={<Shield className="w-5 h-5 text-neon-purple" />}
            />
          </div>

          {/* Dark Markets Banner */}
          {filter === 'dark' && (
            <div className="mb-6 p-4 rounded-xl border-2 border-neon-purple bg-gradient-to-r from-neon-purple/10 to-neon-green/10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neon-purple/20 rounded-lg">
                  <Lock className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Dark Markets - Private Betting</h3>
                  <p className="text-dark/70 text-sm mt-1">
                    Bets on these markets are encrypted using FHE. Your position sizes remain hidden from other traders.
                    Simply bet with USDC - we handle the privacy conversion automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark/40" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-dark bg-white
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                  focus:outline-none focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                  focus:translate-x-[2px] focus:translate-y-[2px]
                  transition-all font-medium"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'dark', 'resolved'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-4 py-3 rounded-xl border-2 font-bold capitalize
                    transition-all flex items-center gap-2
                    ${f === 'dark' ? 'border-neon-purple' : 'border-dark'}
                    ${
                      filter === f
                        ? f === 'dark'
                          ? 'bg-neon-purple text-white shadow-none translate-x-[2px] translate-y-[2px]'
                          : 'bg-dark text-white shadow-none translate-x-[2px] translate-y-[2px]'
                        : f === 'dark'
                          ? 'bg-white shadow-[3px_3px_0px_0px_rgba(139,92,246,1)] hover:shadow-[1px_1px_0px_0px_rgba(139,92,246,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                          : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                    }
                  `}
                >
                  {f === 'dark' ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                  {f === 'dark' ? 'Dark Alpha' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-8">
              <p className="text-red-700 font-medium">{error}</p>
              <Button variant="heroSecondary" size="sm" onClick={loadMarkets} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-dark rounded-2xl p-5 h-64 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded w-20 mb-3" />
                  <div className="h-12 bg-gray-200 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-6 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Markets Grid */}
          {!loading && filteredMarkets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.publicKey}
                  market={market}
                  isTracked={trackedAddresses.has(market.publicKey)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredMarkets.length === 0 && (
            <div className="text-center py-16">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${filter === 'dark' ? 'bg-neon-purple/10' : 'bg-gray-100'}`}>
                {filter === 'dark' ? (
                  <Lock className="w-10 h-10 text-neon-purple" />
                ) : (
                  <Search className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="font-bold text-xl mb-2">
                {filter === 'dark' ? 'No Dark Markets Yet' : 'No markets found'}
              </h3>
              <p className="text-dark/60 mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : filter === 'dark'
                  ? 'Dark Markets use encrypted collateral for private betting. Create one to get started.'
                  : 'No markets match the current filter'}
              </p>
              {filter === 'dark' && (
                <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Dark Market
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Market Modal */}
      <CreateMarketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleMarketCreated}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border-2 ${
      highlight
        ? 'bg-gradient-to-br from-neon-purple/10 to-neon-green/10 border-neon-purple shadow-[3px_3px_0px_0px_rgba(139,92,246,1)]'
        : 'bg-white border-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
    }`}>
      <div className={`flex items-center gap-2 mb-1 ${highlight ? 'text-neon-purple' : 'text-dark/60'}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-black text-2xl">{value}</p>
    </div>
  );
}
