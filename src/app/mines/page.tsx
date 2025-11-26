'use client';

import { Mines } from '@/components/games/Mines';
import { motion } from 'framer-motion';
import { Bomb, Shield, TrendingUp } from 'lucide-react';

export default function MinesPage() {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bomb className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mines</h1>
              <p className="text-gray-500">Find the gems, avoid the bombs. Cash out anytime!</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Max Multiplier:</span>
              <span className="text-white font-semibold">Up to 24x</span>
            </div>
            <div className="w-px h-4 bg-[#30363d]" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">House Edge:</span>
              <span className="text-white font-semibold">3%</span>
            </div>
          </div>
        </motion.div>

        {/* Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Mines />
        </motion.div>
      </div>
    </div>
  );
}
