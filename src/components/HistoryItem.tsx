import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BitcoinIcon,
  L1XIcon,
  EthereumIcon,
  BNBChainIcon,
  PolygonIcon,
  ArbitrumIcon,
  OptimismIcon,
  SolanaIcon,
  AvalancheIcon,
  FantomIcon,
  BaseIcon,
  ZkSyncIcon,
} from '@/components/icons';

interface HistoryItemProps {
  address: string;
  trustScore: number;
  timestamp: string;
  network?: string;
  verdict?: 'Highly Legit' | 'Likely Legit' | 'Likely Risky' | 'High Risk';
  scamIndicators?: string[];
  onDelete?: (address: string, network: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ 
  address, 
  trustScore, 
  timestamp,
  network = 'ethereum',
  verdict = 'Likely Legit', // Default value
  scamIndicators = [],
  onDelete
}) => {
  const scoreColor = 
    trustScore >= 80 ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/40' :
    trustScore >= 50 ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/40' :
    'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/40';
  
  const networkColors: Record<string, string> = {
    ethereum: 'border-[#627EEA] bg-[#627EEA]/10 text-[#627EEA]',
    binance: 'border-[#F3BA2F] bg-[#F3BA2F]/10 text-[#F3BA2F]',
    polygon: 'border-[#8247E5] bg-[#8247E5]/10 text-[#8247E5]',
    arbitrum: 'border-[#28A0F0] bg-[#28A0F0]/10 text-[#28A0F0]',
    optimism: 'border-[#FF0420] bg-[#FF0420]/10 text-[#FF0420]',
  };

  const networkNames: Record<string, string> = {
    ethereum: 'Ethereum',
    binance: 'BNB Chain',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
  };
  
  const verdictStyles = {
    'Highly Legit': {
      color: 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan',
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    'Likely Legit': {
      color: 'border-neon-pink bg-neon-pink/10 text-neon-pink',
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    },
    'Likely Risky': {
      color: 'border-neon-orange bg-neon-orange/10 text-neon-orange',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />
    },
    'High Risk': {
      color: 'border-neon-red bg-neon-red/10 text-neon-red',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />
    }
  };
  
  const verdictStyle = verdictStyles[verdict] || verdictStyles['Likely Legit'];
  
  const formattedAddress = address.slice(0, 6) + '...' + address.slice(-4);
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const NetworkIcon = {
    bitcoin: BitcoinIcon,
    l1x: L1XIcon,
    ethereum: EthereumIcon,
    binance: BNBChainIcon,
    polygon: PolygonIcon,
    arbitrum: ArbitrumIcon,
    optimism: OptimismIcon,
    solana: SolanaIcon,
    avalanche: AvalancheIcon,
    fantom: FantomIcon,
    base: BaseIcon,
    zksync: ZkSyncIcon,
  }[network] || EthereumIcon;
  
  return (
    <div className="glass-card rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="font-mono bg-muted/50 px-3 py-1 rounded text-sm">
          {formattedAddress}
        </div>
        
        <Badge 
          variant="outline" 
          className={`${networkColors[network] || 'border-muted-foreground text-muted-foreground'} flex items-center gap-2`}
        >
          <NetworkIcon className="h-4 w-4" />
          {networkNames[network] || network}
        </Badge>
        
        <Badge variant="outline" className={`${scoreColor} text-xs px-2 py-0.5`}>
          Score: {trustScore}
        </Badge>
        
        <Badge variant="outline" className={verdictStyle.color}>
          {verdictStyle.icon}
          {verdict}
        </Badge>
        
        {scamIndicators.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-neon-red bg-neon-red/10 text-neon-red">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {scamIndicators.length} {scamIndicators.length === 1 ? 'Warning' : 'Warnings'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {scamIndicators.map((indicator, index) => (
                    <p key={index} className="text-xs">{indicator}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <span className="text-xs text-muted-foreground">
          Analyzed {timeAgo}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link to={`/?address=${address}&network=${network}`}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
            View Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-neon-pink hover:bg-neon-pink/10 rounded-full"
                onClick={() => onDelete && onDelete(address, network)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete from history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default HistoryItem;
