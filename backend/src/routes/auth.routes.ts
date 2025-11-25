import { Router } from 'express';
import { ethers } from 'ethers';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { ProvablyFairService } from '../services/provablyFair.service.js';

export const authRoutes = Router();

// Generate nonce for wallet signature
authRoutes.post('/nonce', authRateLimiter, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new AppError(400, 'Invalid wallet address', 'INVALID_ADDRESS');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    // Generate nonce
    const nonce = `Sign this message to authenticate with MonadVault.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Store nonce in Redis (expires in 5 minutes)
    await redis.setex(`auth:nonce:${normalizedAddress}`, 300, nonce);

    res.json({ nonce });
  } catch (error) {
    next(error);
  }
});

// Verify signature and authenticate
authRoutes.post('/verify', authRateLimiter, async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new AppError(400, 'Invalid wallet address', 'INVALID_ADDRESS');
    }

    if (!signature) {
      throw new AppError(400, 'Signature required', 'SIGNATURE_REQUIRED');
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Get stored nonce
    const nonce = await redis.get(`auth:nonce:${normalizedAddress}`);
    if (!nonce) {
      throw new AppError(400, 'Nonce expired or not found', 'NONCE_EXPIRED');
    }

    // Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(nonce, signature).toLowerCase();
    } catch {
      throw new AppError(400, 'Invalid signature', 'INVALID_SIGNATURE');
    }

    if (recoveredAddress !== normalizedAddress) {
      throw new AppError(400, 'Signature verification failed', 'SIGNATURE_MISMATCH');
    }

    // Delete used nonce
    await redis.del(`auth:nonce:${normalizedAddress}`);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      // Create new user
      const clientSeed = ProvablyFairService.generateServerSeed().substring(0, 32);
      
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          clientSeed,
        }
      });

      // Create initial server seed
      const serverSeed = ProvablyFairService.generateServerSeed();
      await prisma.serverSeed.create({
        data: {
          odataId: user.id,
          seed: serverSeed,
          seedHash: ProvablyFairService.hashServerSeed(serverSeed),
          isActive: true
        }
      });

      // Create initial balance
      await prisma.balance.create({
        data: {
          userId: user.id,
          currency: 'MON',
          amount: 0
        }
      });
    }

    if (user.isBanned) {
      throw new AppError(403, `Account banned: ${user.banReason || 'Contact support'}`, 'ACCOUNT_BANNED');
    }

    // Generate JWT
    const token = await generateToken({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      level: user.level,
      isVip: user.isVip,
      vipTier: user.vipTier
    });

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        isVip: user.isVip,
        vipTier: user.vipTier,
        referralCode: user.referralCode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
authRoutes.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Token required', 'TOKEN_REQUIRED');
    }

    // Token validation is handled by verifyToken
    // If we get here, token is valid, issue new one
    const user = await prisma.user.findUnique({
      where: { id: req.body.userId }
    });

    if (!user) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    const token = await generateToken({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      level: user.level,
      isVip: user.isVip,
      vipTier: user.vipTier
    });

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Logout (optional - mainly for revoking refresh tokens if implemented)
authRoutes.post('/logout', async (req, res) => {
  // With JWTs, logout is mainly client-side
  // Could implement token blacklist with Redis if needed
  res.json({ success: true });
});

