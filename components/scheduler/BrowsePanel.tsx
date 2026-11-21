'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CapacityBar, EmptyState, ErrorState, Skeleton, StatusBadge } from '@/components/ui';
import type { SlotRow } from '@/lib/database.types';
import { DAYS, KIND_LABEL, dayLabel, deriveSlotStatus, periodRange } from '@/lib/schedule';
import { fetchSlots } from '@/lib/services';
import type { Catalog, DB, SlotKind } from '@/lib/services';

type Props = { db: DB; catalog: Catalog };

const PAGE_SIZE = 24;

export default function BrowsePanel({ db, catalog }: Props) {
  const [slots, setSlots] = useState<SlotRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [kind, setKind] = useState<'' | SlotKind>('');
  const [day, setDay] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setError(null);
    setSlots(null);
    try {
      setSlots(await fetchSlots(db));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل المواعيد.');
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const lookups = useMemo(
    () => ({
      subjects: new Map(catalog.subjects.map((s) => [s.id, s.name])),
      groups: new Map(catalog.groups.map((g) => [g.id, g.name])),
      sections: new Map(catalog.sections.map((s) => [s.id, s.number])),
      staff: new Map(catalog.staff.map((s) => [s.id, s.full_name])),
    }),
    [catalog],
  );

  const filtered = useMemo(() => {
    if (!slots) return [];
    const q = query.trim().toLowerCase();
    return slots.filter((s) => {
      if (subjectId && String(s.subject_id) !== subjectId) return false;
      if (groupId && String(s.group_id) !== groupId) return false;
      if (kind && s.kind !== kind) return false;
      if (day !== null && s.day !== day) return false;
      if (q) {
        const hay = `${lookups.staff.get(s.staff_id) ?? ''} ${s.room} ${lookups.subjects.get(s.subject_id) ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [slots, subjectId, groupId, kind, day, query, lookups]);

  const hasFilters = subjectId !== '' || groupId !== '' || kind !== '' || day !== null || query !== '';

  function clearFilters() {
    setSubjectId('');
    setGroupId('');
    setKind('');
    setDay(null);
    setQuery('');
    setLimit(PAGE_SIZE);
  }

  return (
    <div>
      <section className="panel" aria-labelledby="browse-title">
        <h2 id="browse-title" className="panel-title">
          كل المواعيد
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="input sm:col-span-2 lg:col-span-1"
            type="search"
            placeholder="ابحث باسم الدكتور أو المادة أو القاعة"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            aria-label="بحث"
          />
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="المادة">
            <option value="">كل المواد</option>
            {catalog.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="المجموعة">
            <option value="">كل المجموعات</option>
            {catalog.groups.map((g) => (
              <option key={g.id} value={g.id}>
                مجموعة {g.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value === 'lecture' || e.target.value === 'section' ? e.target.value : '')}
            aria-label="النوع"
          >
            <option value="">محاضرات وسكاشن</option>
            <option value="lecture">محاضرات فقط</option>
            <option value="section">سكاشن فقط</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="اليوم">
          <button type="button" className="chip" aria-pressed={day === null} onClick={() => setDay(null)}>
            كل الأيام
          </button>
          {DAYS.map((d) => (
            <button key={d.index} type="button" className="chip" aria-pressed={day === d.index} onClick={() => setDay(d.index)}>
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-live="polite">
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : slots === null ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : slots.length === 0 ? (
          <EmptyState title="مفيش مواعيد مضافة لسه" hint="شغّل seed.sql أو اطلب من الإدارة إضافة المواعيد." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="مفيش نتائج بالفلاتر دي"
            action={
              hasFilters ? (
                <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                  مسح الفلاتر
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="muted mb-3 text-sm">
              {filtered.length} ميعاد
              {hasFilters ? (
                <button type="button" className="ms-3 underline" onClick={clearFilters}>
                  مسح الفلاتر
                </button>
              ) : null}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, limit).map((s) => {
                const sectionNumber = s.section_id !== null ? lookups.sections.get(s.section_id) : undefined;
                return (
                  <article key={s.id} className="slot-card" data-status={deriveSlotStatus(s)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{lookups.subjects.get(s.subject_id) ?? 'مادة'}</p>
                        <p className="muted text-sm">{KIND_LABEL[s.kind]}</p>
                      </div>
                      <StatusBadge status={deriveSlotStatus(s)} />
                    </div>
                    <p className="text-sm">
                      {dayLabel(s.day)} · الفترة {s.period} ({periodRange(s.period)})
                    </p>
                    <p className="muted text-sm">
                      مجموعة {lookups.groups.get(s.group_id) ?? ''}
                      {sectionNumber !== undefined ? ` · سكشن ${sectionNumber}` : ''} · {s.room}
                    </p>
                    <p className="text-sm">{lookups.staff.get(s.staff_id) ?? ''}</p>
                    <CapacityBar enrolled={s.enrolled_count} capacity={s.capacity} />
                  </article>
                );
              })}
            </div>
            {filtered.length > limit ? (
              <div className="mt-4 text-center">
                <button type="button" className="btn btn-ghost" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                  عرض المزيد
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
