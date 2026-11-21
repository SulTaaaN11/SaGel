import { useMemo, useState, type FormEvent } from 'react';
import type { StudentRow } from '@/lib/database.types';
import type { Catalog, DB } from '@/lib/services';
import { registerStudent } from '@/lib/services';
import { DEFAULT_FIRST_YEAR_GROUPS } from '@/lib/first-year-schedule';
import { Field } from '@/components/ui';

type Props = {
  db: DB;
  catalog: Catalog;
  initial: StudentRow | null;
  onDone: (student: StudentRow) => void | Promise<void>;
  onCancel?: () => void;
};

export default function RegistrationForm({ db, catalog, initial, onDone, onCancel }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [code, setCode] = useState(initial?.university_code ?? '');
  const [groupId, setGroupId] = useState<string>(initial ? String(initial.group_id) : '');
  const [sectionId, setSectionId] = useState<string>(initial ? String(initial.section_id) : '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (!groupId) return [];
    const selectedGroup = catalog.groups.find((g) => String(g.id) === groupId);
    const dbSections = catalog.sections
      .filter((s) => String(s.group_id) === groupId)
      .sort((a, b) => a.number - b.number);

    const groupIndex = selectedGroup
      ? Math.max(0, catalog.groups.findIndex((g) => g.id === selectedGroup.id))
      : 0;
    const byName = selectedGroup
      ? DEFAULT_FIRST_YEAR_GROUPS.find((fg) => fg.name === selectedGroup.name.trim())
      : undefined;
    const range = byName ?? DEFAULT_FIRST_YEAR_GROUPS[groupIndex];

    if (!range) {
      return dbSections;
    }

    const dbByNumber = new Map(dbSections.map((s) => [s.number, s]));
    const items: Array<{ id: number; group_id: number; number: number }> = [];

    for (let num = range.sectionFrom; num <= range.sectionTo; num++) {
      const existing = dbByNumber.get(num);
      if (existing) {
        items.push(existing);
      } else {
        items.push({ id: -num, group_id: Number(groupId), number: num });
      }
    }

    for (const s of dbSections) {
      if (!items.some((item) => item.number === s.number)) {
        items.push(s);
      }
    }

    return items.sort((a, b) => a.number - b.number);
  }, [catalog.groups, catalog.sections, groupId]);

  const valid = fullName.trim().length >= 3 && code.trim().length >= 3 && groupId !== '' && sectionId !== '';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const chosenGroupId = Number(groupId);
      const chosenSectionId = Number(sectionId);
      const result = await registerStudent(db, {
        fullName: fullName.trim(),
        universityCode: code.trim(),
        groupId: chosenGroupId,
        sectionId: chosenSectionId,
      });

      if (!result.ok) {
        setError(result.message || 'تعذّر حفظ البيانات.');
        return;
      }

      setSaved(true);

      const studentPayload: StudentRow = {
        id: initial?.id ?? String(Date.now()),
        full_name: fullName.trim(),
        university_code: code.trim(),
        group_id: chosenGroupId,
        section_id: chosenSectionId,
        created_at: initial?.created_at ?? new Date().toISOString(),
      };

      await onDone(studentPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ البيانات.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{initial ? 'تعديل بيانات الطالب' : 'تسجيل بيانات الطالب'}</h2>
        <p className="muted text-sm">بياناتك بتتخزن على جهازك وبتحدد مجموعتك وسكشنك عشان نعرضلك المواعيد المتاحة ليك.</p>
      </div>
      <form onSubmit={onSubmit} className="stack-lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الثلاثي / الكامل">
            <input
              className="input"
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
              placeholder="مثال: أحمد محمد علي"
              required
            />
          </Field>
          <Field label="الكود الجامعي">
            <input
              className="input"
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setSaved(false); }}
              placeholder="مثال: 20261234"
              required
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المجموعة">
            <select
              className="input"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSectionId('');
                setSaved(false);
              }}
              required
            >
              <option value="">اختر المجموعة</option>
              {catalog.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  مجموعة {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="السكشن" hint={groupId && sections.length === 0 ? 'مفيش سكاشن مضافة للمجموعة دي.' : undefined}>
            <select
              className="input"
              value={sectionId}
              onChange={(e) => { setSectionId(e.target.value); setSaved(false); }}
              disabled={!groupId || sections.length === 0}
              required
            >
              <option value="">اختر السكشن</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  سكشن {s.number}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && <p className="error-text text-sm">{error}</p>}
        {saved && !error && <p className="text-sm">تم الحفظ</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn" disabled={!valid || busy}>
            {busy ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : initial ? 'حفظ التعديلات' : 'متابعة إلى الجدول'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
              إلغاء
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

