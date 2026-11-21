import type { SlotStatus, SuggestedSlotRow } from '@/lib/database.types';
import { DAYS, PERIODS } from '@/lib/constants';

// للتوافق: الثوابت تُستورد من lib/constants وتُعاد تصديرها هنا.
export * from '@/lib/constants';

export type FreeTime = { day: number; period: number };

export const cellKey = (c: FreeTime): string => `${c.day}-${c.period}`;

export function isValidCell(c: FreeTime): boolean {
  return (
    Number.isInteger(c.day) && c.day >= 0 && c.day <= 5 && Number.isInteger(c.period) && c.period >= 1 && c.period <= 8
  );
}

/** '13:30:00' -> '01:30' (نفس صيغة الجدول المعتمد) */
export function formatTime(t: string): string {
  const [h, m] = t.split(':');
  let hh = Number(h) % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, '0')}:${m}`;
}

export const dayLabel = (day: number): string => DAYS[day]?.label ?? '';

export function periodRange(period: number): string {
  const p = PERIODS.find((x) => x.id === period);
  return p ? `${formatTime(p.start)} - ${formatTime(p.end)}` : '';
}

export function describeSlot(s: Pick<SuggestedSlotRow, 'day_no' | 'period_no' | 'staff_name' | 'room'>): string {
  return `${dayLabel(s.day_no)} · الفترة ${s.period_no} (${periodRange(s.period_no)}) · ${s.staff_name} · ${s.room}`;
}

/** حالة الميعاد للعرض العام (قائمة المواعيد ولوحة الإدارة). */
export function deriveSlotStatus(s: { enrolled_count: number; capacity: number; is_open: boolean }): SlotStatus {
  if (!s.is_open) return 'closed';
  if (s.enrolled_count >= s.capacity) return 'full';
  return 'available';
}
