import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-session';
import { getAdminEnv } from '@/lib/env.server';

export async function isAdmin(): Promise<boolean> {
  const env = getAdminEnv();
  if (!env) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, env.secret);
}

/** للصفحات/الـ layouts: يعيد التوجيه للرئيسية لو مش أدمن. */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) redirect('/');
}

/** لـ Route Handlers: يرجع Response 401 لو مش أدمن، وإلا null. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ ok: false, message: 'غير مصرّح.' }, { status: 401 });
}
