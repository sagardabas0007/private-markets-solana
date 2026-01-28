'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, TrendingUp, Share2, Shield, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TradePanel from '@/components/TradePanel';
import { Button } from '@/components/ui/button';
import {
  fetchMarket,
  Market,
  MarketPrices,
  calculatePriceFromReserves,
  formatTimestamp,
  getMarketTimeRemaining,
  isMarketActive,
  isDarkMarket,
} from '@/lib/api';

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarket = async () => {
    if (!marketId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchMarket(marketId);
      setMarket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
  }, [marketId]);

  const prices: MarketPrices = market
    ? calculatePriceFromReserves(
        market.account.yes_token_supply_minted,
        market.account.no_token_supply_minted
      )
    : { yes: 0.5, no: 0.5 };

  const active = market ? isMarketActive(market) : false;
  const timeRemaining = market ? getMarketTimeRemaining(market) : '';
  const endDate = market ? formatTimestamp(market.account.end_time) : new Date();
  const createdDate = market ? formatTimestamp(market.account.creation_time) : new Date();
  const dark = market ? isDarkMarket(market) : false;
  const tradingEnabled = market?.tradingEnabled ?? !dark; // V3 markets have tradingEnabled=true

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-dark/60 hover:text-dark mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Markets
          </button>

          {/* Loading */}
          {loading && (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
                <div className="h-96 bg-gray-200 rounded-2xl" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border-2 border-red-500 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <Button variant="heroSecondary" onClick={loadMarket}>
                Try Again
              </Button>
            </div>
          )}

          {/* Market Content */}
          {!loading && market && (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`
                      text-sm font-bold px-4 py-1 rounded-full border-2 border-dark
                      ${active ? 'bg-neon-green' : 'bg-gray-200'}
                    `}
                  >
                    {market.account.resolved ? 'Resolved' : active ? 'Active' : 'Ended'}
                  </span>
                  <div className="flex items-center gap-1 text-dark/60">
                    <Clock className="w-4 h-4" />
                    <span>{timeRemaining}</span>
                  </div>
                  <div className="flex items-center gap-1 text-neon-green font-medium">
                    <Shield className="w-4 h-4" />
                    <span>Privacy Enabled</span>
                  </div>
                </div>

                <h1 className="font-black text-3xl md:text-4xl mb-4">
                  {market.account.question}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-dark/60">
                  <a
                    href={`https://explorer.solana.com/address/${marketId}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-dark"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Created by {market.account.creator.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Market Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Price Display */}
                  <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="font-bold text-xl mb-6">Current Odds</h2>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-black text-neon-green mb-2">
                          {(prices.yes * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">YES</div>
                        <div className="text-sm text-dark/60">
                          ${prices.yes.toFixed(2)} per share
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-5xl font-black text-red-400 mb-2">
                          {(prices.no * 100).toFixed(0)}%
                        </div>
                        <div className="text-lg font-bold">NO</div>
                        <div className="text-sm text-dark/60">
                          ${prices.no.toFixed(2)} per share
                        </div>
                      </div>
                    </div>

                    {/* Price Bar */}
                    <div className="mt-6 h-8 rounded-full border-2 border-dark overflow-hidden flex">
                      <div
                        className="bg-neon-green transition-all"
                        style={{ width: `${prices.yes * 100}%` }}
                      />
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${prices.no * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Market Details */}
                  <div className="bg-white border-2 border-dark rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="font-bold text-xl mb-6">Market Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem
                        label="Initial Liquidity"
                        value={`${(
                          parseInt(market.account.initial_liquidity, 16) / 1_000_000
                        ).toFixed(2)} USDC`}
                      />
                      <DetailItem
                        label="Yes Token Supply"
                        value={`${(
                          parseInt(market.account.yes_token_supply_minted, 16) / 1_000_000
                        ).toFixed(2)}`}
                      />
                      <DetailItem
                        label="No Token Supply"
                        value={`${(
                          parseInt(market.account.no_token_supply_minted, 16) / 1_000_000
                        ).toFixed(2)}`}
                      />
                      <DetailItem label="Resolvable" value={market.account.resolvable ? 'Yes' : 'No'} />
                      <DetailItem
                        label="Created"
                        value={createdDate.toLocaleDateString()}
                      />
                      <DetailItem
                        label="Ends"
                        value={endDate.toLocaleDateString()}
                      />
                    </div>
                  </div>

                  {/* Privacy Info */}
                  <div className="bg-dark text-white rounded-2xl p-6 border-2 border-dark">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-neon-green" />
                      <h2 className="font-bold text-xl">Privacy Protection</h2>
                    </div>
                    <p className="text-white/80 mb-4">
                      This market uses Inco Network for position privacy. Your bet amounts are
                      encrypted before submission - only you can see how much you've wagered.
                    </p>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-green" />
                        Position sizes encrypted client-side
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-green" />
                        Market odds remain publicly visible
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neon-green" />
                        Only wallet owner can decrypt positions
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Column - Trade Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-28">
                    <TradePanel
                      marketAddress={marketId}
                      prices={prices}
                      onTradeComplete={loadMarket}
                      tradingEnabled={tradingEnabled}
                      isDarkMarket={dark}
                      collateralToken={market.account.collateral_token}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-dark/60 mb-1">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
