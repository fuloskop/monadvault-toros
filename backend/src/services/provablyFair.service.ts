import crypto from 'crypto';
import { prisma } from '../config/database.js';

export interface RollResult {
  roll: number;         // 0 to 1
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export class ProvablyFairService {
  /**
   * Generate a new server seed
   */
  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a server seed (shown to user before game)
   */
  static hashServerSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  /**
   * Generate a provably fair roll between 0 and 1
   */
  static generateRoll(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): number {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Use first 8 characters (32 bits) for roll
    const rollInt = parseInt(hash.substring(0, 8), 16);
    return rollInt / 0xFFFFFFFF; // Normalize to 0-1
  }

  /**
   * Generate roll for user with automatic nonce increment
   */
  static async generateUserRoll(userId: string): Promise<RollResult> {
    // Get user's current seed and nonce
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientSeed: true, nonce: true }
    });

    if (!user) throw new Error('User not found');

    // Get or create active server seed for this user
    let serverSeedRecord = await prisma.serverSeed.findFirst({
      where: { userId: userId, isActive: true }
    });

    if (!serverSeedRecord) {
      const newSeed = this.generateServerSeed();
      serverSeedRecord = await prisma.serverSeed.create({
        data: {
          userId: userId,
          seed: newSeed,
          seedHash: this.hashServerSeed(newSeed),
          isActive: true
        }
      });
    }

    const currentNonce = user.nonce;
    const roll = this.generateRoll(
      serverSeedRecord.seed,
      user.clientSeed,
      currentNonce
    );

    // Increment user nonce
    await prisma.user.update({
      where: { id: userId },
      data: { nonce: { increment: 1 } }
    });

    return {
      roll,
      serverSeed: serverSeedRecord.seed,
      serverSeedHash: serverSeedRecord.seedHash,
      clientSeed: user.clientSeed,
      nonce: currentNonce
    };
  }

  /**
   * Calculate crash point for crash game
   * Uses hash chain for verification
   */
  static calculateCrashPoint(
    serverSeed: string,
    publicSeed: string,
    houseEdge: number = 0.04 // 4% house edge
  ): number {
    const combined = `${serverSeed}:${publicSeed}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Convert first 52 bits to number
    const h = parseInt(hash.substring(0, 13), 16);
    const e = Math.pow(2, 52);

    // 1/33 chance of instant crash
    if (h % 33 === 0) return 1.0;

    // Calculate crash point
    let result = (100 * e - h) / (e - h);
    
    // Apply house edge
    result = result * (1 - houseEdge);
    
    // Minimum crash point is 1.00
    return Math.max(1, Math.floor(result) / 100);
  }

  /**
   * Generate mine positions for mines game
   */
  static generateMinePositions(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    mineCount: number
  ): number[] {
    const positions: number[] = [];
    const used = new Set<number>();
    let iteration = 0;

    while (positions.length < mineCount) {
      const combined = `${serverSeed}:${clientSeed}:${nonce}:mines:${iteration}`;
      const hash = crypto.createHash('sha256').update(combined).digest('hex');
      const position = parseInt(hash.substring(0, 8), 16) % 25;

      if (!used.has(position)) {
        used.add(position);
        positions.push(position);
      }
      iteration++;
    }

    return positions;
  }

  /**
   * Get wheel segment from roll
   */
  static getWheelSegment(
    roll: number,
    segments: Array<{ multiplier: number; color: string; count: number }>
  ): { segment: number; multiplier: number; color: string } {
    // Build flat segment list
    const flatSegments: Array<{ index: number; multiplier: number; color: string }> = [];
    let idx = 0;
    
    for (const seg of segments) {
      for (let i = 0; i < seg.count; i++) {
        flatSegments.push({
          index: idx++,
          multiplier: seg.multiplier,
          color: seg.color,
        });
      }
    }

    const totalSegments = flatSegments.length;
    const segmentIndex = Math.floor(roll * totalSegments);
    const selected = flatSegments[segmentIndex];

    return {
      segment: selected.index,
      multiplier: selected.multiplier,
      color: selected.color,
    };
  }

  /**
   * Verify a previous game result
   */
  static verifyResult(
    serverSeed: string,
    serverSeedHash: string,
    clientSeed: string,
    nonce: number
  ): { valid: boolean; roll: number } {
    const calculatedHash = this.hashServerSeed(serverSeed);
    
    if (calculatedHash !== serverSeedHash) {
      return { valid: false, roll: 0 };
    }

    const roll = this.generateRoll(serverSeed, clientSeed, nonce);
    return { valid: true, roll };
  }

  /**
   * Rotate server seed for a user
   */
  static async rotateUserSeed(userId: string): Promise<{
    newClientSeed: string;
    previousServerSeed: string;
    previousServerSeedHash: string;
    newServerSeedHash: string;
  }> {
    const newClientSeed = crypto.randomBytes(16).toString('hex');
    
    // Get current server seed to reveal
    const currentServerSeed = await prisma.serverSeed.findFirst({
      where: { userId: userId, isActive: true }
    });

    // Create new server seed
    const newServerSeed = this.generateServerSeed();
    const newServerSeedHash = this.hashServerSeed(newServerSeed);
    
    await prisma.$transaction([
      // Mark old seed as used
      prisma.serverSeed.updateMany({
        where: { userId: userId, isActive: true },
        data: { isActive: false, revealedAt: new Date() }
      }),
      // Create new seed
      prisma.serverSeed.create({
        data: {
          userId: userId,
          seed: newServerSeed,
          seedHash: newServerSeedHash,
          isActive: true
        }
      }),
      // Update user's client seed and reset nonce
      prisma.user.update({
        where: { id: userId },
        data: {
          clientSeed: newClientSeed,
          nonce: 0
        }
      })
    ]);

    return {
      newClientSeed,
      previousServerSeed: currentServerSeed?.seed || '',
      previousServerSeedHash: currentServerSeed?.seedHash || '',
      newServerSeedHash,
    };
  }

  /**
   * Get user's current seeds (without revealing active server seed)
   */
  static async getUserSeeds(userId: string): Promise<{
    clientSeed: string;
    serverSeedHash: string;
    nonce: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientSeed: true, nonce: true }
    });

    if (!user) throw new Error('User not found');

    const serverSeed = await prisma.serverSeed.findFirst({
      where: { userId: userId, isActive: true }
    });

    if (!serverSeed) {
      // Create one if doesn't exist
      const newSeed = this.generateServerSeed();
      const newServerSeed = await prisma.serverSeed.create({
        data: {
          userId: userId,
          seed: newSeed,
          seedHash: this.hashServerSeed(newSeed),
          isActive: true
        }
      });
      
      return {
        clientSeed: user.clientSeed,
        serverSeedHash: newServerSeed.seedHash,
        nonce: user.nonce
      };
    }

    return {
      clientSeed: user.clientSeed,
      serverSeedHash: serverSeed.seedHash,
      nonce: user.nonce
    };
  }
}

