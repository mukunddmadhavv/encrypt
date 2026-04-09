import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, _req, res, _next) {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
