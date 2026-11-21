'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui';
import type { MyScheduleRow } from '@/lib/database.types';
import { KIND_LABEL, TIER_LABEL, cellKey } from '@/lib/schedule';
import type { FreeTime } from '@/lib/schedule';
import { buildBusyMap, enrollInSlot, quickEnroll, resolveEnrollment } from '@/lib/services';
import type {
  Catalog,
  DB,
  EnrollOutcome,
  EnrollmentPlan,
  Resolution,
  ResolutionAction,
  SlotKind,
  SuggestedSlot,
  Tier,
} from '@/lib/services';
import AvailabilityGrid from './AvailabilityGrid';
import ProblemPanel from './ProblemPanel';
import SlotCard from './SlotCard';

type Props = {
  db: DB;
  catalog: Catalog;
  schedule: MyScheduleRow[];
  onChanged: () => Promise<void>;
  onOpenSchedule: () => void;
};

type Failure = { message: string; resolution: Resolution | null };

function parseCell(key: string): FreeTime {
  const [day, period] = key.split('-').map(Number);
  return { day, period };
}

function tierTitle(tier: Tier, kind: SlotKind): string {
  if (kind === 'lecture') return tier === 1 ? 'مجموعتك' : TIER_LABEL[tier];
  return TIER_LABEL[tier];
}

function bookedSummary(lecture: boolean, section: boolean): string {
  if (lecture && section) return 'مسجلة بالكامل';
  if (lecture) return 'المحاضرة مسجلة';
  if (section) return 'السكشن مسجل';
  return 'لم تسجل بعد';
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

const KINDS = ['lecture', 'section'] as const;
const PREVIEW_COUNT = 4;

export default function BookingPanel({ db, catalog, schedule, onChanged, onOpenSchedule }: Props) {
  const { push } = useToast();

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [kind, setKind] = useState<SlotKind>('lecture');
  const [free, setFree] = useState<Set<string>>(() => new Set());
  const [plan, setPlan] = useState<EnrollmentPlan | null>(null);
  const [autoResolution, setAutoResolution] = useState<Resolution | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const freeList = useMemo<FreeTime[]>(() => Array.from(free).map(parseCell), [free]);
  const busy = useMemo(() => buildBusyMap(schedule), [schedule]);

  const subject = catalog.subjects.find((s) => s.id === subjectId) ?? null;
  const enrolledRow = subject
    ? (schedule.find((r) => r.subject_name === subject.name && r.kind === kind) ?? null)
    : null;
  const enrolledId = enrolledRow?.enrollment_id ?? null;

  useEffect(() => {
    if (subjectId === null || enrolledId !== null) {
      setPlan(null);
      setAutoResolution(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const timer = setTimeout(async () => {
      try {
        const result = await resolveEnrollment(db, { subjectId, kind, free: freeList });
        if (cancelled) return;
        setPlan(result.plan);
        setAutoResolution(result.resolution);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'تعذّر تحميل المواعيد.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [db, subjectId, kind, freeList, enrolledId, reload]);

  function choose(id: number, nextKind: SlotKind) {
    setSubjectId(id);
    setKind(nextKind);
    setFailure(null);
    setExpanded({});
  }

  function changeFree(next: Set<string>) {
    setFree(next);
    setFailure(null);
  }

  async function afterOutcome(out: EnrollOutcome) {
    if (out.ok) {
      push({
        tone: 'success',
        title: 'تم التسكين',
        text: subject ? `${subject.name}  ${KIND_LABEL[kind]}` : undefined,
      });
      setFailure(null);
      await onChanged();
    } else {
      push({
        tone: out.code === 'NETWORK' || out.code === 'NOT_SIGNED_IN' ? 'error' : 'warn',
        title: 'ما قدرناش نسكّنك',
        text: out.message,
      });
      setFailure({ message: out.message, resolution: out.resolution });
      setReload((n) => n + 1);
    }
    setPendingId(null);
  }

  async function doQuick() {
    if (subjectId === null || pendingId !== null) return;
    setPendingId('quick');
    await afterOutcome(await quickEnroll(db, { subjectId, kind, free: freeList }));
  }

  async function doEnroll(slot: SuggestedSlot) {
    if (subjectId === null || pendingId !== null) return;
    setPendingId(slot.slot_id);
    await afterOutcome(await enrollInSlot(db, { slotId: slot.slot_id, subjectId, kind, free: freeList }));
  }

  function onAction(action: ResolutionAction) {
    switch (action.type) {
      case 'enroll':
        void doEnroll(action.slot);
        break;
      case 'widen_free_time': {
        const next = new Set(free);
        for (const c of action.cells) next.add(cellKey(c));
        changeFree(next);
        break;
      }
      case 'resolve_conflict':
        onOpenSchedule();
        break;
      case 'contact_admin':
        push({ tone: 'info', title: 'تواصل مع الإدارة', text: action.label });
        break;
    }
  }

  const shownResolution = failure?.resolution ?? (autoResolution && autoResolution.kind !== 'ok' ? autoResolution : null);

  const nonAvailable = plan ? plan.rows.filter((r) => r.status !== 'available') : [];

  return (
    <div>
      <section className="panel" aria-labelledby="pick-title">
        <h2 id="pick-title" className="panel-title">
          1. اختار المادة
        </h2>
        {catalog.subjects.length === 0 ? (
          <EmptyState title="مفيش مواد مضافة" hint="شغّل schema.sql ثم seed.sql في Supabase." />
        ) : (
          <div className="course-grid">
            {catalog.subjects.map((s) => {
              const lecture = schedule.some((r) => r.subject_name === s.name && r.kind === 'lecture');
              const section = schedule.some((r) => r.subject_name === s.name && r.kind === 'section');
              const selected = subjectId === s.id;
              const isBooked = (k: (typeof KINDS)[number]) => (k === 'lecture' ? lecture : section);
              return (
                <div
                  key={s.id}
                  className="course"
                  data-selected={selected}
                  data-booked={lecture || section}
                >
                  <button
                    type="button"
                    className="course-main"
                    aria-pressed={selected}
                    onClick={() => choose(s.id, kind)}
                  >
                    <span className="course-name">{s.name}</span>
                    <span className="course-meta">{bookedSummary(lecture, section)}</span>
                  </button>
                  <div className="course-kinds" role="group" aria-label={`نوع الميعاد لمادة ${s.name}`}>
                    {KINDS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        className="kind"
                        aria-pressed={selected && kind === k}
                        data-booked={isBooked(k)}
                        onClick={() => choose(s.id, k)}
                      >
                        {KIND_LABEL[k]}
                        {isBooked(k) ? (
                          <>
                            <CheckIcon />
                            <span className="sr-only">{k === 'lecture' ? 'مسجلة' : 'مسجل'}</span>
                          </>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {subject === null ? (
        <section className="panel">
          <EmptyState title="ابدأ باختيار مادة" hint="هنقترح لك أنسب المواعيد حسب مجموعتك وسكشنك وأوقات فراغك." />
        </section>
      ) : enrolledRow ? (
        <section className="panel" aria-live="polite">
          <div className="problem" data-kind="ok">
            <p className="font-bold">
              {subject.name} ({KIND_LABEL[kind]}) مسجلة بالفعل في جدولك.
            </p>
            <p className="muted mt-1 text-sm">
              {enrolledRow.staff_name}  {enrolledRow.room}
            </p>
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={onOpenSchedule}>
              افتح جدولي لتغييرها
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="panel" aria-labelledby="free-title">
            <h2 id="free-title" className="panel-title">
              2. أوقات فراغك
            </h2>
            <AvailabilityGrid value={free} busy={busy} onChange={changeFree} />
          </section>

          <section className="panel" aria-labelledby="result-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="result-title" className="panel-title !mb-0">
                3. المواعيد المقترحة
              </h2>
              <div className="flex items-center gap-3">
                {loading && plan ? <Spinner /> : null}
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={doQuick}
                  disabled={pendingId !== null || loading || (plan !== null && plan.available.length === 0)}
                >
                  {pendingId === 'quick' ? 'جارٍ التسكين' : 'تسكين سريع بأقرب وقت متاح'}
                </button>
              </div>
            </div>

            {shownResolution || failure ? (
              <div className="mb-4">
                <ProblemPanel
                  resolution={shownResolution}
                  message={failure?.message ?? null}
                  pendingId={pendingId}
                  onAction={onAction}
                />
              </div>
            ) : null}

            {loadError ? (
              <ErrorState message={loadError} onRetry={() => setReload((n) => n + 1)} />
            ) : loading && !plan ? (
              <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : plan === null ? null : !plan.hasSlots ? (
              <EmptyState title="لسه مفيش مواعيد للمادة دي" hint="الإدارة هتضيفها قريباً." />
            ) : plan.available.length === 0 ? (
              <EmptyState
                title="مفيش مواعيد متاحة بالشروط الحالية"
                hint="جرّب توسّع أوقات فراغك أو اختار أحد البدائل فوق."
              />
            ) : (
              <>
                {([1, 2, 3] as const).map((tier) => {
                  const list = plan.byTier[tier];
                  if (list.length === 0) return null;
                  const open = expanded[tier] === true;
                  const visible = open ? list : list.slice(0, PREVIEW_COUNT);
                  return (
                    <div key={tier} className="mb-5">
                      <h3 className="tier-title">
                        {tierTitle(tier, kind)} <span className="muted">({list.length})</span>
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {visible.map((s) => (
                          <SlotCard
                            key={s.slot_id}
                            slot={s}
                            pending={pendingId === s.slot_id}
                            disabled={pendingId !== null}
                            onEnroll={doEnroll}
                          />
                        ))}
                      </div>
                      {list.length > PREVIEW_COUNT ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm mt-3"
                          onClick={() => setExpanded((prev) => ({ ...prev, [tier]: !open }))}
                        >
                          {open ? 'عرض أقل' : `عرض الكل (${list.length})`}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </>
            )}

            {plan && nonAvailable.length > 0 ? (
              <details className="mt-2">
                <summary className="muted cursor-pointer text-sm">
                  مواعيد غير متاحة ({nonAvailable.length}) وأسبابها
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {nonAvailable.slice(0, 12).map((s) => (
                    <SlotCard key={s.slot_id} slot={s} />
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}