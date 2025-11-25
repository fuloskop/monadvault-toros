import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return formatCurrency(amount);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#9ca3af',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#d946ef',
    legendary: '#f59e0b',
    mythic: '#ef4444',
  };
  return colors[rarity.toLowerCase()] || colors.common;
}

export function getRarityGradient(rarity: string): string {
  const color = getRarityColor(rarity);
  return `linear-gradient(135deg, ${color}20, ${color}60)`;
}

export function calculateWinChance(targetMultiplier: number, houseEdge: number = 0.05): number {
  const rawChance = 1 / targetMultiplier;
  return rawChance * (1 - houseEdge) * 100;
}

export function calculateMinesMultiplier(
  mineCount: number,
  revealed: number,
  houseEdge: number = 0.03
): number {
  const safeTiles = 25 - mineCount;
  if (revealed === 0) return 1;

  let probability = 1;
  for (let i = 0; i < revealed; i++) {
    probability *= (safeTiles - i) / (25 - i);
  }

  const rawMultiplier = 1 / probability;
  return parseFloat((rawMultiplier * (1 - houseEdge)).toFixed(4));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateClientSeed(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

