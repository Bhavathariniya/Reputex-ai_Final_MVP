import { getChain } from '../chains';
import { httpJson } from '../lib/http';
import { cachedIf } from '../lib/cache';
import { env } from '../config/env';

/**
 * CoinGecko integration — supplementary market & community data.
 *
 * Optional: if no key is configured or the token isn't listed, returns
 * available:false and the community/market signals simply contribute less.
 */
const BASE = 'https://api.coingecko.com/api/v3';

export interface CommunityInfo {
  available: boolean;
  name?: string;
  symbol?: string;
  marketCapUsd?: number;
  totalVolumeUsd?: number;
  twitterFollowers?: number;
  telegramUsers?: number;
  redditSubscribers?: number;
  sentimentUpPct?: number;
}

export async function getCommunity(chainSlug: string, address: string): Promise<CommunityInfo> {
  const platform = getChain(chainSlug).coingeckoPlatform;
  if (!platform) return { available: false };

  return cachedIf(`cg:${chainSlug}:${address}`, env.CACHE_TTL_SECONDS, (v) => v.available, async () => {
    const key = env.COINGECKO_API_KEY ? `?x_cg_api_key=${env.COINGECKO_API_KEY}` : '';
    const data = await httpJson<any>(`${BASE}/coins/${platform}/contract/${address}${key}`);
    if (!data || data.error || !data.id) return { available: false };

    const cd = data.community_data ?? {};
    const md = data.market_data ?? {};
    return {
      available: true,
      name: data.name,
      symbol: typeof data.symbol === 'string' ? data.symbol.toUpperCase() : undefined,
      marketCapUsd: num(md.market_cap?.usd),
      totalVolumeUsd: num(md.total_volume?.usd),
      twitterFollowers: num(cd.twitter_followers),
      telegramUsers: num(cd.telegram_channel_user_count),
      redditSubscribers: num(cd.reddit_subscribers),
      sentimentUpPct: num(data.sentiment_votes_up_percentage),
    };
  });
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
