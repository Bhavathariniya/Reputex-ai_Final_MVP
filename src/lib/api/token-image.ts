
import { useState, useEffect } from 'react';

// Interface for token image data
export interface TokenImageData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  large?: string;
  small?: string;
  thumb?: string;
}

/**
 * Custom hook to fetch token image from CoinGecko API
 * @param tokenId The CoinGecko token ID (e.g., 'bitcoin')
 * @param fallbackSymbol Optional fallback symbol for display
 */
export function useTokenImage(tokenId?: string, fallbackSymbol?: string) {
  const [tokenData, setTokenData] = useState<TokenImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenId) return;
    
    const fetchTokenImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // CoinGecko API endpoint for coin data
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch token image: ${response.status}`);
        }
        
        const data = await response.json();
        
        setTokenData({
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          image: data.image.small,
          large: data.image.large,
          small: data.image.small,
          thumb: data.image.thumb
        });
      } catch (err) {
        console.error("Error fetching token image:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokenImage();
  }, [tokenId]);
  
  return { tokenData, isLoading, error, fallbackSymbol };
}
