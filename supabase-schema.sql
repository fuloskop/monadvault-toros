-- Foxie Casino Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  points INTEGER DEFAULT 100,
  total_wagered DECIMAL(18,8) DEFAULT 0,
  total_won DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL,
  payout DECIMAL(18,8) NOT NULL,
  won BOOLEAN NOT NULL,
  client_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL,
  server_seed TEXT,
  nonce INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  username TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game ON bets(game);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (true);

-- Policies for bets
CREATE POLICY "Anyone can view bets" ON bets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bets" ON bets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bets" ON bets FOR UPDATE USING (true);

-- Policies for chat
CREATE POLICY "Anyone can view messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

