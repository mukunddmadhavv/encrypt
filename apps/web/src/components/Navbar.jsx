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
      ? 'text-111827 font-semibold border-b-2 border-parrot-500' /* text-gray-900 equivalent */
      : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-xl font-bold text-parrot-500 tracking-tight transition-colors">Encrypt</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 h-full">
          <Link to="/dashboard" className={`text-sm h-full flex items-center transition-colors ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          <Link to="/connect" className={`text-sm h-full flex items-center transition-colors ${isActive('/connect')}`}>
            Connect
          </Link>
          <Link to="/settings" className={`text-sm h-full flex items-center transition-colors ${isActive('/settings')}`}>
            Settings
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* WA status dot */}
          {waStatus && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200">
              <span className={`status-dot ${waStatus}`} />
              <span className="text-xs font-medium text-gray-600 hidden sm:inline capitalize">{waStatus}</span>
            </div>
          )}

          {/* User avatar + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-parrot-100 border border-parrot-200 flex items-center justify-center text-sm font-bold text-parrot-700">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
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
