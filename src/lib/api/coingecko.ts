
import { toast } from 'sonner';

// CoinGecko API base URL
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = 'CG-LggZcVpfVpN9wDLpAsMoy7Yr'; // Your API key

// Interface for token market data from CoinGecko
export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  platforms?: {
    [networkId: string]: {
      contract_address?: string;
      decimal_place?: number;
    }
  };
  liquidity_score?: number;
  public_interest_score?: number;
  community_score?: number;
  developer_score?: number;
}

// Interface for detailed coin data
export interface CoinGeckoDetailedTokenData {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  image: { thumb: string; small: string; large: string };
  market_data: {
    current_price: { [key: string]: number };
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    liquidity_score?: number;
  };
  community_data: {
    twitter_followers: number;
    telegram_channel_user_count: number;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    reddit_subscribers: number;
    reddit_accounts_active_48h: number;
    facebook_likes: number;
  };
  developer_data: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_request_contributors: number;
    commit_count_4_weeks: number;
    last_4_weeks_commit_activity_series: number[];
  };
  public_interest_stats: {
    alexa_rank: number;
    bing_matches: number;
  };
  liquidity_score?: number;
  public_interest_score?: number;
  community_score?: number;
  developer_score?: number;
}

// Function to search for tokens by contract address
export async function searchTokenByContractAddress(
  contractAddress: string, 
  network: string = 'ethereum'
): Promise<CoinGeckoTokenData | null> {
  try {
    // Map network to CoinGecko platform ID
    const platformId = mapNetworkToPlatformId(network);
    
    if (!platformId) {
      console.warn(`Unsupported network for CoinGecko: ${network}`);
      return null;
    }
    
    const url = `${COINGECKO_API_BASE}/coins/${platformId}/contract/${contractAddress}?x_cg_api_key=${COINGECKO_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.small || '',
      current_price: data.market_data?.current_price?.usd || 0,
      market_cap: data.market_data?.market_cap?.usd || 0,
      market_cap_rank: data.market_cap_rank || 0,
      total_volume: data.market_data?.total_volume?.usd || 0,
      high_24h: data.market_data?.high_24h?.usd || 0,
      low_24h: data.market_data?.low_24h?.usd || 0,
      price_change_24h: data.market_data?.price_change_24h || 0,
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
      market_cap_change_24h: data.market_data?.market_cap_change_24h || 0,
      market_cap_change_percentage_24h: data.market_data?.market_cap_change_percentage_24h || 0,
      circulating_supply: data.market_data?.circulating_supply || 0,
      total_supply: data.market_data?.total_supply || 0,
      max_supply: data.market_data?.max_supply || 0,
      ath: data.market_data?.ath?.usd || 0,
      ath_change_percentage: data.market_data?.ath_change_percentage?.usd || 0,
      ath_date: data.market_data?.ath_date?.usd || '',
      atl: data.market_data?.atl?.usd || 0,
      atl_change_percentage: data.market_data?.atl_change_percentage?.usd || 0,
      atl_date: data.market_data?.atl_date?.usd || '',
      last_updated: data.last_updated || '',
      platforms: data.platforms || {},
      liquidity_score: data.liquidity_score,
      public_interest_score: data.public_interest_score,
      community_score: data.community_score,
      developer_score: data.developer_score
    };
  } catch (error) {
    console.error('Error fetching token data from CoinGecko:', error);
    return null;
  }
}

// Function to get detailed token data with community and developer info
export async function getDetailedTokenData(
  coinId: string
): Promise<CoinGeckoDetailedTokenData | null> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false&x_cg_api_key=${COINGECKO_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Extract liquidity and community scores if available
    data.liquidity_score = data.liquidity_score || data.market_data?.liquidity_score;
    data.community_score = data.community_score;
    data.developer_score = data.developer_score;
    data.public_interest_score = data.public_interest_score;
    
    return data;
  } catch (error) {
    console.error('Error fetching detailed token data from CoinGecko:', error);
    return null;
  }
}

// Helper function to map our network names to CoinGecko platform IDs
function mapNetworkToPlatformId(network: string): string | null {
  const platformMap: Record<string, string> = {
    'ethereum': 'ethereum',
    'binance': 'binance-smart-chain',
    'polygon': 'polygon-pos',
    'arbitrum': 'arbitrum-one',
    'optimism': 'optimistic-ethereum',
    'avalanche': 'avalanche',
    'fantom': 'fantom',
    'base': 'base',
    'zksync': 'zksync'
  };
  
  return platformMap[network.toLowerCase()] || null;
}

// Function to get trending tokens from CoinGecko
export async function getTrendingTokens(): Promise<any[]> {
  try {
    const url = `${COINGECKO_API_BASE}/search/trending?x_cg_api_key=${COINGECKO_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} - ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error('Error fetching trending tokens from CoinGecko:', error);
    return [];
  }
}

// Function to get token price history
export async function getTokenPriceHistory(
  coinId: string,
  days: number = 7,
  interval: string = 'daily'
): Promise<any> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}&x_cg_api_key=${COINGECKO_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token price history from CoinGecko:', error);
    return null;
  }
}

