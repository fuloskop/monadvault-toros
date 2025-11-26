'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useStore } from '@/lib/store';
import { generateMultipleResults, getMinePositions } from '@/lib/provablyFair';
import { Bomb, Gem, Loader2, RotateCcw } from 'lucide-react';

const GRID_SIZE = 25;

export function Mines() {
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { user, balance, gameState, recordBet } = useStore();
  
  const [betAmount, setBetAmount] = useState('0.01');
  const [mineCount, setMineCount] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const calculateMultiplier = (revealedCount: number) => {
    const safeSpots = GRID_SIZE - mineCount;
    let multiplier = 1;
    for (let i = 0; i < revealedCount; i++) {
      multiplier *= (safeSpots - i) / (GRID_SIZE - i);
    }
    return (1 / multiplier) * 0.97;
  };

  const currentMultiplier = calculateMultiplier(revealed.length);
  const potentialWin = parseFloat(betAmount) * currentMultiplier;

  const startGame = async () => {
    if (!isConnected || !user || isLoading) return;
    
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > balance) return;

    setIsLoading(true);

    try {
      await sendTransactionAsync({
        to: '0x0000000000000000000000000000000000000001',
        value: parseEther(betAmount),
      });

      const results = generateMultipleResults(
        gameState.serverSeed,
        gameState.clientSeed,
        gameState.nonce,
        mineCount
      );
      const mines = getMinePositions(results, mineCount, GRID_SIZE);
      
      setMinePositions(mines);
      setRevealed([]);
      setGameActive(true);
      setGameOver(false);
      setWon(false);

    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const revealTile = async (index: number) => {
    if (!gameActive || revealed.includes(index) || gameOver) return;

    if (minePositions.includes(index)) {
      setRevealed([...revealed, index]);
      setGameOver(true);
      setWon(false);
      setGameActive(false);
      await recordBet('mines', parseFloat(betAmount), 0, 0, false);
    } else {
      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      
      if (newRevealed.length === GRID_SIZE - mineCount) {
        setGameOver(true);
        setWon(true);
        setGameActive(false);
        const payout = potentialWin;
        await recordBet('mines', parseFloat(betAmount), currentMultiplier, payout, true);
      }
    }
  };

  const cashOut = async () => {
    if (!gameActive || revealed.length === 0) return;
    
    setGameOver(true);
    setWon(true);
    setGameActive(false);
    
    const payout = potentialWin;
    await recordBet('mines', parseFloat(betAmount), currentMultiplier, payout, true);
  };

  const resetGame = () => {
    setGameActive(false);
    setRevealed([]);
    setMinePositions([]);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Game Grid */}
      <div className="bg-[#161b22] rounded-xl p-6 border border-[#30363d]">
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {Array.from({ length: GRID_SIZE }).map((_, index) => {
            const isRevealed = revealed.includes(index);
            const isMine = minePositions.includes(index);
            const showMine = gameOver && isMine;

            return (
              <motion.button
                key={index}
                whileHover={!isRevealed && gameActive ? { scale: 1.05 } : {}}
                whileTap={!isRevealed && gameActive ? { scale: 0.95 } : {}}
                onClick={() => revealTile(index)}
                disabled={!gameActive || isRevealed}
                className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                  showMine
                    ? 'bg-red-500/20 border-red-500'
                    : isRevealed
                    ? 'bg-green-500/20 border-green-500'
                    : gameActive
                    ? 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] cursor-pointer'
                    : 'bg-[#21262d] border-[#30363d]'
                } border-2`}
              >
                <AnimatePresence mode="wait">
                  {showMine ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      <Bomb className="w-6 h-6 text-red-400" />
                    </motion.div>
                  ) : isRevealed ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      <Gem className="w-6 h-6 text-green-400" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Game Over Message */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <div className={`inline-block px-6 py-3 rounded-xl font-bold text-lg ${
                won
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}>
                {won ? `+${potentialWin.toFixed(4)} MON` : 'Boom! You hit a mine!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Current Stats */}
        {gameActive && (
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Multiplier</div>
              <div className="text-3xl font-bold text-white">{currentMultiplier.toFixed(2)}x</div>
              <div className="text-gray-400 text-sm mt-2">Potential Win</div>
              <div className="text-xl font-bold text-green-400">{potentialWin.toFixed(4)} MON</div>
            </div>
          </div>
        )}

        {/* Bet Amount */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <label className="text-gray-400 text-sm mb-2 block">Bet Amount</label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={gameActive}
              min="0.001"
              step="0.001"
              className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
            <button
              onClick={() => setBetAmount((parseFloat(betAmount) / 2).toString())}
              disabled={gameActive}
              className="w-10 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 hover:text-white hover:border-[#484f58] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount((parseFloat(betAmount) * 2).toString())}
              disabled={gameActive}
              className="w-10 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 hover:text-white hover:border-[#484f58] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              2x
            </button>
          </div>
          <div className="flex gap-2">
            {['0.01', '0.05', '0.1', '0.5', '1'].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                disabled={gameActive}
                className="flex-1 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-gray-400 text-sm hover:text-white hover:border-[#484f58] transition-colors disabled:opacity-50"
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Mine Count */}
        <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
          <label className="text-gray-400 text-sm mb-2 block">Mines: {mineCount}</label>
          <input
            type="range"
            value={mineCount}
            onChange={(e) => setMineCount(parseInt(e.target.value))}
            disabled={gameActive}
            min="1"
            max="24"
            className="w-full"
          />
          <div className="flex justify-between text-gray-500 text-xs mt-1">
            <span>1 (Low Risk)</span>
            <span>24 (High Risk)</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!gameActive ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            disabled={!isConnected || isLoading}
            className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : (
              'Start Game'
            )}
          </motion.button>
        ) : (
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={cashOut}
              disabled={revealed.length === 0}
              className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cash Out {potentialWin.toFixed(4)} MON
            </motion.button>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-[#21262d] border border-[#30363d] rounded-xl text-gray-400 font-semibold hover:text-white hover:border-[#484f58] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Game
            </button>
          </div>
        )}

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
