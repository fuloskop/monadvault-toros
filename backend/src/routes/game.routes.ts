import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { gameRateLimiter } from '../middleware/rateLimit.js';
import { crashService } from '../services/crash.service.js';
import { WheelService } from '../services/wheel.service.js';
import { MinesService } from '../services/mines.service.js';
import { UpgraderService } from '../services/upgrader.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const gameRoutes = Router();

// ============ CRASH ============

gameRoutes.get('/crash/current', async (req, res, next) => {
  try {
    const game = crashService.getCurrentGame();
    res.json(game || { status: 'waiting' });
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/crash/history', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const history = await crashService.getGameHistory(limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ============ WHEEL ============

gameRoutes.get('/wheel/segments', async (req, res, next) => {
  try {
    const segments = WheelService.getSegments();
    res.json(segments);
  } catch (error) {
    next(error);
  }
});

gameRoutes.post('/wheel/spin', authMiddleware, gameRateLimiter, async (req, res, next) => {
  try {
    const { betAmount, currency = 'MON' } = req.body;

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    const result = await WheelService.spin(req.user!.id, betAmount, currency);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/wheel/history', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const history = await WheelService.getHistory(req.user!.id, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/wheel/recent', async (req, res, next) => {
  try {
    const recent = await WheelService.getRecentSpins(10);
    res.json(recent);
  } catch (error) {
    next(error);
  }
});

// ============ MINES ============

gameRoutes.post('/mines/start', authMiddleware, gameRateLimiter, async (req, res, next) => {
  try {
    const { betAmount, mineCount, currency = 'MON' } = req.body;

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    if (!mineCount || typeof mineCount !== 'number') {
      throw new AppError(400, 'Invalid mine count', 'INVALID_MINE_COUNT');
    }

    const result = await MinesService.startGame(req.user!.id, betAmount, mineCount, currency);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

gameRoutes.post('/mines/reveal', authMiddleware, gameRateLimiter, async (req, res, next) => {
  try {
    const { position } = req.body;

    if (typeof position !== 'number') {
      throw new AppError(400, 'Invalid position', 'INVALID_POSITION');
    }

    const result = await MinesService.revealTile(req.user!.id, position);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

gameRoutes.post('/mines/cashout', authMiddleware, async (req, res, next) => {
  try {
    const result = await MinesService.cashout(req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/mines/current', authMiddleware, async (req, res, next) => {
  try {
    const game = await MinesService.getActiveGame(req.user!.id);
    res.json(game);
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/mines/history', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const history = await MinesService.getHistory(req.user!.id, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ============ UPGRADER ============

gameRoutes.get('/upgrader/config', async (req, res, next) => {
  try {
    const config = UpgraderService.getConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

gameRoutes.post('/upgrader/play', authMiddleware, gameRateLimiter, async (req, res, next) => {
  try {
    const { betAmount, targetMultiplier, currency = 'MON' } = req.body;

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      throw new AppError(400, 'Invalid bet amount', 'INVALID_BET_AMOUNT');
    }

    if (!targetMultiplier || typeof targetMultiplier !== 'number') {
      throw new AppError(400, 'Invalid target multiplier', 'INVALID_MULTIPLIER');
    }

    const result = await UpgraderService.play(req.user!.id, betAmount, targetMultiplier, currency);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

gameRoutes.get('/upgrader/history', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const history = await UpgraderService.getHistory(req.user!.id, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

