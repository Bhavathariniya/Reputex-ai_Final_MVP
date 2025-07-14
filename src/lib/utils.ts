
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas and optional decimal places
 */
export function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(num);
}

/**
 * Format a number as currency
 */
export function formatCurrency(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined) return 'N/A';
  
  // Format large numbers more readably
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals
  }).format(num);
}
