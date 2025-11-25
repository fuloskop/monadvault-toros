'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { battlesApi } from '@/lib/api';
import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency, shortenAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BattleCase {
  case: {
    name: string;
    imageUrl: string;
    price: number;
  };
  quantity: number;
}

interface BattleParticipant {
  user: {
    id: string;
    username: string | null;
    avatar: string | null;
  } | null;
  slot: number;
  isBot: boolean;
  totalValue: number;
  isWinner: boolean;
}

interface Battle {
  id: string;
  creator: {
    id: string;
    username: string | null;
    avatar: string | null;
  };
  mode: string;
  totalCost: number;
  currency: string;
  isPrivate: boolean;
  cursedMode: boolean;
  status: string;
  cases: BattleCase[];
  participants: BattleParticipant[];
  createdAt: string;
}

export default function BattlesPage() {
  const { isAuthenticated, user } = useUserStore();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '1v1' | '2v2' | '1v1v1' | '1v1v1v1'>('all');

  useEffect(() => {
    loadBattles();
    const interval = setInterval(loadBattles, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBattles = async () => {
    try {
      const data = await battlesApi.getActive();
      setBattles(data);
    } catch (error) {
      console.error('Failed to load battles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBattles = filter === 'all'
    ? battles
    : battles.filter((b) => b.mode === filter);

  const getSlotCount = (mode: string): number => {
    return mode.split('v').reduce((sum, num) => sum + parseInt(num), 0);
  };

  const getEmptySlots = (battle: Battle): number => {
    const totalSlots = getSlotCount(battle.mode);
    return totalSlots - battle.participants.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Case Battles</h1>
          <p className="text-text-secondary">
            Compete against other players in real-time case battles
          </p>
        </div>

        <Link href="/battles/create">
          <Button
            size="lg"
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Battle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', '1v1', '2v2', '1v1v1', '1v1v1v1'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilter(mode)}
            className={cn(
              'px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap',
              filter === mode
                ? 'bg-primary-500 text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            )}
          >
            {mode === 'all' ? 'All Battles' : mode}
          </button>
        ))}
      </div>

      {/* Battle List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-bg-card animate-pulse" />
          ))}
        </div>
      ) : filteredBattles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-semibold mb-2">No Active Battles</h3>
            <p className="text-text-secondary mb-6">
              Be the first to create a battle and challenge other players!
            </p>
            <Link href="/battles/create">
              <Button>Create Battle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBattles.map((battle, index) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/battles/${battle.id}`}>
                <Card hover glow="primary" className="cursor-pointer">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-1 text-xs font-bold rounded',
                          battle.status === 'waiting' ? 'bg-warning-500/20 text-warning-400' :
                          battle.status === 'in_progress' ? 'bg-success-500/20 text-success-400' :
                          'bg-bg-tertiary text-text-muted'
                        )}>
                          {battle.status === 'waiting' ? 'WAITING' :
                           battle.status === 'in_progress' ? 'IN PROGRESS' : 'COMPLETED'}
                        </span>
                        <span className="px-2 py-1 text-xs font-bold bg-bg-tertiary rounded">
                          {battle.mode}
                        </span>
                        {battle.cursedMode && (
                          <span className="px-2 py-1 text-xs font-bold bg-secondary-500/20 text-secondary-400 rounded">
                            CURSED
                          </span>
                        )}
                        {battle.isPrivate && (
                          <span className="px-2 py-1 text-xs font-bold bg-bg-tertiary text-text-muted rounded">
                            🔒
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-primary-400">
                        {formatCurrency(battle.totalCost)} {battle.currency}
                      </div>
                    </div>

                    {/* Cases */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {battle.cases.map((bc, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 w-16 h-16 rounded-lg bg-bg-tertiary border border-white/5 flex items-center justify-center"
                        >
                          <span className="text-2xl">📦</span>
                        </div>
                      ))}
                    </div>

                    {/* Participants */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {battle.participants.map((p, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                              p.isBot
                                ? 'bg-bg-elevated border-text-muted'
                                : 'bg-gradient-to-br from-secondary-500 to-primary-500 border-bg-card'
                            )}
                          >
                            {p.isBot ? (
                              <span className="text-sm">🤖</span>
                            ) : p.user?.avatar ? (
                              <img src={p.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold">
                                {p.user?.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Empty slots */}
                        {Array(getEmptySlots(battle)).fill(0).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-bg-tertiary"
                          >
                            <span className="text-text-muted text-lg">+</span>
                          </div>
                        ))}
                      </div>

                      {battle.status === 'waiting' && getEmptySlots(battle) > 0 && (
                        <Button size="sm" variant="outline">
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Battles', value: battles.filter(b => b.status === 'waiting').length.toString() },
          { label: 'Total Value', value: formatCurrency(battles.reduce((sum, b) => sum + Number(b.totalCost), 0)) },
          { label: 'Players Ready', value: battles.reduce((sum, b) => sum + b.participants.length, 0).toString() },
          { label: 'Battles Today', value: '234' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <div className="font-mono text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

