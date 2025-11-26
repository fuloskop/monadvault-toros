'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useStore } from '@/lib/store';
import { generateResult, getCoinFlipResult } from '@/lib/provablyFair';
import { Loader2 } from 'lucide-react';

export function CoinFlip() {
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { user, balance, gameState, recordBet } = useStore();
  
  const [betAmount, setBetAmount] = useState('0.01');
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [won, setWon] = useState<boolean | null>(null);

  const multiplier = 1.98;

  const handleFlip = async () => {
    if (!isConnected || !user || isFlipping) return;
    
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > balance) return;

    setIsFlipping(true);
    setResult(null);
    setWon(null);

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
      
      const flipResult = getCoinFlipResult(randomResult);
      const playerWon = flipResult === selectedSide;
      const payout = playerWon ? amount * multiplier : 0;

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult(flipResult);
      setWon(playerWon);

      await recordBet('coinflip', amount, multiplier, payout, playerWon);

    } catch (error) {
      console.error('Flip failed:', error);
    } finally {
      setIsFlipping(false);
    }
  };

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5', '1'];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Game Area */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-8">
        {/* Coin Display */}
        <div className="relative h-64 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            {isFlipping ? (
              <motion.div
                key="flipping"
                animate={{ rotateY: [0, 1800] }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="w-36 h-36 relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl shadow-yellow-500/30 flex items-center justify-center border-4 border-yellow-300">
                  <span className="text-5xl">🦊</span>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key={result}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl border-4 ${
                  result === 'heads'
                    ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300 shadow-yellow-500/30'
                    : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 border-purple-300 shadow-purple-500/30'
                }`}
              >
                <span className="text-5xl">{result === 'heads' ? '🦊' : '🎲'}</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-36 h-36 rounded-full bg-[#21262d] border-4 border-[#30363d] flex items-center justify-center"
              >
                <span className="text-5xl opacity-50">🪙</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result announcement */}
          <AnimatePresence>
            {won !== null && !isFlipping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute -bottom-2 px-6 py-2 rounded-lg font-bold text-lg ${
                  won
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}
              >
                {won ? `+${(parseFloat(betAmount) * multiplier).toFixed(4)} MON` : 'Better luck next time!'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Selection */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedSide('heads')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedSide === 'heads'
                ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/10'
                : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <div className="text-4xl mb-2">🦊</div>
            <div className="text-white font-bold">Heads</div>
            <div className="text-gray-500 text-sm">{multiplier}x</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedSide('tails')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedSide === 'tails'
                ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10'
                : 'bg-[#21262d] border-[#30363d] hover:border-[#484f58]'
            }`}
          >
            <div className="text-4xl mb-2">🎲</div>
            <div className="text-white font-bold">Tails</div>
            <div className="text-gray-500 text-sm">{multiplier}x</div>
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
              {(parseFloat(betAmount || '0') * multiplier).toFixed(4)} MON
            </span>
          </div>
        </div>

        {/* Flip Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFlip}
          disabled={!isConnected || isFlipping}
          className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isFlipping ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Flipping...
            </>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : (
            `Flip for ${betAmount} MON`
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
