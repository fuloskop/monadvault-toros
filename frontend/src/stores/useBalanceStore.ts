import { create } from 'zustand';

interface BalanceState {
  balances: Record<string, number>;
  isLoading: boolean;
  
  setBalances: (balances: Record<string, number>) => void;
  updateBalance: (currency: string, amount: number) => void;
  addBalance: (currency: string, amount: number) => void;
  deductBalance: (currency: string, amount: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balances: {},
  isLoading: false,

  setBalances: (balances) => set({ balances }),

  updateBalance: (currency, amount) =>
    set((state) => ({
      balances: { ...state.balances, [currency]: amount },
    })),

  addBalance: (currency, amount) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [currency]: (state.balances[currency] || 0) + amount,
      },
    })),

  deductBalance: (currency, amount) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [currency]: Math.max(0, (state.balances[currency] || 0) - amount),
      },
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));

