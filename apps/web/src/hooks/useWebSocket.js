import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws') + '/ws'
  : `ws://${window.location.host}/ws`;

/**
 * Custom hook that maintains a WebSocket connection to the backend
 * and surfaces connection status updates.
 *
 * @param {string|null} token - JWT auth token (null = no connection)
 * @returns {{ status, lastMessage, connected }}
 */
export function useWebSocket(token) {
  const [status, setStatus]           = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef   = useRef(null);
  const retryRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('server_connected');
      if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastMessage(msg);

        if (msg.type === 'connection_status') {
          setStatus(msg.payload.status);
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      // Retry after 4s if we have a token
      if (token) {
        retryRef.current = setTimeout(connect, 4000);
      }
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    status,
    lastMessage,
    isWhatsAppConnected: status === 'connected',
  };
}
