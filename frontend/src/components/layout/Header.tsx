'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency, shortenAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Header() {
  const { balances } = useBalanceStore();
  const { user, isAuthenticated } = useUserStore();
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-bg-secondary/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl rotate-45 transform" />
            <div className="absolute inset-1 bg-bg-primary rounded-lg rotate-45 transform flex items-center justify-center">
              <span className="font-display font-bold text-primary-500 -rotate-45 text-lg">M</span>
            </div>
          </div>
          <span className="font-display font-bold text-xl tracking-wider hidden sm:block">
            <span className="text-white">MONAD</span>
            <span className="text-primary-500">VAULT</span>
          </span>
        </Link>

        {/* Center Navigation - Quick Stats */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-xl">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-sm text-text-secondary">Online</span>
              <span className="text-sm font-mono text-white">1,234</span>
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Balance Display */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary rounded-xl border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold">M</span>
                  </div>
                  <span className="font-mono font-semibold text-white">
                    {formatCurrency(balances['MON'] || 0)}
                  </span>
                </div>

                {/* Deposit Button */}
                <button
                  onClick={() => setShowDeposit(true)}
                  className="p-2 bg-primary-500 hover:bg-primary-400 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </motion.div>

              {/* User Menu */}
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{user?.username?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user?.username || shortenAddress(user?.walletAddress || '')}
                  </div>
                  <div className="text-xs text-text-muted">Level {user?.level || 1}</div>
                </div>
              </div>
            </>
          ) : (
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const connected = mounted && account && chain;

                return (
                  <button
                    onClick={openConnectModal}
                    className={cn(
                      'px-6 py-2.5 rounded-xl font-semibold transition-all duration-200',
                      'bg-gradient-to-r from-primary-500 to-primary-600',
                      'hover:from-primary-400 hover:to-primary-500',
                      'shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
                      'flex items-center gap-2'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Connect Wallet
                  </button>
                );
              }}
            </ConnectButton.Custom>
          )}

          {/* Sound Toggle */}
          <button className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

