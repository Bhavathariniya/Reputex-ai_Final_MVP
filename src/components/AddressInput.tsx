
import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BitcoinIcon,
  L1XIcon,
  EthereumIcon,
  PolygonIcon,
  ArbitrumIcon,
  OptimismIcon,
  SolanaIcon,
  AvalancheIcon,
  FantomIcon,
  ZkSyncIcon
} from '@/components/icons';
import BNBChainIcon from './icons/BNBChainIcon';
import BaseCircleImage from './icons/BaseIcon';

const BnbChainCircleImage = BNBChainIcon;
const BaseIcon = BaseCircleImage;

const BLOCKCHAINS = [
  { id: 'bitcoin', name: 'Bitcoin', icon: BitcoinIcon },
  { id: 'l1x', name: 'L1X', icon: L1XIcon },
  { id: 'ethereum', name: 'Ethereum', icon: EthereumIcon },
  { id: 'binance', name: 'BNB Chain', icon: BnbChainCircleImage },
  { id: 'polygon', name: 'Polygon', icon: PolygonIcon },
  { id: 'arbitrum', name: 'Arbitrum', icon: ArbitrumIcon },
  { id: 'optimism', name: 'Optimism', icon: OptimismIcon },
  { id: 'solana', name: 'Solana', icon: SolanaIcon },
  { id: 'avalanche', name: 'Avalanche', icon: AvalancheIcon },
  { id: 'fantom', name: 'Fantom', icon: FantomIcon },
  { id: 'base', name: 'Base', icon: BaseIcon },
  { id: 'zksync', name: 'zkSync', icon: ZkSyncIcon },
];

interface AddressInputProps {
  onSubmit: (address: string, network: string) => void;
  isLoading: boolean;
}

const BlockchainSelector: React.FC<{
  selectedNetwork: string;
  onNetworkChange: (network: string) => void;
  disabled?: boolean;
}> = ({ selectedNetwork, onNetworkChange, disabled = false }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {BLOCKCHAINS.map((blockchain) => {
        const Icon = blockchain.icon;
        return (
          <button
            key={blockchain.id}
            type="button"
            disabled={disabled}
            onClick={() => onNetworkChange(blockchain.id)}
            className={cn(
              "px-3 py-2 rounded-full text-sm transition-all duration-300 ease-in-out",
              "border border-transparent hover:border-neon-cyan/50",
              "flex items-center gap-2",
              selectedNetwork === blockchain.id
                ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="h-8 w-8 flex items-center justify-center">
              <Icon />
            </div>
            {blockchain.name}
          </button>
        );
      })}
    </div>
  );
};

const AddressInput: React.FC<AddressInputProps> = ({ onSubmit, isLoading }) => {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const navigate = useNavigate();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only set address, no auto detection of network anymore
    const addr = e.target.value.trim();
    setAddress(addr);
  };

  const handleNetworkChange = (value: string) => {
    setNetwork(value);
  };

  const validateAddress = (addr: string): boolean => {
    if (addr.startsWith('0x') && addr.length === 42) return true;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return true;
    if (/^(1|3|bc1)[a-zA-Z0-9]{25,42}$/.test(addr)) return true;
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Please enter an address');
      return;
    }

    if (!validateAddress(address)) {
      toast.error('Please enter a valid blockchain address');
      return;
    }

    onSubmit(address, network);

    navigate('/result', {
      state: { address, network },
      replace: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-8">
      <BlockchainSelector 
        selectedNetwork={network}
        onNetworkChange={handleNetworkChange}
        disabled={isLoading}
      />

      <div className="glowing-card p-2 rounded-xl">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-grow">
            <Input
              placeholder="Enter wallet or token address (0x...)"
              value={address}
              onChange={handleAddressChange}
              className="pl-10 py-6 bg-transparent border-muted focus-visible:ring-neon-cyan"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <Button 
            type="submit" 
            className="bg-neon-cyan hover:bg-neon-cyan/80 py-6" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>Analyze</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddressInput;

