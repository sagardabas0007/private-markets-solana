/**
 * API client for Dark Alpha backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Market {
  publicKey: string;
  account: {
    id: string;
    question: string;
    resolved: boolean;
    resolvable: boolean;
    creator: string;
    end_time: string;
    creation_time: string;
    initial_liquidity: string;
    yes_token_mint: string;
    no_token_mint: string;
    yes_token_supply_minted: string;
    no_token_supply_minted: string;
    collateral_token: string;
    market_reserves: string;
    winning_token_id: { None: Record<string, never> } | { Some: string };
  };
}

export interface MarketPrices {
  yes: number;
  no: number;
}

export interface EncryptedValue {
  handle: string;       // The encrypted hex string (ciphertext)
  timestamp: number;    // When encryption occurred
  type: 'uint256' | 'bool';
}

export interface EncryptedTrade {
  encryptedAmount: EncryptedValue;
  encryptedSide: EncryptedValue;
  marketAddress: string;
  timestamp: number;
  commitmentHash: string;  // Proof that trade exists without revealing contents
}

export interface AgentStatus {
  status: 'active' | 'paused' | 'stopped';
  lastScan: string;
  marketsCreated: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Markets API
export async function fetchMarkets(): Promise<Market[]> {
  const res = await fetch(`${API_BASE}/api/markets`);
  const json: ApiResponse<{ count: number; data: Market[] }> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch markets');
  return json.data?.data || [];
}

export async function fetchMarket(marketId: string): Promise<Market | null> {
  const res = await fetch(`${API_BASE}/api/markets/${marketId}`);
  const json: ApiResponse<Market> = await res.json();
  if (!json.success) return null;
  return json.data || null;
}

export async function fetchMarketPrices(marketId: string): Promise<MarketPrices> {
  const res = await fetch(`${API_BASE}/api/trading/market/${marketId}/info`);
  const json: ApiResponse<{ market: Market; prices: MarketPrices }> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch prices');
  return json.data?.prices || { yes: 0.5, no: 0.5 };
}

// Trading API
export async function encryptTrade(params: {
  amount: string;
  side: 'yes' | 'no';
  marketAddress: string;
}): Promise<EncryptedTrade> {
  const res = await fetch(`${API_BASE}/api/trading/encrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json: ApiResponse<EncryptedTrade> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to encrypt trade');
  return json.data!;
}

export async function executeTrade(params: {
  market: string;
  side: 'yes' | 'no';
  amount: string;
}): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/trading/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json: ApiResponse<unknown> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to execute trade');
  return json.data;
}

// Agent API
export async function fetchAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API_BASE}/api/agent/status`);
  const json: ApiResponse<AgentStatus> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch agent status');
  return json.data!;
}

export async function triggerAgentScan(): Promise<{
  newsItems: number;
  opportunities: number;
  preview: unknown[];
}> {
  const res = await fetch(`${API_BASE}/api/agent/scan`, { method: 'POST' });
  const json: ApiResponse<{
    newsItems: number;
    opportunities: number;
    preview: unknown[];
  }> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to trigger scan');
  return json.data!;
}

// Order Book API (Privacy-Preserving)
export interface SubmitPositionResult {
  positionId: string;
  commitmentHash: string;
  status: string;
  message: string;
}

export interface MarketAggregate {
  marketAddress: string;
  totalPositions: number;
  yesPositions: number;
  noPositions: number;
  estimatedYesProbability: number;
  estimatedNoProbability: number;
  privacyNote: string;
}

export interface OrderBookStats {
  totalMarkets: number;
  totalPositions: number;
  totalEncryptedVolume: string;
  uniqueWallets: number;
  markets: Array<{
    marketAddress: string;
    totalPositions: number;
    yesProbability: number;
    noProbability: number;
  }>;
  privacyFeatures: string[];
}

export async function submitEncryptedPosition(params: {
  walletAddress: string;
  marketAddress: string;
  encryptedTrade: EncryptedTrade;
  side: 'yes' | 'no';
}): Promise<SubmitPositionResult> {
  const res = await fetch(`${API_BASE}/api/orderbook/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: params.walletAddress,
      marketAddress: params.marketAddress,
      encryptedAmount: params.encryptedTrade.encryptedAmount,
      encryptedSide: params.encryptedTrade.encryptedSide,
      commitmentHash: params.encryptedTrade.commitmentHash,
      side: params.side,
    }),
  });
  const json: ApiResponse<SubmitPositionResult> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to submit position');
  return json.data!;
}

export async function getMarketAggregate(marketId: string): Promise<MarketAggregate> {
  const res = await fetch(`${API_BASE}/api/orderbook/market/${marketId}/aggregate`);
  const json: ApiResponse<MarketAggregate> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to get aggregate');
  return json.data!;
}

export async function getOrderBookStats(): Promise<OrderBookStats> {
  const res = await fetch(`${API_BASE}/api/orderbook/stats`);
  const json: ApiResponse<OrderBookStats> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to get stats');
  return json.data!;
}

export async function verifyCommitment(commitmentHash: string): Promise<{
  exists: boolean;
  marketAddress?: string;
  timestamp?: number;
}> {
  const res = await fetch(`${API_BASE}/api/orderbook/verify/${commitmentHash}`);
  const json: ApiResponse<{ exists: boolean; marketAddress?: string; timestamp?: number }> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to verify');
  return json.data!;
}

// Utility functions
export function calculatePriceFromReserves(
  yesSupply: string,
  noSupply: string
): MarketPrices {
  const yes = parseInt(yesSupply, 16) || 1;
  const no = parseInt(noSupply, 16) || 1;
  const total = yes + no;
  return {
    yes: Math.round((no / total) * 100) / 100,
    no: Math.round((yes / total) * 100) / 100,
  };
}

export function formatTimestamp(hexTimestamp: string): Date {
  const seconds = parseInt(hexTimestamp, 16);
  return new Date(seconds * 1000);
}

export function isMarketActive(market: Market): boolean {
  const endTime = formatTimestamp(market.account.end_time);
  return !market.account.resolved && endTime > new Date();
}

export function getMarketTimeRemaining(market: Market): string {
  const endTime = formatTimestamp(market.account.end_time);
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Ending soon';
}

// Market Creation API
export interface CreateMarketParams {
  question: string;
  initialLiquidity: number; // In token units (1 token = 1_000_000 units for 6 decimals)
  endTimeHours: number;     // Hours from now until market ends
  collateralMint?: string;  // Optional custom token mint
  useCustomOracle?: boolean; // Use custom oracle for settlement (we control resolution)
}

export interface CreateMarketResult {
  marketAddress: string;
  signature: string;
  question: string;
  creator: string;
  endTime: string;
  isCustomOracle: boolean;
  tracked: {
    publicKey: string;
    question: string;
    creator: string;
    createdAt: number;
    yesProbability: number;
    noProbability: number;
  };
}

export async function createMarket(params: CreateMarketParams): Promise<CreateMarketResult> {
  const res = await fetch(`${API_BASE}/api/markets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json: ApiResponse<CreateMarketResult> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create market');
  return json.data!;
}

// Tracked Markets API
export interface TrackedMarketsResponse {
  totalMarkets: number;
  activeMarkets: number;
  customOracleMarkets: number;
  recentMarkets: Array<{
    publicKey: string;
    question: string;
    creator: string;
    createdAt: number;
  }>;
  markets: Array<{
    publicKey: string;
    question: string;
    creator: string;
    createdAt: number;
    yesProbability: number;
    noProbability: number;
  }>;
}

export async function fetchTrackedMarkets(): Promise<TrackedMarketsResponse> {
  const res = await fetch(`${API_BASE}/api/markets/tracked`);
  const json: ApiResponse<TrackedMarketsResponse> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch tracked markets');
  return json.data!;
}

// Portfolio / Positions API
export interface Position {
  id: string;
  marketAddress: string;
  commitmentHash: string;
  status: 'pending' | 'active' | 'settled';
  timestamp: number;
  encryptedAmount: EncryptedValue;
  encryptedSide: EncryptedValue;
  settlement?: {
    outcome: 'yes' | 'no';
    isWinner: boolean;
    settledAt: number;
  };
}

export interface PositionsResponse {
  walletAddress: string;
  positionCount: number;
  positions: Position[];
  note: string;
}

export async function fetchMyPositions(walletAddress: string): Promise<PositionsResponse> {
  const res = await fetch(`${API_BASE}/api/orderbook/my-positions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  const json: ApiResponse<PositionsResponse> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch positions');
  return json.data!;
}

// Live Activity Feed API
export interface ActivityItem {
  id: string;
  marketAddress: string;
  side: 'yes' | 'no';
  timestamp: number;
  maskedWallet: string;
  status: string;
}

export interface ActivityFeedResponse {
  count: number;
  activity: ActivityItem[];
  note: string;
}

export async function fetchOrderbookActivity(limit: number = 50): Promise<ActivityFeedResponse> {
  const res = await fetch(`${API_BASE}/api/orderbook/activity?limit=${limit}`);
  const json: ApiResponse<ActivityFeedResponse> = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity');
  return json.data!;
}
