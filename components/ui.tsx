'use client';

import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { STATUS_LABEL } from '@/lib/constants';
import type { SlotStatus } from '@/lib/database.types';

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className={label ? '' : 'sr-only'}>{label ?? 'جارٍ التحميل'}</span>
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true" />
      <p className="font-bold">{title}</p>
      {hint ? <p className="muted text-sm">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-mark" data-tone="error" aria-hidden="true" />
      <p className="font-bold">حصلت مشكلة</p>
      <p className="muted text-sm">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-ghost mt-2" onClick={onRetry}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status, label }: { status: SlotStatus; label?: string }) {
  return (
    <span className="badge" data-status={status}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

export function CapacityBar({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
  const tone = pct >= 100 ? 'full' : pct >= 85 ? 'high' : 'ok';
  return (
    <div className="capacity">
      <div
        className="progress"
        data-tone={tone}
        role="progressbar"
        aria-label="نسبة الإشغال"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={enrolled}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="capacity-text">
        {enrolled} / {capacity}
      </span>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

const FOCUSABLE = 'input, select, textarea, button:not([disabled])';

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  busy?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const target =
      dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
    return () => {
      document.body.style.overflow = previous;
      lastFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!busy) onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="overlay overlay-enter"
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog dialog-enter ${wide ? 'dialog-wide' : ''}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" className="toast-close" onClick={onClose} disabled={busy} aria-label="إغلاق">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
