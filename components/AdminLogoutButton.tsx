'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** زر تسجيل خروج الإدارة (يُستخدم داخل صفحة /admin لاحقاً). */
export default function AdminLogoutButton({ label = 'تسجيل الخروج' }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      router.replace('/');
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={logout} disabled={busy}>
      {busy ? 'جارٍ الخروج…' : label}
    </button>
  );
}
