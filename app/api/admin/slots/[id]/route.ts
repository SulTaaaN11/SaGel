import { NextResponse } from 'next/server';
import { describeDbError } from '@/lib/admin-errors';
import { requireAdminApi } from '@/lib/admin-guard';
import { UUID_RE, parsePatch } from '@/lib/admin-validation';
import { getAdminClient } from '@/lib/supabase/admin';

type Ctx = { params: Promise<{ id: string }> };

/** تعديل ميعاد: القاعة، الدكتور، اليوم، الفترة، السعة، وفتح/إغلاق التسجيل. */
export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, message: 'معرّف غير صالح.' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'طلب غير صالح.' }, { status: 400 });
  }

  const parsed = parsePatch(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });

  const { data, error } = await getAdminClient().from('slots').update(parsed.value).eq('id', id).select().single();
  if (error) {
    const e = describeDbError(error);
    return NextResponse.json({ ok: false, message: e.message }, { status: e.status });
  }
  return NextResponse.json({ ok: true, data });
}

type DeleteResult = {
  ok?: boolean;
  code?: string;
  enrolled?: number;
  message?: string;
  removed_enrollments?: number;
};

/** حذف ميعاد. لو فيه طلاب مسكّنين يرجع 409 ولازم يتأكد الحذف بـ ?force=1 (admin_delete_slot). */
export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ ok: false, message: 'معرّف غير صالح.' }, { status: 400 });

  const force = new URL(req.url).searchParams.get('force') === '1';
  const { data, error } = await getAdminClient().rpc('admin_delete_slot', { p_slot_id: id, p_force: force });
  if (error) {
    const e = describeDbError(error);
    return NextResponse.json({ ok: false, message: e.message }, { status: e.status });
  }

  const result = (data ?? {}) as unknown as DeleteResult;
  if (result.ok) return NextResponse.json({ ok: true, removed: result.removed_enrollments ?? 0 });
  if (result.code === 'HAS_ENROLLMENTS') {
    return NextResponse.json(
      { ok: false, code: 'HAS_ENROLLMENTS', enrolled: result.enrolled ?? 0, message: result.message },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: false, message: 'الميعاد غير موجود.' }, { status: 404 });
}
