'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

const FOCUSABLE = 'input, button:not([disabled])';

export default function AdminGate() {
  const router = useRouter();
  const titleId = useId();
  const errorId = useId();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPassword('');
    setError(null);
    setShowPassword(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
    triggerRef.current?.focus();
  }, [reset]);

  // قفل تمرير الخلفية + تركيز أول حقل عند الفتح
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    userRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // لو جلسة الإدارة صالحة (بعد تحديث الصفحة مثلاً) ندخل مباشرة بدون إعادة تسجيل
  async function openGate() {
    try {
      const res = await fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin' });
      const data: { admin?: boolean } = await res.json();
      if (data.admin) {
        router.push('/admin');
        return;
      }
    } catch {
      // نكمل بفتح مربع الدخول
    }
    setOpen(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!busy) close();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;

    // حبس التركيز داخل المربع
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });
      const data: { ok?: boolean; message?: string } = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setOpen(false);
        reset();
        setUsername('');
        router.push('/admin');
        router.refresh();
        return;
      }
      setError(data.message ?? 'بيانات الدخول غير صحيحة.');
      setPassword('');
    } catch {
      setError('تعذّر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="admin-trigger"
        onClick={openGate}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        admin
      </button>

      {open && (
        <div
          className="overlay overlay-enter"
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget && !busy) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="dialog dialog-enter"
          >
            <h2 id={titleId} className="mb-5 text-center text-lg font-bold">
              دخول الإدارة
            </h2>

            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <label className="flex flex-col gap-1.5 text-sm">
                <span>اسم المستخدم</span>
                <input
                  ref={userRef}
                  className="input"
                  dir="ltr"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-describedby={error ? errorId : undefined}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span>كلمة المرور</span>
                <div className="relative">
                  <input
                    className="input pe-16"
                    dir="ltr"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={error ? errorId : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 end-0 px-3 text-xs"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </label>

              <p id={errorId} role="alert" aria-live="polite" className="min-h-5 text-center text-sm" style={{ color: 'var(--accent)' }}>
                {error}
              </p>

              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost flex-1" onClick={close} disabled={busy}>
                  إلغاء
                </button>
                <button type="submit" className="btn flex-1" disabled={busy || !username || !password}>
                  {busy ? 'جارٍ التحقق…' : 'دخول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
