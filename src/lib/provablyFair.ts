import CryptoJS from 'crypto-js';

// Generate a random server seed
export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array);
  } else {
    // Server-side fallback
    return CryptoJS.lib.WordArray.random(32).toString();
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash the server seed (shown to player before bet)
export function hashServerSeed(serverSeed: string): string {
  return CryptoJS.SHA256(serverSeed).toString();
}

// Generate a random client seed
export function generateClientSeed(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Combine seeds and nonce to generate a provably fair result
export function generateResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = CryptoJS.SHA256(combined).toString();
  
  // Take first 8 characters of hash and convert to number between 0-1
  const hex = hash.substring(0, 8);
  const decimal = parseInt(hex, 16);
  const max = 0xFFFFFFFF;
  
  return decimal / max;
}

// Generate multiple results (for mines, etc.)
export function generateMultipleResults(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}:${i}`;
    const hash = CryptoJS.SHA256(combined).toString();
    const hex = hash.substring(0, 8);
    const decimal = parseInt(hex, 16);
    const max = 0xFFFFFFFF;
    results.push(decimal / max);
  }
  
  return results;
}

// Verify a bet result
export function verifyResult(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number
): { valid: boolean; result: number } {
  const computedHash = hashServerSeed(serverSeed);
  const valid = computedHash === serverSeedHash;
  const result = generateResult(serverSeed, clientSeed, nonce);
  
  return { valid, result };
}

// Game-specific result generators
export function getCoinFlipResult(result: number): 'heads' | 'tails' {
  return result < 0.5 ? 'heads' : 'tails';
}

export function getRouletteResult(result: number): number {
  return Math.floor(result * 37); // 0-36
}

export function getMinePositions(results: number[], mineCount: number, gridSize: number): number[] {
  const positions: number[] = [];
  const available = Array.from({ length: gridSize }, (_, i) => i);
  
  for (let i = 0; i < mineCount && available.length > 0; i++) {
    const index = Math.floor(results[i] * available.length);
    positions.push(available[index]);
    available.splice(index, 1);
  }
  
  return positions;
}

export function getUpgraderResult(result: number, winChance: number): boolean {
  return result < winChance;
}

