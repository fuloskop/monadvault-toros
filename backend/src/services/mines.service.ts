import { prisma } from '../config/database.js';
import { ProvablyFairService } from './provablyFair.service.js';
import { BalanceService } from './balance.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { GAME_CONFIG } from '../config/index.js';

// MySQL port (Task 32): minePositions/revealed schema'da `Json` tipinde
// tutuluyor (postgres Int[] kalktı). Prisma JsonValue döndürdüğü için
// .includes/.length çağrılarından önce number[] cast'i gerekiyor.
function asInts(v: unknown): number[] {
  return Array.isArray(v) ? (v as number[]) : [];
}

export class MinesService {
  private static readonly GRID_SIZE = 25; // 5x5
  private static readonly HOUSE_EDGE = GAME_CONFIG.houseEdges.mines;

  /**
   * Calculate multiplier based on mines and revealed tiles
   */
  static calculateMultiplier(mineCount: number, revealed: number): number {
    const safeTiles = this.GRID_SIZE - mineCount;
    
    if (revealed === 0) return 1;
    
    // Calculate probability of surviving to this point
    let probability = 1;
    for (let i = 0; i < revealed; i++) {
      probability *= (safeTiles - i) / (this.GRID_SIZE - i);
    }
    
    // Multiplier = 1 / probability * (1 - houseEdge)
    const rawMultiplier = 1 / probability;
    return parseFloat((rawMultiplier * (1 - this.HOUSE_EDGE)).toFixed(4));
  }

  /**
   * Start a new mines game
   */
  static async startGame(
    userId: string,
    betAmount: number,
    mineCount: number,
    currency: string = 'COIN'
  ) {
    // Validate inputs
    if (mineCount < 1 || mineCount > 24) {
      throw new AppError(400, 'Mine count must be between 1 and 24', 'INVALID_MINE_COUNT');
    }

    if (betAmount < GAME_CONFIG.limits.minBet || betAmount > GAME_CONFIG.limits.maxBet) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    // Check for existing active game
    const existingGame = await prisma.mineGame.findFirst({
      where: { userId, status: 'active' }
    });

    if (existingGame) {
      throw new AppError(400, 'You have an active game. Cashout or finish it first.', 'GAME_IN_PROGRESS');
    }

    // Deduct balance
    await BalanceService.deductBalance(
      userId,
      currency,
      betAmount,
      'bet',
      undefined,
      `Mines game - ${mineCount} mines`
    );

    // Get user's seeds
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientSeed: true, nonce: true }
    });

    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    // Get server seed
    let serverSeed = await prisma.serverSeed.findFirst({
      where: { userId: userId, isActive: true }
    });

    if (!serverSeed) {
      const newSeed = ProvablyFairService.generateServerSeed();
      serverSeed = await prisma.serverSeed.create({
        data: {
          userId: userId,
          seed: newSeed,
          seedHash: ProvablyFairService.hashServerSeed(newSeed),
          isActive: true
        }
      });
    }

    // Generate mine positions
    const minePositions = ProvablyFairService.generateMinePositions(
      serverSeed.seed,
      user.clientSeed,
      user.nonce,
      mineCount
    );

    // Create game
    const game = await prisma.mineGame.create({
      data: {
        userId,
        betAmount,
        currency,
        mineCount,
        minePositions,
        revealed: [],
        status: 'active',
        currentMultiplier: 1,
        serverSeed: serverSeed.seed,
        clientSeed: user.clientSeed,
        nonce: user.nonce
      }
    });

    // Increment nonce
    await prisma.user.update({
      where: { id: userId },
      data: { nonce: { increment: 1 } }
    });

    return {
      gameId: game.id,
      mineCount,
      serverSeedHash: serverSeed.seedHash,
      betAmount,
      currency
    };
  }

  /**
   * Reveal a tile
   */
  static async revealTile(userId: string, position: number) {
    // Validate position
    if (position < 0 || position >= this.GRID_SIZE) {
      throw new AppError(400, 'Invalid tile position', 'INVALID_POSITION');
    }

    // Get active game
    const game = await prisma.mineGame.findFirst({
      where: { userId, status: 'active' }
    });

    if (!game) {
      throw new AppError(404, 'No active game found', 'NO_ACTIVE_GAME');
    }

    // MySQL Json field cast (Task 32)
    const revealedArr = asInts(game.revealed);
    const minePositionsArr = asInts(game.minePositions);

    // Check if already revealed
    if (revealedArr.includes(position)) {
      throw new AppError(400, 'Tile already revealed', 'TILE_REVEALED');
    }

    // Check if it's a mine
    const isMine = minePositionsArr.includes(position);
    const newRevealed = [...revealedArr, position];

    if (isMine) {
      // Game over - player loses
      const updatedGame = await prisma.mineGame.update({
        where: { id: game.id },
        data: {
          revealed: newRevealed,
          status: 'lost',
          completedAt: new Date()
        }
      });

      // Update stats
      await BalanceService.updateWagerStats(
        userId,
        parseFloat(game.betAmount.toString()),
        0
      );

      return {
        gameId: game.id,
        position,
        isMine: true,
        minePositions: minePositionsArr,
        serverSeed: game.serverSeed,
        status: 'lost',
        winAmount: 0
      };
    }

    // Safe tile
    const newMultiplier = this.calculateMultiplier(game.mineCount, newRevealed.length);
    const safeTilesLeft = this.GRID_SIZE - game.mineCount - newRevealed.length;

    // Check if all safe tiles revealed (auto-win)
    if (safeTilesLeft === 0) {
      const winAmount = parseFloat(game.betAmount.toString()) * newMultiplier;
      
      const updatedGame = await prisma.mineGame.update({
        where: { id: game.id },
        data: {
          revealed: newRevealed,
          currentMultiplier: newMultiplier,
          status: 'won',
          winAmount,
          completedAt: new Date()
        }
      });

      // Credit winnings
      await BalanceService.addBalance(
        userId,
        game.currency,
        winAmount,
        'win',
        game.id,
        `Mines win - ${newMultiplier}x`
      );

      await BalanceService.updateWagerStats(
        userId,
        parseFloat(game.betAmount.toString()),
        winAmount
      );

      return {
        gameId: game.id,
        position,
        isMine: false,
        multiplier: newMultiplier,
        nextMultiplier: null,
        safeTilesLeft: 0,
        minePositions: minePositionsArr,
        serverSeed: game.serverSeed,
        status: 'won',
        winAmount
      };
    }

    // Update game state
    await prisma.mineGame.update({
      where: { id: game.id },
      data: {
        revealed: newRevealed,
        currentMultiplier: newMultiplier
      }
    });

    const nextMultiplier = this.calculateMultiplier(game.mineCount, newRevealed.length + 1);

    return {
      gameId: game.id,
      position,
      isMine: false,
      multiplier: newMultiplier,
      nextMultiplier,
      safeTilesLeft,
      status: 'active'
    };
  }

  /**
   * Cashout current game
   */
  static async cashout(userId: string) {
    const game = await prisma.mineGame.findFirst({
      where: { userId, status: 'active' }
    });

    if (!game) {
      throw new AppError(404, 'No active game found', 'NO_ACTIVE_GAME');
    }

    // MySQL Json field cast (Task 32)
    const revealedArr = asInts(game.revealed);
    const minePositionsArr = asInts(game.minePositions);

    if (revealedArr.length === 0) {
      throw new AppError(400, 'Must reveal at least one tile before cashing out', 'NO_TILES_REVEALED');
    }

    const multiplier = parseFloat(game.currentMultiplier.toString());
    const betAmount = parseFloat(game.betAmount.toString());
    const winAmount = betAmount * multiplier;

    // Update game
    const updatedGame = await prisma.mineGame.update({
      where: { id: game.id },
      data: {
        status: 'won',
        winAmount,
        completedAt: new Date()
      }
    });

    // Credit winnings
    await BalanceService.addBalance(
      userId,
      game.currency,
      winAmount,
      'win',
      game.id,
      `Mines cashout - ${multiplier}x`
    );

    // Update stats
    await BalanceService.updateWagerStats(userId, betAmount, winAmount);

    return {
      gameId: game.id,
      multiplier,
      winAmount,
      minePositions: minePositionsArr,
      serverSeed: game.serverSeed,
      status: 'won'
    };
  }

  /**
   * Get active game for user
   */
  static async getActiveGame(userId: string) {
    return prisma.mineGame.findFirst({
      where: { userId, status: 'active' },
      select: {
        id: true,
        betAmount: true,
        currency: true,
        mineCount: true,
        revealed: true,
        currentMultiplier: true,
        createdAt: true
      }
    });
  }

  /**
   * Get user's game history
   */
  static async getHistory(userId: string, limit: number = 20) {
    return prisma.mineGame.findMany({
      where: { userId, status: { not: 'active' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        betAmount: true,
        currency: true,
        mineCount: true,
        revealed: true,
        status: true,
        currentMultiplier: true,
        winAmount: true,
        createdAt: true
      }
    });
  }
}

