import type { Json, MyScheduleRow } from '@/lib/database.types';
import { cellKey, describeSlot, isValidCell, type FreeTime } from '@/lib/schedule';
import type {
  EnrollmentPlan,
  Resolution,
  ResolutionAction,
  ResolutionCause,
  SlotStatus,
  SuggestedSlot,
  Tier,
} from './types';

/* ------------------------------------------------------------------ */
/* دوال خالصة (بدون اتصال بقاعدة البيانات): ترتيب، تشخيص، واقتراحات   */
/* أولوية التسكين تُحسب في SQL (suggest_slots.tier) وهنا نحافظ عليها  */
/* ------------------------------------------------------------------ */

/** أولوية: 1) نفس المجموعة/السكشن  2) باقي سكاشن المجموعة  3) باقي المجاميع، ثم الأقرب يوماً وفترة */
export function compareSlots(a: SuggestedSlot, b: SuggestedSlot): number {
  return a.tier - b.tier || a.day_no - b.day_no || a.period_no - b.period_no;
}

/** يحوّل أوقات الفراغ إلى jsonb. القائمة الفارغة تعني "بدون قيد". */
export function toFreeJson(free?: FreeTime[] | null): Json | null {
  if (!free || free.length === 0) return null;
  const seen = new Set<string>();
  const out: FreeTime[] = [];
  for (const cell of free) {
    if (!isValidCell(cell)) continue;
    const key = cellKey(cell);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ day: cell.day, period: cell.period });
  }
  return out.length > 0 ? (out as unknown as Json) : null;
}

const emptyCounts = (): Record<SlotStatus, number> => ({
  available: 0,
  full: 0,
  closed: 0,
  conflict: 0,
  not_free: 0,
  already_enrolled: 0,
});

/**
- rows: نتيجة suggest_slots مع أوقات الفراغ المحددة.
- anyTimeRows: نفس النتيجة بدون قيد فراغ (لاقتراح بدائل خارج الفراغ) أو null.
 */
export function buildPlan(rows: SuggestedSlot[], anyTimeRows: SuggestedSlot[] | null): EnrollmentPlan {
  const sorted = [...rows].sort(compareSlots);
  const counts = emptyCounts();
  for (const r of sorted) counts[r.status] += 1;

  const available = sorted.filter((s) => s.status === 'available');
  const byTier: Record<Tier, SuggestedSlot[]> = { 1: [], 2: [], 3: [] };
  for (const s of available) byTier[s.tier].push(s);

  const availableIds = new Set(available.map((s) => s.slot_id));
  const outsideFreeTime = (anyTimeRows ?? [])
    .filter((s) => s.status === 'available' && !availableIds.has(s.slot_id))
    .sort(compareSlots);

  return {
    rows: sorted,
    counts,
    available,
    byTier,
    best: available[0] ?? null,
    outsideFreeTime,
    hasSlots: sorted.length > 0,
    alreadyEnrolled: sorted.length > 0 && sorted.every((s) => s.status === 'already_enrolled'),
  };
}

const CONFLICT_PREFIX = 'يتعارض مع مادة ';

/** اسم المادة المتعارضة، مأخوذ من نص reason الذي تولّده دالة SQL (suggest_slots). */
export function extractConflictSubject(reason: string): string {
  return reason.startsWith(CONFLICT_PREFIX) ? reason.slice(CONFLICT_PREFIX.length).trim() : reason;
}

function uniqueCells(slots: SuggestedSlot[], max: number): FreeTime[] {
  const seen = new Set<string>();
  const cells: FreeTime[] = [];
  for (const s of slots) {
    const cell = { day: s.day_no, period: s.period_no };
    const key = cellKey(cell);
    if (seen.has(key)) continue;
    seen.add(key);
    cells.push(cell);
    if (cells.length >= max) break;
  }
  return cells;
}

function buildCauses(plan: EnrollmentPlan): ResolutionCause[] {
  const causes: ResolutionCause[] = [];
  const examplesOf = (status: SlotStatus) => plan.rows.filter((r) => r.status === status).slice(0, 3);

  if (plan.counts.full > 0) {
    causes.push({
      status: 'full',
      count: plan.counts.full,
      title: 'مواعيد مكتملة العدد',
      detail: `${plan.counts.full} ميعاد وصل للحد الأقصى من الطلاب.`,
      examples: examplesOf('full'),
    });
  }
  if (plan.counts.closed > 0) {
    causes.push({
      status: 'closed',
      count: plan.counts.closed,
      title: 'مواعيد مغلقة',
      detail: `${plan.counts.closed} ميعاد مقفول من الإدارة حالياً.`,
      examples: examplesOf('closed'),
    });
  }
  if (plan.counts.conflict > 0) {
    const subjects = [
      ...new Set(plan.rows.filter((r) => r.status === 'conflict').map((r) => extractConflictSubject(r.reason))),
    ];
    causes.push({
      status: 'conflict',
      count: plan.counts.conflict,
      title: 'تعارض مع جدولك',
      detail: `${plan.counts.conflict} ميعاد يتعارض مع: ${subjects.join('، ')}.`,
      examples: examplesOf('conflict'),
    });
  }
  if (plan.counts.not_free > 0) {
    causes.push({
      status: 'not_free',
      count: plan.counts.not_free,
      title: 'خارج أوقات فراغك',
      detail: `${plan.counts.not_free} ميعاد خارج الفترات اللي حددتها.`,
      examples: examplesOf('not_free'),
    });
  }
  return causes;
}

/** يحوّل الخطة إلى رسالة وإجراءات جاهزة للعرض (بدائل، توسيع الفراغ، حل التعارض). */
export function buildResolution(plan: EnrollmentPlan): Resolution {
  if (plan.alreadyEnrolled) {
    return {
      kind: 'already_enrolled',
      headline: 'أنت مسجل في المادة دي بالفعل. احذفها من جدولك لو عايز تغيّر الميعاد.',
      causes: [],
      actions: [],
    };
  }

  if (!plan.hasSlots) {
    return {
      kind: 'no_slots',
      headline: 'لسه مفيش مواعيد مضافة للمادة دي.',
      causes: [],
      actions: [{ type: 'contact_admin', label: 'كلّم الإدارة لإضافة مواعيد المادة.' }],
    };
  }

  if (plan.best) {
    const actions: ResolutionAction[] = plan.available.slice(0, 3).map((slot) => ({
      type: 'enroll',
      label: describeSlot(slot),
      slot,
      outsideFreeTime: false,
    }));
    return { kind: 'ok', headline: 'فيه مواعيد مناسبة لك.', causes: [], actions };
  }

  const causes = buildCauses(plan);
  const actions: ResolutionAction[] = [];

  for (const slot of plan.outsideFreeTime.slice(0, 3)) {
    actions.push({ type: 'enroll', label: describeSlot(slot), slot, outsideFreeTime: true });
  }
  if (plan.outsideFreeTime.length > 0) {
    actions.push({
      type: 'widen_free_time',
      label: 'ضيف الفترات دي لأوقات فراغك',
      cells: uniqueCells(plan.outsideFreeTime, 6),
    });
  }

  if (plan.counts.conflict > 0) {
    const subjects = new Set(plan.rows.filter((r) => r.status === 'conflict').map((r) => extractConflictSubject(r.reason)));
    for (const subjectName of subjects) {
      actions.push({
        type: 'resolve_conflict',
        label: `غيّر أو احذف ميعاد ${subjectName} لو عايز تفتح الفترات دي`,
        subjectName,
      });
    }
  }

  if (plan.outsideFreeTime.length === 0) {
    actions.push({
      type: 'contact_admin',
      label: 'كلّم الإدارة لزيادة السعة أو فتح ميعاد إضافي للمادة.',
    });
  }

  return {
    kind: 'blocked',
    headline:
      plan.outsideFreeTime.length > 0
        ? 'مفيش ميعاد مناسب في أوقات فراغك، لكن فيه بدائل في أوقات تانية.'
        : 'مفيش ميعاد متاح للمادة دي دلوقتي.',
    causes,
    actions,
  };
}

function pairedPeriod(period: number): number | null {
  if (period < 1 || period > 8) return null;
  return period % 2 === 1 ? period + 1 : period - 1;
}

/** الفترات المشغولة في جدول الطالب: مفتاح "يوم-فترة"  اسم المادة (بما فيها الفترة المقترنة 1-2، 3-4، 5-6، 7-8). */
export function buildBusyMap(schedule: MyScheduleRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of schedule) {
    map.set(cellKey({ day: row.day_no, period: row.period_no }), row.subject_name);
    const partner = pairedPeriod(row.period_no);
    if (partner !== null) {
      const partnerKey = cellKey({ day: row.day_no, period: partner });
      if (!map.has(partnerKey)) {
        map.set(partnerKey, row.subject_name);
      }
    }
  }
  return map;
}