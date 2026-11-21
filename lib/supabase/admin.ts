import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { DB } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';
import { getServiceRoleKey } from '@/lib/env.server';

/**
 * عميل service_role: يتخطى RLS. السيرفر فقط، وبعد التحقق من requireAdminApi().
 * لا تستورد هذا الملف من أي Client Component.
 */
export function getAdminClient(): DB {
  return createClient<Database>(publicEnv.url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
