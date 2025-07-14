
// LunarCrush API Integration for social sentiment data
const LUNARCRUSH_API_KEY = "esqni95reedkyjv92p3kvgfdwpma2aeywd67b2vvo";
const LUNARCRUSH_BASE_URL = "https://lunarcrush.com/api/v2";

export interface LunarCrushSocialStats {
  symbol: string;
  name: string;
  price: number;
  volume_24h: number;
  social_score: number;
  social_volume: number;
  social_contributors: number;
  social_dominance: number;
  galaxy_score: number;
  alt_rank: number;
  sentiment_absolute: number;
  sentiment_relative: number;
  tweet_sentiment: number;
  average_sentiment: number;
  twitter_mentions: number;
  twitter_followers: number;
  twitter_retweets: number;
  reddit_posts: number;
  reddit_comments: number;
  reddit_active_users: number;
  bullish_sentiment: number;
  bearish_sentiment: number;
}

/**
 * Get social stats for a token from LunarCrush
 */
export async function getTokenSocialStats(symbol: string): Promise<LunarCrushSocialStats | null> {
  try {
    const url = `${LUNARCRUSH_BASE_URL}/assets?data=assets&key=${LUNARCRUSH_API_KEY}&symbol=${symbol.toUpperCase()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`LunarCrush API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const stats = data.data[0];
      
      return {
        symbol: stats.symbol,
        name: stats.name,
        price: stats.price || 0,
        volume_24h: stats.volume_24h || 0,
        social_score: stats.social_score || 0,
        social_volume: stats.social_volume || 0,
        social_contributors: stats.social_contributors || 0,
        social_dominance: stats.social_dominance || 0,
        galaxy_score: stats.galaxy_score || 0,
        alt_rank: stats.alt_rank || 0,
        sentiment_absolute: stats.sentiment_absolute || 0,
        sentiment_relative: stats.sentiment_relative || 0,
        tweet_sentiment: stats.tweet_sentiment || 0,
        average_sentiment: stats.average_sentiment || 0,
        twitter_mentions: stats.twitter_mentions || 0,
        twitter_followers: stats.twitter_followers || 0,
        twitter_retweets: stats.twitter_retweets || 0,
        reddit_posts: stats.reddit_posts || 0,
        reddit_comments: stats.reddit_comments || 0,
        reddit_active_users: stats.reddit_active_users || 0,
        bullish_sentiment: stats.bullish_sentiment || 0,
        bearish_sentiment: stats.bearish_sentiment || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token social stats from LunarCrush:", error);
    return null;
  }
}

/**
 * Calculate a community score based on social metrics
 */
export function calculateCommunityScore(socialStats: LunarCrushSocialStats | null): number {
  if (!socialStats) return 60; // Default score
  
  let score = 50; // Base score
  
  // Social volume and contributors
  if (socialStats.social_volume > 1000) score += 10;
  else if (socialStats.social_volume > 100) score += 5;
  
  if (socialStats.social_contributors > 500) score += 10;
  else if (socialStats.social_contributors > 100) score += 5;
  
  // Twitter metrics
  if (socialStats.twitter_followers > 100000) score += 15;
  else if (socialStats.twitter_followers > 10000) score += 10;
  else if (socialStats.twitter_followers > 1000) score += 5;
  
  if (socialStats.twitter_mentions > 1000) score += 5;
  
  // Reddit metrics
  if (socialStats.reddit_active_users > 10000) score += 15;
  else if (socialStats.reddit_active_users > 1000) score += 10;
  else if (socialStats.reddit_active_users > 100) score += 5;
  
  if (socialStats.reddit_posts > 100) score += 5;
  
  // Sentiment
  if (socialStats.bullish_sentiment > 75) score += 10;
  else if (socialStats.bullish_sentiment > 60) score += 5;
  else if (socialStats.bullish_sentiment < 30) score -= 10;
  else if (socialStats.bullish_sentiment < 40) score -= 5;
  
  return Math.min(100, Math.max(10, score)); // Keep score between 10-100
}

