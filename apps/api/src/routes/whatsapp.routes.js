import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createSession, disconnectSession, isSessionActive } from '../services/baileys.service.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// POST /api/whatsapp/request-code
// Initiates the WebSocket handshake to generate a QR code.
router.post('/request-code', async (req, res, next) => {
  try {
    const userId = req.userId;

    // Check if already connected
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.isConnected && isSessionActive(userId)) {
      return res.json({
        success: true,
        data: { status: 'already_connected' },
      });
    }

    // Clear any stale or partial sessions before generating a fresh QR code
    await disconnectSession(userId);

    // Start Baileys session (QR code will emit via WebSocket)
    await createSession(userId);

    return res.json({ success: true, data: { status: 'pending' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/whatsapp/status
router.get('/status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isConnected: true, phone: true },
    });

    return res.json({
      success: true,
      data: {
        isConnected: user?.isConnected || false,
        isSessionActive: isSessionActive(req.userId),
        phone: user?.phone || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res, next) => {
  try {
    await disconnectSession(req.userId);
    return res.json({ success: true, data: { message: 'Disconnected successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
