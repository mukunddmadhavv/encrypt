const CONFIG = {
  connected:        { dot: 'connected',    label: 'Connected',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/25' },
  disconnected:     { dot: 'disconnected', label: 'Disconnected', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
  connecting:       { dot: 'connecting',   label: 'Connecting…',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' },
  server_connected: { dot: 'connecting',   label: 'Waiting…',     color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' },
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
