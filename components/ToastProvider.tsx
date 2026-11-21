'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warn';
export type ToastInput = { tone: ToastTone; title: string; text?: string };
type Toast = ToastInput & { id: number };
type ToastApi = { push: (t: ToastInput) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-3), { ...input, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), input.tone === 'error' ? 7000 : 4500),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-label="التنبيهات" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast" data-tone={t.tone} role={t.tone === 'error' ? 'alert' : 'status'}>
            <div className="flex-1">
              <p className="font-bold">{t.title}</p>
              {t.text ? <p className="text-sm opacity-90">{t.text}</p> : null}
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="إغلاق التنبيه">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
