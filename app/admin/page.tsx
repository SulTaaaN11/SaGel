"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_FIRST_YEAR_GROUPS,
  type GroupInfo,
  loadScheduleGroups,
  resetScheduleGroups,
  saveScheduleGroups,
  type SubjectDetail,
} from "@/lib/first-year-schedule";

const ADMIN_PASSCODE = "Sultaan2007**";
const AUTH_STORAGE_KEY = "sul007_admin_unlocked_v1";

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [groups, setGroups] = useState<GroupInfo[]>(DEFAULT_FIRST_YEAR_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>("A");
  const [newStaffText, setNewStaffText] = useState<Record<string, string>>({});
  const [newRoomText, setNewRoomText] = useState<Record<string, string>>({});
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedAuth = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth === "1") {
        setIsUnlocked(true);
      }
    } catch {
      // تجاهل أخطاء التخزين
    } finally {
      setAuthChecked(true);
    }
    setGroups(loadScheduleGroups());
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === ADMIN_PASSCODE) {
      setIsUnlocked(true);
      setAuthError(null);
      setPasscodeInput("");
      try {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
      } catch {
        // تجاهل
      }
    } else {
      setAuthError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPasscodeInput("");
    try {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // تجاهل
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? groups[0],
    [groups, activeGroupId],
  );

  const totalSections = useMemo(
    () =>
      groups.reduce(
        (sum, g) => sum + Math.max(0, (Number(g.sectionTo) || 0) - (Number(g.sectionFrom) || 0) + 1),
        0,
      ),
    [groups],
  );

  const updateGroupField = (
    groupId: string,
    patch: Partial<Pick<GroupInfo, "label" | "summary" | "sectionFrom" | "sectionTo">>,
  ) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    );
  };

  const updateSubjectField = (
    groupId: string,
    subjectId: string,
    patch: Partial<SubjectDetail>,
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subjects: g.subjects.map((s) => (s.id === subjectId ? { ...s, ...patch } : s)),
        };
      }),
    );
  };

  const addStaffMember = (groupId: string, subjectId: string) => {
    const val = (newStaffText[subjectId] ?? "").trim();
    if (!val) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subjects: g.subjects.map((s) =>
            s.id === subjectId ? { ...s, staff: [...s.staff, val] } : s,
          ),
        };
      }),
    );
    setNewStaffText((prev) => ({ ...prev, [subjectId]: "" }));
  };

  const removeStaffMember = (groupId: string, subjectId: string, idx: number) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subjects: g.subjects.map((s) =>
            s.id === subjectId
              ? { ...s, staff: s.staff.filter((_, i) => i !== idx) }
              : s,
          ),
        };
      }),
    );
  };

  const addRoom = (groupId: string, subjectId: string) => {
    const val = (newRoomText[subjectId] ?? "").trim();
    if (!val) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subjects: g.subjects.map((s) =>
            s.id === subjectId ? { ...s, rooms: [...s.rooms, val] } : s,
          ),
        };
      }),
    );
    setNewRoomText((prev) => ({ ...prev, [subjectId]: "" }));
  };

  const removeRoom = (groupId: string, subjectId: string, idx: number) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subjects: g.subjects.map((s) =>
            s.id === subjectId
              ? { ...s, rooms: s.rooms.filter((_, i) => i !== idx) }
              : s,
          ),
        };
      }),
    );
  };

  const addSubjectToGroup = () => {
    const cleanName = newSubjectName.trim();
    if (!cleanName || !activeGroup) return;
    const created: SubjectDetail = {
      id: `${activeGroup.id}-${Date.now()}`,
      subject: cleanName,
      staff: ["د/ عضو هيئة تدريس"],
      daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
      rooms: ["مدرج 1 هـ"],
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id ? { ...g, subjects: [...g.subjects, created] } : g,
      ),
    );
    setNewSubjectName("");
    showToast(`تمت إضافة مادة "${cleanName}" إلى ${activeGroup.label}`);
  };

  const deleteSubject = (subjectId: string) => {
    if (!activeGroup) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === activeGroup.id
          ? { ...g, subjects: g.subjects.filter((s) => s.id !== subjectId) }
          : g,
      ),
    );
  };

  const handleSave = () => {
    saveScheduleGroups(groups);
    showToast("تم حفظ جميع التعديلات بنجاح وتحديث بيانات المجاميع والسكاشن.");
  };

  const handleReset = () => {
    const fresh = resetScheduleGroups();
    setGroups(fresh);
    showToast("تمت إعادة التعيين إلى بيانات الفرقة الأولى الأساسية (73 سكشن).");
  };

  if (!authChecked) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#080b12] text-slate-300 flex items-center justify-center p-6"
      >
        <div className="text-sm">جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#080b12] text-slate-100 flex items-center justify-center px-4 py-10"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d1424] p-7 shadow-2xl">
          <div className="text-center space-y-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              دخول محمي  لوحة الأدمن
            </span>
            <h1 className="text-2xl font-bold text-white">تسجيل دخول الأدمن</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              أدخل كلمة المرور للوصول إلى إدارة المجاميع والسكاشن والمواد.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-medium text-rose-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/15 transition hover:bg-amber-300 cursor-pointer"
            >
              فتح لوحة التحكم
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition">
              الرئيسية
            </Link>
            <Link href="/doctor" className="hover:text-amber-300 transition">
              بوابة الدكتور
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#080b12] text-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* شريط التحكم العلوي */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-xl">
          <div>
            <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">
              لوحة تحكم الأدمن  إدارة المجاميع والسكاشن والمواد
            </span>
            <h1 className="mt-2.5 text-2xl font-bold text-white sm:text-3xl">
              إدارة بيانات الفرقة الأولى التفاعلية
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              عدّل نطاق السكاشن، المواد، الدكاترة والمعيدين، الأيام والفترات، والمدرجات  وتظهر فوراً في بوابة الدكتور.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/doctor"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              معاينة صفحة الدكتور
            </Link>
            <button
              type="button"
              onClick={handleLock}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              قفل اللوحة
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              استعادة الافتراضي
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-400/15 transition hover:bg-amber-300"
            >
              حفظ التعديلات
            </button>
          </div>
        </header>

        {toast && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200">
            {toast}
          </div>
        )}

        {/* ملخص حي */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
            <div className="text-xs text-slate-400">عدد المجاميع</div>
            <div className="mt-1 text-2xl font-bold text-amber-400">{groups.length}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4">
            <div className="text-xs text-slate-400">إجمالي السكاشن المحسوبة</div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{totalSections}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800 bg-[#0d1424] p-4">
            <div className="text-xs text-slate-400">المجموعة قيد التعديل</div>
            <div className="mt-1 text-2xl font-bold text-sky-300">{activeGroup?.label}</div>
          </div>
        </div>

        {/* تبويب اختيار المجموعة للتعديل */}
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const selected = g.id === activeGroup?.id;
            const count = Math.max(0, g.sectionTo - g.sectionFrom + 1);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroupId(g.id)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "border-amber-400 bg-amber-400/15 text-amber-300"
                    : "border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-600 hover:text-white"
                }`}
              >
                {g.label} <span className="text-xs opacity-75">({count} سكشن)</span>
              </button>
            );
          })}
        </div>

        {/* محرر بيانات المجموعة والسكاشن */}
        {activeGroup && (
          <section className="space-y-6 rounded-2xl border border-slate-800 bg-[#0d1424] p-6 shadow-xl">
            <div className="grid grid-cols-1 gap-4 border-b border-slate-800 pb-6 md:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">اسم المجموعة</label>
                <input
                  type="text"
                  value={activeGroup.label}
                  onChange={(e) => updateGroupField(activeGroup.id, { label: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">من سكشن رقم</label>
                <input
                  type="number"
                  min={1}
                  value={activeGroup.sectionFrom}
                  onChange={(e) =>
                    updateGroupField(activeGroup.id, {
                      sectionFrom: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">إلى سكشن رقم</label>
                <input
                  type="number"
                  min={activeGroup.sectionFrom}
                  value={activeGroup.sectionTo}
                  onChange={(e) =>
                    updateGroupField(activeGroup.id, {
                      sectionTo: Math.max(
                        activeGroup.sectionFrom,
                        Number(e.target.value) || activeGroup.sectionFrom,
                      ),
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs text-slate-400 mb-1.5">وصف / ملاحظة المجموعة</label>
                <input
                  type="text"
                  value={activeGroup.summary}
                  onChange={(e) => updateGroupField(activeGroup.id, { summary: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* إضافة مادة جديدة للمجموعة */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
              <h2 className="text-base font-bold text-white">
                مواد {activeGroup.label} وأعضاء هيئة التدريس والمعاونة:
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم مادة جديدة..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSubjectToGroup}
                  className="rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/25"
                >
                  + إضافة مادة
                </button>
              </div>
            </div>

            {/* كروت تعديل المواد */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeGroup.subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="space-y-4 rounded-2xl border border-slate-800 bg-[#11192c] p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={sub.subject}
                      onChange={(e) =>
                        updateSubjectField(activeGroup.id, sub.id, { subject: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteSubject(sub.id)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                    >
                      حذف
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الأيام والفترات</label>
                    <input
                      type="text"
                      value={sub.daysAndPeriods}
                      onChange={(e) =>
                        updateSubjectField(activeGroup.id, sub.id, {
                          daysAndPeriods: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* الدكاترة والمعيدون */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400">
                      الدكاترة والمعيدون / المدرسون المساعدون
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.staff.map((person, idx) => (
                        <span
                          key={`${person}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                        >
                          {person}
                          <button
                            type="button"
                            onClick={() => removeStaffMember(activeGroup.id, sub.id, idx)}
                            className="text-rose-400 hover:text-rose-200"
                            title="إزالة"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أضف دكتور أو معيد (مثال: م/ أحمد حسن)"
                        value={newStaffText[sub.id] ?? ""}
                        onChange={(e) =>
                          setNewStaffText((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addStaffMember(activeGroup.id, sub.id)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>

                  {/* المدرجات والقاعات */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400">المدرجات / القاعات</label>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.rooms.map((room, idx) => (
                        <span
                          key={`${room}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                        >
                          {room}
                          <button
                            type="button"
                            onClick={() => removeRoom(activeGroup.id, sub.id, idx)}
                            className="text-rose-400 hover:text-rose-200"
                            title="إزالة"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أضف مدرج أو قاعة (مثال: مدرج 4 د)"
                        value={newRoomText[sub.id] ?? ""}
                        onChange={(e) =>
                          setNewRoomText((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addRoom(activeGroup.id, sub.id)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

