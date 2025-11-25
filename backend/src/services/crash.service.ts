import { EventEmitter } from 'events';
import { Server as SocketServer } from 'socket.io';
import { prisma } from '../config/database.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { ProvablyFairService } from './provablyFair.service.js';
import { BalanceService } from './balance.service.js';
import { GAME_CONFIG } from '../config/index.js';

interface CrashBet {
  odataId: string;
  odataId: string;
  odataId: string;
  username: string | null;
  betAmount: number;
  currency: string;
  autoCashout?: number;
  cashoutAt?: number;
  status: 'active' | 'won' | 'lost';
}

interface CrashGameState {
  gameId: string;
  gameNumber: number;
  status: 'betting' | 'running' | 'crashed';
  crashPoint: number;
  currentMultiplier: number;
  startTime?: number;
  bets: Map<string, CrashBet>;
  serverSeed: string;
  serverSeedHash: string;
  publicSeed: string;
}

class CrashGameService extends EventEmitter {
  private io: SocketServer | null = null;
  private currentGame: CrashGameState | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private bettingTimeout: NodeJS.Timeout | null = null;

  private readonly BETTING_DURATION = GAME_CONFIG.crash.bettingDuration;
  private readonly TICK_RATE = GAME_CONFIG.crash.tickRate;
  private readonly DELAY_BETWEEN_GAMES = GAME_CONFIG.crash.delayBetweenGames;
  private readonly HOUSE_EDGE = GAME_CONFIG.houseEdges.crash;

  async initialize(io: SocketServer): Promise<void> {
    this.io = io;
    await this.startNewGame();
  }

  async startNewGame(): Promise<void> {
    // Generate seeds
    const serverSeed = ProvablyFairService.generateServerSeed();
    const serverSeedHash = ProvablyFairService.hashServerSeed(serverSeed);
    
    // Get previous game hash for chain
    const previousGame = await prisma.crashGame.findFirst({
      orderBy: { gameNumber: 'desc' }
    });
    const publicSeed = previousGame?.serverSeedHash || 'genesis';

    // Calculate crash point
    const crashPoint = ProvablyFairService.calculateCrashPoint(
      serverSeed,
      publicSeed,
      this.HOUSE_EDGE
    );

    // Create game record
    const game = await prisma.crashGame.create({
      data: {
        crashPoint,
        serverSeed,
        serverSeedHash,
        publicSeed,
        status: 'betting'
      }
    });

    this.currentGame = {
      gameId: game.id,
      gameNumber: game.gameNumber,
      status: 'betting',
      crashPoint,
      currentMultiplier: 1.0,
      bets: new Map(),
      serverSeed,
      serverSeedHash,
      publicSeed,
    };

    // Cache current game state
    await redis.set(REDIS_KEYS.CRASH_CURRENT, JSON.stringify({
      gameId: game.id,
      gameNumber: game.gameNumber,
      status: 'betting',
      serverSeedHash,
      bettingEndsAt: Date.now() + this.BETTING_DURATION
    }));

    // Emit new game event
    this.io?.to('crash').emit('crash:new', {
      gameId: game.id,
      gameNumber: game.gameNumber,
      serverSeedHash,
      bettingEndsAt: Date.now() + this.BETTING_DURATION
    });

    console.log(`🎮 Crash Game #${game.gameNumber} started (crash: ${crashPoint}x)`);

    // Start betting timer
    this.bettingTimeout = setTimeout(() => this.startCrashing(), this.BETTING_DURATION);
  }

  async placeBet(
    userId: string,
    username: string | null,
    amount: number,
    currency: string,
    autoCashout?: number
  ): Promise<{ success: boolean; error?: string; betId?: string }> {
    if (!this.currentGame || this.currentGame.status !== 'betting') {
      return { success: false, error: 'Betting is closed' };
    }

    if (this.currentGame.bets.has(userId)) {
      return { success: false, error: 'Already placed a bet this round' };
    }

    if (amount < GAME_CONFIG.limits.minBet || amount > GAME_CONFIG.limits.maxBet) {
      return { success: false, error: 'Invalid bet amount' };
    }

    // Deduct balance
    try {
      await BalanceService.deductBalance(
        userId,
        currency,
        amount,
        'bet',
        this.currentGame.gameId,
        `Crash bet - Game #${this.currentGame.gameNumber}`
      );
    } catch {
      return { success: false, error: 'Insufficient balance' };
    }

    // Get user's seeds
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientSeed: true, nonce: true }
    });

    // Create bet record
    const bet = await prisma.crashBet.create({
      data: {
        gameId: this.currentGame.gameId,
        odataId: userId,
        betAmount: amount,
        currency,
        autoCashout,
        status: 'active',
        clientSeed: user?.clientSeed || '',
        nonce: user?.nonce || 0
      }
    });

    // Increment nonce
    await prisma.user.update({
      where: { id: userId },
      data: { nonce: { increment: 1 } }
    });

    this.currentGame.bets.set(userId, {
      odataId: bet.id,
      odataId: odataId,
      odataId: odataId,
      username,
      betAmount: amount,
      currency,
      autoCashout,
      status: 'active'
    });

    // Emit bet placed
    this.io?.to('crash').emit('crash:bet', {
      odataId: odataId,
      username,
      amount,
      autoCashout
    });

    return { success: true, betId: bet.id };
  }

  async cashout(userId: string): Promise<{ success: boolean; multiplier?: number; winAmount?: number }> {
    if (!this.currentGame || this.currentGame.status !== 'running') {
      return { success: false };
    }

    const bet = this.currentGame.bets.get(userId);
    if (!bet || bet.status !== 'active') {
      return { success: false };
    }

    const multiplier = this.currentGame.currentMultiplier;
    const winAmount = bet.betAmount * multiplier;

    bet.cashoutAt = multiplier;
    bet.status = 'won';

    // Update database
    await prisma.crashBet.update({
      where: { id: bet.odataId },
      data: {
        cashoutAt: multiplier,
        winAmount,
        status: 'won'
      }
    });

    // Credit winnings
    await BalanceService.addBalance(
      userId,
      bet.currency,
      winAmount,
      'win',
      this.currentGame.gameId,
      `Crash win @${multiplier.toFixed(2)}x - Game #${this.currentGame.gameNumber}`
    );

    // Update stats
    await BalanceService.updateWagerStats(userId, bet.betAmount, winAmount);

    // Emit cashout
    this.io?.to('crash').emit('crash:cashout', {
      userId,
      username: bet.username,
      multiplier,
      winAmount
    });

    // Emit to live feed
    if (winAmount >= 10) {
      this.io?.to('live').emit('live:win', {
        game: 'crash',
        username: bet.username,
        betAmount: bet.betAmount,
        multiplier,
        winAmount,
        currency: bet.currency
      });
    }

    return { success: true, multiplier, winAmount };
  }

  private async startCrashing(): Promise<void> {
    if (!this.currentGame) return;

    this.currentGame.status = 'running';
    this.currentGame.startTime = Date.now();

    await prisma.crashGame.update({
      where: { id: this.currentGame.gameId },
      data: { status: 'running', startedAt: new Date() }
    });

    await redis.set(REDIS_KEYS.CRASH_CURRENT, JSON.stringify({
      gameId: this.currentGame.gameId,
      gameNumber: this.currentGame.gameNumber,
      status: 'running',
      serverSeedHash: this.currentGame.serverSeedHash,
      startTime: this.currentGame.startTime
    }));

    this.io?.to('crash').emit('crash:started', {
      gameId: this.currentGame.gameId,
      gameNumber: this.currentGame.gameNumber
    });

    // Start tick loop
    this.tickInterval = setInterval(() => this.tick(), this.TICK_RATE);
  }

  private tick(): void {
    if (!this.currentGame || !this.currentGame.startTime) return;

    const elapsed = Date.now() - this.currentGame.startTime;
    
    // Calculate current multiplier using exponential growth
    // Formula: 1.0 * e^(0.00006 * elapsed)
    const multiplier = Math.pow(Math.E, 0.00006 * elapsed);
    this.currentGame.currentMultiplier = Math.floor(multiplier * 100) / 100;

    // Check auto-cashouts
    for (const [userId, bet] of this.currentGame.bets) {
      if (
        bet.status === 'active' &&
        bet.autoCashout &&
        this.currentGame.currentMultiplier >= bet.autoCashout
      ) {
        this.cashout(userId);
      }
    }

    // Emit tick (throttle to every 100ms for performance)
    this.io?.to('crash').volatile.emit('crash:tick', {
      multiplier: this.currentGame.currentMultiplier
    });

    // Check for crash
    if (this.currentGame.currentMultiplier >= this.currentGame.crashPoint) {
      this.crash();
    }
  }

  private async crash(): Promise<void> {
    if (!this.currentGame || this.tickInterval === null) return;

    clearInterval(this.tickInterval);
    this.tickInterval = null;

    const crashPoint = this.currentGame.crashPoint;
    this.currentGame.status = 'crashed';

    // Mark all remaining bets as lost
    for (const [userId, bet] of this.currentGame.bets) {
      if (bet.status === 'active') {
        bet.status = 'lost';
        await prisma.crashBet.update({
          where: { id: bet.odataId },
          data: { status: 'lost' }
        });

        // Update stats (wagered but lost)
        await BalanceService.updateWagerStats(userId, bet.betAmount, 0);
      }
    }

    await prisma.crashGame.update({
      where: { id: this.currentGame.gameId },
      data: {
        status: 'crashed',
        crashedAt: new Date()
      }
    });

    // Emit crash with revealed server seed
    this.io?.to('crash').emit('crash:crashed', {
      gameId: this.currentGame.gameId,
      crashPoint,
      serverSeed: this.currentGame.serverSeed
    });

    console.log(`💥 Crash Game #${this.currentGame.gameNumber} crashed at ${crashPoint}x`);

    // Clear current game
    this.currentGame = null;
    await redis.del(REDIS_KEYS.CRASH_CURRENT);

    // Start next game after delay
    setTimeout(() => this.startNewGame(), this.DELAY_BETWEEN_GAMES);
  }

  getCurrentGame(): Omit<CrashGameState, 'crashPoint' | 'serverSeed'> | null {
    if (!this.currentGame) return null;

    // Don't expose crash point or server seed until game ends
    const { crashPoint, serverSeed, ...safeState } = this.currentGame;
    return {
      ...safeState,
      bets: this.currentGame.bets
    };
  }

  getGameHistory(limit: number = 20): Promise<Array<{
    gameNumber: number;
    crashPoint: number;
    serverSeed: string;
    serverSeedHash: string;
    createdAt: Date;
  }>> {
    return prisma.crashGame.findMany({
      where: { status: 'crashed' },
      orderBy: { gameNumber: 'desc' },
      take: limit,
      select: {
        gameNumber: true,
        crashPoint: true,
        serverSeed: true,
        serverSeedHash: true,
        createdAt: true
      }
    }) as any;
  }
}

export const crashService = new CrashGameService();

