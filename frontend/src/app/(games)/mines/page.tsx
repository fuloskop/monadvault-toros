'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { gamesApi } from '@/lib/api';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { calculateMinesMultiplier, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MinesGame {
  gameId: string;
  mineCount: number;
  betAmount: number;
  currency: string;
  revealed: number[];
  status: 'active' | 'won' | 'lost';
  currentMultiplier: number;
  minePositions?: number[];
  serverSeedHash?: string;
}

export default function MinesPage() {
  const { isAuthenticated, token } = useUserStore();
  const { balances, deductBalance, addBalance } = useBalanceStore();

  const [game, setGame] = useState<MinesGame | null>(null);
  const [betAmount, setBetAmount] = useState(1);
  const [mineCount, setMineCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const safeTiles = 25 - mineCount;
  const nextMultiplier = game 
    ? calculateMinesMultiplier(game.mineCount, game.revealed.length + 1)
    : calculateMinesMultiplier(mineCount, 1);

  const startGame = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    if (betAmount > (balances['COIN'] || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const result = await gamesApi.startMines(token, betAmount, mineCount);
      setGame({
        gameId: result.gameId,
        mineCount: result.mineCount,
        betAmount,
        currency: result.currency,
        revealed: [],
        status: 'active',
        currentMultiplier: 1,
        serverSeedHash: result.serverSeedHash,
      });
      deductBalance('COIN', betAmount);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, betAmount, mineCount, balances, deductBalance]);

  const revealTile = useCallback(async (position: number) => {
    if (!token || !game || game.status !== 'active') return;
    if (game.revealed.includes(position)) return;

    setIsLoading(true);
    try {
      const result = await gamesApi.revealTile(token, position);
      
      if (result.isMine) {
        // Hit a mine
        setGame((prev) => prev ? {
          ...prev,
          revealed: [...prev.revealed, position],
          status: 'lost',
          minePositions: result.minePositions,
        } : null);
        toast.error('💥 BOOM! You hit a mine!');
      } else {
        // Safe tile
        setGame((prev) => prev ? {
          ...prev,
          revealed: [...prev.revealed, position],
          currentMultiplier: result.multiplier,
          status: result.status,
          minePositions: result.status === 'won' ? result.minePositions : undefined,
        } : null);

        if (result.status === 'won') {
          addBalance('COIN', result.winAmount);
          toast.success(`🎉 You won ${formatCurrency(result.winAmount)} MON!`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reveal tile');
    } finally {
      setIsLoading(false);
    }
  }, [token, game, addBalance]);

  const cashout = useCallback(async () => {
    if (!token || !game || game.status !== 'active') return;
    if (game.revealed.length === 0) {
      toast.error('Reveal at least one tile first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await gamesApi.cashoutMines(token);
      setGame((prev) => prev ? {
        ...prev,
        status: 'won',
        minePositions: result.minePositions,
      } : null);
      addBalance('COIN', result.winAmount);
      toast.success(`🎉 Cashed out ${formatCurrency(result.winAmount)} MON!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cashout');
    } finally {
      setIsLoading(false);
    }
  }, [token, game, addBalance]);

  const resetGame = () => {
    setGame(null);
  };

  const getTileContent = (position: number) => {
    const isRevealed = game?.revealed.includes(position);
    const isMine = game?.minePositions?.includes(position);

    if (game?.status === 'lost' || game?.status === 'won') {
      if (isMine) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl"
          >
            💣
          </motion.div>
        );
      }
      if (isRevealed) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl"
          >
            💎
          </motion.div>
        );
      }
      return null;
    }

    if (isRevealed) {
      return (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-3xl"
        >
          💎
        </motion.div>
      );
    }

    return null;
  };

  const getTileClass = (position: number) => {
    const isRevealed = game?.revealed.includes(position);
    const isMine = game?.minePositions?.includes(position);

    if (game?.status === 'lost' || game?.status === 'won') {
      if (isMine) {
        return 'bg-danger-500/20 border-danger-500';
      }
      if (isRevealed) {
        return 'bg-success-500/20 border-success-500';
      }
      return 'bg-bg-tertiary border-white/10';
    }

    if (isRevealed) {
      return 'bg-success-500/20 border-success-500';
    }

    return 'bg-bg-tertiary border-white/10 hover:bg-bg-elevated hover:border-primary-500/50 cursor-pointer';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Mines</h1>
        <p className="text-text-secondary">
          Reveal tiles to increase your multiplier. Avoid the mines!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardContent className="space-y-4">
            {!game ? (
              <>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Bet Amount</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    min={0.01}
                    step={0.1}
                    className="font-mono"
                  />
                  <div className="flex gap-1 mt-2">
                    {[0.5, 2].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setBetAmount((prev) => prev * mult)}
                        className="flex-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
                      >
                        {mult < 1 ? '½' : '2x'}
                      </button>
                    ))}
                    <button
                      onClick={() => setBetAmount(balances['COIN'] || 0)}
                      className="flex-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Mines: {mineCount}
                  </label>
                  <input
                    type="range"
                    value={mineCount}
                    onChange={(e) => setMineCount(parseInt(e.target.value))}
                    min={1}
                    max={24}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>1</span>
                    <span>24</span>
                  </div>
                </div>

                <div className="p-4 bg-bg-tertiary rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Safe Tiles</span>
                    <span className="text-white font-mono">{safeTiles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">First Tile</span>
                    <span className="text-primary-400 font-mono">
                      {calculateMinesMultiplier(mineCount, 1).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Max Win</span>
                    <span className="text-success-400 font-mono">
                      {calculateMinesMultiplier(mineCount, safeTiles).toFixed(2)}x
                    </span>
                  </div>
                </div>

                <Button
                  onClick={startGame}
                  disabled={!isAuthenticated || isLoading || betAmount > (balances['COIN'] || 0)}
                  isLoading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  Start Game
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 bg-bg-tertiary rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Bet</span>
                    <span className="text-white font-mono">
                      {formatCurrency(game.betAmount)} MON
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Mines</span>
                    <span className="text-white font-mono">{game.mineCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Revealed</span>
                    <span className="text-white font-mono">{game.revealed.length}</span>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-sm text-text-secondary mb-1">Current</div>
                  <div className="text-4xl font-bold font-mono text-primary-400">
                    {game.currentMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-sm text-text-muted mt-1">
                    = {formatCurrency(game.betAmount * game.currentMultiplier)} MON
                  </div>
                </div>

                {game.status === 'active' && (
                  <div className="text-center p-3 bg-success-500/10 border border-success-500/30 rounded-xl">
                    <div className="text-sm text-success-400 mb-1">Next tile</div>
                    <div className="text-2xl font-bold font-mono text-success-400">
                      {nextMultiplier.toFixed(2)}x
                    </div>
                  </div>
                )}

                {game.status === 'active' ? (
                  <Button
                    onClick={cashout}
                    disabled={game.revealed.length === 0 || isLoading}
                    isLoading={isLoading}
                    variant="success"
                    className="w-full"
                    size="lg"
                  >
                    Cashout {formatCurrency(game.betAmount * game.currentMultiplier)} MON
                  </Button>
                ) : (
                  <Button
                    onClick={resetGame}
                    className="w-full"
                    size="lg"
                  >
                    Play Again
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Game Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {Array(25).fill(0).map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => revealTile(i)}
                    disabled={
                      !game ||
                      game.status !== 'active' ||
                      game.revealed.includes(i) ||
                      isLoading
                    }
                    whileHover={game?.status === 'active' && !game.revealed.includes(i) ? { scale: 1.05 } : {}}
                    whileTap={game?.status === 'active' && !game.revealed.includes(i) ? { scale: 0.95 } : {}}
                    className={cn(
                      'aspect-square rounded-xl border-2 flex items-center justify-center',
                      'transition-all duration-200',
                      getTileClass(i),
                      !game && 'bg-bg-tertiary border-white/5 cursor-default'
                    )}
                  >
                    {getTileContent(i)}
                  </motion.button>
                ))}
              </div>

              {/* Result Banner */}
              <AnimatePresence>
                {game?.status === 'lost' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4 p-4 bg-danger-500/20 border border-danger-500/30 rounded-xl text-center"
                  >
                    <div className="text-2xl font-bold text-danger-400">💥 BOOM!</div>
                    <div className="text-danger-300">
                      You lost {formatCurrency(game.betAmount)} MON
                    </div>
                  </motion.div>
                )}

                {game?.status === 'won' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4 p-4 bg-success-500/20 border border-success-500/30 rounded-xl text-center"
                  >
                    <div className="text-2xl font-bold text-success-400">🎉 YOU WON!</div>
                    <div className="text-success-300">
                      {formatCurrency(game.betAmount * game.currentMultiplier)} MON @ {game.currentMultiplier.toFixed(2)}x
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

