import { NextResponse } from 'next/server';
import { describeDbError } from '@/lib/admin-errors';
import { requireAdminApi } from '@/lib/admin-guard';
import { parseCreate } from '@/lib/admin-validation';
import { getAdminClient } from '@/lib/supabase/admin';

/** إضافة ميعاد جديد (محاضرة أو سكشن). */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  const parsed = parseCreate(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });

  const { data, error } = await getAdminClient().from('slots').insert(parsed.value).select().single();
  if (error) {
    const e = describeDbError(error);
    return NextResponse.json({ ok: false, message: e.message }, { status: e.status });
  }
  return NextResponse.json({ ok: true, data });
}
