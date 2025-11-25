import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { BalanceService } from '../services/balance.service.js';
import { ProvablyFairService } from '../services/provablyFair.service.js';

export const battleRoutes = Router();

// Get active battles
battleRoutes.get('/', async (req, res, next) => {
  try {
    const battles = await prisma.battle.findMany({
      where: {
        status: { in: ['waiting', 'in_progress'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        cases: {
          include: {
            case: {
              select: { name: true, imageUrl: true, price: true }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        }
      }
    });

    res.json(battles);
  } catch (error) {
    next(error);
  }
});

// Get battle by ID
battleRoutes.get('/:id', async (req, res, next) => {
  try {
    const battle = await prisma.battle.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        cases: {
          include: {
            case: {
              select: { name: true, imageUrl: true, price: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          },
          orderBy: { slot: 'asc' }
        },
        rounds: {
          orderBy: [{ roundNumber: 'asc' }, { participantId: 'asc' }]
        }
      }
    });

    if (!battle) {
      throw new AppError(404, 'Battle not found', 'BATTLE_NOT_FOUND');
    }

    // Hide server seed if battle not completed
    if (battle.status !== 'completed') {
      (battle as any).serverSeed = undefined;
    }

    res.json(battle);
  } catch (error) {
    next(error);
  }
});

// Create battle
battleRoutes.post('/create', authMiddleware, async (req, res, next) => {
  try {
    const { mode, cases: caseIds, cursedMode = false, isPrivate = false } = req.body;

    // Validate mode
    const validModes = ['1v1', '2v2', '1v1v1', '1v1v1v1'];
    if (!validModes.includes(mode)) {
      throw new AppError(400, 'Invalid battle mode', 'INVALID_MODE');
    }

    // Validate cases
    if (!Array.isArray(caseIds) || caseIds.length === 0 || caseIds.length > 10) {
      throw new AppError(400, 'Must select 1-10 cases', 'INVALID_CASES');
    }

    // Get cases and calculate total cost
    const cases = await prisma.case.findMany({
      where: { id: { in: caseIds }, isActive: true }
    });

    if (cases.length !== caseIds.length) {
      throw new AppError(400, 'One or more cases not found', 'CASES_NOT_FOUND');
    }

    const totalCost = cases.reduce((sum, c) => sum + parseFloat(c.price.toString()), 0);
    const currency = cases[0].currency;

    // Check balance
    const balance = await BalanceService.getBalance(req.user!.id, currency);
    if (balance < totalCost) {
      throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    // Deduct balance
    await BalanceService.deductBalance(
      req.user!.id,
      currency,
      totalCost,
      'bet',
      undefined,
      `Creating battle - ${mode}`
    );

    // Generate server seed
    const serverSeed = ProvablyFairService.generateServerSeed();
    const serverSeedHash = ProvablyFairService.hashServerSeed(serverSeed);

    // Create battle
    const battle = await prisma.battle.create({
      data: {
        creatorId: req.user!.id,
        mode,
        totalCost,
        currency,
        isPrivate,
        privateCode: isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
        cursedMode,
        serverSeed,
        serverSeedHash,
        cases: {
          create: caseIds.map((caseId: string, index: number) => ({
            caseId,
            quantity: 1,
            order: index
          }))
        },
        participants: {
          create: {
            odataId: req.user!.id,
            slot: 0,
            isBot: false
          }
        }
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        cases: {
          include: {
            case: {
              select: { name: true, imageUrl: true, price: true }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        }
      }
    });

    res.json(battle);
  } catch (error) {
    next(error);
  }
});

// Join battle
battleRoutes.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const { slot } = req.body;

    const battle = await prisma.battle.findUnique({
      where: { id: req.params.id },
      include: {
        participants: true,
        cases: true
      }
    });

    if (!battle) {
      throw new AppError(404, 'Battle not found', 'BATTLE_NOT_FOUND');
    }

    if (battle.status !== 'waiting') {
      throw new AppError(400, 'Battle already started', 'BATTLE_STARTED');
    }

    // Check if slot is valid and available
    const maxSlots = parseInt(battle.mode.replace(/v/g, '').split('').reduce((a, b) => a + parseInt(b), 0).toString());
    if (slot < 0 || slot >= maxSlots) {
      throw new AppError(400, 'Invalid slot', 'INVALID_SLOT');
    }

    const slotTaken = battle.participants.some(p => p.slot === slot);
    if (slotTaken) {
      throw new AppError(400, 'Slot already taken', 'SLOT_TAKEN');
    }

    // Check if user already in battle
    const alreadyJoined = battle.participants.some(p => p.odataId === req.user!.id);
    if (alreadyJoined) {
      throw new AppError(400, 'Already in this battle', 'ALREADY_JOINED');
    }

    // Check balance
    const totalCost = parseFloat(battle.totalCost.toString());
    const balance = await BalanceService.getBalance(req.user!.id, battle.currency);
    if (balance < totalCost) {
      throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    // Deduct balance
    await BalanceService.deductBalance(
      req.user!.id,
      battle.currency,
      totalCost,
      'bet',
      battle.id,
      `Joining battle - ${battle.mode}`
    );

    // Add participant
    await prisma.battleParticipant.create({
      data: {
        battleId: battle.id,
        odataId: req.user!.id,
        slot,
        isBot: false
      }
    });

    // Check if battle is full and start it
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    const requiredPlayers = parseInt(battle.mode.replace(/v/g, '').split('').reduce((a, b) => a + parseInt(b), 0).toString());
    
    if (updatedBattle!.participants.length >= requiredPlayers) {
      // Start battle (would trigger via socket in real implementation)
      await prisma.battle.update({
        where: { id: battle.id },
        data: { status: 'in_progress', startedAt: new Date() }
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add bot to battle
battleRoutes.post('/:id/bot', authMiddleware, async (req, res, next) => {
  try {
    const { slot } = req.body;

    const battle = await prisma.battle.findUnique({
      where: { id: req.params.id },
      include: { participants: true }
    });

    if (!battle) {
      throw new AppError(404, 'Battle not found', 'BATTLE_NOT_FOUND');
    }

    if (battle.creatorId !== req.user!.id) {
      throw new AppError(403, 'Only creator can add bots', 'NOT_CREATOR');
    }

    if (battle.status !== 'waiting') {
      throw new AppError(400, 'Battle already started', 'BATTLE_STARTED');
    }

    // Validate slot
    const maxSlots = parseInt(battle.mode.replace(/v/g, '').split('').reduce((a, b) => a + parseInt(b), 0).toString());
    if (slot < 0 || slot >= maxSlots) {
      throw new AppError(400, 'Invalid slot', 'INVALID_SLOT');
    }

    const slotTaken = battle.participants.some(p => p.slot === slot);
    if (slotTaken) {
      throw new AppError(400, 'Slot already taken', 'SLOT_TAKEN');
    }

    // Add bot
    await prisma.battleParticipant.create({
      data: {
        battleId: battle.id,
        odataId: null,
        slot,
        isBot: true
      }
    });

    // Check if battle is full
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battle.id },
      include: { participants: true }
    });

    const requiredPlayers = parseInt(battle.mode.replace(/v/g, '').split('').reduce((a, b) => a + parseInt(b), 0).toString());
    
    if (updatedBattle!.participants.length >= requiredPlayers) {
      await prisma.battle.update({
        where: { id: battle.id },
        data: { status: 'in_progress', startedAt: new Date() }
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get battle history
battleRoutes.get('/history/me', authMiddleware, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const battles = await prisma.battle.findMany({
      where: {
        OR: [
          { creatorId: req.user!.id },
          { participants: { some: { odataId: req.user!.id } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        creator: {
          select: { id: true, username: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      }
    });

    res.json(battles);
  } catch (error) {
    next(error);
  }
});

