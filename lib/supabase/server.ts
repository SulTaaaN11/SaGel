import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { DB } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';

/**
 * عميل السيرفر بصلاحيات المستخدم الحالي (anon key + كوكيز الجلسة).
 * للاستخدام في Server Components و Route Handlers عند الحاجة لقراءة جلسة الطالب.
 */
export async function getServerClient(): Promise<DB> {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.url, publicEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // يُستدعى من Server Component: الكتابة غير مسموحة هناك، وتجاهلها آمن.
        }
      },
    },
  }) as DB;
}
