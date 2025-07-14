
import React from 'react';
import TokenImage from './TokenImage';
import { getCoinGeckoIdFromSymbol } from '../lib/api/token-mappings';

interface TokenSymbolProps {
  symbol: string;
  showName?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  etherscanSymbol?: string; // Optional Etherscan symbol
}

const TokenSymbol: React.FC<TokenSymbolProps> = ({ 
  symbol, 
  showName = true, 
  size = 'medium',
  className = '',
  etherscanSymbol
}) => {
  // Use Etherscan symbol if provided, otherwise use the passed symbol
  const displaySymbol = etherscanSymbol || symbol;
  const tokenId = getCoinGeckoIdFromSymbol(displaySymbol);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TokenImage 
        tokenId={tokenId} 
        symbol={displaySymbol} 
        size={size} 
      />
      {showName && (
        <span className="font-medium">{displaySymbol.toUpperCase()}</span>
      )}
    </div>
  );
};

export default TokenSymbol;
