'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { socketClient } from '@/lib/socket';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CrashBet {
  odataId: string;
  username: string | null;
  amount: number;
  autoCashout?: number;
  status: 'active' | 'won' | 'lost';
  cashoutAt?: number;
}

interface CrashState {
  gameId: string;
  gameNumber: number;
  status: 'betting' | 'running' | 'crashed';
  multiplier: number;
  crashPoint?: number;
  serverSeedHash?: string;
  bettingEndsAt?: number;
  bets: CrashBet[];
}

export default function CrashPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const { isAuthenticated, token } = useUserStore();
  const { balances, deductBalance, addBalance } = useBalanceStore();

  const [gameState, setGameState] = useState<CrashState | null>(null);
  const [displayMultiplier, setDisplayMultiplier] = useState('1.00');
  const [betAmount, setBetAmount] = useState(1);
  const [autoCashout, setAutoCashout] = useState<number | undefined>(undefined);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [history, setHistory] = useState<{ crashPoint: number; gameNumber: number }[]>([]);
  const [countdown, setCountdown] = useState(0);

  // Connect to crash game
  useEffect(() => {
    const socket = socketClient.connect(token || undefined);
    socketClient.joinCrash();

    // Game state
    socket.on('crash:state', (state: any) => {
      setGameState({
        ...state,
        bets: state.bets || [],
      });
      if (state.status === 'running' && state.startTime) {
        startTimeRef.current = state.startTime;
      }
    });

    // New game
    socket.on('crash:new', (data: any) => {
      setGameState((prev) => ({
        ...prev!,
        gameId: data.gameId,
        gameNumber: data.gameNumber,
        status: 'betting',
        multiplier: 1,
        serverSeedHash: data.serverSeedHash,
        bettingEndsAt: data.bettingEndsAt,
        bets: [],
      }));
      setHasBet(false);
      setHasCashedOut(false);
      setDisplayMultiplier('1.00');
    });

    // Game started
    socket.on('crash:started', () => {
      setGameState((prev) => prev ? { ...prev, status: 'running' } : null);
      startTimeRef.current = Date.now();
    });

    // Multiplier tick
    socket.on('crash:tick', (data: { multiplier: number }) => {
      setDisplayMultiplier(data.multiplier.toFixed(2));
      setGameState((prev) => prev ? { ...prev, multiplier: data.multiplier } : null);
    });

    // Game crashed
    socket.on('crash:crashed', (data: { crashPoint: number; serverSeed: string }) => {
      setGameState((prev) => prev ? {
        ...prev,
        status: 'crashed',
        crashPoint: data.crashPoint,
      } : null);
      setDisplayMultiplier(data.crashPoint.toFixed(2));
      setHistory((prev) => [
        { crashPoint: data.crashPoint, gameNumber: gameState?.gameNumber || 0 },
        ...prev.slice(0, 19),
      ]);
    });

    // Bet placed
    socket.on('crash:bet', (bet: CrashBet) => {
      setGameState((prev) => prev ? {
        ...prev,
        bets: [...prev.bets, bet],
      } : null);
    });

    // Cashout
    socket.on('crash:cashout', (data: { userId: string; multiplier: number; winAmount: number }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          bets: prev.bets.map((bet) =>
            bet.odataId === data.userId
              ? { ...bet, status: 'won', cashoutAt: data.multiplier }
              : bet
          ),
        };
      });
    });

    // Error handling
    socket.on('error', (data: { message: string }) => {
      console.error('Crash error:', data.message);
    });

    return () => {
      socket.off('crash:state');
      socket.off('crash:new');
      socket.off('crash:started');
      socket.off('crash:tick');
      socket.off('crash:crashed');
      socket.off('crash:bet');
      socket.off('crash:cashout');
      socket.off('error');
    };
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (gameState?.status === 'betting' && gameState.bettingEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, gameState.bettingEndsAt! - Date.now());
        setCountdown(Math.ceil(remaining / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState?.status, gameState?.bettingEndsAt]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      const dpr = window.devicePixelRatio || 1;

      // Clear
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 229, 240, 0.05)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += 40 * dpr) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 40 * dpr) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw curve if running or crashed
      if (gameState?.status === 'running' || gameState?.status === 'crashed') {
        const elapsed = gameState.status === 'crashed'
          ? 10000
          : Date.now() - startTimeRef.current;

        const points: { x: number; y: number }[] = [];
        const maxTime = 15000;

        for (let t = 0; t <= Math.min(elapsed, maxTime); t += 50) {
          const m = Math.pow(Math.E, 0.00006 * t);
          const x = (t / maxTime) * width;
          const y = height - ((m - 1) / 15) * height;
          points.push({ x, y: Math.max(20 * dpr, y) });
        }

        if (points.length > 1) {
          // Gradient fill
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          if (gameState.status === 'crashed') {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 229, 240, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 229, 240, 0.3)');
          }

          ctx.beginPath();
          ctx.moveTo(points[0].x, height);
          points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.lineTo(points[points.length - 1].x, height);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Line
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.strokeStyle = gameState.status === 'crashed' ? '#ef4444' : '#00e5f0';
          ctx.lineWidth = 3 * dpr;
          ctx.stroke();

          // Glow
          ctx.shadowColor = gameState.status === 'crashed' ? '#ef4444' : '#00e5f0';
          ctx.shadowBlur = 20 * dpr;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Set canvas size
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();
    window.addEventListener('resize', resize);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState?.status]);

  const placeBet = useCallback(() => {
    if (!isAuthenticated || hasBet || gameState?.status !== 'betting') return;
    if (betAmount > (balances['MON'] || 0)) return;

    socketClient.placeCrashBet(betAmount, 'MON', autoCashout);
    setHasBet(true);
    deductBalance('MON', betAmount);
  }, [isAuthenticated, hasBet, gameState?.status, betAmount, balances, autoCashout, deductBalance]);

  const cashout = useCallback(() => {
    if (!hasBet || hasCashedOut || gameState?.status !== 'running') return;

    socketClient.cashoutCrash();
    setHasCashedOut(true);
    addBalance('MON', betAmount * gameState.multiplier);
  }, [hasBet, hasCashedOut, gameState?.status, gameState?.multiplier, betAmount, addBalance]);

  const getStatusColor = (crashPoint: number) => {
    if (crashPoint < 1.5) return 'text-danger-400';
    if (crashPoint < 2) return 'text-warning-400';
    if (crashPoint < 5) return 'text-primary-400';
    return 'text-success-400';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Game Area */}
      <div className="lg:col-span-2 space-y-4">
        {/* Graph */}
        <Card className="relative overflow-hidden">
          <div className="aspect-video relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Multiplier Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {gameState?.status === 'betting' && (
                  <motion.div
                    key="betting"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-semibold text-text-secondary mb-2">
                      Starting in
                    </div>
                    <div className="text-6xl font-bold font-mono text-primary-400">
                      {countdown}s
                    </div>
                  </motion.div>
                )}

                {gameState?.status === 'running' && (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <motion.div
                      className="text-7xl md:text-8xl font-bold font-mono text-primary-400"
                      style={{ textShadow: '0 0 60px rgba(0, 229, 240, 0.6)' }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {displayMultiplier}x
                    </motion.div>
                  </motion.div>
                )}

                {gameState?.status === 'crashed' && (
                  <motion.div
                    key="crashed"
                    initial={{ opacity: 0, scale: 2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-danger-400 mb-2">
                      CRASHED
                    </div>
                    <div
                      className="text-7xl font-bold font-mono text-danger-500"
                      style={{ textShadow: '0 0 60px rgba(239, 68, 68, 0.6)' }}
                    >
                      {displayMultiplier}x
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* Betting Controls */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm text-text-secondary mb-2">Bet Amount</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  min={0.01}
                  step={0.1}
                  className="font-mono"
                />
                <div className="flex gap-1">
                  {[0.5, 2].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setBetAmount((prev) => prev * mult)}
                      className="px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                      {mult < 1 ? '½' : '2x'}
                    </button>
                  ))}
                  <button
                    onClick={() => setBetAmount(balances['MON'] || 0)}
                    className="px-2 py-1 text-xs bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div className="min-w-[120px]">
              <label className="block text-sm text-text-secondary mb-2">Auto Cashout</label>
              <Input
                type="number"
                value={autoCashout || ''}
                onChange={(e) => setAutoCashout(parseFloat(e.target.value) || undefined)}
                placeholder="1.50"
                min={1.01}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              {gameState?.status === 'betting' ? (
                <Button
                  onClick={placeBet}
                  disabled={!isAuthenticated || hasBet || betAmount > (balances['MON'] || 0)}
                  className="w-full h-12"
                  size="lg"
                >
                  {hasBet ? 'Bet Placed!' : `Bet ${formatCurrency(betAmount)} MON`}
                </Button>
              ) : gameState?.status === 'running' && hasBet && !hasCashedOut ? (
                <Button
                  onClick={cashout}
                  variant="success"
                  className="w-full h-12"
                  size="lg"
                >
                  Cashout @ {displayMultiplier}x
                </Button>
              ) : (
                <Button disabled className="w-full h-12" size="lg">
                  {hasCashedOut ? 'Cashed Out!' : 'Wait for next round...'}
                </Button>
              )}
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
              {history.map((game, i) => (
                <motion.div
                  key={`${game.gameNumber}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-mono text-sm font-semibold',
                    'bg-bg-tertiary border border-white/5',
                    getStatusColor(game.crashPoint)
                  )}
                >
                  {game.crashPoint.toFixed(2)}x
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">Current Bets</h3>
              <span className="text-sm text-text-muted">
                {gameState?.bets.length || 0} players
              </span>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
            {gameState?.bets.map((bet, i) => (
              <motion.div
                key={`${bet.odataId}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl',
                  'bg-bg-tertiary border border-white/5',
                  bet.status === 'won' && 'border-success-500/30 bg-success-500/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {bet.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {bet.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-text-muted font-mono">
                      {formatCurrency(bet.amount)} MON
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {bet.status === 'won' ? (
                    <div className="text-success-400 font-mono font-semibold">
                      +{formatCurrency(bet.amount * (bet.cashoutAt || 1))}
                      <div className="text-xs text-success-500">
                        @{bet.cashoutAt?.toFixed(2)}x
                      </div>
                    </div>
                  ) : bet.autoCashout ? (
                    <div className="text-xs text-text-muted">
                      Auto: {bet.autoCashout}x
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}

            {(!gameState?.bets || gameState.bets.length === 0) && (
              <div className="text-center text-text-muted py-8">
                No bets yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Game #</span>
              <span className="font-mono text-white">
                {gameState?.gameNumber || '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Server Seed Hash</span>
              <span className="font-mono text-white truncate max-w-[120px]">
                {gameState?.serverSeedHash?.slice(0, 10) || '-'}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">House Edge</span>
              <span className="font-mono text-white">4%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

