import 'server-only';

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  return key;
}

export type AdminEnv = { username: string; password: string; secret: string };

/** يرجع null لو الإعداد ناقص أو مفتاح الجلسة ضعيف (أقل من 32 حرف). */
export function getAdminEnv(): AdminEnv | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!username || !password || !secret || secret.length < 32) return null;
  return { username, password, secret };
}
