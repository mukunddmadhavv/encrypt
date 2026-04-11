import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  isJidBroadcast,
  isJidGroup,
  Browsers,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../lib/prisma.js';
import { downloadSession, uploadSession, deleteSession } from './supabase-session.service.js';
import { shouldNotify, summarizeMessage, generateAutoReply } from './llm.service.js';
import { sendNotification } from './notifier.service.js';
import { broadcastConnectionStatus, broadcastQR } from '../websocket/manager.js';

// Map of userId -> active WASocket
const activeSessions = new Map();
// Map of userId -> latest QR code
const qrCodes = new Map();
// Map of userId -> notification group JID
const notifyGroups = new Map();
// Auto-reply cooldown: "userId:senderJid" -> timestamp of last reply (ms)
const autoReplyCooldown = new Map();
const AUTO_REPLY_COOLDOWN_MS = 1_000; // 1 reply per sender per minute
// Conversation history for auto-reply context: "userId:remoteJid" -> [{role, content}]
const chatHistory = new Map();
const MAX_HISTORY_MESSAGES = 20; // sliding window — old messages drop off the front
const silentLogger = pino({ level: 'silent' });

/** Appends a message to the chat history and enforces the sliding window */
function pushToHistory(key, role, content) {
  if (!chatHistory.has(key)) chatHistory.set(key, []);
  const hist = chatHistory.get(key);
  hist.push({ role, content });
  if (hist.length > MAX_HISTORY_MESSAGES) hist.splice(0, hist.length - MAX_HISTORY_MESSAGES);
}

export function getLatestQr(userId) {
  return qrCodes.get(userId) || null;
}

/** Returns true if a user currently has an active Baileys socket */
export function isSessionActive(userId) {
  return activeSessions.has(userId);
}

function getLocalDir(userId) {
  return path.join('/tmp', `baileys-${userId}`);
}

function extractPhoneFromJid(jid) {
  if (!jid) return null;
  // WhatsApp linked device JIDs look like "1234567890:12@s.whatsapp.net"
  // We need to split by ':' or '@' first to isolate just the base phone number
  const base = jid.split('@')[0].split(':')[0];
  const digits = base.replace(/[^0-9]/g, '');
  return digits?.length ? digits : null;
}

function closeSocket(sock) {
  if (!sock) return;
  try { sock.ev.removeAllListeners(); } catch { /* noop */ }
  try { sock.ws?.close(); } catch { /* noop */ }
}

async function ensureNotifyGroup(userId, sock, phoneOrSelfJid) {
  if (notifyGroups.has(userId)) return notifyGroups.get(userId);

  // Strip the ':device' suffix WhatsApp adds to multi-device JIDs (e.g. "91xxx:9@s.whatsapp.net" → "91xxx@s.whatsapp.net")
  // then normalise to a plain @s.whatsapp.net JID we can send to.
  let base = (phoneOrSelfJid || '').split(':')[0]; // drop device suffix
  base = base.split('@')[0];                        // drop any existing domain
  const digits = base.replace(/[^0-9]/g, '');

  if (!digits) return null;

  const selfJid = `${digits}@s.whatsapp.net`;
  notifyGroups.set(userId, selfJid);
  console.log(`[Baileys] 📬 Notify target resolved to ${selfJid} for user ${userId}`);
  return selfJid;
}

/**
 * Creates (or restores) a WhatsApp session for a user.
 * Returns true if session initialization began.
 */
export async function createSession(userId) {
  console.log(`[Baileys] createSession called for user ${userId}`);

  // If a socket is already tracked, close it quietly but keep auth files
  const existing = activeSessions.get(userId);
  if (existing) {
    closeSocket(existing);
    activeSessions.delete(userId);
  }

  qrCodes.delete(userId);

  const localDir = getLocalDir(userId);
  await fs.mkdir(localDir, { recursive: true });

  // Restore session files from Supabase Storage
  await downloadSession(userId, localDir);

  const { state, saveCreds } = await useMultiFileAuthState(localDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[Baileys] using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: silentLogger,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 20_000,
    defaultQueryTimeoutMs: 10_000,
    keepAliveIntervalMs: 10_000,
    generateHighQualityLinkPreview: false,
  });

  activeSessions.set(userId, sock);
  broadcastConnectionStatus(userId, 'connecting');

  // Persist credentials whenever they update
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    await uploadSession(userId, localDir);
  });

  // Handle connection lifecycle
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    console.log(`[Baileys] connection.update for ${userId}: ${connection || 'unknown'}`);

    if (qr) {
      console.log(`[Baileys] 📱 QR Code generated for user ${userId}`);
      qrCodes.set(userId, qr);
      broadcastQR(userId, qr);
    }

    if (connection === 'open') {
      console.log(`[Baileys] ✅ Connected — user ${userId}`);
      qrCodes.delete(userId);
      broadcastConnectionStatus(userId, 'connected');

      // Capture the user's own phone number the first time we connect
      const phone = extractPhoneFromJid(sock.user?.id);
      const data = phone ? { isConnected: true, phone } : { isConnected: true };
      await prisma.user.update({ where: { id: userId }, data });

      // Create (or reuse) a dedicated notify group for this user
      await ensureNotifyGroup(userId, sock, sock.user?.id || phone || null);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = code === DisconnectReason.loggedOut || code === 401;
      console.log(`[Baileys] Connection closed (${userId}). Code: ${code}`);

      broadcastConnectionStatus(userId, 'disconnected');
      await prisma.user.update({ where: { id: userId }, data: { isConnected: false } });

      // Always stop tracking this socket
      closeSocket(sock);
      activeSessions.delete(userId);

      if (isLoggedOut) {
        await deleteSession(userId);
        console.log(`[Baileys] Session cleared (logged out/banned): ${userId}`);
      } else {
        // Network drop — reconnect after short delay without wiping auth files
        broadcastConnectionStatus(userId, 'connecting');
        console.log(`[Baileys] Reconnecting in 3s — ${userId}`);
        setTimeout(() => {
          createSession(userId).catch((err) =>
            console.error(`[Baileys] Reconnect failed for ${userId}:`, err.message)
          );
        }, 3000);
      }
    }
  });

  // Process every incoming message
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    console.log(`[Baileys] messages.upsert type=${type} count=${messages?.length || 0} for user ${userId}`);

    // Fresh DB read for condition each time (user may have updated it)
    const condition = await prisma.condition.findUnique({
      where: { userId },
      select: { prompt: true, isActive: true },
    });
    if (!condition) {
      console.log(`[Baileys] Skipping message — no condition set for ${userId}`);
      return;
    }
    if (!condition.isActive) {
      console.log(`[Baileys] Skipping message — condition inactive for ${userId}`);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, notifyTargetJid: true, notifyTargetPhone: true },
    });
    if (!user?.phone) {
      console.log(`[Baileys] Skipping message — user phone not recorded for ${userId}`);
      return;
    }

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (isJidBroadcast(msg.key.remoteJid || '')) continue;

      // Extract text from various message types
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!text.trim()) {
        console.log('[Baileys] Skipping message — empty/unsupported content');
        continue;
      }

      const senderJid = msg.key.participant || msg.key.remoteJid || '';
      const senderName = msg.pushName || senderJid.split('@')[0] || 'Unknown';
      const chatType = isJidGroup(msg.key.remoteJid || '') ? 'group' : 'private';

      console.log(`[Baileys] ${chatType} msg from ${senderName} → evaluating...`);

      // LLM check — message never stored
      console.log(`[Baileys] Evaluating message from ${senderName} for user ${userId}`);
      const notify = await shouldNotify(condition.prompt, text, senderName);
      if (notify) {
        console.log(`[Baileys] 🔔 Match! Notifying ${userId}`);
        const summary = await summarizeMessage(condition.prompt, text, senderName);
        const selfJid = sock.user?.id || null; // may include suffix like :9
        const userOverrideJid =
          user.notifyTargetJid ||
          (user.notifyTargetPhone ? `${user.notifyTargetPhone.replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

        const groupJid = await ensureNotifyGroup(userId, sock, selfJid || user.phone);

        // Priority: explicit user override JID -> group JID -> self JID -> primary phone JID
        const targetJid =
          userOverrideJid ||
          groupJid ||
          selfJid ||
          `${user.phone.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

        await sendNotification(sock, user.phone, senderName, text, condition.prompt, summary, targetJid);
      } else {
        console.log(`[Baileys] No match for message from ${senderName} (user ${userId})`);
      }

      // ── Auto-reply (soul persona) ──────────────────────────────────────────
      // Fetch soul settings once per message (user may toggle live)
      const soulData = await prisma.user.findUnique({
        where: { id: userId },
        select: { soulProfile: true, autoReplyEnabled: true },
      });

      if (soulData?.autoReplyEnabled && soulData?.soulProfile?.trim()) {
        // Determine if this message should trigger an auto-reply:
        // - Private DM: always
        // - Group: only if the user's own JID is in the @-mention list
        const selfJidBase = sock.user?.id?.split(':')[0]?.split('@')[0]; // e.g. "919876543210"
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const selfMentioned = selfJidBase
          ? mentionedJids.some((j) => j.startsWith(selfJidBase))
          : false;

        const shouldAutoReply =
          chatType === 'private' || (chatType === 'group' && selfMentioned);

        if (shouldAutoReply) {
          const cooldownKey = `${userId}:${msg.key.remoteJid}:${senderJid}`;
          const histKey    = `${userId}:${msg.key.remoteJid}`;
          const lastReply  = autoReplyCooldown.get(cooldownKey) || 0;
          const now = Date.now();

          // Push the incoming message into history before generating a reply
          pushToHistory(histKey, 'user', `${senderName}: "${text}"`);

          if (now - lastReply > AUTO_REPLY_COOLDOWN_MS) {
            autoReplyCooldown.set(cooldownKey, now);
            console.log(`[Baileys] 🤖 Generating auto-reply for ${senderName} (${chatType}) — history: ${chatHistory.get(histKey)?.length || 0} msgs`);

            const replyText = await generateAutoReply(
              soulData.soulProfile,
              senderName,
              text,
              chatType,
              chatHistory.get(histKey) || []
            );

            if (replyText) {
              // Push the bot's reply into history so next message has full context
              pushToHistory(histKey, 'assistant', replyText);

              const replyTarget = msg.key.remoteJid; // group JID or DM JID
              await sock.sendMessage(replyTarget, {
                text: replyText,
                ...(chatType === 'group' ? { quoted: msg } : {}),
              });
              console.log(`[Baileys] ✉️  Auto-reply sent to ${replyTarget}`);
            }
          } else {
            const secsLeft = Math.ceil((AUTO_REPLY_COOLDOWN_MS - (now - lastReply)) / 1000);
            console.log(`[Baileys] ⏳ Auto-reply cooldown active for ${senderName} (${secsLeft}s left)`);
          }
        }
      }
    }
  });

  // Log delivery/read acks so we can see if WhatsApp actually delivers the alert
  sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
      const status = update.status;
      if (typeof status !== 'undefined') {
        // 1=server ack, 2=delivered, 3=read, 4=played
        console.log(
          `[Baileys] ack status=${status} for message ${key?.id || 'unknown'} (user ${userId})`
        );
      }
    }
  });

  return true;
}

export async function disconnectSession(userId) {
  qrCodes.delete(userId);
  const sock = activeSessions.get(userId);
  if (sock) {
    try { await sock.logout(); } catch { /* ignore */ }
    activeSessions.delete(userId);
  }
  await deleteSession(userId);
  await fs.rm(getLocalDir(userId), { recursive: true, force: true }).catch(() => { });
  await prisma.user.update({
    where: { id: userId },
    data: { isConnected: false, phone: null },
  });
  broadcastConnectionStatus(userId, 'disconnected');
}
