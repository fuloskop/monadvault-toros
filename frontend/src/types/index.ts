// User types
export interface User {
  id: string;
  walletAddress: string;
  username: string | null;
  avatar: string | null;
  level: number;
  xp: number;
  totalWagered: number;
  totalWon: number;
  isVip: boolean;
  vipTier: number;
  referralCode: string;
  createdAt: string;
}

// Balance types
export interface Balance {
  currency: string;
  amount: number;
  locked: number;
}

// Case types
export interface CaseItem {
  id: string;
  name: string;
  imageUrl: string;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  probability: number;
  color: string;
}

export interface Case {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  price: number;
  currency: string;
  category: string;
  isFeatured: boolean;
  isActive: boolean;
  items: CaseItem[];
  totalOpens: number;
}

export interface CaseOpenResult {
  success: boolean;
  item: CaseItem;
  caseOpenId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  roll: number;
}

// Battle types
export interface BattleCase {
  case: {
    name: string;
    imageUrl: string;
    price: number;
  };
  quantity: number;
  order: number;
}

export interface BattleParticipant {
  id: string;
  user: {
    id: string;
    username: string | null;
    avatar: string | null;
  } | null;
  slot: number;
  isBot: boolean;
  totalValue: number;
  isWinner: boolean;
}

export interface BattleRound {
  id: string;
  roundNumber: number;
  participantId: string;
  itemName: string;
  itemValue: number;
  itemRarity: string;
  itemImageUrl: string;
}

export interface Battle {
  id: string;
  creator: User;
  mode: '1v1' | '2v2' | '1v1v1' | '1v1v1v1';
  totalCost: number;
  currency: string;
  isPrivate: boolean;
  privateCode: string | null;
  cursedMode: boolean;
  serverSeedHash: string;
  serverSeed?: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  winnerId: string | null;
  cases: BattleCase[];
  participants: BattleParticipant[];
  rounds: BattleRound[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// Crash types
export interface CrashBet {
  id: string;
  userId: string;
  username: string | null;
  betAmount: number;
  currency: string;
  autoCashout?: number;
  cashoutAt?: number;
  winAmount?: number;
  status: 'active' | 'won' | 'lost';
}

export interface CrashGame {
  gameId: string;
  gameNumber: number;
  status: 'betting' | 'running' | 'crashed';
  crashPoint?: number;
  currentMultiplier: number;
  serverSeedHash: string;
  serverSeed?: string;
  publicSeed: string;
  bettingEndsAt?: number;
  startTime?: number;
  bets: CrashBet[];
}

// Mines types
export interface MinesGame {
  gameId: string;
  mineCount: number;
  betAmount: number;
  currency: string;
  revealed: number[];
  minePositions?: number[];
  status: 'active' | 'won' | 'lost';
  currentMultiplier: number;
  serverSeedHash: string;
}

// Wheel types
export interface WheelSegment {
  index: number;
  multiplier: number;
  color: string;
}

export interface WheelSpinResult {
  spinId: string;
  segment: number;
  multiplier: number;
  color: string;
  winAmount: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  roll: number;
}

// Upgrader types
export interface UpgraderResult {
  gameId: string;
  isWin: boolean;
  targetMultiplier: number;
  winChance: number;
  winAmount: number;
  roll: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  user: {
    id: string;
    username: string | null;
    avatar: string | null;
    level: number;
    isVip: boolean;
    vipTier: number;
  };
  room: string;
  content: string;
  createdAt: string;
}

// Transaction types
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus' | 'referral' | 'rain';
  currency: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  createdAt: string;
}

// Provably Fair types
export interface SeedInfo {
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
}

export interface VerificationResult {
  valid: boolean;
  roll: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

// Socket Event types
export interface SocketEvents {
  // Crash events
  'crash:new': (data: { gameId: string; gameNumber: number; serverSeedHash: string; bettingEndsAt: number }) => void;
  'crash:started': (data: { gameId: string; gameNumber: number }) => void;
  'crash:tick': (data: { multiplier: number }) => void;
  'crash:crashed': (data: { gameId: string; crashPoint: number; serverSeed: string }) => void;
  'crash:bet': (data: CrashBet) => void;
  'crash:cashout': (data: { userId: string; username: string | null; multiplier: number; winAmount: number }) => void;
  
  // Battle events
  'battle:update': (data: Battle) => void;
  'battle:round': (data: BattleRound) => void;
  'battle:complete': (data: { battleId: string; winnerId: string }) => void;
  
  // Chat events
  'chat:message': (data: ChatMessage) => void;
  
  // Live feed
  'live:win': (data: { game: string; username: string; betAmount: number; multiplier: number; winAmount: number; currency: string }) => void;
  
  // Rain
  'rain:start': (data: { id: string; amount: number; currency: string; maxClaims: number; expiresAt: string }) => void;
  'rain:claim': (data: { userId: string; username: string }) => void;
  'rain:end': () => void;
  
  // General
  'error': (data: { message: string }) => void;
  'online:count': (count: number) => void;
}

