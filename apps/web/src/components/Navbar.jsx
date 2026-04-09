import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Navbar({ waStatus }) {
  const { user, logout } = useAuth();
  const location = useNavigate();
  const loc = useLocation();

  function handleLogout() {
    logout();
    location('/');
  }

  const isActive = (path) =>
    loc.pathname === path
      ? 'text-brand-400 border-b border-brand-500'
      : 'text-zinc-400 hover:text-zinc-200';

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl">🔔</span>
          <span className="font-bold text-white tracking-tight group-hover:text-brand-300 transition-colors">
            Smart<span className="gradient-text">Notifier</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className={`text-sm font-medium pb-0.5 transition-colors ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          <Link to="/connect" className={`text-sm font-medium pb-0.5 transition-colors ${isActive('/connect')}`}>
            Connect
          </Link>
          <Link to="/settings" className={`text-sm font-medium pb-0.5 transition-colors ${isActive('/settings')}`}>
            Settings
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* WA status dot */}
          {waStatus && (
            <div className="flex items-center gap-1.5">
              <span className={`status-dot ${waStatus}`} />
              <span className="text-xs text-zinc-500 hidden sm:inline capitalize">{waStatus}</span>
            </div>
          )}

          {/* User avatar + logout */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
