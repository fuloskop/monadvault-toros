import { PrismaClient, Prisma } from '@prisma/client';
import { getSkins, type ByMykelSkin } from '../src/lib/bymykel.js';
import {
  rarityIdToBucket,
  synthValueForBucket,
  perItemProbability,
  type RarityBucket,
} from '../src/lib/rarity.js';

const prisma = new PrismaClient();

// TOROS Games seed (forked from MonadVault).
// Orijinal generic Coin/Gem/Crystal placeholder item'ları kaldırıldı; veri
// kaynağı artık byMykel/CSGO-API. Her kasa için:
//   1) Skin pool'u filtreleme kuralıyla seçilir (örn. sadece AK + AWP)
//   2) rarity.id'den bucket'a (Mil-Spec/Restricted/Classified/Covert/Rare)
//   3) Bucket weight'i bucket içi item sayısına eşit dağıtılır
//   4) Bucket sum 79.92 + 15.98 + 3.20 + 0.64 + 0.26 = 100.00 (Valve standart)

// Kasa başına item sınırı — UI roulette strip uzunluğu hissini koru
const MAX_ITEMS_PER_BUCKET = 6;

// Bir bucket içinden rastgele N skin seç (uniform random sampling)
function sampleFromBucket(skins: ByMykelSkin[], n: number): ByMykelSkin[] {
  if (skins.length <= n) return [...skins];
  const pool = [...skins];
  const out: ByMykelSkin[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// Skin listesinden CaseItem create payload'u üret (probability normalize edilmiş).
function buildItemsFromSkins(skins: ByMykelSkin[]) {
  // Bucket'lara göre grupla
  const byBucket = new Map<RarityBucket, ByMykelSkin[]>();
  for (const s of skins) {
    const b = rarityIdToBucket(s.rarity?.id);
    if (!b) continue;
    if (!byBucket.has(b)) byBucket.set(b, []);
    byBucket.get(b)!.push(s);
  }

  const items: Prisma.CaseItemCreateWithoutCaseInput[] = [];
  for (const [bucket, bucketSkins] of byBucket) {
    const picked = sampleFromBucket(bucketSkins, MAX_ITEMS_PER_BUCKET);
    const probEach = perItemProbability(bucket, picked.length);
    for (const skin of picked) {
      items.push({
        name: skin.name,
        imageUrl: skin.image,
        value: new Prisma.Decimal(synthValueForBucket(bucket)),
        rarity: bucket.caseItemRarity,
        probability: new Prisma.Decimal(probEach),
        color: bucket.color,
      });
    }
  }
  return items;
}

interface CaseSpec {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  priceCoins: number;
  category: 'featured' | 'budget' | 'premium' | 'special';
  isFeatured: boolean;
  sortOrder: number;
  filter: (s: ByMykelSkin) => boolean;
}

// 5 starter TOROS kasası. byMykel skin pool'undan filtre ile beslenirler.
const CASE_SPECS: CaseSpec[] = [
  {
    name: 'Toros Başlangıç Kasası',
    slug: 'toros-baslangic',
    description: 'Yeni başlayanlar için popüler tüfek ve tabanca skinleri.',
    imageUrl: '/images/cases/toros-baslangic.png',
    priceCoins: 100,
    category: 'budget',
    isFeatured: true,
    sortOrder: 1,
    // AK-47, M4A4, M4A1-S, AWP, USP-S, Glock, Desert Eagle
    filter: (s) => [7, 8, 9, 16, 60, 61, 4].includes(s.weapon?.weapon_id),
  },
  {
    name: 'Toros Premium Tüfek',
    slug: 'toros-premium-tufek',
    description: 'AK-47, M4 ve AWP koleksiyonundan üst seviye skinler.',
    imageUrl: '/images/cases/toros-premium.png',
    priceCoins: 500,
    category: 'premium',
    isFeatured: true,
    sortOrder: 2,
    filter: (s) => [7, 9, 16, 60].includes(s.weapon?.weapon_id),
  },
  {
    name: 'Toros Bıçak Kasası',
    slug: 'toros-bicak',
    description: 'Yüksek riskli ama bıçak şansı bu kasada artar.',
    imageUrl: '/images/cases/toros-bicak.png',
    priceCoins: 2000,
    category: 'special',
    isFeatured: true,
    sortOrder: 3,
    // Sadece bıçak defindexleri
    filter: (s) =>
      [500, 503, 505, 506, 507, 508, 509, 512, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 525].includes(
        s.weapon?.weapon_id
      ),
  },
  {
    name: 'Toros Eldiven Kasası',
    slug: 'toros-eldiven',
    description: 'Tüm eldiven koleksiyonundan rastgele drop.',
    imageUrl: '/images/cases/toros-eldiven.png',
    priceCoins: 1500,
    category: 'special',
    isFeatured: false,
    sortOrder: 4,
    // Glove defindexes
    filter: (s) =>
      [4725, 5027, 5030, 5031, 5032, 5033, 5034, 5035].includes(s.weapon?.weapon_id),
  },
  {
    name: 'Toros Tabanca Kasası',
    slug: 'toros-tabanca',
    description: 'Ekonomik tour: tüm tabanca skinlerinden uygun fiyatlı şans.',
    imageUrl: '/images/cases/toros-tabanca.png',
    priceCoins: 50,
    category: 'budget',
    isFeatured: false,
    sortOrder: 5,
    // USP-S, P2000, Glock, Desert Eagle, P250, Five-SeveN, Tec-9, CZ75-Auto, R8 Revolver, Dual Berettas
    filter: (s) => [61, 32, 4, 1, 36, 3, 30, 63, 64, 2].includes(s.weapon?.weapon_id),
  },
];

async function main() {
  console.log('🌱 Seeding TOROS Games database from byMykel...');

  console.log('  → byMykel skins.json çekiliyor...');
  const allSkins = await getSkins();
  console.log(`  → ${allSkins.length} skin alındı`);

  for (const spec of CASE_SPECS) {
    const pool = allSkins.filter((s) => spec.filter(s) && !!s.rarity?.id);
    console.log(`  → ${spec.name}: ${pool.length} skin pool'da`);

    const items = buildItemsFromSkins(pool);
    if (items.length === 0) {
      console.warn(`  ⚠ ${spec.name}: bucket eşleştirme ile item üretilmedi, atlanıyor`);
      continue;
    }

    // Upsert pattern: aynı seed tekrar çalışırsa duplicate olmasın
    const existing = await prisma.case.findUnique({ where: { slug: spec.slug } });
    if (existing) {
      // Mevcut item'ları sil, yeni pool ile yeniden oluştur
      await prisma.caseItem.deleteMany({ where: { caseId: existing.id } });
      await prisma.case.update({
        where: { id: existing.id },
        data: {
          name: spec.name,
          description: spec.description,
          imageUrl: spec.imageUrl,
          price: new Prisma.Decimal(spec.priceCoins),
          currency: 'COIN',
          category: spec.category,
          isFeatured: spec.isFeatured,
          sortOrder: spec.sortOrder,
          items: { create: items },
        },
      });
    } else {
      await prisma.case.create({
        data: {
          name: spec.name,
          slug: spec.slug,
          description: spec.description,
          imageUrl: spec.imageUrl,
          price: new Prisma.Decimal(spec.priceCoins),
          currency: 'COIN',
          houseEdge: new Prisma.Decimal(0.05),
          isActive: true,
          isFeatured: spec.isFeatured,
          category: spec.category,
          sortOrder: spec.sortOrder,
          items: { create: items },
        },
      });
    }
    console.log(`  ✓ ${spec.name}: ${items.length} item seeded`);
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
