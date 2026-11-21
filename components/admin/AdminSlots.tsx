'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { CapacityBar, EmptyState, ErrorState, Modal, Skeleton, StatusBadge } from '@/components/ui';
import type { SlotRow } from '@/lib/database.types';
import { KIND_LABEL, dayLabel, deriveSlotStatus, periodRange } from '@/lib/schedule';
import { fetchCatalog, fetchSlots } from '@/lib/services';
import type { Catalog, SlotKind } from '@/lib/services';
import { getBrowserClient } from '@/lib/supabase/client';
import AdminSlotForm from './AdminSlotForm';
import type { SlotFormValues } from './AdminSlotForm';

type ApiResult = { ok: boolean; status: number; message?: string; code?: string; enrolled?: number };

async function callApi(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      code?: string;
      enrolled?: number;
    };
    return { ok: res.ok && data.ok !== false, status: res.status, message: data.message, code: data.code, enrolled: data.enrolled };
  } catch {
    return { ok: false, status: 0, message: 'تعذّر الاتصال بالخادم.' };
  }
}

type Data = { catalog: Catalog; slots: SlotRow[] };
type StatusFilter = '' | 'available' | 'full' | 'closed';

export default function AdminSlots({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { push } = useToast();

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [kind, setKind] = useState<'' | SlotKind>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [query, setQuery] = useState('');

  const [formTarget, setFormTarget] = useState<SlotRow | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ slot: SlotRow; enrolled: number } | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const db = getBrowserClient();
      const [catalog, slots] = await Promise.all([fetchCatalog(db), fetchSlots(db)]);
      setData({ catalog, slots });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل البيانات.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUnauthorized = useCallback(() => {
    push({ tone: 'warn', title: 'انتهت جلسة الإدارة', text: 'سجّل الدخول من جديد.' });
    onLoggedOut();
  }, [push, onLoggedOut]);

  const lookups = useMemo(() => {
    const c = data?.catalog;
    return {
      subjects: new Map((c?.subjects ?? []).map((s) => [s.id, s.name])),
      groups: new Map((c?.groups ?? []).map((g) => [g.id, g.name])),
      sections: new Map((c?.sections ?? []).map((s) => [s.id, s.number])),
      staff: new Map((c?.staff ?? []).map((s) => [s.id, s.full_name])),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.slots.filter((s) => {
      if (subjectId && String(s.subject_id) !== subjectId) return false;
      if (groupId && String(s.group_id) !== groupId) return false;
      if (kind && s.kind !== kind) return false;
      if (status && deriveSlotStatus(s) !== status) return false;
      if (q) {
        const hay = `${lookups.staff.get(s.staff_id) ?? ''} ${s.room} ${lookups.subjects.get(s.subject_id) ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, subjectId, groupId, kind, status, query, lookups]);

  const stats = useMemo(() => {
    const slots = data?.slots ?? [];
    return {
      total: slots.length,
      enrolled: slots.reduce((sum, s) => sum + s.enrolled_count, 0),
      full: slots.filter((s) => deriveSlotStatus(s) === 'full').length,
      closed: slots.filter((s) => !s.is_open).length,
    };
  }, [data]);

  async function logout() {
    await callApi('/api/admin/logout', 'POST');
    push({ tone: 'info', title: 'تم تسجيل الخروج' });
    onLoggedOut();
  }

  async function saveForm(values: SlotFormValues) {
    if (formTarget === null) return;
    setSaving(true);
    const result =
      formTarget === 'new'
        ? await callApi('/api/admin/slots', 'POST', {
            subject_id: values.subjectId,
            kind: values.kind,
            group_id: values.groupId,
            section_id: values.sectionId,
            staff_id: values.staffId,
            room: values.room,
            day: values.day,
            period: values.period,
            capacity: values.capacity,
            is_open: values.isOpen,
          })
        : await callApi(`/api/admin/slots/${formTarget.id}`, 'PATCH', {
            staff_id: values.staffId,
            room: values.room,
            day: values.day,
            period: values.period,
            capacity: values.capacity,
            is_open: values.isOpen,
          });
    setSaving(false);

    if (result.status === 401) return handleUnauthorized();
    if (!result.ok) {
      push({ tone: 'error', title: 'تعذّر الحفظ', text: result.message });
      return;
    }
    push({ tone: 'success', title: formTarget === 'new' ? 'تمت إضافة الميعاد' : 'تم حفظ التعديلات' });
    setFormTarget(null);
    await load();
  }

  async function toggleOpen(slot: SlotRow) {
    setRowBusy(slot.id);
    const result = await callApi(`/api/admin/slots/${slot.id}`, 'PATCH', { is_open: !slot.is_open });
    setRowBusy(null);
    if (result.status === 401) return handleUnauthorized();
    if (!result.ok) {
      push({ tone: 'error', title: 'تعذّر تغيير الحالة', text: result.message });
      return;
    }
    push({ tone: 'success', title: slot.is_open ? 'تم إغلاق التسجيل في الميعاد' : 'تم فتح التسجيل في الميعاد' });
    await load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    const force = deleting.enrolled > 0;
    const result = await callApi(`/api/admin/slots/${deleting.slot.id}${force ? '?force=1' : ''}`, 'DELETE');
    setSaving(false);

    if (result.status === 401) return handleUnauthorized();
    if (result.code === 'HAS_ENROLLMENTS') {
      setDeleting({ slot: deleting.slot, enrolled: result.enrolled ?? deleting.enrolled });
      push({ tone: 'warn', title: 'فيه طلاب مسكّنين', text: result.message });
      return;
    }
    if (!result.ok) {
      push({ tone: 'error', title: 'تعذّر الحذف', text: result.message });
      return;
    }
    push({ tone: 'success', title: 'تم حذف الميعاد' });
    setDeleting(null);
    await load();
  }

  const slotTitle = (s: SlotRow) =>
    `${lookups.subjects.get(s.subject_id) ?? 'مادة'} · ${KIND_LABEL[s.kind]}`;

  const slotPlace = (s: SlotRow) => {
    const sec = s.section_id !== null ? lookups.sections.get(s.section_id) : undefined;
    return `مجموعة ${lookups.groups.get(s.group_id) ?? ''}${sec !== undefined ? ` · سكشن ${sec}` : ''}`;
  };

  return (
    <div>
      <header className="app-header">
        <div className="flex items-center gap-3">
          <span className="brand-mark" aria-hidden="true">
            إ
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">لوحة الإدارة</h1>
            <p className="muted text-sm">إدارة المواعيد والسعات</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-ghost btn-sm" href="/">
            الصفحة الرئيسية
          </a>
          <button type="button" className="btn btn-sm" onClick={() => setFormTarget('new')} disabled={!data}>
            + إضافة ميعاد
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </header>

      {error ? (
        <section className="panel">
          <ErrorState message={error} onRetry={() => void load()} />
        </section>
      ) : !data ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="ملخص">
            {[
              { label: 'عدد المواعيد', value: stats.total },
              { label: 'إجمالي التسكين', value: stats.enrolled },
              { label: 'مواعيد مكتملة', value: stats.full },
              { label: 'مواعيد مغلقة', value: stats.closed },
            ].map((s) => (
              <div key={s.label} className="panel !mt-0 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="muted text-sm">{s.label}</p>
              </div>
            ))}
          </section>

          <section className="panel">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                className="input lg:col-span-1"
                type="search"
                placeholder="بحث بالمسؤول أو المادة أو القاعة"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="بحث"
              />
              <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="المادة">
                <option value="">كل المواد</option>
                {data.catalog.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="المجموعة">
                <option value="">كل المجموعات</option>
                {data.catalog.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    مجموعة {g.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={kind}
                onChange={(e) => setKind(e.target.value === 'lecture' || e.target.value === 'section' ? e.target.value : '')}
                aria-label="النوع"
              >
                <option value="">محاضرات وسكاشن</option>
                <option value="lecture">محاضرات</option>
                <option value="section">سكاشن</option>
              </select>
              <select
                className="input"
                value={status}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatus(v === 'available' || v === 'full' || v === 'closed' ? v : '');
                }}
                aria-label="الحالة"
              >
                <option value="">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="full">مكتمل العدد</option>
                <option value="closed">مغلق</option>
              </select>
            </div>
          </section>

          <section className="panel" aria-live="polite">
            {data.slots.length === 0 ? (
              <EmptyState
                title="مفيش مواعيد مضافة"
                hint="ضيف أول ميعاد أو شغّل seed.sql لبيانات تجريبية."
                action={
                  <button type="button" className="btn" onClick={() => setFormTarget('new')}>
                    + إضافة ميعاد
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState title="مفيش نتائج بالفلاتر دي" />
            ) : (
              <>
                <p className="muted mb-3 text-sm">{filtered.length} ميعاد</p>
                <ul className="flex flex-col gap-2">
                  {filtered.slice(0, 100).map((s) => {
                    const st = deriveSlotStatus(s);
                    return (
                      <li
                        key={s.id}
                        className="row-interactive grid gap-3 rounded-xl border p-3 lg:grid-cols-[1.4fr_1.2fr_1fr_auto] lg:items-center"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <div>
                          <p className="font-bold">{slotTitle(s)}</p>
                          <p className="muted text-sm">
                            {slotPlace(s)} · {lookups.staff.get(s.staff_id) ?? ''}
                          </p>
                        </div>
                        <div className="text-sm">
                          <p>
                            {dayLabel(s.day)} · الفترة {s.period}
                          </p>
                          <p className="muted">
                            {periodRange(s.period)} · {s.room}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={st} />
                          <CapacityBar enrolled={s.enrolled_count} capacity={s.capacity} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormTarget(s)}>
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void toggleOpen(s)}
                            disabled={rowBusy === s.id}
                          >
                            {s.is_open ? 'إغلاق' : 'فتح'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleting({ slot: s, enrolled: s.enrolled_count })}
                          >
                            حذف
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {filtered.length > 100 ? (
                  <p className="muted mt-3 text-center text-sm">عرض أول 100 ميعاد. استخدم الفلاتر لتضييق النتائج.</p>
                ) : null}
              </>
            )}
          </section>
        </>
      )}

      <Modal
        open={formTarget !== null && data !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === 'new' ? 'إضافة ميعاد' : 'تعديل الميعاد'}
        wide
        busy={saving}
      >
        {data && formTarget !== null ? (
          <AdminSlotForm
            key={formTarget === 'new' ? 'new' : formTarget.id}
            catalog={data.catalog}
            slots={data.slots}
            initial={formTarget === 'new' ? null : formTarget}
            busy={saving}
            onSubmit={saveForm}
            onCancel={() => setFormTarget(null)}
          />
        ) : null}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="حذف الميعاد؟" busy={saving}>
        {deleting ? (
          <>
            <p className="mb-2 text-sm">
              هيتم حذف <strong>{slotTitle(deleting.slot)}</strong> ({dayLabel(deleting.slot.day)} · الفترة {deleting.slot.period}).
            </p>
            {deleting.enrolled > 0 ? (
              <p className="problem mb-4 text-sm" role="alert">
                فيه {deleting.enrolled} طالب مسكّن في الميعاد ده. الحذف هيلغي تسكينهم كلهم ولا يمكن التراجع.
              </p>
            ) : null}
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setDeleting(null)} disabled={saving}>
                رجوع
              </button>
              <button type="button" className="btn btn-danger flex-1" onClick={confirmDelete} disabled={saving} data-autofocus>
                {saving ? 'جارٍ الحذف…' : deleting.enrolled > 0 ? 'حذف رغم وجود طلاب' : 'تأكيد الحذف'}
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
