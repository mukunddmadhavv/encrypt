import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { getCondition, disconnect } from '../lib/api.js';

export default function Dashboard() {
  const { user, token, refreshUser } = useAuth();
  const { status: wsStatus, lastMessage } = useWebSocket(token);
  const [condition, setCondition] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    getCondition().then((r) => setCondition(r.data.data.condition)).catch(() => {});
  }, []);

  // Sync WA status from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'connection_status') {
      refreshUser();
    }
  }, [lastMessage, refreshUser]);

  async function handleDisconnect() {
    if (!confirm('Disconnect your WhatsApp account?')) return;
    setDisconnecting(true);
    try {
      await disconnect();
      await refreshUser();
    } catch { /* ignore */ } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = wsStatus === 'connected' || user?.isConnected;

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <Navbar waStatus={wsStatus} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-6">

        {/* Welcome + status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Here's what's happening with your notifier.</p>
          </div>
          <ConnectionStatus status={wsStatus} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'WhatsApp',
              value: isConnected ? 'Connected' : (user?.phone ? 'Disconnected' : 'Not linked'),
              sub: user?.phone ? `+${user.phone}` : 'No account linked',
              color: isConnected ? 'text-green-400' : 'text-red-400',
            },
            {
              label: 'AI Filter',
              value: condition ? 'Active' : 'Not set',
              sub: condition ? condition.prompt.slice(0, 48) + '…' : 'Go to Settings to configure',
              color: condition ? 'text-brand-400' : 'text-zinc-500',
            },
            {
              label: 'Message storage',
              value: 'Never stored',
              sub: 'Zero messages written to DB',
              color: 'text-emerald-400',
            },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* WhatsApp card */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-xl">📱</div>
              <div>
                <h2 className="font-semibold text-white text-sm">WhatsApp Account</h2>
                <p className="text-xs text-zinc-500">{user?.phone ? `+${user.phone}` : 'No account linked'}</p>
              </div>
            </div>

            {!isConnected ? (
              <Link to="/connect" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.7rem 1rem' }}>
                Link WhatsApp →
              </Link>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-danger w-full"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect account'}
              </button>
            )}
          </div>

          {/* Condition card */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-xl">🧠</div>
              <div>
                <h2 className="font-semibold text-white text-sm">Notification Condition</h2>
                <p className="text-xs text-zinc-500">{condition ? 'Active condition set' : 'No condition configured'}</p>
              </div>
            </div>

            {condition ? (
              <div className="bg-brand-500/8 border border-brand-500/15 rounded-xl p-3">
                <p className="text-xs text-zinc-400 leading-relaxed italic">"{condition.prompt}"</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">You need to set a condition before notifications will work.</p>
            )}

            <Link to="/settings" className="btn-secondary block text-center text-sm">
              {condition ? 'Edit condition →' : 'Set condition →'}
            </Link>
          </div>
        </div>

        {/* Info banner */}
        {isConnected && condition && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-brand-500/15">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow flex-shrink-0" />
            <p className="text-sm text-zinc-400">
              <span className="text-brand-300 font-medium">Smart Notifier is active.</span>{' '}
              Your messages are being monitored in real-time. Nothing is stored.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
