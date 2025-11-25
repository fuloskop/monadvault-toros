'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { gamesApi } from '@/lib/api';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { formatCurrency, calculateWinChance } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function UpgraderPage() {
  const { isAuthenticated, token } = useUserStore();
  const { balances, deductBalance, addBalance } = useBalanceStore();

  const [betAmount, setBetAmount] = useState(1);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{
    isWin: boolean;
    multiplier: number;
    winAmount: number;
    roll: number;
    winChance: number;
  } | null>(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [history, setHistory] = useState<{ isWin: boolean; multiplier: number }[]>([]);

  const winChance = calculateWinChance(targetMultiplier);
  const potentialWin = betAmount * targetMultiplier;

  const play = useCallback(async () => {
    if (!token || !isAuthenticated || isPlaying) return;
    if (betAmount > (balances['MON'] || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlaying(true);
    setResult(null);
    deductBalance('MON', betAmount);

    try {
      const response = await gamesApi.playUpgrader(token, betAmount, targetMultiplier);

      // Calculate spin angle
      const winZoneAngle = (winChance / 100) * 360;
      const targetAngle = response.isWin
        ? Math.random() * winZoneAngle // Land in win zone
        : winZoneAngle + Math.random() * (360 - winZoneAngle); // Land outside

      const spins = 3 + Math.random() * 2;
      const finalAngle = spinAngle + spins * 360 + targetAngle;
      setSpinAngle(finalAngle);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setResult({
        isWin: response.isWin,
        multiplier: response.targetMultiplier,
        winAmount: response.winAmount || 0,
        roll: response.roll,
        winChance: response.winChance,
      });

      // Update history
      setHistory((prev) => [
        { isWin: response.isWin, multiplier: response.targetMultiplier },
        ...prev.slice(0, 19),
      ]);

      if (response.isWin) {
        addBalance('MON', response.winAmount);
        toast.success(`🎉 Upgraded! Won ${formatCurrency(response.winAmount)} MON!`);
      } else {
        toast.error('Failed to upgrade. Better luck next time!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to play');
      addBalance('MON', betAmount);
    } finally {
      setIsPlaying(false);
    }
  }, [token, isAuthenticated, isPlaying, betAmount, targetMultiplier, balances, winChance, spinAngle, deductBalance, addBalance]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Upgrader</h1>
        <p className="text-text-secondary">
          Risk it all for bigger rewards. Set your multiplier and spin!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="relative flex justify-center">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white filter drop-shadow-lg" />
              </div>

              {/* Wheel */}
              <motion.div
                className="relative w-80 h-80"
                animate={{ rotate: spinAngle }}
                transition={{
                  duration: isPlaying ? 3 : 0,
                  ease: [0.2, 0.8, 0.3, 1],
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Win zone */}
                  <path
                    d={describeArc(100, 100, 90, 0, winChance * 3.6)}
                    fill="#22c55e"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                  {/* Lose zone */}
                  <path
                    d={describeArc(100, 100, 90, winChance * 3.6, 360)}
                    fill="#ef4444"
                    stroke="#dc2626"
                    strokeWidth="2"
                  />
                  {/* Center circle */}
                  <circle cx="100" cy="100" r="40" fill="#0a0a0f" stroke="#00e5f0" strokeWidth="3" />
                  {/* Win chance text */}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fill="#00e5f0"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono"
                  >
                    {winChance.toFixed(2)}%
                  </text>
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="10"
                    fontFamily="Exo 2"
                  >
                    chance
                  </text>
                </svg>
              </motion.div>
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 text-center"
                >
                  <div className={cn(
                    'text-5xl font-bold font-display',
                    result.isWin ? 'text-success-400' : 'text-danger-400'
                  )}>
                    {result.isWin ? 'SUCCESS!' : 'FAILED'}
                  </div>
                  <div className="mt-2 text-text-secondary">
                    {result.isWin
                      ? `Won ${formatCurrency(result.winAmount)} MON at ${result.multiplier}x`
                      : `Lost ${formatCurrency(betAmount)} MON`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
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
                    onClick={() => setBetAmount(balances['MON'] || 0)}
                    className="flex-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Target Multiplier: {targetMultiplier.toFixed(2)}x
                </label>
                <input
                  type="range"
                  value={targetMultiplier}
                  onChange={(e) => setTargetMultiplier(parseFloat(e.target.value))}
                  min={1.01}
                  max={100}
                  step={0.01}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>1.01x</span>
                  <span>100x</span>
                </div>
              </div>

              <div className="p-4 bg-bg-tertiary rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Win Chance</span>
                  <span className={cn(
                    'font-mono font-semibold',
                    winChance > 50 ? 'text-success-400' :
                    winChance > 25 ? 'text-warning-400' : 'text-danger-400'
                  )}>
                    {winChance.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Potential Win</span>
                  <span className="text-primary-400 font-mono font-semibold">
                    {formatCurrency(potentialWin)} MON
                  </span>
                </div>
              </div>

              <Button
                onClick={play}
                disabled={!isAuthenticated || isPlaying || betAmount > (balances['MON'] || 0)}
                isLoading={isPlaying}
                className="w-full"
                size="lg"
              >
                {isPlaying ? 'Upgrading...' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Multipliers */}
          <Card>
            <CardHeader>
              <h3 className="font-display font-semibold">Quick Select</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[1.5, 2, 3, 5, 10, 25, 50, 75, 100].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setTargetMultiplier(mult)}
                    className={cn(
                      'py-2 rounded-lg font-mono font-semibold transition-colors',
                      targetMultiplier === mult
                        ? 'bg-primary-500 text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-white hover:bg-bg-elevated'
                    )}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <h3 className="font-display font-semibold">Recent Games</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-mono text-sm font-semibold',
                      item.isWin
                        ? 'bg-success-500/20 text-success-400'
                        : 'bg-danger-500/20 text-danger-400'
                    )}
                  >
                    {item.multiplier}x
                  </motion.div>
                ))}
                {history.length === 0 && (
                  <div className="text-text-muted text-sm">No games yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to draw arc for SVG
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

