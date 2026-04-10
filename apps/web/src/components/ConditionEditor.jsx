import { useState, useEffect } from 'react';
import { getCondition, saveCondition } from '../lib/api.js';

const EXAMPLES = [
  'Notify me when anyone mentions class bunk, assignments, or exam dates',
  'Alert me if someone shares important links or notes in any group',
  'Notify me when my name is mentioned or someone asks me a question',
  'Alert me only for urgent messages or emergency announcements',
];

export default function ConditionEditor() {
  const [prompt, setPrompt]     = useState('');
  const [original, setOriginal] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    getCondition()
      .then((res) => {
        const p = res.data.data.condition?.prompt || '';
        setPrompt(p);
        setOriginal(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (prompt.trim().length < 10) {
      setError('Please write a more detailed condition (at least 10 characters).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveCondition(prompt.trim());
      setOriginal(prompt.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = prompt.trim() !== original.trim();

  if (loading) {
    return <div className="h-40 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-parrot-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your notification condition
        </label>
        <textarea
          className="textarea"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe when you want to be notified…&#10;&#10;Example: Notify me when anyone talks about class bunk, assignments, important announcements, or exam dates."
          disabled={saving}
        />
      </div>

      {/* Example chips */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="text-xs px-3 py-1.5 bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 border border-gray-200 transition-all font-medium"
            >
              {ex.length > 45 ? ex.slice(0, 45) + '…' : ex}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 2rem' }}
        >
          {saving ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              Saving…
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2 justify-center py-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          ) : 'Save Condition'}
        </button>
        {isDirty && !saving && (
          <span className="text-xs font-medium text-amber-600">You have unsaved changes</span>
        )}
      </div>
    </form>
  );
}
