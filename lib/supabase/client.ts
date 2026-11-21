import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';

export type DB = SupabaseClient<Database>;

let browserClient: DB | undefined;

/** عميل المتصفح (نسخة واحدة). يُستخدم في Client Components فقط. */
export function getBrowserClient(): DB {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(publicEnv.url, publicEnv.anonKey) as DB;
  }
  return browserClient;
}
