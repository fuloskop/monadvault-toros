import { create } from 'zustand';
import { supabase, isDemoMode } from './supabase';
import { generateServerSeed, generateClientSeed, hashServerSeed } from './provablyFair';

interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  points: number;
  total_wagered: number;
  total_won: number;
}

interface ChatMessage {
  id: string;
  user_id: string;
  wallet_address: string;
  username: string | null;
  message: string;
  created_at: string;
}

interface GameState {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

interface Store {
  // User state
  user: User | null;
  balance: number;
  isLoading: boolean;
  
  // Game state
  gameState: GameState;
  
  // Chat state
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setBalance: (balance: number) => void;
  loadUser: (walletAddress: string) => Promise<void>;
  updatePoints: (points: number) => Promise<void>;
  recordBet: (game: string, amount: number, multiplier: number, payout: number, won: boolean) => Promise<void>;
  
  // Game actions
  initializeGameState: () => void;
  rotateServerSeed: () => void;
  incrementNonce: () => void;
  setClientSeed: (seed: string) => void;
  
  // Chat actions
  toggleChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  subscribeToMessages: () => () => void;
}

// Demo chat messages
const demoMessages: ChatMessage[] = [
  {
    id: '1',
    user_id: 'demo',
    wallet_address: '0x1234...5678',
    username: 'FoxieFan',
    message: 'Just hit 10x on upgrader! 🎉',
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: '2',
    user_id: 'demo2',
    wallet_address: '0xabcd...ef12',
    username: 'LuckyPlayer',
    message: 'Welcome to Foxie Casino! 🦊',
    created_at: new Date(Date.now() - 30000).toISOString(),
  },
];

export const useStore = create<Store>((set, get) => ({
  // Initial state
  user: null,
  balance: 0,
  isLoading: false,
  
  gameState: {
    serverSeed: '',
    serverSeedHash: '',
    clientSeed: '',
    nonce: 0,
  },
  
  chatMessages: isDemoMode ? demoMessages : [],
  isChatOpen: false,
  
  // User actions
  setUser: (user) => set({ user }),
  setBalance: (balance) => set({ balance }),
  
  loadUser: async (walletAddress: string) => {
    set({ isLoading: true });
    
    // Demo mode - create local user
    if (isDemoMode) {
      const demoUser: User = {
        id: 'demo-' + walletAddress.slice(0, 8),
        wallet_address: walletAddress.toLowerCase(),
        username: null,
        points: 100, // Welcome bonus
        total_wagered: 0,
        total_won: 0,
      };
      set({ user: demoUser, isLoading: false });
      return;
    }
    
    try {
      // Try to find existing user
      const { data: existingUser, error: fetchError } = await supabase!
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();
      
      if (existingUser) {
        set({ user: existingUser, isLoading: false });
        return;
      }
      
      // Create new user if not exists
      if (fetchError?.code === 'PGRST116') {
        const { data: newUser, error: insertError } = await supabase!
          .from('users')
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            points: 100, // Welcome bonus
            total_wagered: 0,
            total_won: 0,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        set({ user: newUser, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
  
  updatePoints: async (points: number) => {
    const { user } = get();
    if (!user) return;
    
    if (isDemoMode) {
      set({ user: { ...user, points: user.points + points } });
      return;
    }
    
    try {
      const { error } = await supabase!
        .from('users')
        .update({ points: user.points + points })
        .eq('id', user.id);
      
      if (error) throw error;
      set({ user: { ...user, points: user.points + points } });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  },
  
  recordBet: async (game, amount, multiplier, payout, won) => {
    const { user, gameState } = get();
    if (!user) return;
    
    // Update local state
    const newTotalWagered = user.total_wagered + amount;
    const newTotalWon = user.total_won + (won ? payout : 0);
    const pointsEarned = Math.floor(amount * 10); // 10 points per unit wagered
    
    set({
      user: {
        ...user,
        total_wagered: newTotalWagered,
        total_won: newTotalWon,
        points: user.points + pointsEarned,
      },
    });
    
    // Increment nonce for next bet
    get().incrementNonce();
    
    if (isDemoMode) return;
    
    try {
      // Record the bet
      await supabase!.from('bets').insert({
        user_id: user.id,
        game,
        amount,
        multiplier,
        payout,
        won,
        client_seed: gameState.clientSeed,
        server_seed_hash: gameState.serverSeedHash,
        nonce: gameState.nonce,
      });
      
      // Update user stats
      await supabase!
        .from('users')
        .update({
          total_wagered: newTotalWagered,
          total_won: newTotalWon,
          points: user.points + pointsEarned,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error recording bet:', error);
    }
  },
  
  // Game state actions
  initializeGameState: () => {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = generateClientSeed();
    
    set({
      gameState: {
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: 0,
      },
    });
  },
  
  rotateServerSeed: () => {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    
    set((state) => ({
      gameState: {
        ...state.gameState,
        serverSeed,
        serverSeedHash,
        nonce: 0,
      },
    }));
  },
  
  incrementNonce: () => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        nonce: state.gameState.nonce + 1,
      },
    }));
  },
  
  setClientSeed: (seed: string) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        clientSeed: seed,
        nonce: 0,
      },
    }));
  },
  
  // Chat actions
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  
  sendMessage: async (message: string) => {
    const { user, chatMessages } = get();
    if (!user || !message.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      wallet_address: user.wallet_address,
      username: user.username,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };
    
    // Add locally immediately
    set({ chatMessages: [...chatMessages, newMessage].slice(-100) });
    
    if (isDemoMode) return;
    
    try {
      await supabase!.from('chat_messages').insert({
        user_id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        message: message.trim(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },
  
  loadMessages: async () => {
    if (isDemoMode) return;
    
    try {
      const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      set({ chatMessages: data?.reverse() || [] });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  },
  
  subscribeToMessages: () => {
    if (isDemoMode || !supabase) {
      return () => {};
    }
    
    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          set((state) => ({
            chatMessages: [...state.chatMessages, payload.new as ChatMessage].slice(-100),
          }));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
