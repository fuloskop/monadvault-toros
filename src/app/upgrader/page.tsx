'use client';

import { Upgrader } from '@/components/games/Upgrader';
import { motion } from 'framer-motion';
import { TrendingUp, Shield } from 'lucide-react';

export default function UpgraderPage() {
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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Upgrader</h1>
              <p className="text-gray-500">Choose your odds and spin the wheel!</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 p-4 bg-[#161b22] rounded-xl border border-[#30363d]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Max Multiplier:</span>
              <span className="text-white font-semibold">98x</span>
            </div>
            <div className="w-px h-4 bg-[#30363d]" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">House Edge:</span>
              <span className="text-white font-semibold">1%</span>
            </div>
          </div>
        </motion.div>

        {/* Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Upgrader />
        </motion.div>
      </div>
    </div>
  );
}
