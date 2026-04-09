import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, hydrate user from stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then((res) => setUser(res.data.data.user))
      .catch(() => { localStorage.removeItem('token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await apiRegister({ email, password, name });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Sync user updates (e.g. after WhatsApp connect)
  const refreshUser = useCallback(async () => {
    if (!token) return;
    const res = await getMe();
    setUser(res.data.data.user);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
