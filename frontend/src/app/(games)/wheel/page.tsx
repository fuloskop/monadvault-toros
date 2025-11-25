'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { gamesApi } from '@/lib/api';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface WheelSegment {
  index: number;
  multiplier: number;
  color: string;
}

const SEGMENTS: WheelSegment[] = [
  { index: 0, multiplier: 0, color: '#1a1a26' },
  { index: 1, multiplier: 0.2, color: '#3b82f6' },
  { index: 2, multiplier: 0.5, color: '#22c55e' },
  { index: 3, multiplier: 1.2, color: '#eab308' },
  { index: 4, multiplier: 0.2, color: '#3b82f6' },
  { index: 5, multiplier: 0.5, color: '#22c55e' },
  { index: 6, multiplier: 1.5, color: '#f97316' },
  { index: 7, multiplier: 0.2, color: '#3b82f6' },
  { index: 8, multiplier: 0.5, color: '#22c55e' },
  { index: 9, multiplier: 1.2, color: '#eab308' },
  { index: 10, multiplier: 2, color: '#ef4444' },
  { index: 11, multiplier: 0.2, color: '#3b82f6' },
  { index: 12, multiplier: 0.5, color: '#22c55e' },
  { index: 13, multiplier: 1.2, color: '#eab308' },
  { index: 14, multiplier: 0.2, color: '#3b82f6' },
  { index: 15, multiplier: 3, color: '#a855f7' },
  { index: 16, multiplier: 0.5, color: '#22c55e' },
  { index: 17, multiplier: 1.2, color: '#eab308' },
  { index: 18, multiplier: 0.2, color: '#3b82f6' },
  { index: 19, multiplier: 0.5, color: '#22c55e' },
  { index: 20, multiplier: 5, color: '#ec4899' },
  { index: 21, multiplier: 1.2, color: '#eab308' },
  { index: 22, multiplier: 0.2, color: '#3b82f6' },
  { index: 23, multiplier: 0.5, color: '#22c55e' },
  { index: 24, multiplier: 1.5, color: '#f97316' },
  { index: 25, multiplier: 0.2, color: '#3b82f6' },
  { index: 26, multiplier: 1.2, color: '#eab308' },
  { index: 27, multiplier: 0.5, color: '#22c55e' },
  { index: 28, multiplier: 2, color: '#ef4444' },
  { index: 29, multiplier: 0.2, color: '#3b82f6' },
  { index: 30, multiplier: 50, color: '#00e5f0' },
  { index: 31, multiplier: 0.5, color: '#22c55e' },
  { index: 32, multiplier: 1.2, color: '#eab308' },
  { index: 33, multiplier: 0.2, color: '#3b82f6' },
  { index: 34, multiplier: 1.5, color: '#f97316' },
  { index: 35, multiplier: 0.5, color: '#22c55e' },
  { index: 36, multiplier: 1.2, color: '#eab308' },
  { index: 37, multiplier: 0.2, color: '#3b82f6' },
  { index: 38, multiplier: 3, color: '#a855f7' },
  { index: 39, multiplier: 0.5, color: '#22c55e' },
  { index: 40, multiplier: 1.2, color: '#eab308' },
  { index: 41, multiplier: 0.2, color: '#3b82f6' },
  { index: 42, multiplier: 2, color: '#ef4444' },
  { index: 43, multiplier: 0.5, color: '#22c55e' },
  { index: 44, multiplier: 1.5, color: '#f97316' },
  { index: 45, multiplier: 0.2, color: '#3b82f6' },
  { index: 46, multiplier: 1.2, color: '#eab308' },
  { index: 47, multiplier: 0.5, color: '#22c55e' },
  { index: 48, multiplier: 5, color: '#ec4899' },
  { index: 49, multiplier: 1.2, color: '#eab308' },
];

export default function WheelPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { isAuthenticated, token } = useUserStore();
  const { balances, deductBalance, addBalance } = useBalanceStore();

  const [betAmount, setBetAmount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ segment: number; multiplier: number; winAmount: number } | null>(null);
  const [history, setHistory] = useState<{ multiplier: number; color: string }[]>([]);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 10;
    const segmentAngle = (2 * Math.PI) / SEGMENTS.length;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw segments
    SEGMENTS.forEach((segment, i) => {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      const textAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.75;
      const x = center + Math.cos(textAngle) * textRadius;
      const y = center + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = segment.multiplier === 0 ? '#666' : '#fff';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(segment.multiplier === 0 ? 'BUST' : `${segment.multiplier}x`, 0, 0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = '#00e5f0';
    ctx.lineWidth = 3;
    ctx.stroke();

  }, []);

  const spin = useCallback(async () => {
    if (!token || !isAuthenticated || isSpinning) return;
    if (betAmount > (balances['MON'] || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSpinning(true);
    setResult(null);
    deductBalance('MON', betAmount);

    try {
      const response = await gamesApi.spinWheel(token, betAmount);

      // Calculate target rotation
      const segmentAngle = 360 / SEGMENTS.length;
      const targetSegmentAngle = response.segment * segmentAngle;
      const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.5;
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const targetRotation = rotation + spins * 360 + (360 - targetSegmentAngle) + randomOffset;

      setRotation(targetRotation);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Show result
      setResult({
        segment: response.segment,
        multiplier: response.multiplier,
        winAmount: response.winAmount,
      });

      // Add winnings
      addBalance('MON', response.winAmount);

      // Update history
      const segment = SEGMENTS[response.segment];
      setHistory((prev) => [
        { multiplier: response.multiplier, color: segment?.color || '#1a1a26' },
        ...prev.slice(0, 19),
      ]);

      if (response.multiplier >= 5) {
        toast.success(`🎉 Big win! ${response.multiplier}x`);
      } else if (response.multiplier > 1) {
        toast.success(`Won ${formatCurrency(response.winAmount)} MON!`);
      } else if (response.multiplier === 0) {
        toast.error('BUST! Better luck next time');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to spin');
      addBalance('MON', betAmount);
    } finally {
      setIsSpinning(false);
    }
  }, [token, isAuthenticated, isSpinning, betAmount, balances, rotation, deductBalance, addBalance]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Wheel of Fortune</h1>
        <p className="text-text-secondary">
          Spin the wheel and test your luck!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="relative flex justify-center">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-primary-500 filter drop-shadow-lg" />
              </div>

              {/* Wheel Container */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{
                  duration: isSpinning ? 5 : 0,
                  ease: [0.2, 0.8, 0.3, 1],
                }}
                style={{ transformOrigin: 'center center' }}
              >
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={350}
                  className="max-w-full"
                />
              </motion.div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, transparent 60%, rgba(0, 229, 240, 0.1) 100%)',
              }} />
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-center"
                >
                  <div className={cn(
                    'text-4xl font-bold font-mono',
                    result.multiplier === 0 ? 'text-danger-400' :
                    result.multiplier >= 5 ? 'text-warning-400' :
                    result.multiplier >= 2 ? 'text-success-400' :
                    'text-primary-400'
                  )}>
                    {result.multiplier === 0 ? 'BUST' : `${result.multiplier}x`}
                  </div>
                  <div className="text-text-secondary mt-1">
                    {result.multiplier === 0 ? 'Lost' : `Won ${formatCurrency(result.winAmount)} MON`}
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
                  disabled={isSpinning}
                />
                <div className="flex gap-1 mt-2">
                  {[0.5, 2].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setBetAmount((prev) => prev * mult)}
                      disabled={isSpinning}
                      className="flex-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors disabled:opacity-50"
                    >
                      {mult < 1 ? '½' : '2x'}
                    </button>
                  ))}
                  <button
                    onClick={() => setBetAmount(balances['MON'] || 0)}
                    disabled={isSpinning}
                    className="flex-1 px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <Button
                onClick={spin}
                disabled={!isAuthenticated || isSpinning || betAmount > (balances['MON'] || 0)}
                isLoading={isSpinning}
                className="w-full"
                size="lg"
              >
                {isSpinning ? 'Spinning...' : `Spin for ${formatCurrency(betAmount)} MON`}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <h3 className="font-display font-semibold">Recent Spins</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 rounded-lg font-mono text-sm font-semibold"
                    style={{
                      backgroundColor: `${item.color}30`,
                      color: item.color,
                      borderColor: item.color,
                    }}
                  >
                    {item.multiplier === 0 ? 'BUST' : `${item.multiplier}x`}
                  </motion.div>
                ))}
                {history.length === 0 && (
                  <div className="text-text-muted text-sm">No spins yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multiplier Legend */}
          <Card>
            <CardHeader>
              <h3 className="font-display font-semibold">Multipliers</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { mult: '50x', color: '#00e5f0', label: 'Jackpot' },
                  { mult: '5x', color: '#ec4899', label: 'Pink' },
                  { mult: '3x', color: '#a855f7', label: 'Purple' },
                  { mult: '2x', color: '#ef4444', label: 'Red' },
                  { mult: '1.5x', color: '#f97316', label: 'Orange' },
                  { mult: '1.2x', color: '#eab308', label: 'Yellow' },
                  { mult: '0.5x', color: '#22c55e', label: 'Green' },
                  { mult: '0.2x', color: '#3b82f6', label: 'Blue' },
                  { mult: 'BUST', color: '#1a1a26', label: 'Black' },
                ].map((item) => (
                  <div
                    key={item.mult}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-mono">{item.mult}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

