import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service-role client — full storage access, never exposed to frontend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default supabase;
