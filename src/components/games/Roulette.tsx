'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useStore } from '@/lib/store';
import { generateResult, getRouletteResult } from '@/lib/provablyFair';
import { Loader2 } from 'lucide-react';

type BetType = 'red' | 'black' | 'green';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// European roulette wheel order
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// SVG helper to create arc path
function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  };
}

export function Roulette() {
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { user, balance, gameState, recordBet } = useStore();
  
  const [betAmount, setBetAmount] = useState('0.01');
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const getColorHex = (num: number): string => {
    const color = getNumberColor(num);
    if (color === 'green') return '#16a34a';
    if (color === 'red') return '#dc2626';
    return '#1f2937';
  };

  const getMultiplier = (betType: BetType): number => {
    switch (betType) {
      case 'green': return 35;
      case 'red':
      case 'black':
        return 2;
      default: return 1;
    }
  };

  const checkWin = (betType: BetType, resultNum: number): boolean => {
    switch (betType) {
      case 'green':
        return resultNum === 0;
      case 'red':
        return RED_NUMBERS.includes(resultNum);
      case 'black':
        return BLACK_NUMBERS.includes(resultNum);
      default:
        return false;
    }
  };

  // Pre-calculate wheel segments
  const wheelSegments = useMemo(() => {
    const segmentAngle = 360 / 37;
    return WHEEL_NUMBERS.map((num, i) => ({
      num,
      color: getColorHex(num),
      path: describeArc(150, 150, 140, i * segmentAngle, (i + 1) * segmentAngle),
      textAngle: i * segmentAngle + segmentAngle / 2,
    }));
  }, []);

  const handleSpin = async () => {
    if (!isConnected || !user || isSpinning || !selectedBet) return;
    
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > balance) return;

    setIsSpinning(true);
    setResult(null);
    setLastWin(null);

    try {
      // Send transaction
      await sendTransactionAsync({
        to: '0x0000000000000000000000000000000000000001',
        value: parseEther(betAmount),
      });

      // Generate result
      const randomResult = generateResult(
        gameState.serverSeed,
        gameState.clientSeed,
        gameState.nonce
      );
      const rouletteResult = getRouletteResult(randomResult);

      // Calculate the target rotation
      // Find index of result in wheel
      const resultIndex = WHEEL_NUMBERS.indexOf(rouletteResult);
      const segmentAngle = 360 / 37;
      // Target angle for the ball to land on this segment (pointing up)
      const targetAngle = -(resultIndex * segmentAngle + segmentAngle / 2);
      // Add multiple full rotations for effect
      const newRotation = rotation + 1800 + targetAngle - (rotation % 360);
      setRotation(newRotation);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 4000));

      setResult(rouletteResult);

      // Check win
      const won = checkWin(selectedBet, rouletteResult);
      const multiplier = getMultiplier(selectedBet);
      const payout = won ? amount * multiplier : 0;
      
      if (won) {
        setLastWin(payout);
      }

      // Record bet
      await recordBet('roulette', amount, multiplier, payout, won);

    } catch (error) {
      console.error('Spin failed:', error);
    } finally {
      setIsSpinning(false);
    }
  };

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5', '1'];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Game Area */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-8">
        {/* Roulette Wheel */}
        <div className="relative h-80 flex items-center justify-center mb-8">
          {/* Outer ring decoration */}
          <div className="absolute w-72 h-72 rounded-full border-8 border-yellow-600 shadow-2xl shadow-yellow-500/20" />
          
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            <svg width="300" height="300" viewBox="0 0 300 300">
              {/* Outer ring */}
              <circle cx="150" cy="150" r="148" fill="none" stroke="#854d0e" strokeWidth="4" />
              
              {/* Wheel segments */}
              {wheelSegments.map((segment, i) => (
                <g key={i}>
                  <path
                    d={segment.path}
                    fill={segment.color}
                    stroke="#1a1a2e"
                    strokeWidth="1"
                  />
                  {/* Number text */}
                  <text
                    x="150"
                    y="30"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${segment.textAngle}, 150, 150)`}
                  >
                    {segment.num}
                  </text>
                </g>
              ))}
              
              {/* Inner decorative ring */}
              <circle cx="150" cy="150" r="50" fill="url(#centerGradient)" stroke="#a855f7" strokeWidth="3" />
              
              {/* Gradient definition */}
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </radialGradient>
              </defs>
            </svg>
            
            {/* Center fox */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🦊</span>
            </div>
          </motion.div>

          {/* Ball indicator (fixed position, points to winning segment) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>

          {/* Result display */}
          <AnimatePresence>
            {result !== null && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -bottom-4"
              >
                <div className={`px-8 py-3 rounded-xl font-bold text-xl ${
                  getNumberColor(result) === 'green'
                    ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                    : getNumberColor(result) === 'red'
                    ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                    : 'bg-gray-800/50 text-gray-300 border border-gray-500/50'
                }`}>
                  {result}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Win announcement */}
        <AnimatePresence>
          {lastWin !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-6"
            >
              <span className="text-2xl font-bold text-green-400">+{lastWin.toFixed(4)} MON!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Betting Options */}
        <div className="grid grid-cols-3 gap-3">
          {/* Color bets */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBet('red')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedBet === 'red'
                ? 'bg-red-500/10 border-red-500 shadow-lg shadow-red-500/10'
                : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-red-600 mx-auto mb-2" />
            <div className="text-white font-bold">Red</div>
            <div className="text-gray-500 text-sm">2x</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBet('black')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedBet === 'black'
                ? 'bg-gray-500/10 border-gray-500 shadow-lg shadow-gray-500/10'
                : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-900 mx-auto mb-2 border border-gray-600" />
            <div className="text-white font-bold">Black</div>
            <div className="text-gray-500 text-sm">2x</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBet('green')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedBet === 'green'
                ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/10'
                : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-green-600 mx-auto mb-2" />
            <div className="text-white font-bold">Green (0)</div>
            <div className="text-gray-500 text-sm">35x</div>
          </motion.button>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="space-y-4">
        {/* Bet Amount */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <label className="text-gray-400 text-sm mb-2 block">Bet Amount</label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              min="0.001"
              step="0.001"
              className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => setBetAmount((parseFloat(betAmount) / 2).toString())}
              className="w-10 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 hover:text-white hover:border-[#484f58] transition-colors flex-shrink-0"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((parseFloat(betAmount) * 2).toString())}
              className="w-10 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 hover:text-white hover:border-[#484f58] transition-colors flex-shrink-0"
            >
              2x
            </button>
          </div>
          <div className="flex gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className="flex-1 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 text-sm hover:text-white hover:border-[#484f58] transition-colors"
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Potential Win */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Potential Win</span>
            <span className="text-green-400 font-bold text-lg">
              {selectedBet ? (parseFloat(betAmount || '0') * getMultiplier(selectedBet)).toFixed(4) : '0.0000'} MON
            </span>
          </div>
        </div>

        {/* Spin Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSpin}
          disabled={!isConnected || isSpinning || !selectedBet}
          className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Spinning...
            </>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : (
            `Spin for ${betAmount} MON`
          )}
        </motion.button>

        {/* Provably Fair */}
        <div className="p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
          <h4 className="text-gray-400 font-medium mb-2 text-sm">🔒 Provably Fair</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Seed Hash</span>
              <span className="text-gray-400 font-mono">{gameState.serverSeedHash.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nonce</span>
              <span className="text-gray-400">{gameState.nonce}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

