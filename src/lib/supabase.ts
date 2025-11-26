import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock/null client if env vars aren't set (for demo mode)
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

export const isDemoMode = !supabase;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string | null;
          points: number;
          total_wagered: number;
          total_won: number;
          created_at: string;
        };
        Insert: {
          wallet_address: string;
          username?: string | null;
          points?: number;
          total_wagered?: number;
          total_won?: number;
        };
        Update: {
          username?: string | null;
          points?: number;
          total_wagered?: number;
          total_won?: number;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          game: string;
          amount: number;
          multiplier: number;
          payout: number;
          won: boolean;
          client_seed: string;
          server_seed_hash: string;
          server_seed: string | null;
          nonce: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game: string;
          amount: number;
          multiplier: number;
          payout: number;
          won: boolean;
          client_seed: string;
          server_seed_hash: string;
          server_seed?: string | null;
          nonce: number;
        };
        Update: {
          server_seed?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          username: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          wallet_address: string;
          username?: string | null;
          message: string;
        };
        Update: never;
      };
    };
  };
};

