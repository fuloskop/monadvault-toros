'use client';

import { CoinFlip } from '@/components/games/CoinFlip';
import { motion } from 'framer-motion';
import { Coins, Shield, TrendingUp } from 'lucide-react';

export default function CoinFlipPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Coin Flip</h1>
              <p className="text-gray-500">Pick heads or tails and double your luck!</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Multiplier:</span>
              <span className="text-white font-semibold">1.98x</span>
            </div>
            <div className="w-px h-4 bg-[#30363d]" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">House Edge:</span>
              <span className="text-white font-semibold">2%</span>
            </div>
          </div>
        </motion.div>

        {/* Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CoinFlip />
        </motion.div>
      </div>
    </div>
  );
}
