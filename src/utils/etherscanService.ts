
import axios from 'axios';

const ETHERSCAN_API_KEY = '1WC3RZHBZ1JWUVD191F7KARAR24S9HFVHP';
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

export interface ContractSourceInfo {
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  isVerified: boolean;
  implementation?: string;
  constructorArguments?: string;
}

export interface EtherscanContractResponse {
  status: string;
  message: string;
  result: Array<{
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string;
    Implementation: string;
    SwarmSource: string;
  }>;
}

/**
 * Fetches verified smart contract source code from Etherscan
 * @param address - The contract address to fetch source code for
 * @returns Promise<ContractSourceInfo | null>
 */
export async function fetchContractCode(address: string): Promise<ContractSourceInfo | null> {
  try {
    if (!address || address.length !== 42) {
      throw new Error('Invalid contract address');
    }

    const response = await axios.get<EtherscanContractResponse>(
      `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (response.data.status !== '1') {
      console.warn('Etherscan API returned error:', response.data.message);
      return null;
    }

    const result = response.data.result[0];
    
    // Check if contract is verified
    const isVerified = result.SourceCode !== '';
    
    if (!isVerified) {
      return {
        sourceCode: '',
        contractName: '',
        compilerVersion: '',
        isVerified: false
      };
    }

    // Handle proxy contracts
    let sourceCode = result.SourceCode;
    
    // If source code starts with {{ it's a JSON format (multiple files)
    if (sourceCode.startsWith('{{')) {
      try {
        // Remove outer braces and parse JSON
        const jsonStr = sourceCode.slice(1, -1);
        const parsedSource = JSON.parse(jsonStr);
        
        // Extract main contract source or combine all sources
        if (parsedSource.sources) {
          const mainFile = Object.keys(parsedSource.sources)[0];
          sourceCode = parsedSource.sources[mainFile].content || sourceCode;
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON source code format, using raw source');
      }
    }

    return {
      sourceCode,
      contractName: result.ContractName || 'Unknown',
      compilerVersion: result.CompilerVersion || 'Unknown',
      isVerified: true,
      implementation: result.Implementation || undefined,
      constructorArguments: result.ConstructorArguments || undefined
    };

  } catch (error) {
    console.error('Error fetching contract code from Etherscan:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - Etherscan API is not responding');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded - Please try again later');
      }
      if (error.response?.status >= 500) {
        throw new Error('Etherscan API is currently unavailable');
      }
    }
    
    throw new Error('Failed to fetch contract source code');
  }
}

/**
 * Formats source code for display by removing excessive whitespace
 * @param sourceCode - Raw source code string
 * @returns Formatted source code
 */
export function formatSourceCode(sourceCode: string): string {
  if (!sourceCode) return '';
  
  return sourceCode
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '  ') // Convert tabs to spaces
    .trim();
}

/**
 * Extracts a summary of the contract (first N lines)
 * @param sourceCode - Full source code
 * @param maxLines - Maximum number of lines to include (default: 50)
 * @returns Truncated source code
 */
export function getContractSummary(sourceCode: string, maxLines: number = 50): string {
  if (!sourceCode) return '';
  
  const lines = sourceCode.split('\n');
  if (lines.length <= maxLines) return sourceCode;
  
  return lines.slice(0, maxLines).join('\n') + '\n\n// ... (truncated)';
}
