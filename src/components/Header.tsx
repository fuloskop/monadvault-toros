'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { useStore } from '@/lib/store';
import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, LogOut, Trophy, ChevronDown, Bell } from 'lucide-react';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  
  const { user, loadUser, initializeGameState, setBalance } = useStore();

  const formattedBalance = useMemo(() => {
    if (!balance) return '0.0000';
    return parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4);
  }, [balance]);

  useEffect(() => {
    if (isConnected && address) {
      loadUser(address);
      initializeGameState();
    }
  }, [isConnected, address, loadUser, initializeGameState]);

  useEffect(() => {
    if (balance) {
      setBalance(parseFloat(formattedBalance));
    }
  }, [balance, formattedBalance, setBalance]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="h-16 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-6">
      {/* Left Side - Empty spacer */}
      <div className="flex-1" />

      {/* Center - Balance */}
      <div className="flex items-center justify-center">
        {isConnected && user && (
          <div className="flex items-center gap-2 px-6 py-2 bg-[#21262d] rounded-lg border border-[#30363d]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-[10px]">M</span>
            </div>
            <span className="text-white font-semibold text-lg">{formattedBalance}</span>
            <span className="text-gray-500 text-sm">MON</span>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {isConnected && user && (
          <>
            {/* Points */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#21262d] rounded-lg border border-[#30363d]">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 font-semibold text-sm">{user.points.toLocaleString()}</span>
              <span className="text-gray-500 text-xs">PTS</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
            </button>
          </>
        )}

        {/* Wallet Button */}
        {isConnected ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => disconnect()}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-white text-sm font-medium transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <span className="text-[10px] font-bold">
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <span>{formatAddress(address!)}</span>
            <LogOut className="w-4 h-4 text-gray-500" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => connect({ connector: connectors[0] })}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg shadow-green-600/20"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect</span>
          </motion.button>
        )}
      </div>
    </header>
  );
}
