import { env } from '../config/env';
import { getChain } from '../chains';
import { httpJson } from '../lib/http';
import { cachedIf } from '../lib/cache';
import { logger } from '../lib/logger';

/**
 * Block-explorer service (Etherscan V2 multichain).
 *
 * Every call here returns REAL on-chain / explorer data. Where the explorer
 * cannot answer (free-tier limits, unverified contract), we return a typed
 * "unavailable" shape — never fabricated values.
 */

const KEY = env.ETHERSCAN_API_KEY ?? '';
const TTL = env.CACHE_TTL_SECONDS;

function url(chainSlug: string, params: Record<string, string>): string {
  const chain = getChain(chainSlug);
  const q = new URLSearchParams({
    chainid: String(chain.chainId),
    apikey: KEY,
    ...params,
  });
  return `${chain.explorerApi}?${q.toString()}`;
}

interface ExplorerResponse<T = unknown> {
  status?: string;
  message?: string;
  result?: T;
}

/**
 * Raw EVM bytecode at an address. Returns:
 *   - a hex string (`'0x'` = externally-owned wallet, longer = contract)
 *   - `null` when the explorer was unreachable (so callers don't mistake a
 *     failed lookup for a wallet). Only successful lookups are cached.
 */
export async function getCode(chainSlug: string, address: string): Promise<string | null> {
  return cachedIf(
    `code:${chainSlug}:${address}`,
    TTL,
    (v) => v !== null,
    async () => {
      const data = await httpJson<{ result?: string }>(
        url(chainSlug, { module: 'proxy', action: 'eth_getCode', address, tag: 'latest' }),
      );
      return data && typeof data.result === 'string' ? data.result : null;
    },
  );
}

/** True if the address has deployed bytecode (a contract), false if it's a wallet, null if unreachable. */
export async function isContract(chainSlug: string, address: string): Promise<boolean | null> {
  const code = await getCode(chainSlug, address);
  if (code === null) return null; // explorer unreachable
  if (code === '0x') return false;
  return code.length > 2;
}

export interface SourceInfo {
  available: boolean;
  isVerified: boolean;
  contractName?: string;
  compilerVersion?: string;
  isProxy?: boolean;
  /** Full flattened source, when verified. Used for static red-flag scanning. */
  sourceCode?: string;
}

/** Contract verification status + source code (for static analysis). */
export async function getSourceCode(chainSlug: string, address: string): Promise<SourceInfo> {
  return cachedIf(`src:${chainSlug}:${address}`, TTL, (v) => v.available, async () => {
    const data = await httpJson<ExplorerResponse<any[]>>(
      url(chainSlug, { module: 'contract', action: 'getsourcecode', address }),
    );
    if (!data || data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
      return { available: false, isVerified: false };
    }
    const row = data.result[0];
    const sourceCode: string = row.SourceCode ?? '';
    const isVerified = sourceCode.trim() !== '';
    return {
      available: true,
      isVerified,
      contractName: row.ContractName || undefined,
      compilerVersion: row.CompilerVersion || undefined,
      isProxy: row.Proxy === '1',
      sourceCode: isVerified ? sourceCode : undefined,
    };
  });
}

export interface CreationInfo {
  available: boolean;
  contractCreator?: string;
  txHash?: string;
  creationDate?: string; // ISO date string
  ageDays?: number;
}

/** Who deployed the contract and when (used for the contract-age signal). */
export async function getCreation(chainSlug: string, address: string): Promise<CreationInfo> {
  return cachedIf(`creation:${chainSlug}:${address}`, TTL, (v) => v.available, async () => {
    // Primary: getcontractcreation (V2 returns timestamp on most chains)
    const data = await httpJson<ExplorerResponse<any[]>>(
      url(chainSlug, { module: 'contract', action: 'getcontractcreation', contractaddresses: address }),
    );
    if (data?.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
      const row = data.result[0];
      const tsRaw = row.timestamp ?? row.blockTimestamp;
      const info = buildCreation(row.contractCreator, row.txHash, tsRaw);
      if (info.creationDate || info.contractCreator) return info;
    }

    // Fallback: first tx in the address's tx list = the deployment tx.
    const txData = await httpJson<ExplorerResponse<any[]>>(
      url(chainSlug, {
        module: 'account', action: 'txlist', address,
        startblock: '0', endblock: '99999999', page: '1', offset: '1', sort: 'asc',
      }),
    );
    if (txData?.status === '1' && Array.isArray(txData.result) && txData.result.length > 0) {
      const first = txData.result[0];
      return buildCreation(first.from, first.hash, first.timeStamp);
    }

    return { available: false };
  });
}

function buildCreation(creator?: string, txHash?: string, tsRaw?: string | number): CreationInfo {
  let creationDate: string | undefined;
  let ageDays: number | undefined;
  if (tsRaw !== undefined && tsRaw !== null && `${tsRaw}` !== '') {
    const seconds = Number(tsRaw);
    if (Number.isFinite(seconds) && seconds > 0) {
      const ms = seconds * 1000;
      creationDate = new Date(ms).toISOString();
      ageDays = Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
    }
  }
  return {
    available: Boolean(creator || creationDate),
    contractCreator: creator || undefined,
    txHash: txHash || undefined,
    creationDate,
    ageDays,
  };
}

export interface OwnerInfo {
  available: boolean;
  owner?: string;
  /** True when owner() resolves to the zero address (ownership renounced). */
  renounced?: boolean;
}

const ZERO = '0x0000000000000000000000000000000000000000';
// keccak("owner()") selector
const OWNER_SELECTOR = '0x8da5cb5b';

/**
 * Reads the contract's owner() via eth_call — a genuine on-chain check for
 * whether ownership has been renounced (owner == 0x0). Many ERC-20s expose
 * owner(); if not, this returns available:false (we don't guess).
 */
export async function getOwner(chainSlug: string, address: string): Promise<OwnerInfo> {
  return cachedIf(`owner:${chainSlug}:${address}`, TTL, (v) => v.available, async () => {
    const data = await httpJson<{ result?: string }>(
      url(chainSlug, { module: 'proxy', action: 'eth_call', to: address, data: OWNER_SELECTOR, tag: 'latest' }),
    );
    const raw = data?.result;
    if (!raw || raw === '0x' || raw.length < 66) return { available: false };
    // last 40 hex chars = the address
    const owner = '0x' + raw.slice(-40);
    return { available: true, owner, renounced: owner.toLowerCase() === ZERO };
  });
}

export interface HolderInfo {
  available: boolean;
  holderCount?: number;
  /** % of supply held by the top 10 holders (0-100). Higher = more concentrated. */
  top10Pct?: number;
}

/**
 * Token holder concentration. Note: Etherscan's `tokenholderlist` is a Pro-tier
 * endpoint; on the free tier this returns available:false and the holder pillar
 * degrades to lower confidence rather than inventing a number.
 */
export async function getHolderConcentration(chainSlug: string, address: string): Promise<HolderInfo> {
  return cachedIf(`holders:${chainSlug}:${address}`, TTL, (v) => v.available, async () => {
    const data = await httpJson<ExplorerResponse<any>>(
      url(chainSlug, { module: 'token', action: 'tokenholderlist', contractaddress: address, page: '1', offset: '100' }),
    );
    if (!data || data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
      logger.debug('holder_list_unavailable', { chainSlug, address });
      return { available: false };
    }
    const rows = data.result as Array<{ TokenHolderQuantity?: string; TokenHolderShare?: string }>;
    let top10Pct: number | undefined;
    if (rows[0]?.TokenHolderShare !== undefined) {
      top10Pct = rows.slice(0, 10).reduce((sum, r) => sum + (parseFloat(r.TokenHolderShare ?? '0') || 0), 0);
    } else {
      const total = rows.reduce((s, r) => s + (parseFloat(r.TokenHolderQuantity ?? '0') || 0), 0);
      if (total > 0) {
        const top10 = rows.slice(0, 10).reduce((s, r) => s + (parseFloat(r.TokenHolderQuantity ?? '0') || 0), 0);
        top10Pct = (top10 / total) * 100;
      }
    }
    return { available: true, holderCount: rows.length, top10Pct };
  });
}
