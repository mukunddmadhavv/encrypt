import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login    = (data) => api.post('/auth/login', data);
export const getMe    = ()     => api.get('/auth/me');

// ── WhatsApp ──────────────────────────────────────────────────────────────────
export const startWhatsAppSession = () => api.post('/whatsapp/request-code');
export const getWhatsAppStatus = () => api.get('/whatsapp/status');
export const disconnect        = () => api.post('/whatsapp/disconnect');

// ── Condition ─────────────────────────────────────────────────────────────────
export const getCondition    = ()       => api.get('/condition');
export const saveCondition   = (prompt) => api.put('/condition', { prompt });
export const deleteCondition = ()       => api.delete('/condition');

// ── Notify target (second number / group) ────────────────────────────────────
export const getNotifyTarget  = () => api.get('/notify-target');
export const saveNotifyTarget = (data) => api.put('/notify-target', data);

// ── Soul / persona (auto-reply) ───────────────────────────────────────────────
export const getSoul  = ()     => api.get('/soul');
export const saveSoul = (data) => api.put('/soul', data);

export default api;
