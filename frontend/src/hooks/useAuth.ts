'use client';

import { useCallback, useEffect } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useUserStore } from '@/stores/useUserStore';
import { useBalanceStore } from '@/stores/useBalanceStore';
import { authApi, userApi } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import toast from 'react-hot-toast';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  const { user, token, isAuthenticated, login, logout, setUser } = useUserStore();
  const { setBalances, setLoading } = useBalanceStore();

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      authenticate();
    }
  }, [isConnected, address]);

  // Load user data when token exists
  useEffect(() => {
    if (token && !user) {
      loadUserData();
    }
  }, [token]);

  // Connect socket when authenticated
  useEffect(() => {
    if (token) {
      socketClient.connect(token);
    }
    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  const authenticate = useCallback(async () => {
    if (!address) return;

    try {
      // Get nonce
      const { nonce } = await authApi.getNonce(address);

      // Sign message
      const signature = await signMessageAsync({ message: nonce });

      // Verify and get token
      const { token: newToken, user: userData } = await authApi.verify(address, signature);

      login(userData, newToken);
      
      // Load balances
      await loadBalances(newToken);

      toast.success('Connected successfully!');
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Failed to authenticate');
    }
  }, [address, signMessageAsync, login]);

  const loadUserData = useCallback(async () => {
    if (!token) return;

    try {
      const userData = await userApi.getMe(token);
      setUser(userData);
      await loadBalances(token);
    } catch (error) {
      console.error('Failed to load user data:', error);
      logout();
    }
  }, [token, setUser, logout]);

  const loadBalances = useCallback(async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const balances = await userApi.getBalance(tokenToUse);
      setBalances(balances);
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setLoading(false);
    }
  }, [token, setBalances, setLoading]);

  const handleLogout = useCallback(() => {
    logout();
    wagmiDisconnect();
    socketClient.disconnect();
    toast.success('Disconnected');
  }, [logout, wagmiDisconnect]);

  return {
    user,
    token,
    isAuthenticated,
    isConnected,
    address,
    authenticate,
    logout: handleLogout,
    refreshBalances: () => loadBalances(),
  };
}

