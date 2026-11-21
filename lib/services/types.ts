import type { Json, SlotKind, SlotStatus, SuggestedSlotRow, Tier } from '@/lib/database.types';
import type { FreeTime } from '@/lib/schedule';

export type { DB } from '@/lib/supabase/client';
export type { SlotKind, SlotStatus, SuggestedSlotRow as SuggestedSlot, Tier, FreeTime };

// ---------- نتائج الدوال (jsonb) ----------
export type EnrollErrorCode =
  | 'STUDENT_NOT_FOUND'
  | 'SLOT_NOT_FOUND'
  | 'ALREADY_ENROLLED'
  | 'TIME_CONFLICT'
  | 'SLOT_FULL'
  | 'SLOT_CLOSED'
  | 'CONCURRENT_CONFLICT'
  | 'NO_SLOT_AVAILABLE'
  | 'NOT_SIGNED_IN'
  | 'NETWORK'
  | 'UNKNOWN';

export type EnrollSuccess = { ok: true; slotId: string };
export type EnrollFailure = {
  ok: false;
  code: EnrollErrorCode;
  message: string;
  conflictsWith?: string;
};
export type EnrollResult = EnrollSuccess | EnrollFailure;

export type RegisterErrorCode = 'NOT_SIGNED_IN' | 'CODE_TAKEN' | 'INVALID_GROUP_SECTION' | 'INVALID_DATA' | 'NETWORK' | 'UNKNOWN';
export type RegisterResult = { ok: true } | { ok: false; code: RegisterErrorCode; message: string };

export type DropResult = { ok: true } | { ok: false; code: 'NOT_FOUND' | 'NETWORK' | 'UNKNOWN'; message: string };

// ---------- حل المشاكل والاقتراحات ----------
export type EnrollmentPlan = {
  /** كل مواعيد المادة مرتبة (أولوية ثم يوم ثم فترة) مع الحالة */
  rows: SuggestedSlotRow[];
  counts: Record<SlotStatus, number>;
  /** المتاح فعلاً ضمن أوقات الفراغ */
  available: SuggestedSlotRow[];
  byTier: Record<Tier, SuggestedSlotRow[]>;
  best: SuggestedSlotRow | null;
  /** مواعيد متاحة لكن خارج أوقات الفراغ المحددة (بدائل) */
  outsideFreeTime: SuggestedSlotRow[];
  hasSlots: boolean;
  alreadyEnrolled: boolean;
};

export type ResolutionCause = {
  status: Exclude<SlotStatus, 'available'>;
  count: number;
  title: string;
  detail: string;
  examples: SuggestedSlotRow[];
};

export type ResolutionAction =
  | { type: 'enroll'; label: string; slot: SuggestedSlotRow; outsideFreeTime: boolean }
  | { type: 'widen_free_time'; label: string; cells: FreeTime[] }
  | { type: 'resolve_conflict'; label: string; subjectName: string }
  | { type: 'contact_admin'; label: string };

export type Resolution = {
  kind: 'ok' | 'blocked' | 'already_enrolled' | 'no_slots';
  headline: string;
  causes: ResolutionCause[];
  actions: ResolutionAction[];
};

export type EnrollOutcome =
  | { ok: true; slotId: string }
  | { ok: false; code: EnrollErrorCode; message: string; resolution: Resolution | null };

export type PlanArgs = { subjectId: number; kind: SlotKind; free?: FreeTime[] | null };

export type { Json };
