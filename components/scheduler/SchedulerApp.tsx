'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '@/components/ToastProvider';
import { ErrorState, Skeleton } from '@/components/ui';
import type { MyScheduleRow, StudentRow } from '@/lib/database.types';
import { getBrowserClient } from '@/lib/supabase/client';
import { fetchCatalog, getMyProfile, getMySchedule, subscribeToMyEnrollments } from '@/lib/services';
import type { Catalog, DB } from '@/lib/services';
import BookingPanel from './BookingPanel';
import BrowsePanel from './BrowsePanel';
import RegistrationForm from './RegistrationForm';
import ScheduleView from './ScheduleView';

type Tab = 'book' | 'mine' | 'browse';
type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

export default function SchedulerApp() {
  const { push } = useToast();

  const [db, setDb] = useState<DB | null>(null);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [profile, setProfile] = useState<StudentRow | null>(null);
  const [schedule, setSchedule] = useState<MyScheduleRow[]>([]);
  const [tab, setTab] = useState<Tab>('book');
  const [editing, setEditing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // العميل يُنشأ بعد التحميل في المتصفح فقط
  useEffect(() => {
    try {
      setDb(getBrowserClient());
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'إعدادات Supabase غير مكتملة.' });
    }
  }, []);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    setLoad({ status: 'loading' });
    (async () => {
      try {
        const [cat, prof] = await Promise.all([fetchCatalog(db), getMyProfile(db)]);
        const sched = prof ? await getMySchedule(db) : [];
        if (cancelled) return;
        setCatalog(cat);
        setProfile(prof);
        setSchedule(sched);
        setLoad({ status: 'ready' });
      } catch (err) {
        if (!cancelled) setLoad({ status: 'error', message: err instanceof Error ? err.message : 'تعذّر تحميل البيانات.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, attempt]);

  const refreshSchedule = useCallback(async () => {
    if (!db) return;
    try {
      setSchedule(await getMySchedule(db));
    } catch (err) {
      push({ tone: 'error', title: 'تعذّر تحديث الجدول', text: err instanceof Error ? err.message : undefined });
    }
  }, [db, push]);

  // تحديث لحظي لو غيّرت جدولك من تبويب أو جهاز تاني
  const profileId = profile?.id ?? null;
  useEffect(() => {
    if (!db || !profileId) return;
    return subscribeToMyEnrollments(db, profileId, () => {
      void refreshSchedule();
    });
  }, [db, profileId, refreshSchedule]);

  const afterRegister = useCallback(async (submittedStudent: StudentRow) => {
    setProfile(submittedStudent);
    setEditing(false);
    setTab('book');
    if (!db) return;
    try {
      const prof = await getMyProfile(db);
      if (prof) setProfile(prof);
      setSchedule(await getMySchedule(db));
    } catch {
      // نبقي على بيانات الطالب المسجلة ونعرض واجهة الجدول
    }
  }, [db]);

  const studentLine = useMemo(() => {
    if (!profile || !catalog) return '';
    const group = catalog.groups.find((g) => g.id === profile.group_id)?.name ?? '';
    const section = catalog.sections.find((s) => s.id === profile.section_id)?.number;
    return `مجموعة ${group}${section !== undefined ? ` · سكشن ${section}` : ''}`;
  }, [profile, catalog]);

  const header = (
    <header className="app-header no-print">
      <div className="flex items-center gap-3">
        <span className="brand-mark" aria-hidden="true">
          ج
        </span>
        <div>
          <h1 className="text-lg font-bold leading-tight">جداول الفرقة الأولى</h1>
          <p className="muted text-sm">نظم المعلومات الإدارية</p>
        </div>
      </div>
      {profile && catalog ? (
        <div className="flex items-center gap-3">
          <div className="text-end text-sm">
            <p className="font-medium">{profile.full_name}</p>
            <p className="muted">{studentLine}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            تعديل بياناتي
          </button>
        </div>
      ) : null}
    </header>
  );

  let body: ReactNode;
  if (load.status === 'error') {
    body = (
      <section className="panel">
        <ErrorState message={load.message} onRetry={() => setAttempt((n) => n + 1)} />
      </section>
    );
  } else if (load.status === 'loading' || !db || !catalog) {
    body = (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-56" />
      </div>
    );
  } else if (!profile || editing) {
    body = (
      <RegistrationForm
        db={db}
        catalog={catalog}
        initial={profile}
        onDone={afterRegister}
        onCancel={profile ? () => setEditing(false) : undefined}
      />
    );
  } else {
    body = (
      <>
        <div className="tabs no-print" role="tablist" aria-label="أقسام التطبيق">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'book'} onClick={() => setTab('book')}>
            حجز مادة
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
            جدولي
            {schedule.length > 0 ? <span className="tab-count">{schedule.length}</span> : null}
          </button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'browse'} onClick={() => setTab('browse')}>
            كل المواعيد
          </button>
        </div>

        {tab === 'book' ? (
          <BookingPanel
            db={db}
            catalog={catalog}
            schedule={schedule}
            onChanged={refreshSchedule}
            onOpenSchedule={() => setTab('mine')}
          />
        ) : tab === 'mine' ? (
          <ScheduleView
            db={db}
            schedule={schedule}
            totalSubjects={catalog.subjects.length}
            onChanged={refreshSchedule}
            onGoBook={() => setTab('book')}
          />
        ) : (
          <BrowsePanel db={db} catalog={catalog} />
        )}
      </>
    );
  }

  return (
    <main className="app-shell">
      {header}
      {body}
    </main>
  );
}

