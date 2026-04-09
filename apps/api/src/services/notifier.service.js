/**
 * Sends a WhatsApp self-notification to the user's own number.
 * The message goes FROM their connected account TO themselves.
 *
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {string} userPhone - User's WhatsApp number e.g. "919876543210"
 * @param {string} senderName - Who sent the triggering message
 * @param {string} messageText - The triggering message content
 * @param {string} condition - The user's condition (for context)
 * @param {string | null} summary - Optional LLM summary of the triggering message
 * @param {string | null} selfJidOverride - Optional JID to send to (use the connected account JID when available)
 */
export async function sendNotification(
  sock,
  userPhone,
  senderName,
  messageText,
  condition,
  summary = null,
  extraJid = null
) {
  // Normalize phone -> JID and also include optional extra JID (e.g., number:device@s.whatsapp.net)
  const normalizeJid = (digits) => {
    let d = (digits || '').replace(/[^0-9]/g, '');
    if (d.startsWith('91') && d.length > 12) d = d.slice(0, 12); // keep 91 + 10 digits
    if (d.length > 15) d = d.slice(0, 15); // WA upper bound
    return d ? `${d}@s.whatsapp.net` : null;
  };

  // Preferred target order:
  // 1) NOTIFY_TARGET_JID (explicit JID, e.g., second number or group)
  // 2) NOTIFY_TARGET_PHONE (digits -> JID)
  // 3) extraJid (self JID with suffix)
  // 4) primary phone JID
  const envTargetJid = process.env.NOTIFY_TARGET_JID?.trim();
  const envTargetPhone = process.env.NOTIFY_TARGET_PHONE?.trim();

  const primaryJid = normalizeJid(userPhone);
  const targets = [];

  if (envTargetJid?.endsWith('@s.whatsapp.net')) targets.push(envTargetJid);
  else if (envTargetPhone) targets.push(normalizeJid(envTargetPhone));
  else if (extraJid?.endsWith('@s.whatsapp.net')) targets.push(extraJid);
  else targets.push(primaryJid);

  const uniqueTargets = [...new Set(targets)].filter(Boolean);

  // Build a concise summary + original as two messages for better readability
  const summaryText =
    `🔔 *Smart Notifier Summary*\n` +
    `*From:* ${senderName}\n` +
    `*Condition:* ${condition}\n\n` +
    `*Summary:* ${summary || 'Summary not available'}`;

  const originalText =
    `📨 *Original Message*\n` +
    `*From:* ${senderName}\n\n` +
    `${messageText}`;

  try {
    const preview = `${summaryText}\n---\n${originalText}`;
    console.log(`[Notifier] Payload preview:\n${preview.length > 500 ? preview.slice(0, 500) + '...' : preview}`);

    for (const jid of uniqueTargets) {
      const res1 = await sock.sendMessage(jid, { text: summaryText });
      const res2 = await sock.sendMessage(jid, { text: originalText });
      console.log(
        `[Notifier] ✅ Alerts sent to ${jid} (triggered by: ${senderName}) ` +
        `summaryId=${res1?.key?.id || 'n/a'} originalId=${res2?.key?.id || 'n/a'}`
      );
    }
  } catch (err) {
    console.error('[Notifier] Failed to send alert:', err.message);
  }
}
