import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/notify-target
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { notifyTargetJid: true, notifyTargetPhone: true },
    });
    return res.json({
      success: true,
      data: {
        notifyTargetJid: user?.notifyTargetJid || null,
        notifyTargetPhone: user?.notifyTargetPhone || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notify-target
// Body: { notifyTargetJid?: string | null, notifyTargetPhone?: string | null }
router.put('/', async (req, res, next) => {
  try {
    const { notifyTargetJid = null, notifyTargetPhone = null } = req.body || {};

    const jid = typeof notifyTargetJid === 'string' ? notifyTargetJid.trim() : null;
    const phone = typeof notifyTargetPhone === 'string' ? notifyTargetPhone.trim() : null;

    if (jid && !jid.endsWith('@s.whatsapp.net')) {
      return res.status(400).json({ success: false, error: 'notifyTargetJid must end with @s.whatsapp.net' });
    }

    const data = {
      notifyTargetJid: jid || null,
      notifyTargetPhone: phone || null,
    };

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { notifyTargetJid: true, notifyTargetPhone: true },
    });

    return res.json({ success: true, data: { notifyTargetJid: user.notifyTargetJid, notifyTargetPhone: user.notifyTargetPhone } });
  } catch (err) {
    next(err);
  }
});

export default router;
