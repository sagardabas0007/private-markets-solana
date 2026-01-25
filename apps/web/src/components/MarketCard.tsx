'use client';

import Link from 'next/link';
import { TrendingUp, Clock, Users, Zap } from 'lucide-react';
import { Market, calculatePriceFromReserves, getMarketTimeRemaining, isMarketActive } from '@/lib/api';

interface MarketCardProps {
  market: Market;
  isTracked?: boolean;
}

export default function MarketCard({ market, isTracked = false }: MarketCardProps) {
  const prices = calculatePriceFromReserves(
    market.account.yes_token_supply_minted,
    market.account.no_token_supply_minted
  );
  const timeRemaining = getMarketTimeRemaining(market);
  const active = isMarketActive(market);

  return (
    <Link href={`/markets/${market.publicKey}`}>
      <div className={`
        bg-white border-2 border-dark rounded-2xl p-5
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        hover:translate-x-[2px] hover:translate-y-[2px]
        hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        transition-all cursor-pointer
        ${!active ? 'opacity-60' : ''}
      `}>
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`
              text-xs font-bold px-3 py-1 rounded-full border-2 border-dark
              ${active ? 'bg-neon-green' : 'bg-gray-200'}
            `}>
              {market.account.resolved ? 'Resolved' : active ? 'Active' : 'Ended'}
            </span>
            {isTracked && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-neon-purple text-white flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Dark Alpha
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-dark/60">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* Question */}
        <h3 className="font-bold text-lg mb-4 line-clamp-2 min-h-[3.5rem]">
          {market.account.question}
        </h3>

        {/* Price bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold w-10">YES</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-lg border border-dark/20 overflow-hidden">
              <div
                className="h-full bg-neon-green transition-all"
                style={{ width: `${prices.yes * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold w-12 text-right">
              {(prices.yes * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold w-10">NO</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-lg border border-dark/20 overflow-hidden">
              <div
                className="h-full bg-red-400 transition-all"
                style={{ width: `${prices.no * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold w-12 text-right">
              {(prices.no * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-dark/60 pt-3 border-t border-dark/10">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>
              {(parseInt(market.account.initial_liquidity, 16) / 1_000_000).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isTracked ? (
              <>
                <Zap className="w-4 h-4 text-neon-purple" />
                <span className="text-neon-purple font-medium">Dark Alpha</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>PNP Market</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
