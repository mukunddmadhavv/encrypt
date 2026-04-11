import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/soul — return current soul profile for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { soulProfile: true, autoReplyEnabled: true },
    });
    return res.json({
      success: true,
      data: {
        soulProfile: user?.soulProfile || '',
        autoReplyEnabled: user?.autoReplyEnabled ?? false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/soul — save soul profile + toggle
// Body: { soulProfile?: string, autoReplyEnabled?: boolean }
router.put('/', async (req, res, next) => {
  try {
    const { soulProfile, autoReplyEnabled } = req.body || {};

    const data = {};
    if (typeof soulProfile === 'string') {
      data.soulProfile = soulProfile.trim() || null;
    }
    if (typeof autoReplyEnabled === 'boolean') {
      data.autoReplyEnabled = autoReplyEnabled;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { soulProfile: true, autoReplyEnabled: true },
    });

    return res.json({
      success: true,
      data: {
        soulProfile: user.soulProfile || '',
        autoReplyEnabled: user.autoReplyEnabled,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
