import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': env.FRONTEND_URL,
    'X-Title': 'WhatsApp Smart Notifier',
  },
});

// Hard truncation to fit free-tier prompt budgets
const truncate = (text, max = 300) =>
  (text || '').toString().slice(0, max);

/**
 * Evaluates whether a message matches the user's notification condition.
 * Messages are evaluated in-memory ONLY — never stored.
 *
 * @param {string} userCondition - The user's notification rule
 * @param {string} messageText   - Incoming message content
 * @param {string} senderName    - Display name of the sender
 * @returns {Promise<boolean>}
 */
export async function shouldNotify(userCondition, messageText, senderName) {
  if (!messageText.trim()) return false;

  try {
    console.log(`[LLM] Evaluating message for condition="${userCondition?.slice(0,80) || ''}" sender="${senderName}"`);

    const completion = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: `Decide YES or NO if the message relates to the condition. Reply only YES or NO.`,
        },
        {
          role: 'user',
          content: `Condition: "${truncate(userCondition, 200)}"\nMessage: "${truncate(messageText, 200)}"\nSender: ${senderName}\nAnswer YES or NO only.`,
        },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const answer = completion.choices[0]?.message?.content?.trim().toUpperCase();
    console.log(`[LLM] Decision: ${answer}`);
    return answer === 'YES';
  } catch (err) {
    console.error('[LLM] Error evaluating message:', err);
    return false; // Fail safe — don't notify on error
  }
}

/**
 * Produces a compact summary of a triggering message for the user.
 * Keeps it short so it is readable in WhatsApp.
 *
 * @param {string} condition - The user's condition for context
 * @param {string} messageText - The incoming message content
 * @param {string} senderName - Display name of the sender
 * @returns {Promise<string|null>}
 */
export async function summarizeMessage(condition, messageText, senderName) {
  if (!messageText.trim()) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: `Summarize in <=2 short sentences, no emojis.`,
        },
        {
          role: 'user',
          content: `Condition: "${truncate(condition, 120)}"\nSender: ${senderName}\nMessage: "${truncate(messageText, 200)}"\nSummary:`,
        },
      ],
      max_tokens: 32,
      temperature: 0.2,
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[LLM] Error summarizing message:', err);
    return null;
  }
}

// ── Groq client (auto-reply) ───────────────────────────────────────────────────
const groqClient = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

/**
 * Generates a short, human-sounding auto-reply *as* the user.
 * Uses the user's soulProfile as a system persona so replies match their style.
 *
 * @param {string} soulProfile   - The user's personal description / persona text
 * @param {string} senderName    - Name of whoever sent the message
 * @param {string} messageText   - The message they sent
 * @param {'private'|'group'} chatType - DM or group @-mention context
 * @returns {Promise<string|null>}  Reply text, or null if unavailable
 */
export async function generateAutoReply(soulProfile, senderName, messageText, chatType, history = []) {
  if (!groqClient) {
    console.log('[LLM] Groq not configured — skipping auto-reply');
    return null;
  }
  if (!soulProfile?.trim() || !messageText?.trim()) return null;

  const contextHint =
    chatType === 'group'
      ? 'You were tagged/mentioned in a group chat. Reply naturally, briefly.'
      : 'This is a private DM. Reply casually and naturally.';

  // Current time in IST — gives the LLM real temporal awareness
  const nowIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());

  try {
    // history already contains the latest user message (pushed before this call),
    // so we use it directly as the full message thread after the system prompt.
    const messages = [
      {
        role: 'system',
        content:
          `You are roleplaying as a real person based on the profile below. ` +
          `Respond to the incoming WhatsApp message exactly as this person would — ` +
          `same texting style, vocabulary, tone, and length. ` +
          `Do NOT use formal language, excessive emojis, or sound like a bot. ` +
          `Do NOT include your name, "Me:", or any labels/prefixes in your response. Just send the raw text of the message. ` +
          `Keep the reply short (1-3 sentences max). ` +
          `${contextHint}\n` +
          `Current time (IST): ${nowIST} — use this for context if asked about time or activities.\n\n` +
          `=== PERSONA ===\n${truncate(soulProfile, 800)}`,
      },
      // Inject full conversation history so Groq knows what was said before
      ...history,
    ];

    const completion = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      messages,
      max_tokens: 120,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    console.log(`[LLM] Auto-reply generated (${reply?.length || 0} chars)`);
    return reply || null;
  } catch (err) {
    console.error('[LLM] Groq auto-reply error:', err.message);
    return null;
  }
}
