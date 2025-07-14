
// Dexscreener API Integration for real-time token data
const DEXSCREENER_API_BASE = "https://api.dexscreener.com/latest/dex/tokens";

export interface DexscreenerTokenData {
  schemaVersion: string;
  pairs: Array<{
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
      m5: { buys: number; sells: number };
      h1: { buys: number; sells: number };
      h6: { buys: number; sells: number };
      h24: { buys: number; sells: number };
    };
    volume: {
      h24: number;
      h6: number;
      h1: number;
      m5: number;
    };
    priceChange: {
      m5: number;
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity?: {
      usd?: number;
      base?: number;
      quote?: number;
    };
    fdv?: number;
    marketCap?: number;
    pairCreatedAt?: number;
  }>;
}

/**
 * Fetch real-time token data from Dexscreener API
 */
export async function getDexscreenerData(tokenAddress: string): Promise<DexscreenerTokenData | null> {
  try {
    const url = `${DEXSCREENER_API_BASE}/${tokenAddress}`;
    console.log('Fetching Dexscreener data from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Dexscreener API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Dexscreener data received:', data);
    
    return data;
  } catch (error) {
    console.error("Error fetching Dexscreener data:", error);
    return null;
  }
}

/**
 * Calculate Liquidity Risk Score based on real Dexscreener data
 */
export function calculateLiquidityRiskScore(dexData: DexscreenerTokenData | null): number {
  if (!dexData || !dexData.pairs || dexData.pairs.length === 0) {
    return 80; // High risk if no data available
  }

  // Use the first pair with the highest volume
  const mainPair = dexData.pairs.reduce((best, current) => 
    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
  );

  const liquidity = mainPair.liquidity?.usd || 0;
  const volume24h = mainPair.volume?.h24 || 0;

  console.log('Calculating Liquidity Risk with:', { liquidity, volume24h });

  // Liquidity Risk Score logic
  if (liquidity < 10000 || volume24h < 10000) {
    return 80; // High risk
  } else if (liquidity < 100000) {
    return 40; // Medium risk
  } else {
    return 10; // Low risk
  }
}

/**
 * Calculate Market Stability Score based on real price change data
 */
export function calculateMarketStabilityScore(
  dexData: DexscreenerTokenData | null,
  contractSecurity: number,
  liquiditySafety: number,
  communityHealth: number
): number {
  if (!dexData || !dexData.pairs || dexData.pairs.length === 0) {
    return 50; // Default moderate score
  }

  // Use the main trading pair
  const mainPair = dexData.pairs.reduce((best, current) => 
    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
  );

  const priceChange24h = Math.abs(mainPair.priceChange?.h24 || 0);
  
  console.log('Calculating Market Stability with price change:', priceChange24h + '%');

  let marketStabilityScore = 50; // Base score

  // Market Stability Score based on price change
  if (priceChange24h < 2) {
    marketStabilityScore = 95;
  } else if (priceChange24h < 5) {
    marketStabilityScore = 85;
  } else if (priceChange24h < 10) {
    marketStabilityScore = 75;
  } else {
    marketStabilityScore = 50;
  }

  // Apply boost if other scores are high
  if (contractSecurity > 80 && liquiditySafety > 80 && communityHealth > 80) {
    marketStabilityScore += 30;
    console.log('Applied +30% boost to Market Stability');
  }

  return Math.min(100, Math.max(0, marketStabilityScore));
}

/**
 * Get the best trading pair for display
 */
export function getBestTradingPair(dexData: DexscreenerTokenData | null) {
  if (!dexData || !dexData.pairs || dexData.pairs.length === 0) {
    return null;
  }

  // Return the pair with highest 24h volume
  return dexData.pairs.reduce((best, current) => 
    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
  );
}
