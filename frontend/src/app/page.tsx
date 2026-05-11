'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { casesApi } from '@/lib/api';
import { formatCurrency, getRarityColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CaseItem {
  id: string;
  name: string;
  imageUrl: string;
  value: number;
  rarity: string;
  color: string;
  probability: number;
}

interface Case {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  category: string;
  isFeatured: boolean;
  items: CaseItem[];
  _count: { caseOpens: number };
}

export default function HomePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await casesApi.getAll();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', 'featured', 'budget', 'premium', 'special'];
  const filteredCases = activeCategory === 'all' 
    ? cases 
    : cases.filter(c => c.category === activeCategory || (activeCategory === 'featured' && c.isFeatured));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-tertiary to-bg-secondary border border-white/5">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        
        <div className="relative px-8 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Unlock Your </span>
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
                Fortune
              </span>
            </h1>
            <p className="text-lg text-text-secondary mb-6">
              Open provably fair cases, battle other players, and win big on the fastest blockchain casino.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/battles"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
              >
                Join a Battle
              </Link>
              <Link
                href="/crash"
                className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl font-semibold transition-all hover:bg-white/5"
              >
                Play Crash
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Wagered', value: '$1,234,567', icon: '💰' },
          { label: 'Active Players', value: '1,234', icon: '👥' },
          { label: 'Cases Opened', value: '56,789', icon: '📦' },
          { label: 'Biggest Win', value: '$45,678', icon: '🏆' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4 text-center">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <div className="font-mono text-xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-2 rounded-xl font-medium transition-all capitalize whitespace-nowrap',
              activeCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-white hover:bg-bg-elevated'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-bg-card animate-pulse" />
            ))
          : filteredCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/case/${caseItem.slug}`}>
                  <Card
                    hover
                    glow="primary"
                    className="group cursor-pointer overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square p-6 bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                      {caseItem.isFeatured && (
                        <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                          FEATURED
                        </span>
                      )}
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-32 h-32">
                          <div className="absolute inset-0 bg-primary-500/30 rounded-xl blur-xl group-hover:bg-primary-500/50 transition-all" />
                          <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-white/10 flex items-center justify-center">
                            <span className="text-4xl">📦</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                          {caseItem.name}
                        </h3>
                        <p className="text-sm text-text-muted line-clamp-1">
                          {caseItem.description}
                        </p>
                      </div>

                      {/* Items Preview */}
                      <div className="flex -space-x-2">
                        {caseItem.items.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs"
                            style={{
                              borderColor: getRarityColor(item.rarity),
                              backgroundColor: `${getRarityColor(item.rarity)}20`,
                            }}
                          >
                            💎
                          </div>
                        ))}
                        {caseItem.items.length > 5 && (
                          <div className="w-8 h-8 rounded-lg bg-bg-tertiary border border-white/10 flex items-center justify-center text-xs text-text-muted">
                            +{caseItem.items.length - 5}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-[10px] font-bold">T</span>
                          </div>
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(caseItem.price)}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {caseItem._count?.caseOpens?.toLocaleString() || 0} açılış
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
      </div>

      {/* Live Feed */}
      <Card className="p-6">
        <h2 className="font-display text-xl font-bold mb-4">Live Wins</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array(10).fill(0).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl min-w-[200px]"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center">
                <span className="text-sm font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">Anonymous</div>
                <div className="text-xs text-text-muted">Won 125.00 MON</div>
              </div>
              <div className="text-success-400 font-mono text-sm">+2.5x</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

