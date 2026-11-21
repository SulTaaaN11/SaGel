import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_TTL, createAdminToken } from '@/lib/admin-session';
import { getAdminEnv } from '@/lib/env.server';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;
// حماية بسيطة داخل الذاكرة (best-effort على بيئات serverless)
const fails = new Map<string, { count: number; first: number }>();

const digest = (v: string) => createHash('sha256').update(v).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function isLocked(key: string): boolean {
  const rec = fails.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    fails.delete(key);
    return false;
  }
  return rec.count >= MAX_FAILS;
}

function recordFail(key: string): void {
  const rec = fails.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) fails.set(key, { count: 1, first: Date.now() });
  else rec.count += 1;
}

export async function POST(req: Request) {
  const env = getAdminEnv();
  if (!env) {
    return NextResponse.json({ ok: false, message: 'إعدادات الإدارة غير مكتملة على الخادم.' }, { status: 500 });
  }

  const key = clientKey(req);
  if (isLocked(key)) {
    return NextResponse.json(
      { ok: false, message: 'محاولات كثيرة. حاول مرة أخرى بعد بضع دقائق.' },
      { status: 429 },
    );
  }

  let username = '';
  let password = '';
  try {
    const body: unknown = await req.json();
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>;
      if (typeof b.username === 'string') username = b.username.slice(0, 200);
      if (typeof b.password === 'string') password = b.password.slice(0, 200);
    }
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  // نفحص الحقلين دائماً (بدون short-circuit) وبمقارنة ثابتة الزمن
  const userOk = safeEqual(username, env.username);
  const passOk = safeEqual(password, env.password);

  if (!(userOk && passOk)) {
    recordFail(key);
    await sleep(400);
    return NextResponse.json({ ok: false, message: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
  }

  fails.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: await createAdminToken(env.secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL,
  });
  return res;
}
