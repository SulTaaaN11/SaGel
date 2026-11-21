'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Field, Skeleton } from '@/components/ui';
import AdminSlots from './AdminSlots';

type Auth = 'checking' | 'anon' | 'admin';

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data: { ok?: boolean; message?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        onSuccess();
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
    <section className="panel mx-auto mt-10 w-full max-w-sm" aria-labelledby="admin-login-title">
      <h1 id="admin-login-title" className="mb-1 text-center text-xl font-bold">
        دخول الإدارة
      </h1>
      <p className="muted mb-5 text-center text-sm">أدخل بياناتك للوصول إلى لوحة التحكم.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="اسم المستخدم">
          <input
            className="input"
            dir="ltr"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Field>
        <Field label="كلمة المرور">
          <input
            className="input"
            dir="ltr"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <p role="alert" aria-live="polite" className="min-h-5 text-center text-sm" style={{ color: 'var(--full)' }}>
          {error}
        </p>
        <button type="submit" className="btn" disabled={busy || !username || !password}>
          {busy ? 'جارٍ التحقق…' : 'دخول'}
        </button>
      </form>
    </section>
  );
}

export default function AdminDashboard() {
  const [auth, setAuth] = useState<Auth>('checking');

  // التحقق التلقائي من الجلسة (تبقى صالحة بعد تحديث الصفحة)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { admin?: boolean }) => {
        if (!cancelled) setAuth(data.admin ? 'admin' : 'anon');
      })
      .catch(() => {
        if (!cancelled) setAuth('anon');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      {auth === 'checking' ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      ) : auth === 'anon' ? (
        <AdminLogin onSuccess={() => setAuth('admin')} />
      ) : (
        <AdminSlots onLoggedOut={() => setAuth('anon')} />
      )}
    </main>
  );
}
