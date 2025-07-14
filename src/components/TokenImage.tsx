
import React from 'react';
import { useTokenImage } from '../lib/api/token-image';
import { mapEtherscanSymbolToCoinGeckoId } from '../lib/api/token-mappings';

interface TokenImageProps {
  tokenId?: string;
  symbol?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  etherscanSymbol?: string; // Optional Etherscan symbol
}

const TokenImage: React.FC<TokenImageProps> = ({
  tokenId,
  symbol,
  size = 'medium',
  className = '',
  etherscanSymbol
}) => {
  // If we have an Etherscan symbol, try to map it to a CoinGecko ID
  const mappedTokenId = etherscanSymbol ? 
    mapEtherscanSymbolToCoinGeckoId(etherscanSymbol) || tokenId : 
    tokenId;
  
  const { tokenData, isLoading, error } = useTokenImage(mappedTokenId, symbol || etherscanSymbol);
  
  // Size mapping
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };
  
  const sizeClass = sizeClasses[size];
  
  // If we have the token data, show the image
  if (tokenData?.image) {
    return (
      <img 
        src={tokenData.image}
        alt={`${tokenData.name || symbol || etherscanSymbol || 'Token'} logo`}
        className={`rounded-full ${sizeClass} ${className}`}
      />
    );
  }
  
  // While loading or if there's an error, show the fallback symbol
  const fallbackSymbol = (etherscanSymbol || symbol)?.toUpperCase() || '?';
  
  return (
    <div className={`flex items-center justify-center bg-gray-700 text-white rounded-full ${sizeClass} ${className}`}>
      <span className="text-xs font-bold">{fallbackSymbol}</span>
    </div>
  );
};

export default TokenImage;
