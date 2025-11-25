import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { BalanceService } from '../services/balance.service.js';
import { ProvablyFairService } from '../services/provablyFair.service.js';

export const userRoutes = Router();

// Get current user profile
userRoutes.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        avatar: true,
        level: true,
        xp: true,
        totalWagered: true,
        totalWon: true,
        isVip: true,
        vipTier: true,
        referralCode: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update profile
userRoutes.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const updates: any = {};

    if (username !== undefined) {
      // Validate username
      if (username && (username.length < 3 || username.length > 20)) {
        throw new AppError(400, 'Username must be 3-20 characters', 'INVALID_USERNAME');
      }
      if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new AppError(400, 'Username can only contain letters, numbers, and underscores', 'INVALID_USERNAME');
      }

      // Check if username is taken
      if (username) {
        const existing = await prisma.user.findUnique({
          where: { username }
        });
        if (existing && existing.id !== req.user!.id) {
          throw new AppError(400, 'Username already taken', 'USERNAME_TAKEN');
        }
      }

      updates.username = username || null;
    }

    if (avatar !== undefined) {
      // Validate avatar URL
      if (avatar && !avatar.match(/^https?:\/\//)) {
        throw new AppError(400, 'Invalid avatar URL', 'INVALID_AVATAR');
      }
      updates.avatar = avatar || null;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      select: {
        id: true,
        username: true,
        avatar: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get balances
userRoutes.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const balances = await BalanceService.getAllBalances(req.user!.id);
    res.json(balances);
  } catch (error) {
    next(error);
  }
});

// Get transaction history
userRoutes.get('/transactions', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;

    const where: any = { userId: req.user!.id };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        currency: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        description: true,
        createdAt: true
      }
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

// Get user stats
userRoutes.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        totalWagered: true,
        totalWon: true,
        totalDeposited: true,
        totalWithdrawn: true,
        level: true,
        xp: true,
        _count: {
          select: {
            caseOpens: true,
            wheelSpins: true,
            crashBets: true,
            mineGames: true,
            upgraderGames: true
          }
        }
      }
    });

    res.json({
      ...user,
      profit: parseFloat(user!.totalWon.toString()) - parseFloat(user!.totalWagered.toString()),
      gamesPlayed: Object.values(user!._count).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    next(error);
  }
});

// Get current seeds
userRoutes.get('/seed', authMiddleware, async (req, res, next) => {
  try {
    const seeds = await ProvablyFairService.getUserSeeds(req.user!.id);
    res.json(seeds);
  } catch (error) {
    next(error);
  }
});

// Rotate seeds
userRoutes.post('/seed/rotate', authMiddleware, async (req, res, next) => {
  try {
    const { newClientSeed } = req.body;
    
    // If user provides new client seed, use it
    if (newClientSeed) {
      if (typeof newClientSeed !== 'string' || newClientSeed.length < 1 || newClientSeed.length > 64) {
        throw new AppError(400, 'Client seed must be 1-64 characters', 'INVALID_CLIENT_SEED');
      }
    }

    const result = await ProvablyFairService.rotateUserSeed(req.user!.id);
    
    // If user provided custom client seed, update it
    if (newClientSeed) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { clientSeed: newClientSeed }
      });
      result.newClientSeed = newClientSeed;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get referral info
userRoutes.get('/referrals', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        referralCode: true,
        referrals: {
          select: {
            id: true,
            username: true,
            totalWagered: true,
            createdAt: true
          }
        }
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Apply referral code
userRoutes.post('/referral/apply', authMiddleware, async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new AppError(400, 'Referral code required', 'CODE_REQUIRED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (user?.referredBy) {
      throw new AppError(400, 'You have already used a referral code', 'ALREADY_REFERRED');
    }

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code }
    });

    if (!referrer) {
      throw new AppError(400, 'Invalid referral code', 'INVALID_CODE');
    }

    if (referrer.id === req.user!.id) {
      throw new AppError(400, 'Cannot use your own referral code', 'SELF_REFERRAL');
    }

    // Apply referral
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { referredBy: code }
    });

    res.json({ success: true, message: 'Referral code applied!' });
  } catch (error) {
    next(error);
  }
});

