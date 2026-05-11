import { redis } from '../config/redis.js';

// byMykel/CSGO-API community CDN feed. Bu dosya toroscs/src/lib/bymykel.ts'in
// Express + ioredis tarafına port edilmiş hâli. Aynı endpoint'ler, aynı cache
// stratejisi (L1 in-memory 5dk, L2 Redis 24sa). Toroscs ile aynı Redis'i
// paylaşırsak cache de paylaşılır (KEY_PREFIX = "toroscs:bymykel:") — başka
// instance'da çalışıyorsa kendi cache'ini doldurur, sorun değil.

const CACHE_TTL_SEC = 24 * 60 * 60; // 24h
const KEY_PREFIX = 'toroscs:bymykel:';

const URLS = {
  skins: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
  weapons: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/base_weapons.json',
  agents: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json',
  stickers: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json',
  keychains: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json',
  music_kits: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/music_kits.json',
  collectibles: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/collectibles.json',
} as const;

export type ByMykelDataset = keyof typeof URLS;

// ── Raw type shapes (only fields we actually use) ────────

export interface ByMykelWeapon {
  id: string;
  def_index: number;
  name: string;
  description?: string;
  category?: { id: string; name: string };
  team?: { id: 'terrorists' | 'counter-terrorists' | 'both'; name: string };
  image?: string;
}

export interface ByMykelSkin {
  id: string;
  name: string;
  description?: string;
  weapon: { id: string; weapon_id: number; name: string };
  category: { id: string; name: string };
  pattern?: { id: string; name?: string };
  min_float: number;
  max_float: number;
  paint_index: string;
  rarity?: { id: string; name: string; color: string };
  stattrak?: boolean;
  souvenir?: boolean;
  legacy_model?: boolean;
  image: string;
  team?: { id: 'terrorists' | 'counter-terrorists' | 'both'; name: string };
}

// ── Cache layer ──────────────────────────────────────────

const memCache = new Map<ByMykelDataset, { data: unknown; expires: number }>();
const MEM_TTL_MS = 5 * 60 * 1000;

async function fetchDataset<T>(dataset: ByMykelDataset): Promise<T> {
  // L1: in-process memory
  const mem = memCache.get(dataset);
  if (mem && mem.expires > Date.now()) {
    return mem.data as T;
  }

  // L2: Redis
  const cacheKey = `${KEY_PREFIX}${dataset}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as T;
      memCache.set(dataset, { data: parsed, expires: Date.now() + MEM_TTL_MS });
      return parsed;
    } catch {
      // fall through to refetch
    }
  }

  // L3: origin
  const res = await fetch(URLS[dataset], {
    headers: { 'User-Agent': 'toros-games/1.0' },
  });
  if (!res.ok) {
    throw new Error(`byMykel ${dataset}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as T;

  await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL_SEC);
  memCache.set(dataset, { data, expires: Date.now() + MEM_TTL_MS });
  return data;
}

export async function getSkins(): Promise<ByMykelSkin[]> {
  return fetchDataset<ByMykelSkin[]>('skins');
}

export async function getWeapons(): Promise<ByMykelWeapon[]> {
  return fetchDataset<ByMykelWeapon[]>('weapons');
}
