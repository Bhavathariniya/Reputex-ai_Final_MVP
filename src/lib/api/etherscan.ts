import { format } from "date-fns";

// API key for Etherscan
const ETHERSCAN_API_KEY = "1WC3RZHBZ1JWUVD191F7KARAR24S9HFVHP";
const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";

// Response interfaces
interface EtherscanResponse {
  status: string;
  message: string;
  result: any;
}

export interface TokenInfoResponse {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark?: string;
  description?: string;
  website?: string;
  email?: string;
  blog?: string;
  reddit?: string;
  slack?: string;
  facebook?: string;
  twitter?: string;
  bitcointalk?: string;
  github?: string;
  telegram?: string;
  wechat?: string;
  linkedin?: string;
  discord?: string;
  whitepaper?: string;
  tokenPriceUSD?: string;
}

export interface ContractCreationInfo {
  contractCreator: string;
  txHash: string;
  creationDate?: string;
}

export interface ContractSourceCodeInfo {
  isVerified: boolean;
  sourceCode?: string;
  compilerVersion?: string;
  implementation?: string;
  hasProxy?: boolean;
  constructorArguments?: string;
  hasOwnershipRenounced?: boolean;
}

export interface TokenHolderInfo {
  address: string;
  tokenBalance: string;
  percentage: string;
  isContract: boolean;
}

/**
 * Fetches contract creation information from Etherscan
 */
export async function getContractCreationInfo(
  address: string
): Promise<ContractCreationInfo | null> {
  try {
    // Priority 1: Get contract creation info from Etherscan via transaction list
    const url = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data: EtherscanResponse = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      const firstTx = data.result[0];
      const timestamp = parseInt(firstTx.timeStamp);
      const creationDate = format(new Date(timestamp * 1000), 'dd-MM-yyyy');
      
      return {
        contractCreator: firstTx.from,
        txHash: firstTx.hash,
        creationDate: creationDate
      };
    }
    
    // If Etherscan txlist fails, try the contract creation endpoint as fallback
    const contractCreationUrl = `${ETHERSCAN_BASE_URL}?module=contract&action=getcontractcreation&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    
    const creationResponse = await fetch(contractCreationUrl);
    const creationData: EtherscanResponse = await creationResponse.json();
    
    if (creationData.status === "1" && Array.isArray(creationData.result) && creationData.result.length > 0) {
      const contractInfo = creationData.result[0];
      
      // Get transaction details to find creation date
      const txHash = contractInfo.txHash;
      const txUrl = `${ETHERSCAN_BASE_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
      const txResponse = await fetch(txUrl);
      const txData = await txResponse.json();
      
      if (txData.result && txData.result.blockNumber) {
        const blockNumber = parseInt(txData.result.blockNumber, 16);
        
        // Get block info to find timestamp
        const blockUrl = `${ETHERSCAN_BASE_URL}?module=block&action=getblockreward&blockno=${blockNumber}&apikey=${ETHERSCAN_API_KEY}`;
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();
        
        if (blockData.status === "1" && blockData.result && blockData.result.timeStamp) {
          const timestamp = parseInt(blockData.result.timeStamp);
          return {
            contractCreator: contractInfo.contractCreator,
            txHash: contractInfo.txHash,
            creationDate: format(new Date(timestamp * 1000), 'dd-MM-yyyy')
          };
        }
      }
      
      return {
        contractCreator: contractInfo.contractCreator,
        txHash: contractInfo.txHash
      };
    }
    
    // If both Etherscan methods fail, return null and let other APIs try
    return null;
  } catch (error) {
    console.error("Error fetching contract creation from Etherscan:", error);
    return null;
  }
}

/**
 * Fetches token information from Etherscan
 */
export async function getTokenInfo(
  address: string
): Promise<TokenInfoResponse | null> {
  try {
    const url = `${ETHERSCAN_BASE_URL}?module=token&action=tokeninfo&contractaddress=${address}&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data: EtherscanResponse = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      return data.result[0] as TokenInfoResponse;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
}

/**
 * Checks if a contract is verified
 */
export async function isContractVerified(
  address: string
): Promise<boolean> {
  try {
    const url = `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data: EtherscanResponse = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      return data.result[0].SourceCode !== '';
    }
    
    return false;
  } catch (error) {
    console.error("Error checking contract verification:", error);
    return false;
  }
}

/**
 * Fetches contract source code from Etherscan
 */
export async function getContractSourceCode(
  address: string
): Promise<ContractSourceCodeInfo | null> {
  try {
    const url = `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data: EtherscanResponse = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      const sourceInfo = data.result[0];
      const isVerified = sourceInfo.SourceCode !== '';
      
      return {
        isVerified,
        sourceCode: sourceInfo.SourceCode,
        compilerVersion: sourceInfo.CompilerVersion,
        implementation: sourceInfo.Implementation,
        hasProxy: sourceInfo.Proxy === '1',
        constructorArguments: sourceInfo.ConstructorArguments,
        // Rough check for ownership renounced - look for zero address in source code
        // This is a simplified check and not 100% reliable
        hasOwnershipRenounced: isVerified && 
          sourceInfo.SourceCode.includes('0x0000000000000000000000000000000000000000') &&
          (sourceInfo.SourceCode.includes('renounce') || sourceInfo.SourceCode.includes('transferOwnership'))
      };
    }
    
    return {
      isVerified: false
    };
  } catch (error) {
    console.error("Error fetching contract source code:", error);
    return {
      isVerified: false
    };
  }
}

/**
 * Fetches token holders from Etherscan
 */
export async function getTokenHolders(
  address: string,
  page: number = 1,
  offset: number = 10
): Promise<TokenHolderInfo[]> {
  try {
    const url = `${ETHERSCAN_BASE_URL}?module=token&action=tokenholderlist&contractaddress=${address}&page=${page}&offset=${offset}&apikey=${ETHERSCAN_API_KEY}`;
    
    const response = await fetch(url);
    const data: EtherscanResponse = await response.json();
    
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result.map(holder => ({
        address: holder.address,
        tokenBalance: holder.TokenHolderQuantity,
        percentage: ((parseFloat(holder.TokenHolderQuantity) / parseFloat(holder.TokenTotalSupply)) * 100).toFixed(2),
        isContract: false // We can't determine this from Etherscan tokenholderlist endpoint
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching token holders:", error);
    return [];
  }
}

/**
 * Calculate holder distribution score
 */
export function calculateHolderDistributionScore(holders: TokenHolderInfo[]): number {
  if (!holders || holders.length === 0) return 50; // Default score
  
  // Calculate total percentage held by top 10 holders
  const topHoldersPercentage = holders
    .slice(0, Math.min(10, holders.length))
    .reduce((sum, holder) => sum + parseFloat(holder.percentage), 0);
  
  // Calculate score based on distribution
  // Less concentration = higher score
  if (topHoldersPercentage > 90) return 10; // Extremely concentrated
  if (topHoldersPercentage > 80) return 20;
  if (topHoldersPercentage > 70) return 30;
  if (topHoldersPercentage > 60) return 40;
  if (topHoldersPercentage > 50) return 50;
  if (topHoldersPercentage > 40) return 60;
  if (topHoldersPercentage > 30) return 70;
  if (topHoldersPercentage > 20) return 80;
  if (topHoldersPercentage > 10) return 90;
  return 95; // Very well distributed
}

/**
 * Generate an etherscan explorer link for the given address
 */
export function getEtherscanAddressUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

/**
 * Generate an etherscan transaction link for the given txHash
 */
export function getEtherscanTxUrl(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`;
}

/**
 * Generate an explorer link for the given address based on the network
 */
export function generateExplorerLink(address: string, network: string = 'ethereum'): string {
  // Map network to appropriate block explorer
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/address/',
    binance: 'https://bscscan.com/address/',
    polygon: 'https://polygonscan.com/address/',
    arbitrum: 'https://arbiscan.io/address/',
    optimism: 'https://optimistic.etherscan.io/address/',
    avalanche: 'https://snowtrace.io/address/',
    fantom: 'https://ftmscan.com/address/',
    base: 'https://basescan.org/address/',
    zksync: 'https://explorer.zksync.io/address/'
  };
  
  const baseUrl = explorers[network.toLowerCase()] || explorers.ethereum;
  return `${baseUrl}${address}`;
}
