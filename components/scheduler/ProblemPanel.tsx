'use client';

import { StatusBadge } from '@/components/ui';
import type { Resolution, ResolutionAction } from '@/lib/services';

type Props = {
  resolution: Resolution | null;
  message?: string | null;
  pendingId: string | null;
  onAction: (action: ResolutionAction) => void;
};

function actionButtonLabel(a: ResolutionAction): string {
  switch (a.type) {
    case 'enroll':
      return a.outsideFreeTime ? 'سكّن (خارج فراغك)' : 'سكّن هنا';
    case 'widen_free_time':
      return 'أضف الفترات';
    case 'resolve_conflict':
      return 'افتح جدولي';
    case 'contact_admin':
      return 'تفاصيل';
  }
}

export default function ProblemPanel({ resolution, message, pendingId, onAction }: Props) {
  if (!resolution && !message) return null;

  return (
    <div className="problem" data-kind={resolution?.kind ?? 'blocked'} role="status" aria-live="polite">
      <p className="font-bold">{resolution?.headline ?? message}</p>
      {resolution && message && message !== resolution.headline ? (
        <p className="muted mt-1 text-sm">{message}</p>
      ) : null}

      {resolution && resolution.causes.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {resolution.causes.map((c) => (
            <li key={c.status} className="flex flex-wrap items-start gap-2 text-sm">
              <StatusBadge status={c.status} label={c.title} />
              <span className="muted flex-1">{c.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {resolution && resolution.actions.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold" style={{ color: 'var(--accent)' }}>
            أقرب البدائل المتاحة
          </p>
          <ul className="flex flex-col gap-2">
            {resolution.actions.map((a, i) => {
              const key = a.type === 'enroll' ? a.slot.slot_id : `${a.type}-${i}`;
              const pending = a.type === 'enroll' && pendingId === a.slot.slot_id;
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2" style={{ borderColor: 'var(--line)' }}>
                  <span className="min-w-0 flex-1 text-sm">{a.label}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    disabled={pendingId !== null}
                    onClick={() => onAction(a)}
                  >
                    {pending ? 'جارٍ التسكين…' : actionButtonLabel(a)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
