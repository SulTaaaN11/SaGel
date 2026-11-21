import type { Json } from '@/lib/database.types';
import type { DropResult, EnrollErrorCode, EnrollResult, RegisterErrorCode, RegisterResult } from './types';

type JsonRecord = { [key: string]: Json | undefined };

function isRecord(v: Json | undefined): v is JsonRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const ENROLL_CODES: readonly EnrollErrorCode[] = [
  'STUDENT_NOT_FOUND',
  'SLOT_NOT_FOUND',
  'ALREADY_ENROLLED',
  'TIME_CONFLICT',
  'SLOT_FULL',
  'SLOT_CLOSED',
  'CONCURRENT_CONFLICT',
  'NO_SLOT_AVAILABLE',
];

const REGISTER_CODES: readonly RegisterErrorCode[] = [
  'NOT_SIGNED_IN',
  'CODE_TAKEN',
  'INVALID_GROUP_SECTION',
  'INVALID_DATA',
];

const str = (v: Json | undefined, fallback: string): string => (typeof v === 'string' && v ? v : fallback);

export function parseEnrollResult(raw: Json): EnrollResult {
  if (!isRecord(raw)) return { ok: false, code: 'UNKNOWN', message: 'رد غير متوقع من الخادم.' };
  if (raw.ok === true) return { ok: true, slotId: str(raw.slot_id, '') };

  const code = ENROLL_CODES.find((c) => c === raw.code) ?? 'UNKNOWN';
  return {
    ok: false,
    code,
    message: str(raw.message, 'تعذّر إتمام التسكين.'),
    conflictsWith: typeof raw.conflicts_with === 'string' ? raw.conflicts_with : undefined,
  };
}

export function parseRegisterResult(raw: Json): RegisterResult {
  if (!isRecord(raw)) return { ok: false, code: 'UNKNOWN', message: 'رد غير متوقع من الخادم.' };
  if (raw.ok === true) return { ok: true };
  const code = REGISTER_CODES.find((c) => c === raw.code) ?? 'UNKNOWN';
  return { ok: false, code, message: str(raw.message, 'تعذّر حفظ البيانات.') };
}

export function parseDropResult(raw: Json): DropResult {
  if (isRecord(raw) && raw.ok === true) return { ok: true };
  return {
    ok: false,
    code: isRecord(raw) && raw.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'UNKNOWN',
    message: isRecord(raw) ? str(raw.message, 'تعذّر حذف المادة.') : 'تعذّر حذف المادة.',
  };
}
