'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Coins, Grid3X3, Target, TrendingUp, Bomb, Sparkles, Trophy, Users, Zap, ArrowRight } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAccount } from 'wagmi';

const games = [
  {
    name: 'Coin Flip',
    description: 'Classic 50/50 odds',
    href: '/coinflip',
    icon: Coins,
    multiplier: '1.98x',
    color: 'from-yellow-500 to-orange-500',
    players: 142,
  },
  {
    name: 'Mines',
    description: 'Navigate the minefield',
    href: '/mines',
    icon: Bomb,
    multiplier: 'Up to 24x',
    color: 'from-emerald-500 to-teal-500',
    players: 89,
    hot: true,
  },
  {
    name: 'Roulette',
    description: 'Spin the wheel',
    href: '/roulette',
    icon: Target,
    multiplier: 'Up to 35x',
    color: 'from-red-500 to-rose-500',
    players: 234,
  },
  {
    name: 'Upgrader',
    description: 'Risk for rewards',
    href: '/upgrader',
    icon: TrendingUp,
    multiplier: 'Up to 100x',
    color: 'from-purple-500 to-fuchsia-500',
    players: 67,
  },
];

const stats = [
  { label: 'Total Wagered', value: '1.2M MON', icon: Coins },
  { label: 'Total Players', value: '12,459', icon: Users },
  { label: 'Biggest Win', value: '50,000 MON', icon: Trophy },
];

export default function Home() {
  const { user } = useStore();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-purple-600/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Welcome to Foxie Casino</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-white">Experience</span>
                <br />
                <span className="gradient-text">Provably Fair</span>
                <br />
                <span className="text-white">Gaming</span>
              </h1>
              
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Play casino games on Monad blockchain with instant payouts and verifiable fairness. Your luck, your control.
              </p>
              
              <div className="flex items-center gap-4">
                <Link href="/coinflip">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-lg shadow-green-600/20 transition-colors flex items-center gap-2"
                  >
                    Play Now
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  Learn More
                  <Zap className="w-4 h-4" />
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-[#30363d]">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-green-500/30 rounded-3xl blur-3xl scale-110" />
                
                {/* Main mascot container */}
                <div className="relative w-80 h-80 bg-gradient-to-br from-[#21262d] to-[#161b22] rounded-3xl border border-[#30363d] flex items-center justify-center overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: 'radial-gradient(circle at 2px 2px, #22c55e 1px, transparent 0)',
                      backgroundSize: '24px 24px'
                    }} />
                  </div>
                  
                  {/* Fox mascot */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="text-[120px] z-10"
                  >
                    🦊
                  </motion.div>
                  
                  {/* Floating elements */}
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute top-8 right-8 text-4xl"
                  >
                    🎲
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-12 left-8 text-3xl"
                  >
                    💎
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute top-12 left-12 text-2xl"
                  >
                    ✨
                  </motion.div>
                </div>

                {/* Floating win badge */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-4 -right-4 px-4 py-2 bg-green-500 rounded-lg text-white font-bold shadow-lg shadow-green-500/30"
                >
                  +500 MON
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Casino Games</h2>
              <p className="text-gray-500">Choose your game and start winning</p>
            </div>
            <Link href="/games" className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {games.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={game.href}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-5 cursor-pointer group overflow-hidden"
                  >
                    {/* Hot badge */}
                    {game.hot && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-xs font-bold">
                        HOT
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-white font-semibold mb-1">{game.name}</h3>
                    <p className="text-gray-500 text-sm mb-3">{game.description}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#30363d]">
                      <span className="text-green-400 text-sm font-medium">{game.multiplier}</span>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{game.players} playing</span>
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-12 border-t border-[#21262d]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#161b22] rounded-xl border border-[#30363d]">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Instant Payouts</h3>
              <p className="text-gray-500 text-sm">Winnings are sent directly to your wallet within seconds. No delays, no KYC.</p>
            </div>
            <div className="p-6 bg-[#161b22] rounded-xl border border-[#30363d]">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Provably Fair</h3>
              <p className="text-gray-500 text-sm">Every game result can be verified. We use on-chain randomness for complete transparency.</p>
            </div>
            <div className="p-6 bg-[#161b22] rounded-xl border border-[#30363d]">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Earn Points</h3>
              <p className="text-gray-500 text-sm">Get 10 points for every MON wagered. Climb the leaderboard and unlock rewards.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
