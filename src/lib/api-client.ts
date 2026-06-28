/**
 * Shared frontend types + the (still-mock) analysis-history helpers.
 *
 * All real analysis now happens server-side via `reputexApi.ts`. This file no
 * longer contains any provider API keys or direct provider calls — those were
 * moved to the backend. The history functions below are local placeholders
 * until a backend history/DB endpoint exists.
 */

// Interface for token data (consumed by Result/ResultTabs/AnalysisReport UI).
export interface TokenData {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  decimals: number;
  holderCount: number;
  isLiquidityLocked: boolean;
  isVerified: boolean;
  creationTime?: string;
  contractCreator?: string;
  creatorTxHash?: string;
  currentPrice?: number;
  marketCap?: number;
  tradingVolume?: number;
  priceChange24h?: number;
  communityData?: {
    twitterFollowers?: number;
    telegramUsers?: number;
    redditSubscribers?: number;
    redditActiveUsers?: number;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  developerData?: {
    forks?: number;
    stars?: number;
    commitCount?: number;
    contributors?: number;
  };
  etherscanData?: {
    tokenInfo?: any;
    contractCreationInfo?: any;
  };
}

export interface HistoryItem {
  address: string;
  trustScore: number;
  timestamp: string;
  network: string;
  verdict?: string;
  scamIndicators?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const HISTORY_KEY = 'reputex.history';

/** Read locally-stored analysis history (placeholder until a backend DB exists). */
export async function getScoreHistory(): Promise<ApiResponse<HistoryItem[]>> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(HISTORY_KEY) : null;
    const data: HistoryItem[] = raw ? JSON.parse(raw) : [];
    return { success: true, data };
  } catch {
    return { success: true, data: [] };
  }
}

export async function deleteHistoryItem(address: string, network: string): Promise<ApiResponse<boolean>> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(HISTORY_KEY) : null;
    const items: HistoryItem[] = raw ? JSON.parse(raw) : [];
    const next = items.filter((i) => !(i.address === address && i.network === network));
    if (typeof localStorage !== 'undefined') localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return { success: true, data: true };
  } catch {
    return { success: false, error: 'Failed to delete history item' };
  }
}

export async function clearAllHistory(): Promise<ApiResponse<boolean>> {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(HISTORY_KEY);
    return { success: true, data: true };
  } catch {
    return { success: false, error: 'Failed to clear history' };
  }
}
