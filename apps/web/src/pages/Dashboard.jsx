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
    <div className="min-h-screen bg-gray-50 flex flex-col page-enter">
      <Navbar waStatus={wsStatus} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">

        {/* Welcome + status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Overview
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your notifier instance.</p>
          </div>
          <ConnectionStatus status={wsStatus} />
        </div>

        {/* Action cards - Consolidated into a single panel like Dub.co */}
        <div className="card-minimal overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start justify-between border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xl">📱</div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">WhatsApp Account</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md">Connect your WhatsApp to allow Encrypt to read incoming messages and send you alerts.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {user?.phone ? `+${user.phone}` : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              {!isConnected ? (
                <Link to="/connect" className="btn-primary block text-center min-w-[140px]">
                  Link WhatsApp
                </Link>
              ) : (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="btn-danger w-full md:w-auto min-w-[140px]"
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start justify-between bg-gray-50/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-parrot-50 border border-parrot-100 flex items-center justify-center text-xl">🧠</div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">AI Filter Condition</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md">Define exactly what kind of messages should trigger a notification. We'll ignore the rest.</p>
                
                {condition ? (
                  <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 max-w-lg">
                    <p className="text-sm text-gray-700 italic">"{condition.prompt}"</p>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    No condition configured
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link to="/settings" className="btn-secondary block text-center min-w-[140px]">
                {condition ? 'Edit Rule' : 'Set Rule'}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: 'WhatsApp Status',
              value: isConnected ? 'Connected' : (user?.phone ? 'Disconnected' : 'Not linked'),
              sub: 'Real-time WebSocket',
              isActive: isConnected,
            },
            {
              label: 'AI Status',
              value: condition ? 'Active' : 'Not set',
              sub: 'Evaluating messages',
              isActive: !!condition,
            },
            {
              label: 'Database Privacy',
              value: '100% Private',
              sub: 'Zero messages stored',
              isActive: true,
            },
          ].map((s) => (
            <div key={s.label} className="card-minimal p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{s.label}</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-parrot-500' : 'bg-gray-300'}`} />
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        {isConnected && condition && (
          <div className="card-minimal p-4 flex items-center justify-between border-l-4 border-l-parrot-500">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-parrot-500 animate-pulse flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">System Active.</span>{' '}
                Monitoring WhatsApp messages in the background. Note: Messages are never stored.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
