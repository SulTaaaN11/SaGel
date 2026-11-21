import type { SlotKind } from '@/lib/database.types';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SlotCreateInput = {
  subject_id: number;
  kind: SlotKind;
  group_id: number;
  section_id: number | null;
  staff_id: number;
  room: string;
  day: number;
  period: number;
  capacity: number;
  is_open: boolean;
};

export type SlotPatchInput = Partial<Pick<SlotCreateInput, 'staff_id' | 'room' | 'day' | 'period' | 'capacity' | 'is_open'>>;

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function int(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

export function parseCreate(body: unknown): Parsed<SlotCreateInput> {
  if (!isRecord(body)) return { ok: false, message: 'طلب غير صالح.' };

  const subject_id = int(body.subject_id, 1, 32767);
  const group_id = int(body.group_id, 1, 32767);
  const staff_id = int(body.staff_id, 1, 2147483647);
  const day = int(body.day, 0, 5);
  const period = int(body.period, 1, 8);
  const room = text(body.room, 60);
  const kind: SlotKind | null = body.kind === 'lecture' || body.kind === 'section' ? body.kind : null;
  const capacity = body.capacity === undefined ? 250 : int(body.capacity, 1, 5000);
  const is_open = body.is_open === undefined ? true : typeof body.is_open === 'boolean' ? body.is_open : null;

  if (subject_id === null) return { ok: false, message: 'اختر المادة.' };
  if (kind === null) return { ok: false, message: 'اختر نوع الميعاد (محاضرة أو سكشن).' };
  if (group_id === null) return { ok: false, message: 'اختر المجموعة.' };
  if (staff_id === null) return { ok: false, message: 'اختر الدكتور أو المعيد.' };
  if (room === null) return { ok: false, message: 'اكتب اسم القاعة أو المدرج (حتى 60 حرف).' };
  if (day === null) return { ok: false, message: 'اختر اليوم.' };
  if (period === null) return { ok: false, message: 'اختر الفترة (1 إلى 8).' };
  if (capacity === null) return { ok: false, message: 'السعة لازم تكون رقم من 1 إلى 5000.' };
  if (is_open === null) return { ok: false, message: 'قيمة الحالة غير صالحة.' };

  let section_id: number | null = null;
  if (kind === 'section') {
    section_id = int(body.section_id, 1, 2147483647);
    if (section_id === null) return { ok: false, message: 'اختر السكشن.' };
  }

  return { ok: true, value: { subject_id, kind, group_id, section_id, staff_id, room, day, period, capacity, is_open } };
}

export function parsePatch(body: unknown): Parsed<SlotPatchInput> {
  if (!isRecord(body)) return { ok: false, message: 'طلب غير صالح.' };
  const out: SlotPatchInput = {};

  if (body.staff_id !== undefined) {
    const v = int(body.staff_id, 1, 2147483647);
    if (v === null) return { ok: false, message: 'الدكتور أو المعيد غير صالح.' };
    out.staff_id = v;
  }
  if (body.room !== undefined) {
    const v = text(body.room, 60);
    if (v === null) return { ok: false, message: 'اكتب اسم القاعة أو المدرج (حتى 60 حرف).' };
    out.room = v;
  }
  if (body.day !== undefined) {
    const v = int(body.day, 0, 5);
    if (v === null) return { ok: false, message: 'اليوم غير صالح.' };
    out.day = v;
  }
  if (body.period !== undefined) {
    const v = int(body.period, 1, 8);
    if (v === null) return { ok: false, message: 'الفترة غير صالحة (1 إلى 8).' };
    out.period = v;
  }
  if (body.capacity !== undefined) {
    const v = int(body.capacity, 1, 5000);
    if (v === null) return { ok: false, message: 'السعة لازم تكون رقم من 1 إلى 5000.' };
    out.capacity = v;
  }
  if (body.is_open !== undefined) {
    if (typeof body.is_open !== 'boolean') return { ok: false, message: 'قيمة الحالة غير صالحة.' };
    out.is_open = body.is_open;
  }

  if (Object.keys(out).length === 0) return { ok: false, message: 'مفيش تغييرات للحفظ.' };
  return { ok: true, value: out };
}
