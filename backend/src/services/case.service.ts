import { prisma } from '../config/database.js';
import { ProvablyFairService } from './provablyFair.service.js';
import { BalanceService } from './balance.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { GAME_CONFIG } from '../config/index.js';

export interface CaseOpenResult {
  success: boolean;
  item?: {
    id: string;
    name: string;
    imageUrl: string;
    value: number;
    rarity: string;
    color: string;
  };
  caseOpenId?: string;
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
  roll?: number;
  error?: string;
}

export class CaseService {
  /**
   * Get all active cases
   */
  static async getAllCases() {
    return prisma.case.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { price: 'asc' }
      ],
      include: {
        items: {
          orderBy: { value: 'desc' }
        },
        _count: {
          select: { caseOpens: true }
        }
      }
    });
  }

  /**
   * Get case by slug
   */
  static async getCaseBySlug(slug: string) {
    const caseData = await prisma.case.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { value: 'desc' }
        }
      }
    });

    if (!caseData) {
      throw new AppError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    return caseData;
  }

  /**
   * Open a case
   */
  static async openCase(
    userId: string,
    caseSlug: string,
    count: number = 1
  ): Promise<CaseOpenResult[]> {
    if (count < 1 || count > 5) {
      throw new AppError(400, 'Can only open 1-5 cases at once', 'INVALID_COUNT');
    }

    // Get case
    const caseData = await prisma.case.findUnique({
      where: { slug: caseSlug },
      include: {
        items: {
          orderBy: { probability: 'desc' }
        }
      }
    });

    if (!caseData || !caseData.isActive) {
      throw new AppError(404, 'Case not found or inactive', 'CASE_NOT_FOUND');
    }

    const price = parseFloat(caseData.price.toString());
    const totalCost = price * count;

    // Check and deduct balance
    const balance = await BalanceService.getBalance(userId, caseData.currency);
    if (balance < totalCost) {
      throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    await BalanceService.deductBalance(
      userId,
      caseData.currency,
      totalCost,
      'bet',
      caseData.id,
      `Opening ${count}x ${caseData.name}`
    );

    const results: CaseOpenResult[] = [];

    // Open each case
    for (let i = 0; i < count; i++) {
      const result = await this.processSingleOpen(userId, caseData);
      results.push(result);
    }

    // Update case open count
    await prisma.case.update({
      where: { id: caseData.id },
      data: { totalOpens: { increment: count } }
    });

    return results;
  }

  /**
   * Process a single case open
   */
  private static async processSingleOpen(
    userId: string,
    caseData: any
  ): Promise<CaseOpenResult> {
    // Get provably fair roll
    const { roll, serverSeed, serverSeedHash, clientSeed, nonce } = 
      await ProvablyFairService.generateUserRoll(userId);

    // Determine won item based on roll
    const item = this.getItemFromRoll(roll, caseData.items);

    const itemValue = parseFloat(item.value.toString());
    const betAmount = parseFloat(caseData.price.toString());
    const isWin = itemValue > betAmount;

    // Record case open
    const caseOpen = await prisma.caseOpen.create({
      data: {
        userId,
        caseId: caseData.id,
        itemId: item.id,
        betAmount: caseData.price,
        winAmount: item.value,
        currency: caseData.currency,
        serverSeed,
        clientSeed,
        nonce,
        roll,
        isWin
      }
    });

    // Credit winnings
    if (itemValue > 0) {
      await BalanceService.addBalance(
        userId,
        caseData.currency,
        itemValue,
        'win',
        caseOpen.id,
        `Won ${item.name} from ${caseData.name}`
      );
    }

    // Update user stats
    await BalanceService.updateWagerStats(userId, betAmount, itemValue);

    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        value: itemValue,
        rarity: item.rarity,
        color: item.color
      },
      caseOpenId: caseOpen.id,
      serverSeedHash,
      clientSeed,
      nonce,
      roll
    };
  }

  /**
   * Get item from roll based on probabilities
   */
  private static getItemFromRoll(roll: number, items: any[]): any {
    // Calculate cumulative probabilities
    let cumulative = 0;
    
    for (const item of items) {
      cumulative += parseFloat(item.probability.toString());
      if (roll < cumulative) {
        return item;
      }
    }

    // Fallback to last item (shouldn't happen if probabilities sum to 1)
    return items[items.length - 1];
  }

  /**
   * Get user's case opening history
   */
  static async getUserHistory(userId: string, limit: number = 50, offset: number = 0) {
    return prisma.caseOpen.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        case: {
          select: {
            name: true,
            slug: true,
            imageUrl: true
          }
        },
        item: {
          select: {
            name: true,
            imageUrl: true,
            rarity: true,
            color: true
          }
        }
      }
    });
  }

  /**
   * Get recent case opens for live feed
   */
  static async getRecentOpens(limit: number = 20) {
    return prisma.caseOpen.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        case: {
          select: {
            name: true,
            slug: true
          }
        },
        item: {
          select: {
            name: true,
            imageUrl: true,
            value: true,
            rarity: true,
            color: true
          }
        }
      }
    });
  }
}

