import { useEffect, useState } from 'react';
import { getSoul, saveSoul } from '../lib/api.js';

const PLACEHOLDER = `Examples of what to include:
• My name is Mukund. I'm a developer who loves building things.
• I text in casual Hinglish — mix of Hindi and English.
• I usually reply short and to the point, sometimes with "haan", "bhai", "theek hai".
• I'm into startups, coding, music, and late-night coding sessions.
• I avoid formal language. I don't say "Greetings" or "Hope this message finds you well".
• If someone asks where I am, just say "busy with work, will catch up later".`;

export default function SoulEditor() {
  const [soul, setSoul] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSoul()
      .then((res) => {
        const data = res.data.data || {};
        setSoul(data.soulProfile || '');
        setEnabled(data.autoReplyEnabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveSoul({ soulProfile: soul, autoReplyEnabled: enabled });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
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
    <form onSubmit={handleSave} className="space-y-5">
      {/* Auto-reply toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable auto-reply</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When on, the bot replies to your DMs and group @-mentions as you.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-parrot-500 focus:ring-offset-2 ${
            enabled ? 'bg-parrot-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Soul / persona textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your persona
          <span className="ml-2 text-xs font-normal text-gray-400">(the AI uses this to reply as you)</span>
        </label>
        <textarea
          id="soul-profile-textarea"
          value={soul}
          onChange={(e) => setSoul(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          disabled={saving}
          className="input w-full resize-none text-sm leading-relaxed font-normal"
          style={{ fontFamily: 'inherit' }}
        />
        <p className="text-[11px] text-gray-400 mt-1.5">
          Write in first person. The more detail, the more accurate the auto-replies.
        </p>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{ width: 'auto' }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save persona'}
      </button>
    </form>
  );
}
