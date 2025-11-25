'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { casesApi } from '@/lib/api';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { formatCurrency, getRarityColor, sleep } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CaseItem {
  id: string;
  name: string;
  imageUrl: string;
  value: number;
  rarity: string;
  color: string;
  probability: number;
}

interface CaseData {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  items: CaseItem[];
}

interface OpenResult {
  item: CaseItem;
  caseOpenId: string;
  roll: number;
}

const ITEM_WIDTH = 180;
const VISIBLE_ITEMS = 7;

export default function CaseOpenPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { isAuthenticated, token } = useUserStore();
  const { balances, deductBalance, addBalance } = useBalanceStore();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [openCount, setOpenCount] = useState(1);
  const [results, setResults] = useState<OpenResult[]>([]);
  const [spinOffset, setSpinOffset] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Load case data
  useEffect(() => {
    loadCase();
  }, [slug]);

  const loadCase = async () => {
    try {
      const data = await casesApi.getBySlug(slug);
      setCaseData(data);
    } catch (error) {
      console.error('Failed to load case:', error);
      toast.error('Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate extended items for spinner
  const generateSpinnerItems = useCallback(() => {
    if (!caseData) return [];
    
    const items: CaseItem[] = [];
    // Generate weighted items based on probability
    for (let i = 0; i < 100; i++) {
      const roll = Math.random();
      let cumulative = 0;
      for (const item of caseData.items) {
        cumulative += item.probability;
        if (roll < cumulative) {
          items.push(item);
          break;
        }
      }
    }
    return items;
  }, [caseData]);

  const [spinnerItems, setSpinnerItems] = useState<CaseItem[]>([]);

  useEffect(() => {
    setSpinnerItems(generateSpinnerItems());
  }, [caseData, generateSpinnerItems]);

  const openCase = useCallback(async () => {
    if (!token || !caseData || isSpinning) return;
    
    const totalCost = caseData.price * openCount;
    if (totalCost > (balances['MON'] || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setResults([]);

    try {
      // Deduct balance immediately
      deductBalance('MON', totalCost);

      // Call API
      const openResults = await casesApi.open(token, slug, openCount);

      // Find winning item index in spinner
      const winningItem = openResults[0].item;
      const winningIndex = spinnerItems.findIndex((item, idx) => 
        idx > 30 && item.id === winningItem.id
      );

      // Calculate spin offset
      const centerOffset = (VISIBLE_ITEMS * ITEM_WIDTH) / 2 - ITEM_WIDTH / 2;
      const baseOffset = winningIndex * ITEM_WIDTH;
      const randomOffset = (Math.random() - 0.5) * ITEM_WIDTH * 0.3;
      const finalOffset = baseOffset - centerOffset + randomOffset;

      // Animate spin
      setSpinOffset(finalOffset);

      // Wait for animation
      await sleep(4000);

      // Show result
      setResults(openResults);
      setShowResult(true);

      // Add winnings
      const totalWin = openResults.reduce((sum, r) => sum + r.item.value, 0);
      addBalance('MON', totalWin);

      // Show toast based on rarity
      const bestItem = openResults.reduce((best, r) => 
        r.item.value > best.item.value ? r : best
      , openResults[0]);
      
      if (bestItem.item.rarity === 'mythic' || bestItem.item.rarity === 'legendary') {
        toast.success(`🎉 JACKPOT! Won ${bestItem.item.name}!`);
      } else if (bestItem.item.value > caseData.price) {
        toast.success(`Won ${bestItem.item.name}!`);
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to open case');
      // Refund on error
      addBalance('MON', totalCost);
    } finally {
      setIsSpinning(false);
    }
  }, [token, caseData, openCount, balances, spinnerItems, slug, deductBalance, addBalance]);

  const resetSpin = () => {
    setSpinOffset(0);
    setShowResult(false);
    setResults([]);
    setSpinnerItems(generateSpinnerItems());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Case not found</h1>
        <p className="text-text-secondary">This case doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold mb-2">{caseData.name}</h1>
        <p className="text-text-secondary">{caseData.description}</p>
      </div>

      {/* Spinner */}
      <Card className="overflow-hidden">
        <div className="relative py-8 bg-gradient-to-b from-bg-tertiary to-bg-secondary">
          {/* Center indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary-500 z-10" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-primary-500 z-10" />
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary-500/30 z-10" />

          {/* Gradient overlays */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg-secondary to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg-secondary to-transparent z-10" />

          {/* Items container */}
          <div 
            className="flex justify-center overflow-hidden"
            style={{ width: '100%' }}
          >
            <motion.div
              className="flex"
              animate={{ x: -spinOffset }}
              transition={{
                duration: isSpinning ? 4 : 0.5,
                ease: isSpinning ? [0.15, 0.85, 0.35, 1.0] : 'easeOut',
              }}
              style={{ willChange: 'transform' }}
            >
              {spinnerItems.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  className="flex-shrink-0 p-2"
                  style={{ width: ITEM_WIDTH }}
                >
                  <div
                    className={cn(
                      'relative rounded-xl overflow-hidden border-2 transition-all duration-300 h-40',
                      'flex flex-col items-center justify-center p-4',
                      showResult && results[0]?.item.id === item.id && 'ring-4 ring-primary-500 shadow-glow-primary'
                    )}
                    style={{
                      borderColor: item.color,
                      background: `linear-gradient(135deg, ${item.color}10, ${item.color}30)`,
                    }}
                  >
                    <div className="text-4xl mb-2">💎</div>
                    <div className="text-sm font-medium text-white text-center line-clamp-1">
                      {item.name}
                    </div>
                    <div
                      className="text-lg font-bold font-mono"
                      style={{ color: item.color }}
                    >
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Result Display */}
      <AnimatePresence>
        {showResult && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-lg text-text-secondary mb-2">You won</div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: results[0].item.color }}
                >
                  {results[0].item.name}
                </div>
                <div className="text-2xl font-mono font-bold text-primary-400">
                  {formatCurrency(results[0].item.value)} MON
                </div>
                <div className="mt-4 text-sm text-text-muted">
                  {results[0].item.value > caseData.price ? (
                    <span className="text-success-400">
                      +{formatCurrency(results[0].item.value - caseData.price)} profit!
                    </span>
                  ) : (
                    <span className="text-danger-400">
                      -{formatCurrency(caseData.price - results[0].item.value)} loss
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Open:</span>
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setOpenCount(count)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-semibold transition-colors',
                    openCount === count
                      ? 'bg-primary-500 text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-white'
                  )}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-text-secondary">Total Cost</div>
              <div className="font-mono font-bold text-white">
                {formatCurrency(caseData.price * openCount)} MON
              </div>
            </div>

            {showResult ? (
              <Button onClick={resetSpin} size="lg">
                Open Again
              </Button>
            ) : (
              <Button
                onClick={openCase}
                disabled={!isAuthenticated || isSpinning || (caseData.price * openCount) > (balances['MON'] || 0)}
                isLoading={isSpinning}
                size="lg"
              >
                {isSpinning ? 'Opening...' : 'Open Case'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardContent>
          <h3 className="font-display text-lg font-semibold mb-4">Case Contents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {caseData.items
              .sort((a, b) => b.value - a.value)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border"
                  style={{
                    borderColor: item.color,
                    background: `linear-gradient(135deg, ${item.color}05, ${item.color}15)`,
                  }}
                >
                  <div className="text-center mb-2">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div className="text-sm font-medium text-white text-center line-clamp-1">
                    {item.name}
                  </div>
                  <div
                    className="text-sm font-mono font-bold text-center"
                    style={{ color: item.color }}
                  >
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-text-muted text-center mt-1">
                    {(item.probability * 100).toFixed(2)}%
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

