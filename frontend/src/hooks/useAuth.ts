'use client';

import { useCallback, useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { userApi } from '@/lib/api';
import { socketClient } from '@/lib/socket';

// TOROS fork: site login-walled. Anonim kullanıcı sayfa açar açmaz Steam
// OpenID akışına yönlendiriliyor; site içinde "logged out" UI hiç görünmüyor.
// Auth toroscs iron-session cookie'siyle aynı domain üzerinden taşınıyor.
// API client imzaları `token: string` zorunlu kalıyor; cookie modunda token
// olarak session marker geçiyoruz, backend cookie'yi öncelikli okur.

const SESSION_MARKER = 'cookie';

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const returnTo = window.location.pathname + window.location.search;
  window.location.href = '/api/auth/login?returnTo=' + encodeURIComponent(returnTo);
}

export function useAuth() {
  const { user, token, isAuthenticated, setUser, setToken, logout } = useUserStore();
  const { setBalances, setLoading } = useBalanceStore();

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      const balances = await userApi.getBalance(SESSION_MARKER);
      setBalances(balances);
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setLoading(false);
    }
  }, [setBalances, setLoading]);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await userApi.getMe(SESSION_MARKER);
      setUser(userData);
      setToken(SESSION_MARKER);
      await loadBalances();
    } catch (err: any) {
      // Login wall: cookie yok/expired → Steam login'e yönlendir
      logout();
      if (err?.statusCode === 401 || err?.statusCode === 403) {
        redirectToLogin();
      }
    }
  }, [setUser, setToken, logout, loadBalances]);

  // Boot'ta bir kez session check (login wall)
  useEffect(() => {
    if (!isAuthenticated) loadUserData();
  }, []);

  // Socket'i auth durumuna göre bağla — cookie aynı handshake'te akıyor
  useEffect(() => {
    if (isAuthenticated) {
      socketClient.connect(SESSION_MARKER);
    }
    return () => {
      socketClient.disconnect();
    };
  }, [isAuthenticated]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // logout endpoint olmasa bile client state'i temizle
    }
    logout();
    socketClient.disconnect();
    redirectToLogin();
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated,
    isConnected: isAuthenticated, // legacy şim
    address: user?.walletAddress ?? null, // legacy şim
    authenticate: loadUserData, // legacy şim
    logout: handleLogout,
    refreshBalances: loadBalances,
  };
}
