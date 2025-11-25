import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

export class BalanceService {
  /**
   * Get user balance for a currency
   */
  static async getBalance(userId: string, currency: string): Promise<number> {
    // Try cache first
    const cached = await redis.get(REDIS_KEYS.USER_BALANCE(userId, currency));
    if (cached !== null) {
      return parseFloat(cached);
    }

    // Get from database
    const balance = await prisma.balance.findUnique({
      where: {
        userId_currency: { userId, currency }
      }
    });

    const amount = balance ? parseFloat(balance.amount.toString()) : 0;

    // Cache for 30 seconds
    await redis.setex(REDIS_KEYS.USER_BALANCE(userId, currency), 30, amount.toString());

    return amount;
  }

  /**
   * Get all balances for a user
   */
  static async getAllBalances(userId: string): Promise<Record<string, number>> {
    const balances = await prisma.balance.findMany({
      where: { userId }
    });

    const result: Record<string, number> = {};
    for (const balance of balances) {
      result[balance.currency] = parseFloat(balance.amount.toString());
    }

    return result;
  }

  /**
   * Add to balance (deposit, win, bonus)
   */
  static async addBalance(
    userId: string,
    currency: string,
    amount: number,
    type: string,
    reference?: string,
    description?: string
  ): Promise<number> {
    if (amount <= 0) {
      throw new AppError(400, 'Amount must be positive', 'INVALID_AMOUNT');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      let balance = await tx.balance.findUnique({
        where: {
          userId_currency: { userId, currency }
        }
      });

      const balanceBefore = balance ? parseFloat(balance.amount.toString()) : 0;

      // Upsert balance
      balance = await tx.balance.upsert({
        where: {
          userId_currency: { userId, currency }
        },
        update: {
          amount: { increment: new Prisma.Decimal(amount) }
        },
        create: {
          userId,
          currency,
          amount: new Prisma.Decimal(amount)
        }
      });

      const balanceAfter = parseFloat(balance.amount.toString());

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type,
          currency,
          amount: new Prisma.Decimal(amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reference,
          description
        }
      });

      return balanceAfter;
    });

    // Invalidate cache
    await redis.del(REDIS_KEYS.USER_BALANCE(userId, currency));

    return result;
  }

  /**
   * Deduct from balance (bet, withdrawal)
   */
  static async deductBalance(
    userId: string,
    currency: string,
    amount: number,
    type: string,
    reference?: string,
    description?: string
  ): Promise<number> {
    if (amount <= 0) {
      throw new AppError(400, 'Amount must be positive', 'INVALID_AMOUNT');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const balance = await tx.balance.findUnique({
        where: {
          userId_currency: { userId, currency }
        }
      });

      if (!balance) {
        throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      const balanceBefore = parseFloat(balance.amount.toString());

      if (balanceBefore < amount) {
        throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      // Update balance
      const updatedBalance = await tx.balance.update({
        where: {
          userId_currency: { userId, currency }
        },
        data: {
          amount: { decrement: new Prisma.Decimal(amount) }
        }
      });

      const balanceAfter = parseFloat(updatedBalance.amount.toString());

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type,
          currency,
          amount: new Prisma.Decimal(-amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reference,
          description
        }
      });

      return balanceAfter;
    });

    // Invalidate cache
    await redis.del(REDIS_KEYS.USER_BALANCE(userId, currency));

    return result;
  }

  /**
   * Lock balance for pending bet
   */
  static async lockBalance(
    userId: string,
    currency: string,
    amount: number
  ): Promise<void> {
    if (amount <= 0) {
      throw new AppError(400, 'Amount must be positive', 'INVALID_AMOUNT');
    }

    await prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          userId_currency: { userId, currency }
        }
      });

      if (!balance) {
        throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      const available = parseFloat(balance.amount.toString()) - parseFloat(balance.locked.toString());

      if (available < amount) {
        throw new AppError(400, 'Insufficient available balance', 'INSUFFICIENT_BALANCE');
      }

      await tx.balance.update({
        where: {
          userId_currency: { userId, currency }
        },
        data: {
          locked: { increment: new Prisma.Decimal(amount) }
        }
      });
    });

    await redis.del(REDIS_KEYS.USER_BALANCE(userId, currency));
  }

  /**
   * Unlock balance (cancel pending bet)
   */
  static async unlockBalance(
    userId: string,
    currency: string,
    amount: number
  ): Promise<void> {
    await prisma.balance.update({
      where: {
        userId_currency: { userId, currency }
      },
      data: {
        locked: { decrement: new Prisma.Decimal(amount) }
      }
    });

    await redis.del(REDIS_KEYS.USER_BALANCE(userId, currency));
  }

  /**
   * Settle locked balance (finalize bet)
   */
  static async settleLocked(
    userId: string,
    currency: string,
    lockedAmount: number,
    winAmount: number,
    type: string,
    reference?: string
  ): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({
        where: {
          userId_currency: { userId, currency }
        }
      });

      if (!balance) {
        throw new AppError(400, 'Balance not found', 'BALANCE_NOT_FOUND');
      }

      const balanceBefore = parseFloat(balance.amount.toString());
      
      // Calculate net change: remove locked, add winAmount
      const netChange = winAmount - lockedAmount;

      // Update balance
      const updatedBalance = await tx.balance.update({
        where: {
          userId_currency: { userId, currency }
        },
        data: {
          amount: { increment: new Prisma.Decimal(netChange) },
          locked: { decrement: new Prisma.Decimal(lockedAmount) }
        }
      });

      const balanceAfter = parseFloat(updatedBalance.amount.toString());

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type,
          currency,
          amount: new Prisma.Decimal(netChange),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reference,
          description: winAmount > lockedAmount ? 'Win' : 'Loss'
        }
      });

      return balanceAfter;
    });

    await redis.del(REDIS_KEYS.USER_BALANCE(userId, currency));

    return result;
  }

  /**
   * Update user wagering stats
   */
  static async updateWagerStats(
    userId: string,
    wagered: number,
    won: number
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalWagered: { increment: new Prisma.Decimal(wagered) },
        totalWon: { increment: new Prisma.Decimal(won) },
        xp: { increment: Math.floor(wagered * 10) } // 10 XP per dollar wagered
      }
    });
  }
}

