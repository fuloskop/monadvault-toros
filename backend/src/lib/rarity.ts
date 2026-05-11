// CSGO/CS2 standart kasa açma drop oranları + byMykel rarity normalize.
// Valve'in resmî oranları (Wiki, official drop table):
//
//   Mil-Spec (Blue)     79.92%
//   Restricted (Purple) 15.98%
//   Classified (Pink)    3.20%
//   Covert (Red)         0.64%
//   Rare Special (Gold)  0.26%  — knife/gloves
//   -----------------------------------
//   Toplam              100.00%
//
// byMykel `rarity.id` field'ları Valve schema string'leri. Naming kafa
// karıştırıcı ("mythical" → Restricted, "ancient" → Covert) ama bu Valve'in
// kendi şeması.

export type RarityBucketName =
  | 'Mil-Spec'
  | 'Restricted'
  | 'Classified'
  | 'Covert'
  | 'Rare Special';

export interface RarityBucket {
  name: RarityBucketName;
  weight: number; // 0-100 percent
  color: string; // hex (kasa UI gradient'i için)
  // CaseItem.rarity için MonadVault'un kendi enum string'leri:
  caseItemRarity: 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancient';
  // Synthetic value range (TOROS coin, kasa açma simülasyonu için)
  minValue: number;
  maxValue: number;
}

const BUCKETS: Record<RarityBucketName, RarityBucket> = {
  'Mil-Spec':     { name: 'Mil-Spec',     weight: 79.92, color: '#4b69ff', caseItemRarity: 'rare',      minValue: 1,    maxValue: 5     },
  'Restricted':   { name: 'Restricted',   weight: 15.98, color: '#8847ff', caseItemRarity: 'epic',      minValue: 5,    maxValue: 25    },
  'Classified':   { name: 'Classified',   weight: 3.20,  color: '#d32ce6', caseItemRarity: 'legendary', minValue: 25,   maxValue: 100   },
  'Covert':       { name: 'Covert',       weight: 0.64,  color: '#eb4b4b', caseItemRarity: 'mythic',    minValue: 100,  maxValue: 500   },
  'Rare Special': { name: 'Rare Special', weight: 0.26,  color: '#e4ae39', caseItemRarity: 'ancient',   minValue: 500,  maxValue: 5000  },
};

// byMykel `rarity.id` → bucket. Bilinmeyen id'ler null döner (kasada yer almaz).
export function rarityIdToBucket(rarityId: string | undefined): RarityBucket | null {
  if (!rarityId) return null;
  switch (rarityId) {
    case 'rarity_rare_weapon':
      return BUCKETS['Mil-Spec'];
    case 'rarity_mythical_weapon':
      return BUCKETS['Restricted'];
    case 'rarity_legendary_weapon':
      return BUCKETS['Classified'];
    case 'rarity_ancient_weapon':
      return BUCKETS['Covert'];
    // Knife / Gloves byMykel'de "ancient" (no _weapon suffix) veya "immortal"
    case 'rarity_ancient':
    case 'rarity_immortal':
      return BUCKETS['Rare Special'];
    // Consumer / Industrial Grade kasada bulunmaz (white/grey rarity)
    case 'rarity_common_weapon':
    case 'rarity_uncommon_weapon':
      return null;
    default:
      return null;
  }
}

// byMykel rarity color → bucket (fallback için, id mevcut olmadığında)
export function rarityColorToBucket(color: string | undefined): RarityBucket | null {
  if (!color) return null;
  const c = color.toLowerCase();
  for (const b of Object.values(BUCKETS)) {
    if (b.color.toLowerCase() === c) return b;
  }
  return null;
}

// Bucket içinden synthetic bir value üret (uniform random — saf simülasyon)
export function synthValueForBucket(b: RarityBucket): number {
  const v = b.minValue + Math.random() * (b.maxValue - b.minValue);
  return Math.round(v * 100) / 100;
}

// Bucket weight'i bucket içindeki item sayısına böl → her item için per-item probability.
// `CaseItem.probability` Decimal(10, 8) — yani 0-1 arasında bir oran (0.7992 vb.)
export function perItemProbability(bucket: RarityBucket, itemsInBucket: number): number {
  if (itemsInBucket <= 0) return 0;
  return (bucket.weight / 100) / itemsInBucket;
}

export const ALL_BUCKETS: RarityBucket[] = Object.values(BUCKETS);
