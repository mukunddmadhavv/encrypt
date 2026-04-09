import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/condition
router.get('/', async (req, res, next) => {
  try {
    const condition = await prisma.condition.findUnique({
      where: { userId: req.userId },
      select: { id: true, prompt: true, isActive: true, updatedAt: true },
    });

    return res.json({ success: true, data: { condition } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/condition
// Body: { prompt: string, isActive?: boolean }
router.put('/', async (req, res, next) => {
  try {
    const { prompt, isActive = true } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'prompt must be a string with at least 10 characters',
      });
    }

    const condition = await prisma.condition.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, prompt: prompt.trim(), isActive },
      update: { prompt: prompt.trim(), isActive },
      select: { id: true, prompt: true, isActive: true, updatedAt: true },
    });

    return res.json({ success: true, data: { condition } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/condition
router.delete('/', async (req, res, next) => {
  try {
    await prisma.condition.deleteMany({ where: { userId: req.userId } });
    return res.json({ success: true, data: { message: 'Condition deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
