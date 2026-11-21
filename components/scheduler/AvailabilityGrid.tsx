'use client';

import { DAYS, PERIODS, cellKey } from '@/lib/schedule';
import type { FreeTime } from '@/lib/schedule';

type Props = {
  value: Set<string>;
  /** الفترات المشغولة بمواد مسجلة: مفتاح "يوم-فترة" ← اسم المادة */
  busy: Map<string, string>;
  onChange: (next: Set<string>) => void;
};

export default function AvailabilityGrid({ value, busy, onChange }: Props) {
  const isBusy = (day: number, period: number) => busy.has(cellKey({ day, period }));

  function toggleCell(day: number, period: number) {
    if (isBusy(day, period)) return;
    const key = cellKey({ day, period });
    const next = new Set(value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  function toggleMany(cells: FreeTime[]) {
    const usable = cells.filter((c) => !isBusy(c.day, c.period));
    if (usable.length === 0) return;
    const allOn = usable.every((c) => value.has(cellKey(c)));
    const next = new Set(value);
    for (const c of usable) {
      if (allOn) next.delete(cellKey(c));
      else next.add(cellKey(c));
    }
    onChange(next);
  }

  function preset(periods: readonly number[] | null) {
    if (periods === null) {
      onChange(new Set());
      return;
    }
    const next = new Set<string>();
    for (const d of DAYS) {
      for (const p of periods) {
        if (!isBusy(d.index, p)) next.add(cellKey({ day: d.index, period: p }));
      }
    }
    onChange(next);
  }

  const dayCells = (day: number): FreeTime[] => PERIODS.map((p) => ({ day, period: p.id }));
  const periodCells = (period: number): FreeTime[] => DAYS.map((d) => ({ day: d.index, period }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="تعبئة سريعة لأوقات الفراغ">
        <button type="button" className="chip" onClick={() => preset([1, 2, 3, 4, 5, 6, 7, 8])}>
          كل الفترات
        </button>
        <button type="button" className="chip" onClick={() => preset([1, 2, 3, 4])}>
          صباحاً (1 - 4)
        </button>
        <button type="button" className="chip" onClick={() => preset([5, 6, 7, 8])}>
          بعد الظهر (5 - 8)
        </button>
        <button type="button" className="chip" onClick={() => preset(null)}>
          مسح
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="avail-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">الفترة</span>
              </th>
              {DAYS.map((d) => (
                <th key={d.index} scope="col">
                  <button
                    type="button"
                    className="avail-head"
                    onClick={() => toggleMany(dayCells(d.index))}
                    title={`تحديد أو إلغاء يوم ${d.label} بالكامل`}
                  >
                    {d.short}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p.id}>
                <th scope="row">
                  <button
                    type="button"
                    className="avail-head"
                    onClick={() => toggleMany(periodCells(p.id))}
                    title={`تحديد أو إلغاء الفترة ${p.id} في كل الأيام`}
                  >
                    <span className="font-bold">{p.id}</span>
                    <span className="avail-time">{p.start}</span>
                  </button>
                </th>
                {DAYS.map((d) => {
                  const key = cellKey({ day: d.index, period: p.id });
                  const busyName = busy.get(key);
                  const state = busyName ? 'busy' : value.has(key) ? 'free' : 'idle';
                  return (
                    <td key={d.index}>
                      <button
                        type="button"
                        className="cell"
                        data-state={state}
                        aria-pressed={state === 'free'}
                        disabled={state === 'busy'}
                        title={busyName ? `متعارض مع ${busyName}` : undefined}
                        aria-label={`${d.label} الفترة ${p.id}${busyName ? ` (مشغولة: ${busyName})` : ''}`}
                        onClick={() => toggleCell(d.index, p.id)}
                      >
                        {state === 'busy' ? 'مشغول' : state === 'free' ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-hint mt-2">
        اضغط على اسم اليوم أو رقم الفترة لتحديد صف أو عمود كامل. لو ما حددتش أي فترة هنعتبر كل الأوقات مناسبة.
      </p>
    </div>
  );
}
