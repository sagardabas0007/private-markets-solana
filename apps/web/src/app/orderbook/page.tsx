'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  EyeOff,
  Zap,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  fetchOrderbookActivity,
  getOrderBookStats,
  fetchMarket,
  ActivityItem,
  OrderBookStats,
  Market,
} from '@/lib/api';

export default function OrderbookPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<OrderBookStats | null>(null);
  const [markets, setMarkets] = useState<Map<string, Market>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [activityData, statsData] = await Promise.all([
        fetchOrderbookActivity(50),
        getOrderBookStats(),
      ]);

      setActivity(activityData.activity);
      setStats(statsData);
      setLastUpdate(new Date());

      // Fetch market details for unique markets
      const uniqueMarkets = Array.from(new Set(activityData.activity.map(a => a.marketAddress)));
      const marketPromises = uniqueMarkets.map(async (addr) => {
        if (!markets.has(addr)) {
          try {
            const market = await fetchMarket(addr);
            if (market) return { addr, market };
          } catch {
            // Ignore fetch errors for individual markets
          }
        }
        return null;
      });

      const results = await Promise.all(marketPromises);
      const newMarkets = new Map(markets);
      results.forEach(r => {
        if (r) newMarkets.set(r.addr, r.market);
      });
      setMarkets(newMarkets);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [markets]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadData, 5000); // Refresh every 5 seconds
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, loadData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-black text-4xl mb-2 flex items-center gap-3">
                <Activity className="w-10 h-10 text-neon-purple" />
                Live Orderbook
              </h1>
              <p className="text-dark/60">
                Watch{' '}
                <span className="inline-flex items-center gap-1 text-neon-green font-bold">
                  <Shield className="w-4 h-4" /> encrypted orders
                </span>{' '}
                flow in real-time
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dark font-bold text-sm transition-all ${
                  autoRefresh
                    ? 'bg-neon-green shadow-none translate-x-[1px] translate-y-[1px]'
                    : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {autoRefresh ? 'Live' : 'Paused'}
              </button>
              <Button
                variant="heroSecondary"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Positions"
                value={stats.totalPositions.toString()}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <StatCard
                label="Active Markets"
                value={stats.totalMarkets.toString()}
                icon={<Activity className="w-5 h-5 text-neon-purple" />}
              />
              <StatCard
                label="Unique Wallets"
                value={stats.uniqueWallets.toString()}
                icon={<Shield className="w-5 h-5 text-neon-green" />}
              />
              <StatCard
                label="Volume"
                value="ENCRYPTED"
                icon={<Zap className="w-5 h-5 text-yellow-500" />}
                subtitle="Privacy Protected"
              />
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-dark text-white rounded-2xl p-4 mb-8 border-2 border-dark">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-neon-green flex-shrink-0" />
              <div>
                <h3 className="font-bold">Privacy-Preserving Orderbook</h3>
                <p className="text-sm text-white/70">
                  Wallet addresses are masked. Order amounts are encrypted with Inco ECIES and never revealed.
                  You can see market sentiment without knowing who bet what.
                </p>
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl">Recent Activity</h2>
            <span className="text-sm text-dark/60 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Updated: {lastUpdate.toLocaleTimeString()}
              {autoRefresh && <span className="ml-2 w-2 h-2 bg-neon-green rounded-full animate-pulse" />}
            </span>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-8">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && activity.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-dark rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity Feed */}
          {activity.length > 0 && (
            <div className="space-y-3">
              {activity.map((item, index) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  market={markets.get(item.marketAddress)}
                  formatTime={formatTime}
                  formatRelativeTime={formatRelativeTime}
                  isNew={index === 0 && autoRefresh}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && activity.length === 0 && (
            <div className="bg-white border-2 border-dark rounded-2xl p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-dark/40" />
              <h2 className="font-bold text-2xl mb-2">No Activity Yet</h2>
              <p className="text-dark/60 mb-6 max-w-md mx-auto">
                Be the first to place an encrypted position on a prediction market!
              </p>
              <Link href="/markets">
                <Button variant="hero">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Explore Markets
                </Button>
              </Link>
            </div>
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
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-white border-2 border-dark rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 text-dark/60 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-black text-2xl">{value}</p>
      {subtitle && <p className="text-xs text-dark/50">{subtitle}</p>}
    </div>
  );
}

function ActivityCard({
  item,
  market,
  formatTime,
  formatRelativeTime,
  isNew,
}: {
  item: ActivityItem;
  market?: Market;
  formatTime: (ts: number) => string;
  formatRelativeTime: (ts: number) => string;
  isNew: boolean;
}) {
  const isYes = item.side === 'yes';

  return (
    <div
      className={`bg-white border-2 border-dark rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
        isNew ? 'ring-2 ring-neon-green ring-offset-2' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Side Indicator */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 border-dark ${
            isYes ? 'bg-neon-green' : 'bg-red-400 text-white'
          }`}
        >
          {isYes ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                isYes ? 'bg-neon-green/20 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isYes ? 'YES' : 'NO'}
            </span>
            <span className="text-sm text-dark/60">
              <Shield className="w-3 h-3 inline mr-1" />
              {item.maskedWallet}
            </span>
          </div>

          <p className="font-medium text-sm truncate">
            {market?.account.question || `Market ${item.marketAddress.slice(0, 8)}...`}
          </p>
        </div>

        {/* Time & Link */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold">{formatRelativeTime(item.timestamp)}</p>
          <p className="text-xs text-dark/50">{formatTime(item.timestamp)}</p>
          <Link
            href={`/markets/${item.marketAddress}`}
            className="text-xs text-neon-purple hover:underline flex items-center gap-1 justify-end mt-1"
          >
            View <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Encrypted Amount Notice */}
      <div className="mt-3 pt-3 border-t border-dark/10 flex items-center justify-between text-xs text-dark/50">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Amount: <span className="font-mono bg-dark/5 px-1 rounded">ENCRYPTED</span>
        </span>
        <span className="capitalize">{item.status}</span>
      </div>
    </div>
  );
}
