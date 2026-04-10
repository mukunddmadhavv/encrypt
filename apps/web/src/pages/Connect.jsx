import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar.jsx';
import { startWhatsAppSession, getWhatsAppStatus } from '../lib/api.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Connect() {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { status: wsStatus, lastMessage } = useWebSocket(token);

  const [qr, setQr]               = useState('');
  const [step, setStep]           = useState('generate');  // generate | qr | connected
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [initialCheck, setInitialCheck] = useState(true);

  // On mount: check if already connected
  useEffect(() => {
    getWhatsAppStatus()
      .then((res) => {
        if (res.data.data.isConnected) setStep('connected');
      })
      .catch(() => {})
      .finally(() => setInitialCheck(false));
  }, []);

  // Watch WS for connection confirmation or incoming QR codes
  useEffect(() => {
    if (lastMessage?.type === 'connection_status') {
      const s = lastMessage.payload.status;
      if (s === 'connected') {
        setStep('connected');
        refreshUser();
      }
    } else if (lastMessage?.type === 'qr') {
      setQr(lastMessage.payload.qr);
      setStep('qr');
      setLoading(false);
    }
  }, [lastMessage, refreshUser]);

  async function handleGenerateQR(e) {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    setQr('');
    
    try {
      const res = await startWhatsAppSession();
      if (res.data.data.status === 'already_connected') {
        setStep('connected');
        refreshUser();
        setLoading(false);
      } else {
        setStep('qr');
        // Loading state remains true until the QR actually arrives over WebSocket
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize session. Try again.');
      setLoading(false);
    }
  }

  if (initialCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col page-enter">
      <Navbar waStatus={wsStatus} />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Step: Connected ────────────────────────────────────────────── */}
          {step === 'connected' && (
            <div className="card-minimal p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Connected!</h1>
                <p className="text-gray-500 text-sm">Your account is linked. Encrypt is now watching your messages.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/settings')} className="btn-primary">
                  Set notification condition
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                  Go to dashboard
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Generate QR Button ────────────────────────────────────── */}
          {step === 'generate' && (
            <div className="card-minimal p-8 space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Connect WhatsApp</h1>
                <p className="text-gray-500 text-sm px-4">
                  Scan a QR code to link your account entirely locally. No phone numbers necessary.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button 
                onClick={handleGenerateQR} 
                disabled={loading} 
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Initializing...
                  </span>
                ) : 'Generate QR Code'}
              </button>
            </div>
          )}

          {/* ── Step: Show QR Code ───────────────────────────────────────── */}
          {step === 'qr' && (
            <div className="card-minimal p-8 space-y-8 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-parrot-500 animate-pulse" />
                  <span className="text-xs text-parrot-600 font-bold uppercase tracking-wide">Ready to connect</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Scan in WhatsApp</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Open WhatsApp on your phone.<br/>
                  Tap <span className="font-semibold text-gray-700">Menu</span> or <span className="font-semibold text-gray-700">Settings</span> and select <span className="font-semibold text-gray-700">Linked Devices</span>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-gray-200 shadow-sm overflow-hidden min-h-[224px] min-w-[224px] flex items-center justify-center">
                {qr ? (
                  <QRCodeSVG value={qr} size={224} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 w-[224px] h-[224px]">
                    <span className="w-8 h-8 border-4 border-parrot-100 border-t-parrot-500 rounded-full animate-spin inline-block" />
                    <span className="text-gray-400 text-sm font-medium">Loading QR...</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateQR}
                  className="btn-secondary w-full"
                  disabled={loading}
                >
                  Reload QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
