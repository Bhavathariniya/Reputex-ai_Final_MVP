/**
 * Static source-code red-flag scanner.
 *
 * Runs ONLY on verified source code returned by the explorer. These are
 * heuristic pattern matches — they indicate capabilities the contract *has*,
 * which a human (or the AI layer) should weigh. They are deliberately
 * conservative and each one is reported with the matched capability so the
 * score stays explainable.
 */

export interface DangerousCapability {
  key: string;
  label: string;
  severity: 'high' | 'medium';
  /** Why this matters to an investor. */
  note: string;
}

interface Rule {
  key: string;
  label: string;
  severity: 'high' | 'medium';
  note: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  {
    key: 'mint',
    label: 'Mintable supply',
    severity: 'high',
    note: 'Owner can create new tokens, diluting holders.',
    pattern: /function\s+_?mint\s*\(/i,
  },
  {
    key: 'blacklist',
    label: 'Blacklist / blocklist',
    severity: 'high',
    note: 'Specific addresses can be blocked from selling.',
    pattern: /(blacklist|blocklist|_isBlacklisted|isBot|setBot)/i,
  },
  {
    key: 'pause',
    label: 'Pausable trading',
    severity: 'high',
    note: 'Owner can halt all transfers at will.',
    pattern: /function\s+pause\s*\(|whenNotPaused|_pause\s*\(/i,
  },
  {
    key: 'fees',
    label: 'Mutable fees / taxes',
    severity: 'medium',
    note: 'Owner can change buy/sell taxes after launch.',
    pattern: /function\s+set(Fee|Fees|Tax|Taxes|BuyTax|SellTax)\s*\(/i,
  },
  {
    key: 'maxtx',
    label: 'Max transaction / wallet limits',
    severity: 'medium',
    note: 'Owner can restrict how much can be traded or held.',
    pattern: /function\s+set(MaxTx|MaxWallet|MaxTransaction|MaxTxAmount)\s*\(/i,
  },
  {
    key: 'proxy',
    label: 'Upgradeable / proxy logic',
    severity: 'high',
    note: 'Contract code can be swapped out for new logic later.',
    pattern: /(delegatecall|upgradeTo|_implementation|Initializable|UUPSUpgradeable)/i,
  },
  {
    key: 'owneronly',
    label: 'Privileged owner functions',
    severity: 'medium',
    note: 'Owner-only functions present; ownership control matters.',
    pattern: /onlyOwner/i,
  },
];

export interface SourceScan {
  scanned: boolean;
  capabilities: DangerousCapability[];
}

export function scanSource(source: string | undefined): SourceScan {
  if (!source || source.trim() === '') return { scanned: false, capabilities: [] };
  const capabilities: DangerousCapability[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(source)) {
      capabilities.push({ key: rule.key, label: rule.label, severity: rule.severity, note: rule.note });
    }
  }
  return { scanned: true, capabilities };
}

/** Clamp helper used throughout the engine. */
export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}
