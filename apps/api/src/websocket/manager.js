import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getLatestQr } from '../services/baileys.service.js';

// Map of userId -> { ws }
const clients = new Map();

export function createWebSocketServer(wss) {
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Missing auth token');
      return;
    }

    let userId;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      userId = payload.userId;
    } catch {
      ws.close(1008, 'Invalid token');
      return;
    }

    clients.set(userId, ws);
    console.log(`[WS] Connected: ${userId}`);

    ws.on('close', () => {
      clients.delete(userId);
      console.log(`[WS] Disconnected: ${userId}`);
    });

    ws.on('error', (err) => console.error(`[WS] Error (${userId}):`, err.message));

    // Acknowledge connection
    send(userId, { type: 'connection_status', payload: { status: 'server_connected' } });

    const latestQr = getLatestQr(userId);
    if (latestQr) {
      send(userId, { type: 'qr', payload: { qr: latestQr } });
    }
  });
}

/** Send a JSON message to a specific user's browser client */
export function send(userId, message) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/** Broadcast WhatsApp connection status to user's browser */
export function broadcastConnectionStatus(userId, status) {
  send(userId, { type: 'connection_status', payload: { status } });
}

/** Broadcast QR code to user's browser */
export function broadcastQR(userId, qr) {
  send(userId, { type: 'qr', payload: { qr } });
}
