const CONFIG = {
  connected:        { dot: 'connected',    label: 'Connected',    color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  disconnected:     { dot: 'disconnected', label: 'Disconnected', color: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
  connecting:       { dot: 'connecting',   label: 'Connecting…',  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  server_connected: { dot: 'connecting',   label: 'Waiting…',     color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
};

export default function ConnectionStatus({ status }) {
  const cfg = CONFIG[status] || CONFIG.disconnected;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`status-dot ${cfg.dot}`} />
      WhatsApp: {cfg.label}
    </div>
  );
}
