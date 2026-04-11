import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import { env } from './config/env.js';
import { createWebSocketServer } from './websocket/manager.js';
import { ensureBucketExists } from './services/supabase-session.service.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import prisma from './lib/prisma.js';
import { createSession } from './services/baileys.service.js';

import authRoutes from './routes/auth.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import conditionRoutes from './routes/condition.routes.js';
import notifyTargetRoutes from './routes/notify-target.routes.js';
import soulRoutes from './routes/soul.routes.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/condition', conditionRoutes);
app.use('/api/notify-target', notifyTargetRoutes);
app.use('/api/soul', soulRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorMiddleware);

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
createWebSocketServer(wss);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Ensure Supabase storage bucket exists
    await ensureBucketExists();

    // Restore WhatsApp sessions for users marked as connected
    try {
      const connectedUsers = await prisma.user.findMany({
        where: { isConnected: true },
        select: { id: true },
      });
      for (const user of connectedUsers) {
        console.log(`[Startup] Restoring WhatsApp session for user ${user.id}`);
        createSession(user.id).catch((err) =>
          console.error(`[Startup] Failed to restore session for ${user.id}:`, err.message)
        );
      }
    } catch (err) {
      console.error('[Startup] Skipping session restore (DB unavailable):', err.message);
    }

    server.listen(env.PORT, '0.0.0.0', () => {
      console.log(`\n🚀 API running on port ${env.PORT}`);
      console.log(`🔌 WebSocket on ws://0.0.0.0:${env.PORT}/ws`);
      console.log(`🌍 Env: ${env.NODE_ENV}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
