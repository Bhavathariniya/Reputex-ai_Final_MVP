
// Honeypot.is API Integration
const HONEYPOT_API_BASE = "https://api.honeypot.is/v2";

export interface HoneypotCheckResult {
  chain: string;
  chainId: number;
  honeypotResult: {
    isHoneypot: boolean;
    honeypotRiskLevel: 'Low' | 'Medium' | 'High' | 'Unknown';
    buyGas: number;
    buyTax: number;
    sellGas: number;
    sellTax: number;
    transferTax: number;
    buyLiquidity: number;
    sellLiquidity: number;
    simulationSuccess: boolean;
    error?: string;
    blockedSells: boolean;
    customGas: boolean;
    messageCount?: number;
    warnings: string[];
  };
  tokenInfo: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
}

/**
 * Check if a token is a honeypot scam
 */
export async function checkHoneypot(
  tokenAddress: string,
  network: string = 'ethereum'
): Promise<HoneypotCheckResult | null> {
  try {
    // Map network name to chain ID
    const chainId = getChainIdFromNetwork(network);
    if (!chainId) {
      console.warn(`Unsupported network for honeypot check: ${network}`);
      return null;
    }
    
    const url = `${HONEYPOT_API_BASE}/token?address=${tokenAddress}&chainID=${chainId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Honeypot API error: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error checking honeypot status:", error);
    return null;
  }
}

/**
 * Calculate a fraud risk score based on honeypot check results
 */
export function calculateFraudRiskScore(honeypotResult: HoneypotCheckResult | null): number {
  if (!honeypotResult) return 25; // Default moderate risk if we can't check
  
  let baseScore = 10; // Start with low risk
  
  if (honeypotResult.honeypotResult.isHoneypot) {
    // Definite honeypot
    return 90; // Very high risk
  }
  
  // Check tax rates
  const sellTax = honeypotResult.honeypotResult.sellTax;
  if (sellTax > 20) baseScore += 40;
  else if (sellTax > 10) baseScore += 20;
  else if (sellTax > 5) baseScore += 10;
  
  // Check for blocked sells
  if (honeypotResult.honeypotResult.blockedSells) {
    baseScore += 50;
  }
  
  // Check for custom gas requirements
  if (honeypotResult.honeypotResult.customGas) {
    baseScore += 20;
  }
  
  // Check for warnings
  if (honeypotResult.honeypotResult.warnings && honeypotResult.honeypotResult.warnings.length > 0) {
    baseScore += honeypotResult.honeypotResult.warnings.length * 5;
  }
  
  // Risk level from API
  switch (honeypotResult.honeypotResult.honeypotRiskLevel) {
    case 'High':
      baseScore += 30;
      break;
    case 'Medium':
      baseScore += 15;
      break;
    case 'Low':
      baseScore += 5;
      break;
    default:
      baseScore += 10; // Unknown
  }
  
  return Math.min(100, baseScore); // Cap at 100
}

/**
 * Map network name to chain ID for honeypot API
 */
function getChainIdFromNetwork(network: string): number | null {
  const networkMap: Record<string, number> = {
    'ethereum': 1,
    'binance': 56,
    'polygon': 137,
    'arbitrum': 42161,
    'optimism': 10,
    'avalanche': 43114,
    'fantom': 250,
    'base': 8453,
  };
  
  return networkMap[network.toLowerCase()] || null;
}

