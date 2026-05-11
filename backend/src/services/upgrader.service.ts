import { prisma } from '../config/database.js';
import { ProvablyFairService } from './provablyFair.service.js';
import { BalanceService } from './balance.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { GAME_CONFIG } from '../config/index.js';

export class UpgraderService {
  private static readonly HOUSE_EDGE = GAME_CONFIG.houseEdges.upgrader;
  private static readonly MIN_MULTIPLIER = 1.01;
  private static readonly MAX_MULTIPLIER = 100;

  /**
   * Calculate win chance for a target multiplier
   */
  static calculateWinChance(targetMultiplier: number): number {
    // Win chance = (1 / multiplier) * (1 - houseEdge) * 100
    const rawChance = 1 / targetMultiplier;
    return rawChance * (1 - this.HOUSE_EDGE) * 100;
  }

  /**
   * Play upgrader
   */
  static async play(
    userId: string,
    betAmount: number,
    targetMultiplier: number,
    currency: string = 'COIN'
  ) {
    // Validate inputs
    if (targetMultiplier < this.MIN_MULTIPLIER || targetMultiplier > this.MAX_MULTIPLIER) {
      throw new AppError(
        400, 
        `Multiplier must be between ${this.MIN_MULTIPLIER}x and ${this.MAX_MULTIPLIER}x`, 
        'INVALID_MULTIPLIER'
      );
    }

    if (betAmount < GAME_CONFIG.limits.minBet || betAmount > GAME_CONFIG.limits.maxBet) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    const potentialWin = betAmount * targetMultiplier;
    if (potentialWin > GAME_CONFIG.limits.maxWin) {
      throw new AppError(400, 'Potential win exceeds maximum', 'MAX_WIN_EXCEEDED');
    }

    // Deduct balance
    await BalanceService.deductBalance(
      userId,
      currency,
      betAmount,
      'bet',
      undefined,
      `Upgrader - ${targetMultiplier}x`
    );

    // Get provably fair roll
    const { roll, serverSeed, serverSeedHash, clientSeed, nonce } = 
      await ProvablyFairService.generateUserRoll(userId);

    // Calculate win chance and determine outcome
    const winChance = this.calculateWinChance(targetMultiplier);
    const winThreshold = winChance / 100; // Convert to 0-1
    const isWin = roll < winThreshold;

    const winAmount = isWin ? potentialWin : 0;

    // Record game
    const game = await prisma.upgraderGame.create({
      data: {
        userId,
        betAmount,
        currency,
        targetMultiplier,
        winChance,
        roll,
        isWin,
        winAmount: isWin ? winAmount : null,
        serverSeed,
        clientSeed,
        nonce
      }
    });

    // Credit winnings if won
    if (isWin) {
      await BalanceService.addBalance(
        userId,
        currency,
        winAmount,
        'win',
        game.id,
        `Upgrader win - ${targetMultiplier}x`
      );
    }

    // Update stats
    await BalanceService.updateWagerStats(userId, betAmount, winAmount);

    return {
      gameId: game.id,
      isWin,
      targetMultiplier,
      winChance,
      winAmount,
      roll,
      serverSeedHash,
      clientSeed,
      nonce
    };
  }

  /**
   * Get user's game history
   */
  static async getHistory(userId: string, limit: number = 20) {
    return prisma.upgraderGame.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        betAmount: true,
        currency: true,
        targetMultiplier: true,
        winChance: true,
        isWin: true,
        winAmount: true,
        createdAt: true
      }
    });
  }

  /**
   * Get configuration
   */
  static getConfig() {
    return {
      minMultiplier: this.MIN_MULTIPLIER,
      maxMultiplier: this.MAX_MULTIPLIER,
      houseEdge: this.HOUSE_EDGE
    };
  }
}

