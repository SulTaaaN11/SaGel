import type { SlotKind, SlotStatus, Tier } from '@/lib/database.types';

/**
 * ثوابت مركزية. المصدر الفعلي للمجموعات والسكاشن والمواد هو قاعدة البيانات
 * (جداول groups / sections / subjects)، وهذه الثوابت للقيم الافتراضية والتسميات والتحقق.
 */

export const DEFAULT_CAPACITY = 250;

// ---------- الأيام (0=السبت ... 5=الخميس، مطابق لعمود slots.day) ----------
export const DAYS = [
  { index: 0, label: 'السبت', short: 'سبت' },
  { index: 1, label: 'الأحد', short: 'أحد' },
  { index: 2, label: 'الاثنين', short: 'اثنين' },
  { index: 3, label: 'الثلاثاء', short: 'ثلاثاء' },
  { index: 4, label: 'الأربعاء', short: 'أربعاء' },
  { index: 5, label: 'الخميس', short: 'خميس' },
] as const;

// ---------- الفترات (مطابقة لجدول periods) ----------
export const PERIODS = [
  { id: 1, start: '09:15', end: '10:00' },
  { id: 2, start: '10:00', end: '10:45' },
  { id: 3, start: '10:55', end: '11:40' },
  { id: 4, start: '11:40', end: '12:25' },
  { id: 5, start: '12:45', end: '01:30' },
  { id: 6, start: '01:30', end: '02:10' },
  { id: 7, start: '02:20', end: '03:00' },
  { id: 8, start: '03:00', end: '03:45' },
] as const;

// ---------- المجموعات والسكاشن ----------
export const GROUP_NAMES = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'] as const;
export type GroupName = (typeof GROUP_NAMES)[number];

/** عدد السكاشن الافتراضي لكل مجموعة (مطابق لملف seed.sql). الإدارة تعدّله من /admin. */
export const DEFAULT_SECTIONS_PER_GROUP = 4;

export const GROUPS = GROUP_NAMES.map((name, i) => ({
  name,
  sortOrder: i + 1,
  sections: Array.from({ length: DEFAULT_SECTIONS_PER_GROUP }, (_, k) => k + 1),
}));

// ---------- المواد الأساسية ----------
export const SUBJECT_NAMES = [
  'إدارة أعمال',
  'محاسبة مالية',
  'مبادئ اقتصاد',
  'لغة أجنبية 1',
  'مبادئ القانون',
] as const;
export type SubjectName = (typeof SUBJECT_NAMES)[number];

// ---------- تسميات العرض ----------
export const KIND_LABEL: Record<SlotKind, string> = {
  lecture: 'محاضرة',
  section: 'سكشن',
};

/** أولوية التسكين: 1) نفس المجموعة والسكشن  2) باقي سكاشن المجموعة  3) باقي المجاميع */
export const TIER_LABEL: Record<Tier, string> = {
  1: 'نفس المجموعة والسكشن',
  2: 'سكاشن أخرى في مجموعتك',
  3: 'مجموعات أخرى',
};

export const STATUS_LABEL: Record<SlotStatus, string> = {
  available: 'متاح',
  full: 'مكتمل العدد',
  closed: 'مغلق',
  conflict: 'تعارض مع جدولك',
  not_free: 'خارج أوقات فراغك',
  already_enrolled: 'مسجل بالفعل',
};
