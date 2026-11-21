'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Field } from '@/components/ui';
import type { SlotRow } from '@/lib/database.types';
import { DAYS, DEFAULT_CAPACITY, KIND_LABEL, PERIODS, dayLabel } from '@/lib/schedule';
import type { Catalog, SlotKind } from '@/lib/services';

export type SlotFormValues = {
  subjectId: number;
  kind: SlotKind;
  groupId: number;
  sectionId: number | null;
  staffId: number;
  room: string;
  day: number;
  period: number;
  capacity: number;
  isOpen: boolean;
};

type Props = {
  catalog: Catalog;
  slots: SlotRow[];
  initial: SlotRow | null;
  busy: boolean;
  onSubmit: (values: SlotFormValues) => void | Promise<void>;
  onCancel: () => void;
};

const ROOM_SUGGESTIONS = ['مدرج 1', 'مدرج 2', 'مدرج 3', 'قاعة 101', 'قاعة 102', 'قاعة 201', 'قاعة 202'];

export default function AdminSlotForm({ catalog, slots, initial, busy, onSubmit, onCancel }: Props) {
  const editing = initial !== null;

  const [subjectId, setSubjectId] = useState(initial ? String(initial.subject_id) : '');
  const [kind, setKind] = useState<SlotKind>(initial?.kind ?? 'lecture');
  const [groupId, setGroupId] = useState(initial ? String(initial.group_id) : '');
  const [sectionId, setSectionId] = useState(initial?.section_id ? String(initial.section_id) : '');
  const [staffId, setStaffId] = useState(initial ? String(initial.staff_id) : '');
  const [room, setRoom] = useState(initial?.room ?? '');
  const [day, setDay] = useState(initial ? String(initial.day) : '');
  const [period, setPeriod] = useState(initial ? String(initial.period) : '');
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? DEFAULT_CAPACITY));
  const [isOpen, setIsOpen] = useState(initial?.is_open ?? true);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(
    () => catalog.sections.filter((s) => String(s.group_id) === groupId),
    [catalog.sections, groupId],
  );

  const rooms = useMemo(() => Array.from(new Set([...ROOM_SUGGESTIONS, ...slots.map((s) => s.room)])), [slots]);

  const doctors = catalog.staff.filter((s) => s.role === 'doctor');
  const assistants = catalog.staff.filter((s) => s.role === 'assistant');

  // تنبيه عند تعارض الدكتور أو القاعة مع ميعاد آخر في نفس اليوم والفترة
  const warnings = useMemo(() => {
    const out: string[] = [];
    if (day === '' || period === '') return out;
    const others = slots.filter((s) => s.id !== initial?.id && String(s.day) === day && String(s.period) === period);
    if (staffId && others.some((s) => String(s.staff_id) === staffId)) {
      out.push('المسؤول ده عنده ميعاد تاني في نفس اليوم والفترة.');
    }
    if (room.trim() && others.some((s) => s.room === room.trim())) {
      out.push('القاعة دي مستخدمة في ميعاد تاني في نفس الوقت (ممكن يكون مقصود لو محاضرة مشتركة).');
    }
    return out;
  }, [slots, initial?.id, day, period, staffId, room]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const cap = Number(capacity);
    if (!editing) {
      if (subjectId === '') return setError('اختر المادة.');
      if (groupId === '') return setError('اختر المجموعة.');
      if (kind === 'section' && sectionId === '') return setError('اختر السكشن.');
    }
    if (staffId === '') return setError('اختر الدكتور أو المعيد.');
    if (room.trim() === '') return setError('اكتب اسم القاعة أو المدرج.');
    if (day === '') return setError('اختر اليوم.');
    if (period === '') return setError('اختر الفترة.');
    if (!Number.isInteger(cap) || cap < 1 || cap > 5000) return setError('السعة لازم تكون رقم من 1 إلى 5000.');

    setError(null);
    void onSubmit({
      subjectId: Number(subjectId),
      kind,
      groupId: Number(groupId),
      sectionId: kind === 'section' ? Number(sectionId) : null,
      staffId: Number(staffId),
      room: room.trim(),
      day: Number(day),
      period: Number(period),
      capacity: cap,
      isOpen,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المادة">
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={editing} data-autofocus={editing ? undefined : ''}>
            <option value="">اختر المادة</option>
            {catalog.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="النوع">
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value === 'section' ? 'section' : 'lecture')}
            disabled={editing}
          >
            <option value="lecture">{KIND_LABEL.lecture}</option>
            <option value="section">{KIND_LABEL.section}</option>
          </select>
        </Field>

        <Field label="المجموعة">
          <select
            className="input"
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setSectionId('');
            }}
            disabled={editing}
          >
            <option value="">اختر المجموعة</option>
            {catalog.groups.map((g) => (
              <option key={g.id} value={g.id}>
                مجموعة {g.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="السكشن" hint={kind === 'lecture' ? 'المحاضرة لكل سكاشن المجموعة.' : undefined}>
          <select
            className="input"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={editing || kind === 'lecture' || groupId === ''}
          >
            <option value="">{kind === 'lecture' ? 'غير مطلوب' : 'اختر السكشن'}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                سكشن {s.number}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الدكتور / المعيد">
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)} data-autofocus={editing ? '' : undefined}>
            <option value="">اختر المسؤول</option>
            {doctors.length > 0 ? (
              <optgroup label="الدكاترة">
                {doctors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {assistants.length > 0 ? (
              <optgroup label="المعيدين">
                {assistants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </Field>

        <Field label="القاعة / المدرج" hint="اختر من الاقتراحات أو اكتب اسماً جديداً.">
          <input className="input" list="room-suggestions" value={room} onChange={(e) => setRoom(e.target.value)} maxLength={60} />
          <datalist id="room-suggestions">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>

        <Field label="اليوم">
          <select className="input" value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">اختر اليوم</option>
            {DAYS.map((d) => (
              <option key={d.index} value={d.index}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الفترة">
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">اختر الفترة</option>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}: {p.start} - {p.end}
              </option>
            ))}
          </select>
        </Field>

        <Field label="السعة">
          <input
            className="input"
            dir="ltr"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </Field>

        <div className="flex items-end">
          <div className="seg w-full" role="group" aria-label="حالة التسجيل">
            <button type="button" className="flex-1" aria-pressed={isOpen} onClick={() => setIsOpen(true)}>
              التسجيل مفتوح
            </button>
            <button type="button" className="flex-1" aria-pressed={!isOpen} onClick={() => setIsOpen(false)}>
              مغلق
            </button>
          </div>
        </div>
      </div>

      {day !== '' && period !== '' ? (
        <p className="muted text-sm">
          الميعاد: {dayLabel(Number(day))} · الفترة {period}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="problem text-sm" role="status">
          {warnings.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      ) : null}

      <p role="alert" aria-live="polite" className="min-h-5 text-sm" style={{ color: 'var(--full)' }}>
        {error}
      </p>

      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel} disabled={busy}>
          إلغاء
        </button>
        <button type="submit" className="btn flex-1" disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة الميعاد'}
        </button>
      </div>
    </form>
  );
}
