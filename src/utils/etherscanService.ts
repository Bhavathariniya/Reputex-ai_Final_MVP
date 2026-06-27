/**
 * Contract source-code client.
 *
 * Fetches verified source from the ReputeX backend (which holds the Etherscan
 * key) instead of calling Etherscan directly. No API key in the browser.
 * The exported function signatures are unchanged so consumers (ContractCodeDisplay)
 * need no edits.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export interface ContractSourceInfo {
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  isVerified: boolean;
  implementation?: string;
  constructorArguments?: string;
}

export async function fetchContractCode(
  address: string,
  network = 'ethereum',
): Promise<ContractSourceInfo | null> {
  if (!address || address.length !== 42) {
    throw new Error('Invalid contract address');
  }

  const res = await fetch(
    `${API_BASE}/api/v1/source?address=${address}&network=${network}`,
  );

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit exceeded - Please try again later');
    if (res.status >= 500) throw new Error('Source service is currently unavailable');
    throw new Error('Failed to fetch contract source code');
  }

  const data = await res.json();

  if (!data.isVerified) {
    return { sourceCode: '', contractName: '', compilerVersion: '', isVerified: false };
  }

  // Etherscan returns multi-file sources wrapped in {{ ... }} JSON; flatten to
  // the first file's content for display.
  let sourceCode: string = data.sourceCode || '';
  if (sourceCode.startsWith('{{')) {
    try {
      const parsed = JSON.parse(sourceCode.slice(1, -1));
      if (parsed.sources) {
        const mainFile = Object.keys(parsed.sources)[0];
        sourceCode = parsed.sources[mainFile]?.content || sourceCode;
      }
    } catch {
      // keep raw source
    }
  }

  return {
    sourceCode,
    contractName: data.contractName || 'Unknown',
    compilerVersion: data.compilerVersion || 'Unknown',
    isVerified: true,
  };
}

export function formatSourceCode(sourceCode: string): string {
  if (!sourceCode) return '';
  return sourceCode.replace(/\r\n/g, '\n').replace(/\t/g, '  ').trim();
}

export function getContractSummary(sourceCode: string, maxLines = 50): string {
  if (!sourceCode) return '';
  const lines = sourceCode.split('\n');
  if (lines.length <= maxLines) return sourceCode;
  return lines.slice(0, maxLines).join('\n') + '\n\n// ... (truncated)';
}
