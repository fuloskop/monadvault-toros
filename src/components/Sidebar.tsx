'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Grid3X3, 
  Target, 
  TrendingUp, 
  Trophy, 
  Bomb,
  Gift,
  HelpCircle,
  ChevronDown,
  Gamepad2,
  Star,
  Zap
} from 'lucide-react';
import { useState } from 'react';

const gameLinks = [
  { name: 'Coin Flip', href: '/coinflip', icon: Coins },
  { name: 'Mines', href: '/mines', icon: Bomb },
  { name: 'Roulette', href: '/roulette', icon: Target },
  { name: 'Upgrader', href: '/upgrader', icon: TrendingUp },
];

const otherLinks = [
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Help Center', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [gamesOpen, setGamesOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(false);

  return (
    <aside className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full">
      {/* Logo */}
      <Link href="/" className="p-4 flex items-center gap-3 border-b border-[#30363d]">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
            <span className="text-xl">🦊</span>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#161b22]" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">Foxie</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Casino</p>
        </div>
      </Link>

      {/* Promo Banner */}
      <div className="mx-3 mt-4 p-3 rounded-lg bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-green-400">PROMO CODE</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">Use code & get rewards</p>
        <div className="flex gap-2 items-stretch">
          <input 
            type="text" 
            placeholder="Enter code..."
            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors whitespace-nowrap flex-shrink-0">
            Apply
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Games Section */}
        <div className="px-3 mb-2">
          <button 
            onClick={() => setGamesOpen(!gamesOpen)}
            className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>Casino Games</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${gamesOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {gamesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 space-y-1"
            >
              {gameLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-green-600/20 text-green-400 border-l-2 border-green-500'
                        : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                    {link.name === 'Mines' && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded">HOT</span>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 border-t border-[#30363d]" />

        {/* Other Section */}
        <div className="px-3">
          <button 
            onClick={() => setOtherOpen(!otherOpen)}
            className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Other</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${otherOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {otherOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1 space-y-1"
            >
              {otherLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#21262d] transition-all"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Bottom Stats */}
      <div className="p-3 border-t border-[#30363d]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-[#21262d]">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="text-xs">
            <p className="text-gray-400">Provably Fair</p>
            <p className="text-green-400 font-medium">Verified ✓</p>
          </div>
        </div>
      </div>
    </aside>
  );
}


