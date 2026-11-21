'use client';

import { Fragment, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { EmptyState, Modal } from '@/components/ui';
import type { MyScheduleRow } from '@/lib/database.types';
import { DAYS, KIND_LABEL, PERIODS, cellKey, dayLabel, periodRange } from '@/lib/schedule';
import { dropEnrollment } from '@/lib/services';
import type { DB } from '@/lib/services';

type Props = {
  db: DB;
  schedule: MyScheduleRow[];
  totalSubjects: number;
  onChanged: () => Promise<void>;
  onGoBook: () => void;
};

type WeekCell = { type: 'item'; row: MyScheduleRow; span: 1 | 2 } | { type: 'skip' };

/** فترتان متتاليتان (1-2، 3-4، 5-6، 7-8) تُدمجان لو كانتا نفس المادة والنوع والقاعة والمسؤول. */
function sameUnit(a: MyScheduleRow, b: MyScheduleRow): boolean {
  return (
    a.subject_name === b.subject_name &&
    a.kind === b.kind &&
    a.room === b.room &&
    a.staff_name === b.staff_name
  );
}

export default function ScheduleView({ db, schedule, totalSubjects, onChanged, onGoBook }: Props) {
  const { push } = useToast();
  const [target, setTarget] = useState<MyScheduleRow | null>(null);
  const [busy, setBusy] = useState(false);

  const byCell = useMemo(() => {
    const map = new Map<string, MyScheduleRow>();
    for (const row of schedule) map.set(cellKey({ day: row.day_no, period: row.period_no }), row);
    return map;
  }, [schedule]);

  // دمج الفترتين المتتاليتين: الخلية الأولى تأخذ rowSpan=2 والثانية تُتخطى
  const cells = useMemo(() => {
    const map = new Map<string, WeekCell>();
    for (const d of DAYS) {
      for (const p of PERIODS) {
        const key = cellKey({ day: d.index, period: p.id });
        if (map.get(key)?.type === 'skip') continue;
        const row = byCell.get(key);
        if (!row) continue;
        const nextKey = cellKey({ day: d.index, period: p.id + 1 });
        const next = byCell.get(nextKey);
        if (p.id % 2 === 1 && next && sameUnit(row, next)) {
          map.set(key, { type: 'item', row, span: 2 });
          map.set(nextKey, { type: 'skip' });
        } else {
          map.set(key, { type: 'item', row, span: 1 });
        }
      }
    }
    return map;
  }, [byCell]);

  if (schedule.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          title="جدولك فاضي لحد دلوقتي"
          hint="اختار مادة وسكّن أول ميعاد."
          action={
            <button type="button" className="btn" onClick={onGoBook}>
              ابدأ التسكين
            </button>
          }
        />
      </section>
    );
  }

  async function confirmDrop() {
    if (!target) return;
    setBusy(true);
    const result = await dropEnrollment(db, target.enrollment_id);
    if (result.ok) {
      push({ tone: 'success', title: 'تم حذف المادة من جدولك', text: `${target.subject_name}  ${KIND_LABEL[target.kind]}` });
      await onChanged();
    } else {
      push({ tone: 'error', title: 'تعذّر الحذف', text: result.message });
    }
    setBusy(false);
    setTarget(null);
  }

  const totalSlots = totalSubjects * 2;
  const lastPeriodId = PERIODS[PERIODS.length - 1]?.id;

  return (
    <div className="print-area">
      <section className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="panel-title !mb-0">جدولي الأسبوعي</h2>
            <p className="muted text-sm">
              مسجل في {schedule.length} من {totalSlots} (محاضرات وسكاشن)
            </p>
          </div>
          <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
            حفظ / طباعة الجدول
          </button>
        </div>

        <div className="table-scroll" role="region" aria-label="الجدول الأسبوعي" tabIndex={0}>
          <table className="week-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">الفترة</span>
                </th>
                {DAYS.map((d) => (
                  <th key={d.index} scope="col">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <Fragment key={p.id}>
                  <tr>
                    <th scope="row">
                      <div>{p.id}</div>
                      <div className="avail-time">{p.start}</div>
                    </th>
                    {DAYS.map((d) => {
                      const cell = cells.get(cellKey({ day: d.index, period: p.id }));
                      if (cell?.type === 'skip') return null;
                      const item = cell?.type === 'item' ? cell : null;
                      const span = item ? item.span : 1;
                      return (
                        <td
                          key={d.index}
                          data-filled={item ? 'true' : 'false'}
                          data-span={span}
                          rowSpan={span === 2 ? 2 : undefined}
                        >
                          {item ? (
                            <div className="week-item">
                              <span className="font-bold">{item.row.subject_name}</span>
                              <small>
                                {KIND_LABEL[item.row.kind]}  {item.row.room}
                              </small>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                  {p.id % 2 === 0 && p.id !== lastPeriodId ? (
                    <tr className="week-gap" aria-hidden="true">
                      <td colSpan={DAYS.length + 1} />
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">تفاصيل المواد</h2>
        <ul className="flex flex-col gap-2">
          {schedule.map((row) => (
            <li
              key={row.enrollment_id}
              className="row-interactive flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {row.subject_name} <span className="badge" data-status="already_enrolled">{KIND_LABEL[row.kind]}</span>
                </p>
                <p className="muted text-sm">
                  {dayLabel(row.day_no)}  الفترة {row.period_no} ({periodRange(row.period_no)})  {row.staff_name}  {row.room}
                </p>
                <p className="muted text-sm">
                  مجموعة {row.group_name}
                  {row.section_number !== null ? `  سكشن ${row.section_number}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn-danger btn-sm no-print" onClick={() => setTarget(row)}>
                حذف
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={target !== null} onClose={() => setTarget(null)} title="حذف المادة من جدولك؟" busy={busy}>
        {target ? (
          <>
            <p className="mb-4 text-sm">
              هتتشال <strong>{target.subject_name}</strong> ({KIND_LABEL[target.kind]}) من جدولك، وتقدر تسكّنها تاني في أي وقت.
            </p>
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setTarget(null)} disabled={busy}>
                رجوع
              </button>
              <button type="button" className="btn btn-danger flex-1" onClick={confirmDrop} disabled={busy} data-autofocus>
                {busy ? 'جارٍ الحذف' : 'تأكيد الحذف'}
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}