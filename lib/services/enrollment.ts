import { toServiceError } from './errors';
import { parseEnrollResult } from './parse';
import { buildPlan, buildResolution, toFreeJson } from './resolver';
import type {
  DB,
  EnrollErrorCode,
  EnrollOutcome,
  EnrollmentPlan,
  PlanArgs,
  Resolution,
  SlotKind,
  SuggestedSlot,
} from './types';
import { ServiceError } from './errors';
import type { FreeTime } from '@/lib/schedule';

/** كل مواعيد المادة مع حالة وسبب لكل ميعاد (RPC: suggest_slots). */
export async function getSuggestions(
  db: DB,
  args: { subjectId: number; kind: SlotKind; free?: FreeTime[] | null; limit?: number },
): Promise<SuggestedSlot[]> {
  const { data, error } = await db.rpc('suggest_slots', {
    p_subject_id: args.subjectId,
    p_kind: args.kind,
    p_free: toFreeJson(args.free),
    p_limit: args.limit ?? 200,
  });
  if (error) throw toServiceError(error);
  return data ?? [];
}

/** خطة التسكين: المتاح ضمن الفراغ + بدائل خارجه + تشخيص الأسباب. */
export async function planEnrollment(db: DB, args: PlanArgs): Promise<EnrollmentPlan> {
  const constrained = toFreeJson(args.free) !== null;
  const [rows, anyTime] = await Promise.all([
    getSuggestions(db, { ...args }),
    constrained ? getSuggestions(db, { subjectId: args.subjectId, kind: args.kind, free: null }) : Promise.resolve(null),
  ]);
  return buildPlan(rows, anyTime);
}

/** خطة + رسالة وإجراءات جاهزة للعرض. */
export async function resolveEnrollment(db: DB, args: PlanArgs): Promise<{ plan: EnrollmentPlan; resolution: Resolution }> {
  const plan = await planEnrollment(db, args);
  return { plan, resolution: buildResolution(plan) };
}

const RESOLVABLE: readonly EnrollErrorCode[] = [
  'SLOT_FULL',
  'SLOT_CLOSED',
  'TIME_CONFLICT',
  'CONCURRENT_CONFLICT',
  'NO_SLOT_AVAILABLE',
  'SLOT_NOT_FOUND',
];

async function safeResolution(db: DB, args: PlanArgs): Promise<Resolution | null> {
  try {
    return (await resolveEnrollment(db, args)).resolution;
  } catch {
    return null;
  }
}

function failureFromThrown(err: unknown): EnrollOutcome {
  if (err instanceof ServiceError) {
    return { ok: false, code: err.code === 'UNKNOWN' ? 'UNKNOWN' : err.code, message: err.message, resolution: null };
  }
  return { ok: false, code: 'UNKNOWN', message: 'حدث خطأ غير متوقع. حاول مرة أخرى.', resolution: null };
}

/** تسكين في ميعاد محدد. لو فشل بسبب امتلاء/تعارض يرجع معه بدائل جاهزة. */
export async function enrollInSlot(db: DB, args: PlanArgs & { slotId: string }): Promise<EnrollOutcome> {
  const { data, error } = await db.rpc('enroll_student', { p_slot_id: args.slotId });
  if (error) return failureFromThrown(toServiceError(error));

  const result = parseEnrollResult(data);
  if (result.ok) return { ok: true, slotId: result.slotId };

  const resolution = RESOLVABLE.includes(result.code) ? await safeResolution(db, args) : null;
  return { ok: false, code: result.code, message: result.message, resolution };
}

/** "تسكين سريع بأقرب وقت متاح" بالأولوية؛ عند الفشل يرجع السبب والبدائل. */
export async function quickEnroll(db: DB, args: PlanArgs): Promise<EnrollOutcome> {
  const { data, error } = await db.rpc('quick_enroll', {
    p_subject_id: args.subjectId,
    p_kind: args.kind,
    p_free: toFreeJson(args.free),
  });
  if (error) return failureFromThrown(toServiceError(error));

  const result = parseEnrollResult(data);
  if (result.ok) return { ok: true, slotId: result.slotId };

  const resolution = RESOLVABLE.includes(result.code) ? await safeResolution(db, args) : null;
  return { ok: false, code: result.code, message: result.message, resolution };
}
