import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-guard';

/** هل جلسة الإدارة الحالية صالحة؟ (تبقى صالحة عند التحديث حتى انتهاء مدتها أو تسجيل الخروج) */
export async function GET() {
  return NextResponse.json({ ok: true, admin: await isAdmin() }, { headers: { 'Cache-Control': 'no-store' } });
}
