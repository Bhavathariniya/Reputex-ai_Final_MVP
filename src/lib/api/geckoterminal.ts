interface TokenData {
  id: string;
  name: string;
  symbol: string;
  decimals?: number;
  address: string;
  price_usd?: number;
  market_cap_usd?: number;
  fdv_usd?: number;
  volume_usd?: {
    h24?: number;
  };
  coingecko_coin_id?: string | null;
  socials?: {
    twitter_username?: string | null;
    telegram_handle?: string | null;
    website_url?: string | null;
    discord_url?: string | null;
    facebook_username?: string | null;
    linkedin_url?: string | null;
  };
  total_supply?: string;
  price_change_24h?: number;
}

interface PoolData {
  name: string;
  token_price_usd: number | null;
  volume_usd: {
    h24: number | null;
  } | null;
  transactions: {
    h24: {
      buys: number;
      sells: number;
    } | null;
  } | null;
}

interface GeckoTerminalResponse {
  tokenData: TokenData;
  topPools: { id: string }[];
  poolData: PoolData | null;
}

export async function getTokenDetailsFromGeckoTerminal(contractAddress: string): Promise<GeckoTerminalResponse | null> {
  const url = `https://api.geckoterminal.com/api/v2/networks/eth/tokens/${contractAddress}`;

  try {
    console.log(`Fetching GeckoTerminal data for ${contractAddress}`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error fetching token data: ${response.status}`);
      if (response.status === 404) {
        console.warn("Token not found on GeckoTerminal");
      }
      return null;
    }

    const result = await response.json();
    
    // Check if we have valid data
    if (!result.data || !result.data.attributes) {
      console.warn("Invalid data structure from GeckoTerminal");
      return null;
    }
    
    const tokenData = result.data.attributes;
    const topPools = result.data.relationships.top_pools?.data || [];

    let poolData = null;
    if (result.included && result.included.length > 0) {
      poolData = result.included[0].attributes;
    }
    
    // Log data for debugging
    console.log("Token Name:", tokenData.name);
    console.log("Symbol:", tokenData.symbol);
    console.log("Price (USD):", tokenData.price_usd);
    console.log("Market Cap (USD):", tokenData.market_cap_usd);
    console.log("FDV (USD):", tokenData.fdv_usd);
    console.log("Volume 24h (USD):", tokenData.volume_usd?.h24);
    console.log("Social Media:", tokenData.socials);
    console.log("Top Pools:", topPools.map(pool => pool.id));
    
    if (poolData) {
      console.log("\nTop Pool:");
      console.log("Pool Name:", poolData.name);
      console.log("Token Price USD:", poolData.token_price_usd);
      console.log("24h Volume USD:", poolData.volume_usd?.h24);
      console.log("Transactions 24h:", poolData.transactions?.h24);
    }
    
    return {
      tokenData,
      topPools,
      poolData
    };
  } catch (err) {
    console.error("Failed to fetch token info:", err);
    return null;
  }
}

// Helper functions for formatting data
export const formatNumber = (num: number | null | undefined, decimals: number = 0): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(num);
};

export const formatCurrency = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined) return 'N/A';
  
  // Format large numbers more readably
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals
  }).format(num);
};
