'use client';

import { CapacityBar, StatusBadge } from '@/components/ui';
import { dayLabel, periodRange } from '@/lib/schedule';
import type { SuggestedSlot } from '@/lib/services';

type Props = {
  slot: SuggestedSlot;
  pending?: boolean;
  disabled?: boolean;
  onEnroll?: (slot: SuggestedSlot) => void;
};

export default function SlotCard({ slot, pending = false, disabled = false, onEnroll }: Props) {
  const place =
    slot.section_number !== null ? `مجموعة ${slot.group_name} · سكشن ${slot.section_number}` : `مجموعة ${slot.group_name}`;

  return (
    <article className="slot-card" data-status={slot.status}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">
            {dayLabel(slot.day_no)} · الفترة {slot.period_no}
          </p>
          <p className="muted text-sm">{periodRange(slot.period_no)}</p>
        </div>
        <StatusBadge status={slot.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <div>
          <dt className="muted">المجموعة</dt>
          <dd>{place}</dd>
        </div>
        <div>
          <dt className="muted">القاعة</dt>
          <dd>{slot.room}</dd>
        </div>
        <div className="col-span-2">
          <dt className="muted">المسؤول</dt>
          <dd>{slot.staff_name}</dd>
        </div>
      </dl>

      <CapacityBar enrolled={slot.enrolled_count} capacity={slot.capacity} />

      {slot.status !== 'available' ? <p className="muted text-sm">{slot.reason}</p> : null}

      {slot.status === 'available' && onEnroll ? (
        <button type="button" className="btn btn-sm" disabled={pending || disabled} onClick={() => onEnroll(slot)}>
          {pending ? 'جارٍ التسكين…' : 'سكّنّي هنا'}
        </button>
      ) : null}
    </article>
  );
}
