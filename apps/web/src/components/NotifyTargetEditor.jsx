import { useEffect, useState } from 'react';
import { getNotifyTarget, saveNotifyTarget } from '../lib/api.js';

export default function NotifyTargetEditor() {
  const [jid, setJid] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getNotifyTarget()
      .then((res) => {
        const data = res.data.data || {};
        setJid(data.notifyTargetJid || '');
        setPhone(data.notifyTargetPhone || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!jid && !phone) {
      setError('Provide a target JID or phone.');
      return;
    }
    if (jid && !jid.endsWith('@s.whatsapp.net')) {
      setError('JID must end with @s.whatsapp.net');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveNotifyTarget({ notifyTargetJid: jid || null, notifyTargetPhone: phone || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save target. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-28 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-parrot-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target JID (preferred)
          </label>
          <input
            className="input"
            placeholder="918765432109@s.whatsapp.net"
            value={jid}
            onChange={(e) => setJid(e.target.value)}
            disabled={saving}
          />
          <p className="text-[11px] text-gray-500 mt-1.5">
            Use the JID of your second number or a group (e.g., 12345-6789@g.us).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Phone (fallback)
          </label>
          <input
            className="input"
            placeholder="e.g., 918765432109"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
          />
          <p className="text-[11px] text-gray-500 mt-1.5">
            Only used if JID is empty; will be converted to JID automatically.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary" style={{ width: 'auto' }}>
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save target'}
      </button>
    </form>
  );
}
