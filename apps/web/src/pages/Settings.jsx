import Navbar from '../components/Navbar.jsx';
import ConditionEditor from '../components/ConditionEditor.jsx';
import NotifyTargetEditor from '../components/NotifyTargetEditor.jsx';
import SoulEditor from '../components/SoulEditor.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Settings() {
  const { token } = useAuth();
  const { status: wsStatus } = useWebSocket(token);

  return (
    <div className="min-h-screen flex flex-col page-enter bg-gray-50">
      <Navbar waStatus={wsStatus} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Define when Encrypt should alert you.
          </p>
        </div>

        {/* Soul / persona — auto-reply */}
        <div className="card-minimal p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-lg flex-shrink-0">🧠</div>
            <div>
              <h2 className="font-semibold text-gray-900">Your Persona (Auto-Reply)</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Describe yourself — how you text, your interests, phrases you use.
                When enabled, the bot replies to DMs and group @-mentions <em>as you</em>, using Groq AI.
              </p>
            </div>
          </div>
          <SoulEditor />
        </div>

        {/* Notification condition */}
        <div className="card-minimal p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-parrot-100 border border-parrot-200 flex items-center justify-center text-lg flex-shrink-0">🧠</div>
            <div>
              <h2 className="font-semibold text-gray-900">Notification Condition</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Write in plain English. The AI reads every incoming message and sends you a
                WhatsApp self-notification <em>only</em> when your condition is matched.
                Messages are never stored.
              </p>
            </div>
          </div>
          <ConditionEditor />
        </div>

        {/* Notification target */}
        <div className="card-minimal p-7 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-lg flex-shrink-0">🎯</div>
            <div>
              <h2 className="font-semibold text-gray-900">Notification Target</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Route alerts to a second WhatsApp number or a group JID to avoid self-send issues.
                Enter the JID (preferred) or the phone digits; we’ll convert to JID.
              </p>
            </div>
          </div>
          <NotifyTargetEditor />
        </div>

        {/* How the AI uses your condition */}
        <div className="card-minimal p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span>💡</span> How the AI evaluates messages
          </h3>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            <p>
              Every incoming WhatsApp message is passed to an LLM (via OpenRouter) along with your condition.
              The model responds with <code className="text-parrot-700 bg-parrot-100 px-1 rounded font-medium">YES</code> or{' '}
              <code className="text-gray-600 bg-gray-100 border border-gray-200 px-1 rounded font-medium">NO</code>.
            </p>
            <p>
              If <code className="text-parrot-700 bg-parrot-100 px-1 rounded font-medium">YES</code>, a WhatsApp message
              is sent <strong className="text-gray-900">from your own number to yourself</strong> with the sender name and message.
            </p>
            <p className="text-gray-500">
              Nothing about any message is written to the database at any point.
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
          <span className="text-emerald-500 text-lg flex-shrink-0">🔒</span>
          <p className="text-sm text-emerald-800 leading-relaxed">
            <strong className="font-semibold">Privacy guarantee:</strong> Message content is processed in-memory only.
            Zero message data is stored in Supabase or any other database. Only your account info and this condition string are saved.
          </p>
        </div>
      </main>
    </div>
  );
}
