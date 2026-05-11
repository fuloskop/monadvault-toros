import { prisma } from '../config/database.js';
import { ProvablyFairService } from './provablyFair.service.js';
import { BalanceService } from './balance.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { GAME_CONFIG } from '../config/index.js';

export class WheelService {
  private static readonly SEGMENTS = GAME_CONFIG.wheel.segments;

  /**
   * Build flat segment list
   */
  private static buildSegmentList(): Array<{ index: number; multiplier: number; color: string }> {
    const segments: Array<{ index: number; multiplier: number; color: string }> = [];
    let idx = 0;
    
    for (const seg of this.SEGMENTS) {
      for (let i = 0; i < seg.count; i++) {
        segments.push({
          index: idx++,
          multiplier: seg.multiplier,
          color: seg.color
        });
      }
    }
    
    return segments;
  }

  /**
   * Spin the wheel
   */
  static async spin(
    userId: string,
    betAmount: number,
    currency: string = 'COIN'
  ) {
    // Validate bet
    if (betAmount < GAME_CONFIG.limits.minBet || betAmount > GAME_CONFIG.limits.maxBet) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    // Deduct balance
    await BalanceService.deductBalance(
      userId,
      currency,
      betAmount,
      'bet',
      undefined,
      'Wheel spin'
    );

    // Get provably fair roll
    const { roll, serverSeed, serverSeedHash, clientSeed, nonce } = 
      await ProvablyFairService.generateUserRoll(userId);

    // Determine segment
    const segments = this.buildSegmentList();
    const segmentIndex = Math.floor(roll * segments.length);
    const segment = segments[segmentIndex];
    
    const winAmount = betAmount * segment.multiplier;

    // Record spin
    const wheelSpin = await prisma.wheelSpin.create({
      data: {
        userId,
        betAmount,
        currency,
        multiplier: segment.multiplier,
        winAmount,
        segment: segment.index,
        serverSeed,
        clientSeed,
        nonce,
        roll
      }
    });

    // Credit winnings
    if (winAmount > 0) {
      await BalanceService.addBalance(
        userId,
        currency,
        winAmount,
        'win',
        wheelSpin.id,
        `Wheel win - ${segment.multiplier}x`
      );
    }

    // Update stats
    await BalanceService.updateWagerStats(userId, betAmount, winAmount);

    return {
      spinId: wheelSpin.id,
      segment: segment.index,
      multiplier: segment.multiplier,
      color: segment.color,
      winAmount,
      serverSeedHash,
      clientSeed,
      nonce,
      roll
    };
  }

  /**
   * Get wheel segments configuration
   */
  static getSegments() {
    return this.buildSegmentList();
  }

  /**
   * Get user's spin history
   */
  static async getHistory(userId: string, limit: number = 20) {
    return prisma.wheelSpin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        betAmount: true,
        currency: true,
        multiplier: true,
        winAmount: true,
        segment: true,
        createdAt: true
      }
    });
  }

  /**
   * Get recent spins for live display
   */
  static async getRecentSpins(limit: number = 10) {
    return prisma.wheelSpin.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        multiplier: true,
        segment: true,
        createdAt: true
      }
    });
  }
}

