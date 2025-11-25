export * from './database.js';
export * from './redis.js';
export * from './blockchain.js';

// Game configuration
export const GAME_CONFIG = {
  // House edges
  houseEdges: {
    cases: parseFloat(process.env.CASE_HOUSE_EDGE || '0.05'),
    battles: parseFloat(process.env.CASE_HOUSE_EDGE || '0.05'),
    wheel: parseFloat(process.env.WHEEL_HOUSE_EDGE || '0.04'),
    crash: parseFloat(process.env.CRASH_HOUSE_EDGE || '0.04'),
    mines: parseFloat(process.env.MINES_HOUSE_EDGE || '0.03'),
    upgrader: parseFloat(process.env.UPGRADER_HOUSE_EDGE || '0.05'),
  },

  // Crash game settings
  crash: {
    bettingDuration: 10000, // 10 seconds
    tickRate: 50, // 50ms per tick
    delayBetweenGames: 3000, // 3 seconds
  },

  // Wheel segments
  wheel: {
    segments: [
      { multiplier: 0, color: '#1a1a26', count: 1 },     // BUST (2%)
      { multiplier: 0.2, color: '#3b82f6', count: 8 },   // Blue (16%)
      { multiplier: 0.5, color: '#22c55e', count: 10 },  // Green (20%)
      { multiplier: 1.2, color: '#eab308', count: 12 },  // Yellow (24%)
      { multiplier: 1.5, color: '#f97316', count: 8 },   // Orange (16%)
      { multiplier: 2, color: '#ef4444', count: 5 },     // Red (10%)
      { multiplier: 3, color: '#a855f7', count: 3 },     // Purple (6%)
      { multiplier: 5, color: '#ec4899', count: 2 },     // Pink (4%)
      { multiplier: 50, color: '#00e5f0', count: 1 },    // Jackpot (2%)
    ],
  },

  // Mines settings
  mines: {
    gridSize: 25, // 5x5 grid
    minMines: 1,
    maxMines: 24,
  },

  // XP and leveling
  xp: {
    perDollarWagered: 10,
    levelThresholds: [
      0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, // 1-10
      5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000, // 11-20
      // ... continues
    ],
  },

  // VIP tiers
  vip: {
    tiers: [
      { level: 0, name: 'Bronze', minWagered: 0, rakeback: 0 },
      { level: 1, name: 'Silver', minWagered: 1000, rakeback: 0.05 },
      { level: 2, name: 'Gold', minWagered: 10000, rakeback: 0.10 },
      { level: 3, name: 'Platinum', minWagered: 50000, rakeback: 0.15 },
      { level: 4, name: 'Diamond', minWagered: 200000, rakeback: 0.20 },
      { level: 5, name: 'Obsidian', minWagered: 1000000, rakeback: 0.25 },
    ],
  },

  // Betting limits
  limits: {
    minBet: 0.01,
    maxBet: 10000,
    maxWin: 100000,
  },
} as const;

