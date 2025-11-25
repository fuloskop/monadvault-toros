import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { gameRateLimiter } from '../middleware/rateLimit.js';
import { CaseService } from '../services/case.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const caseRoutes = Router();

// Get all cases
caseRoutes.get('/', async (req, res, next) => {
  try {
    const cases = await CaseService.getAllCases();
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

// Get case by slug
caseRoutes.get('/:slug', async (req, res, next) => {
  try {
    const caseData = await CaseService.getCaseBySlug(req.params.slug);
    res.json(caseData);
  } catch (error) {
    next(error);
  }
});

// Open case(s)
caseRoutes.post('/:slug/open', authMiddleware, gameRateLimiter, async (req, res, next) => {
  try {
    const { count = 1 } = req.body;
    
    if (!Number.isInteger(count) || count < 1 || count > 5) {
      throw new AppError(400, 'Count must be between 1 and 5', 'INVALID_COUNT');
    }

    const results = await CaseService.openCase(
      req.user!.id,
      req.params.slug,
      count
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Get user's case opening history
caseRoutes.get('/history/me', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await CaseService.getUserHistory(req.user!.id, limit, offset);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Get recent case opens (live feed)
caseRoutes.get('/recent/all', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const recent = await CaseService.getRecentOpens(limit);
    res.json(recent);
  } catch (error) {
    next(error);
  }
});

