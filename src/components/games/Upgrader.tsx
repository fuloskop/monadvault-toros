'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useStore } from '@/lib/store';
import { generateResult, getUpgraderResult } from '@/lib/provablyFair';
import { Loader2, Sparkles } from 'lucide-react';

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

export function Upgrader() {
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { user, balance, gameState, recordBet } = useStore();
  
  const [betAmount, setBetAmount] = useState('0.01');
  const [winChance, setWinChance] = useState(50);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [rotation, setRotation] = useState(0);

  const multiplier = (100 / winChance) * 0.99;
  const potentialWin = parseFloat(betAmount) * multiplier;

  const handleSpin = async () => {
    if (!isConnected || !user || isSpinning) return;
    
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > balance) return;

    setIsSpinning(true);
    setResult(null);

    try {
      await sendTransactionAsync({
        to: '0x0000000000000000000000000000000000000001',
        value: parseEther(betAmount),
      });

      const randomResult = generateResult(
        gameState.serverSeed,
        gameState.clientSeed,
        gameState.nonce
      );
      const won = getUpgraderResult(randomResult, winChance / 100);

      // Calculate target angle based on result
      // Win zone is from 0 to winChance% of the wheel
      const resultAngle = randomResult * 360;
      const targetAngle = resultAngle;
      
      // Add multiple rotations for effect
      const newRotation = rotation + 1800 + targetAngle - (rotation % 360);
      setRotation(newRotation);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 4000));

      setResult(won ? 'win' : 'lose');

      const payout = won ? potentialWin : 0;
      await recordBet('upgrader', amount, multiplier, payout, won);

    } catch (error) {
      console.error('Spin failed:', error);
    } finally {
      setIsSpinning(false);
    }
  };

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5', '1'];
  const presetChances = [10, 25, 50, 75, 90];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Game Area */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-8">
        {/* Wheel */}
        <div className="relative h-96 flex items-center justify-center mb-8">
          {/* Outer ring decoration */}
          <div className="absolute w-80 h-80 rounded-full border-8 border-purple-600 shadow-2xl shadow-purple-500/20" />
          
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            <svg width="320" height="320" viewBox="0 0 320 320">
              {/* Win zone (player color) */}
              <path
                d={describeArc(160, 160, 150, 0, (winChance / 100) * 360)}
                fill="#16a34a"
                stroke="#0d1117"
                strokeWidth="2"
              />
              
              {/* House zone */}
              <path
                d={describeArc(160, 160, 150, (winChance / 100) * 360, 360)}
                fill="#dc2626"
                stroke="#0d1117"
                strokeWidth="2"
              />
              
              {/* Center circle */}
              <circle cx="160" cy="160" r="50" fill="url(#centerGradient)" stroke="#a855f7" strokeWidth="3" />
              
              {/* Gradient definition */}
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </radialGradient>
              </defs>
              
              {/* Percentage labels */}
              <text
                x="160"
                y="80"
                fill="white"
                fontSize="24"
                fontWeight="bold"
                textAnchor="middle"
              >
                {winChance}%
              </text>
              <text
                x="160"
                y="240"
                fill="white"
                fontSize="24"
                fontWeight="bold"
                textAnchor="middle"
              >
                {100 - winChance}%
              </text>
            </svg>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🦊</span>
            </div>
          </motion.div>

          {/* Pin indicator (fixed position, points down to winning segment) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>

          {/* Legend */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600" />
              <span className="text-white text-sm font-bold">You Win</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600" />
              <span className="text-white text-sm font-bold">House Wins</span>
            </div>
          </div>
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {result && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <div className={result === 'win' ? 'text-green-400' : 'text-red-400'}>
                {result === 'win' ? (
                  <>
                    <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                    <div className="text-3xl font-bold mb-2">YOU WIN!</div>
                    <div className="text-xl">+{potentialWin.toFixed(4)} MON</div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">💥</div>
                    <div className="text-3xl font-bold">HOUSE WINS</div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Panel */}
      <div className="space-y-4">
        {/* Win Chance Selection */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <label className="text-gray-400 text-sm mb-3 block">Win Chance</label>
          
          {/* Preset buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {presetChances.map((chance) => (
              <motion.button
                key={chance}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setWinChance(chance)}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  winChance === chance
                    ? 'bg-green-600 text-white'
                    : 'bg-[#21262d] text-gray-400 border border-[#30363d] hover:border-[#484f58]'
                }`}
              >
                {chance}%
              </motion.button>
            ))}
          </div>

          {/* Custom slider */}
          <input
            type="range"
            value={winChance}
            onChange={(e) => setWinChance(parseInt(e.target.value))}
            min="1"
            max="99"
            step="1"
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-gray-500 text-xs mt-2">
            <span>1% (98x)</span>
            <span className="text-green-400 font-bold">{winChance}%</span>
            <span>99% (1x)</span>
          </div>
        </div>

        {/* Multiplier Display */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Multiplier</span>
            <span className="text-yellow-400 font-bold text-xl">{multiplier.toFixed(2)}x</span>
          </div>
        </div>

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
              className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-green-500"
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
              {potentialWin.toFixed(4)} MON
            </span>
          </div>
        </div>

        {/* Spin Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSpin}
          disabled={!isConnected || isSpinning}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
