import Navbar from '../components/Navbar.jsx';
import ConditionEditor from '../components/ConditionEditor.jsx';
import NotifyTargetEditor from '../components/NotifyTargetEditor.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Settings() {
  const { token } = useAuth();
  const { status: wsStatus } = useWebSocket(token);

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <Navbar waStatus={wsStatus} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Define when Smart Notifier should alert you.
          </p>
        </div>

        {/* Notification condition */}
        <div className="glass rounded-2xl p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-lg flex-shrink-0">🧠</div>
            <div>
              <h2 className="font-semibold text-white">Notification Condition</h2>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Write in plain English. The AI reads every incoming message and sends you a
                WhatsApp self-notification <em>only</em> when your condition is matched.
                Messages are never stored.
              </p>
            </div>
          </div>
          <ConditionEditor />
        </div>

        {/* Notification target */}
        <div className="glass rounded-2xl p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-lg flex-shrink-0">🎯</div>
            <div>
              <h2 className="font-semibold text-white">Notification Target</h2>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Route alerts to a second WhatsApp number or a group JID to avoid self-send issues.
                Enter the JID (preferred) or the phone digits; we’ll convert to JID.
              </p>
            </div>
          </div>
          <NotifyTargetEditor />
        </div>

        {/* How the AI uses your condition */}
        <div className="glass rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>💡</span> How the AI evaluates messages
          </h3>
          <div className="space-y-2 text-xs text-zinc-500 leading-relaxed">
            <p>
              Every incoming WhatsApp message is passed to an LLM (via OpenRouter) along with your condition.
              The model responds with <code className="text-brand-400 bg-brand-500/10 px-1 rounded">YES</code> or{' '}
              <code className="text-zinc-400 bg-zinc-800 px-1 rounded">NO</code>.
            </p>
            <p>
              If <code className="text-brand-400 bg-brand-500/10 px-1 rounded">YES</code>, a WhatsApp message
              is sent <strong className="text-zinc-300">from your own number to yourself</strong> with the sender name and message.
            </p>
            <p className="text-zinc-600">
              Nothing about any message is written to the database at any point.
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 px-4 py-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
          <span className="text-emerald-400 text-lg flex-shrink-0">🔒</span>
          <p className="text-xs text-emerald-300/70 leading-relaxed">
            <strong className="text-emerald-400">Privacy guarantee:</strong> Message content is processed in-memory only.
            Zero message data is stored in Supabase or any other database. Only your account info and this condition string are saved.
          </p>
        </div>
      </main>
    </div>
  );
}
