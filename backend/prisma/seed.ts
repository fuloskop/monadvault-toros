import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample cases
  const cases = [
    {
      name: 'Starter Case',
      slug: 'starter-case',
      description: 'Perfect for beginners. Great odds and affordable price.',
      imageUrl: '/images/cases/starter.png',
      price: new Prisma.Decimal(1),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: true,
      category: 'budget',
      sortOrder: 1,
      items: [
        { name: 'Bronze Coin', imageUrl: '/images/items/bronze-coin.png', value: 0.1, rarity: 'common', probability: 0.40, color: '#9ca3af' },
        { name: 'Silver Coin', imageUrl: '/images/items/silver-coin.png', value: 0.5, rarity: 'common', probability: 0.30, color: '#9ca3af' },
        { name: 'Gold Coin', imageUrl: '/images/items/gold-coin.png', value: 1.2, rarity: 'uncommon', probability: 0.15, color: '#3b82f6' },
        { name: 'Platinum Coin', imageUrl: '/images/items/platinum-coin.png', value: 2.5, rarity: 'rare', probability: 0.10, color: '#8b5cf6' },
        { name: 'Diamond Coin', imageUrl: '/images/items/diamond-coin.png', value: 5, rarity: 'epic', probability: 0.04, color: '#d946ef' },
        { name: 'Mythic Coin', imageUrl: '/images/items/mythic-coin.png', value: 25, rarity: 'legendary', probability: 0.01, color: '#f59e0b' },
      ]
    },
    {
      name: 'Classic Case',
      slug: 'classic-case',
      description: 'The classic MonadVault experience.',
      imageUrl: '/images/cases/classic.png',
      price: new Prisma.Decimal(5),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: true,
      category: 'featured',
      sortOrder: 2,
      items: [
        { name: 'Common Crystal', imageUrl: '/images/items/common-crystal.png', value: 0.5, rarity: 'common', probability: 0.35, color: '#9ca3af' },
        { name: 'Uncommon Crystal', imageUrl: '/images/items/uncommon-crystal.png', value: 2.5, rarity: 'uncommon', probability: 0.30, color: '#3b82f6' },
        { name: 'Rare Crystal', imageUrl: '/images/items/rare-crystal.png', value: 5, rarity: 'rare', probability: 0.20, color: '#8b5cf6' },
        { name: 'Epic Crystal', imageUrl: '/images/items/epic-crystal.png', value: 10, rarity: 'epic', probability: 0.10, color: '#d946ef' },
        { name: 'Legendary Crystal', imageUrl: '/images/items/legendary-crystal.png', value: 25, rarity: 'legendary', probability: 0.04, color: '#f59e0b' },
        { name: 'Mythic Crystal', imageUrl: '/images/items/mythic-crystal.png', value: 100, rarity: 'mythic', probability: 0.01, color: '#ef4444' },
      ]
    },
    {
      name: 'Premium Case',
      slug: 'premium-case',
      description: 'High stakes, high rewards. Not for the faint of heart.',
      imageUrl: '/images/cases/premium.png',
      price: new Prisma.Decimal(25),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: true,
      category: 'premium',
      sortOrder: 3,
      items: [
        { name: 'Ruby Gem', imageUrl: '/images/items/ruby-gem.png', value: 2.5, rarity: 'common', probability: 0.35, color: '#9ca3af' },
        { name: 'Sapphire Gem', imageUrl: '/images/items/sapphire-gem.png', value: 12.5, rarity: 'uncommon', probability: 0.30, color: '#3b82f6' },
        { name: 'Emerald Gem', imageUrl: '/images/items/emerald-gem.png', value: 25, rarity: 'rare', probability: 0.20, color: '#8b5cf6' },
        { name: 'Amethyst Gem', imageUrl: '/images/items/amethyst-gem.png', value: 50, rarity: 'epic', probability: 0.10, color: '#d946ef' },
        { name: 'Star Sapphire', imageUrl: '/images/items/star-sapphire.png', value: 125, rarity: 'legendary', probability: 0.04, color: '#f59e0b' },
        { name: 'Cosmic Diamond', imageUrl: '/images/items/cosmic-diamond.png', value: 500, rarity: 'mythic', probability: 0.01, color: '#ef4444' },
      ]
    },
    {
      name: 'Budget Bonanza',
      slug: 'budget-bonanza',
      description: 'Maximum fun at minimum cost!',
      imageUrl: '/images/cases/budget.png',
      price: new Prisma.Decimal(0.5),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: false,
      category: 'budget',
      sortOrder: 4,
      items: [
        { name: 'Copper Shard', imageUrl: '/images/items/copper-shard.png', value: 0.05, rarity: 'common', probability: 0.45, color: '#9ca3af' },
        { name: 'Iron Shard', imageUrl: '/images/items/iron-shard.png', value: 0.25, rarity: 'common', probability: 0.30, color: '#9ca3af' },
        { name: 'Steel Shard', imageUrl: '/images/items/steel-shard.png', value: 0.75, rarity: 'uncommon', probability: 0.15, color: '#3b82f6' },
        { name: 'Titanium Shard', imageUrl: '/images/items/titanium-shard.png', value: 2, rarity: 'rare', probability: 0.07, color: '#8b5cf6' },
        { name: 'Obsidian Shard', imageUrl: '/images/items/obsidian-shard.png', value: 5, rarity: 'epic', probability: 0.025, color: '#d946ef' },
        { name: 'Void Shard', imageUrl: '/images/items/void-shard.png', value: 15, rarity: 'legendary', probability: 0.005, color: '#f59e0b' },
      ]
    },
    {
      name: 'Whale Case',
      slug: 'whale-case',
      description: 'For the biggest players only. Massive rewards await.',
      imageUrl: '/images/cases/whale.png',
      price: new Prisma.Decimal(100),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: true,
      category: 'premium',
      sortOrder: 5,
      items: [
        { name: 'Gold Bar', imageUrl: '/images/items/gold-bar.png', value: 10, rarity: 'common', probability: 0.35, color: '#9ca3af' },
        { name: 'Platinum Bar', imageUrl: '/images/items/platinum-bar.png', value: 50, rarity: 'uncommon', probability: 0.30, color: '#3b82f6' },
        { name: 'Diamond Bar', imageUrl: '/images/items/diamond-bar.png', value: 100, rarity: 'rare', probability: 0.20, color: '#8b5cf6' },
        { name: 'Rainbow Bar', imageUrl: '/images/items/rainbow-bar.png', value: 250, rarity: 'epic', probability: 0.10, color: '#d946ef' },
        { name: 'Cosmic Bar', imageUrl: '/images/items/cosmic-bar.png', value: 500, rarity: 'legendary', probability: 0.04, color: '#f59e0b' },
        { name: 'Infinity Bar', imageUrl: '/images/items/infinity-bar.png', value: 2500, rarity: 'mythic', probability: 0.01, color: '#ef4444' },
      ]
    },
    {
      name: 'Mystery Box',
      slug: 'mystery-box',
      description: 'What secrets lie within? Only one way to find out.',
      imageUrl: '/images/cases/mystery.png',
      price: new Prisma.Decimal(10),
      currency: 'MON',
      houseEdge: new Prisma.Decimal(0.05),
      isActive: true,
      isFeatured: false,
      category: 'special',
      sortOrder: 6,
      items: [
        { name: 'Mystery Token', imageUrl: '/images/items/mystery-token.png', value: 1, rarity: 'common', probability: 0.40, color: '#9ca3af' },
        { name: 'Enigma Token', imageUrl: '/images/items/enigma-token.png', value: 5, rarity: 'uncommon', probability: 0.28, color: '#3b82f6' },
        { name: 'Cipher Token', imageUrl: '/images/items/cipher-token.png', value: 15, rarity: 'rare', probability: 0.18, color: '#8b5cf6' },
        { name: 'Riddle Token', imageUrl: '/images/items/riddle-token.png', value: 30, rarity: 'epic', probability: 0.09, color: '#d946ef' },
        { name: 'Puzzle Token', imageUrl: '/images/items/puzzle-token.png', value: 75, rarity: 'legendary', probability: 0.04, color: '#f59e0b' },
        { name: 'Paradox Token', imageUrl: '/images/items/paradox-token.png', value: 250, rarity: 'mythic', probability: 0.01, color: '#ef4444' },
      ]
    },
  ];

  for (const caseData of cases) {
    const { items, ...caseInfo } = caseData;
    
    const createdCase = await prisma.case.upsert({
      where: { slug: caseInfo.slug },
      update: caseInfo,
      create: caseInfo,
    });

    // Create items for this case
    for (const item of items) {
      await prisma.caseItem.upsert({
        where: {
          id: `${createdCase.id}-${item.name.toLowerCase().replace(/\s/g, '-')}`
        },
        update: {
          ...item,
          value: new Prisma.Decimal(item.value),
          probability: new Prisma.Decimal(item.probability),
        },
        create: {
          id: `${createdCase.id}-${item.name.toLowerCase().replace(/\s/g, '-')}`,
          caseId: createdCase.id,
          ...item,
          value: new Prisma.Decimal(item.value),
          probability: new Prisma.Decimal(item.probability),
        },
      });
    }

    console.log(`✅ Created case: ${caseInfo.name}`);
  }

  // Create sample promocode
  await prisma.promocode.upsert({
    where: { code: 'WELCOME' },
    update: {},
    create: {
      code: 'WELCOME',
      type: 'balance',
      value: new Prisma.Decimal(1),
      currency: 'MON',
      maxUses: 1000,
      isActive: true,
    },
  });

  console.log('✅ Created promocode: WELCOME');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

