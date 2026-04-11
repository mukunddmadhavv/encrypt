import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_SESSIONS_BUCKET: z.string().default('baileys-sessions'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // OpenRouter (existing notification LLM)
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-chat'),

  // Groq (auto-reply LLM — optional; auto-reply silently skips if absent)
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  // Optional override target for notifications (JID takes precedence)
  NOTIFY_TARGET_JID: z.string().optional(),
  NOTIFY_TARGET_PHONE: z.string().optional(),

  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173').transform(url => url.replace(/\/$/, '')),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  result.error.errors.forEach((err) => {
    console.error(`  • ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const env = result.data;
