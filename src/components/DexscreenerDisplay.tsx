
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DexscreenerDisplayProps {
  dexscreenerData: any;
  tokenAddress: string;
}

const DexscreenerDisplay: React.FC<DexscreenerDisplayProps> = ({ 
  dexscreenerData, 
  tokenAddress 
}) => {
  if (!dexscreenerData?.pairs || dexscreenerData.pairs.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Real-Time Market Data
          </CardTitle>
          <CardDescription>
            No trading pairs found on DEXs for this token
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get the main trading pair (highest volume)
  const mainPair = dexscreenerData.pairs.reduce((best: any, current: any) => 
    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
  );

  const priceChange24h = mainPair.priceChange?.h24 || 0;
  const isPositiveChange = priceChange24h >= 0;

  return (
    <Card className="glass-card border-neon-cyan">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Real-Time Market Data
          <Badge variant="outline" className="text-xs">
            Live from {mainPair.dexId?.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time trading data from Dexscreener API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Current Price */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Current Price</div>
            <div className="text-xl font-bold">
              {formatCurrency(parseFloat(mainPair.priceUsd || '0'), 6)}
            </div>
            <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
              {isPositiveChange ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {priceChange24h.toFixed(2)}% (24h)
            </div>
          </div>

          {/* 24h Volume */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">24h Trading Volume</div>
            <div className="text-xl font-bold">
              {formatCurrency(mainPair.volume?.h24 || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {(mainPair.txns?.h24?.buys || 0) + (mainPair.txns?.h24?.sells || 0)} transactions
            </div>
          </div>

          {/* Market Cap / FDV */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
            <div className="text-xl font-bold">
              {formatCurrency(mainPair.marketCap || mainPair.fdv || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {mainPair.fdv ? 'Fully Diluted' : 'Circulating'}
            </div>
          </div>

          {/* Liquidity */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
            <div className="text-xl font-bold">
              {formatCurrency(mainPair.liquidity?.usd || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Pool liquidity
            </div>
          </div>

          {/* DEX Info */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Trading Pair</div>
            <div className="font-medium">
              {mainPair.baseToken?.symbol || 'Unknown'} / {mainPair.quoteToken?.symbol || 'Unknown'}
            </div>
            <div className="text-sm text-muted-foreground">
              on {mainPair.dexId?.toUpperCase() || 'DEX'}
            </div>
          </div>

          {/* Trading Activity */}
          <div className="p-3 border border-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">24h Activity</div>
            <div className="flex gap-2 text-sm">
              <span className="text-green-500">
                {mainPair.txns?.h24?.buys || 0} buys
              </span>
              <span className="text-red-500">
                {mainPair.txns?.h24?.sells || 0} sells
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Transactions
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
          {mainPair.url && (
            <a
              href={mainPair.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
            >
              View on {mainPair.dexId?.toUpperCase()}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <a
            href={`https://dexscreener.com/ethereum/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
          >
            View on Dexscreener
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default DexscreenerDisplay;
