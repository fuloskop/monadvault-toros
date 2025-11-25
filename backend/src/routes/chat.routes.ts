import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const chatRoutes = Router();

// Get chat history
chatRoutes.get('/:room', async (req, res, next) => {
  try {
    const room = req.params.room;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const messages = await prisma.chatMessage.findMany({
      where: { room, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            level: true,
            isVip: true,
            vipTier: true
          }
        }
      }
    });

    // Reverse to get chronological order
    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
});

// Send message (REST fallback - primarily handled via Socket)
chatRoutes.post('/:room', authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;
    const room = req.params.room;

    if (!content || typeof content !== 'string') {
      throw new AppError(400, 'Message content required', 'CONTENT_REQUIRED');
    }

    if (content.length > 500) {
      throw new AppError(400, 'Message too long (max 500 characters)', 'MESSAGE_TOO_LONG');
    }

    // Check for VIP room access
    if (room === 'vip') {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isVip: true }
      });

      if (!user?.isVip) {
        throw new AppError(403, 'VIP access required', 'VIP_REQUIRED');
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId: req.user!.id,
        room,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            level: true,
            isVip: true,
            vipTier: true
          }
        }
      }
    });

    res.json(message);
  } catch (error) {
    next(error);
  }
});

// Get rain status
chatRoutes.get('/rain/current', async (req, res, next) => {
  try {
    const rain = await prisma.rain.findFirst({
      where: { status: 'active' },
      include: {
        _count: {
          select: { claims: true }
        }
      }
    });

    if (!rain) {
      res.json(null);
      return;
    }

    res.json({
      id: rain.id,
      amount: rain.amount,
      currency: rain.currency,
      claimCount: rain._count.claims,
      maxClaims: rain.maxClaims,
      amountPerClaim: rain.amountPerClaim,
      expiresAt: rain.expiresAt
    });
  } catch (error) {
    next(error);
  }
});

// Claim rain
chatRoutes.post('/rain/claim', authMiddleware, async (req, res, next) => {
  try {
    const rain = await prisma.rain.findFirst({
      where: { status: 'active' }
    });

    if (!rain) {
      throw new AppError(400, 'No active rain', 'NO_ACTIVE_RAIN');
    }

    // Check if already claimed
    const existingClaim = await prisma.rainClaim.findUnique({
      where: {
        rainId_userId: {
          rainId: rain.id,
          odataId: req.user!.id
        }
      }
    });

    if (existingClaim) {
      throw new AppError(400, 'Already claimed', 'ALREADY_CLAIMED');
    }

    // Check if rain is full
    const claimCount = await prisma.rainClaim.count({
      where: { rainId: rain.id }
    });

    if (claimCount >= rain.maxClaims) {
      throw new AppError(400, 'Rain is full', 'RAIN_FULL');
    }

    // Create claim
    const claim = await prisma.rainClaim.create({
      data: {
        rainId: rain.id,
        odataId: req.user!.id,
        amount: rain.amountPerClaim
      }
    });

    // Update rain claim count
    await prisma.rain.update({
      where: { id: rain.id },
      data: { claimCount: { increment: 1 } }
    });

    // Add balance (would also use BalanceService)
    const { BalanceService } = await import('../services/balance.service.js');
    await BalanceService.addBalance(
      req.user!.id,
      rain.currency,
      parseFloat(rain.amountPerClaim.toString()),
      'rain',
      rain.id,
      'Rain claim'
    );

    res.json({
      success: true,
      amount: rain.amountPerClaim,
      currency: rain.currency
    });
  } catch (error) {
    next(error);
  }
});

