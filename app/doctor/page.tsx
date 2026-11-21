"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_FIRST_YEAR_GROUPS,
  type GroupInfo,
  loadScheduleGroups,
} from "@/lib/first-year-schedule";

export default function DoctorPage() {
  const [groups, setGroups] = useState<GroupInfo[]>(DEFAULT_FIRST_YEAR_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    setGroups(loadScheduleGroups());
  }, []);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const sectionsList = useMemo(() => {
    if (!selectedGroup) return [];
    const from = Math.max(1, Number(selectedGroup.sectionFrom) || 1);
    const to = Math.max(from, Number(selectedGroup.sectionTo) || from);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [selectedGroup]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        backgroundColor: "#090c14",
        color: "#f1f5f9",
        padding: "36px 18px",
        fontFamily: "inherit",
      }}
    >
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
        {/* شريط علوي بسيط ومتوسط */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              backgroundColor: "#111827",
              color: "#e2e8f0",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            العودة للرئيسية
          </Link>

          <button
            type="button"
            onClick={() => setGroups(loadScheduleGroups())}
            style={{
              backgroundColor: "#111827",
              color: "#fcd34d",
              border: "1px solid rgba(251, 191, 36, 0.35)",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            تحديث البيانات
          </button>
        </div>

        {/* الهيدر في نص الشاشة */}
        <header
          style={{
            background: "linear-gradient(135deg, #131b2e 0%, #0d1322 100%)",
            border: "1px solid #1e293b",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(251, 191, 36, 0.12)",
              color: "#fcd34d",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            الفرقة الأولى • نظم المعلومات الإدارية
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", color: "#ffffff" }}>
            بوابة الدكتور - اختيار المجموعة ومتابعة المواد
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
            اختر المجموعة لعرض بياناتها وموادها وأعضاء هيئة التدريس والسكاشن التابعة لها.
          </p>
        </header>

        {/* اختيار المجموعة */}
        <section style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              gap: "12px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>
              1. اختر المجموعة:
            </h2>
            {selectedGroup && (
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                style={{
                  backgroundColor: "#1e293b",
                  color: "#e2e8f0",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                إلغاء التحديد
              </button>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
              gap: "12px",
            }}
          >
            {groups.map((group) => {
              const active = group.id === selectedGroupId;
              const from = Math.max(1, Number(group.sectionFrom) || 1);
              const to = Math.max(from, Number(group.sectionTo) || from);
              const count = to - from + 1;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{
                    textAlign: "right",
                    padding: "16px",
                    borderRadius: "16px",
                    cursor: "pointer",
                    backgroundColor: active ? "rgba(251, 191, 36, 0.14)" : "#0f1626",
                    border: active ? "1.5px solid #fbbf24" : "1px solid #1e293b",
                    color: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "17px",
                        color: active ? "#fcd34d" : "#ffffff",
                      }}
                    >
                      {group.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: "#1e293b",
                        color: "#cbd5e1",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {count} سكشن
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    سكشن {from} إلى {to}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* تفاصيل المجموعة المختارة */}
        {!selectedGroup ? (
          <div
            style={{
              backgroundColor: "#0c1220",
              border: "1px dashed #263349",
              borderRadius: "18px",
              padding: "44px 20px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
              لم يتم اختيار مجموعة بعد
            </div>
            <div style={{ fontSize: "13px" }}>
              اضغط على أي مجموعة من الأعلى لعرض بياناتها وموادها ومعلومة السكاشن الخاصة بها.
            </div>
          </div>
        ) : (
          <section
            style={{
              backgroundColor: "#0e1525",
              border: "1px solid #1e293b",
              borderRadius: "20px",
              padding: "24px",
            }}
          >
            {/* بيانات المجموعة والسكاشن */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
                paddingBottom: "22px",
                marginBottom: "22px",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#fcd34d",
                  }}
                >
                  {selectedGroup.label}
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: 1.7 }}>
                  {selectedGroup.summary}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#090d18",
                  border: "1px solid #1e293b",
                  borderRadius: "14px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#fcd34d",
                    marginBottom: "10px",
                  }}
                >
                  السكاشن التابعة للمجموعة ({sectionsList.length} سكشن):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {sectionsList.map((sec) => (
                    <span
                      key={sec}
                      style={{
                        backgroundColor: "#131c31",
                        border: "1px solid #26354f",
                        color: "#e2e8f0",
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      سكشن {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* مواد المجموعة */}
            <h4 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
              مواد {selectedGroup.label} وأعضاء هيئة التدريس والمعاونة:
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "14px",
              }}
            >
              {selectedGroup.subjects.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "#121b2e",
                    border: "1px solid #1e2c44",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#fcd34d" }}>
                      {sub.subject}
                    </span>
                    <span
                      style={{
                        backgroundColor: "#1e293b",
                        color: "#cbd5e1",
                        fontSize: "11px",
                        padding: "4px 9px",
                        borderRadius: "8px",
                      }}
                    >
                      {sub.daysAndPeriods}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.7 }}>
                    <span style={{ color: "#94a3b8" }}>القائمون بالتدريس: </span>
                    {sub.staff.join(" • ")}
                  </div>

                  <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.7 }}>
                    <span style={{ color: "#94a3b8" }}>المدرجات / القاعات: </span>
                    {sub.rooms.join("، ")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
