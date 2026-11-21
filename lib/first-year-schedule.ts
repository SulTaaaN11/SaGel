export type SubjectDetail = {
  id: string;
  subject: string;
  staff: string[];
  daysAndPeriods: string;
  rooms: string[];
};

export type GroupInfo = {
  id: string;
  name: string;
  label: string;
  sectionFrom: number;
  sectionTo: number;
  summary: string;
  subjects: SubjectDetail[];
};

export const STORAGE_KEY = "sul007_first_year_groups_v1";

export const DEFAULT_FIRST_YEAR_GROUPS: GroupInfo[] = [
  {
    id: "A",
    name: "أ",
    label: "المجموعة أ",
    sectionFrom: 1,
    sectionTo: 12,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 1 إلى 12",
    subjects: [
      {
        id: "A-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ محمد سلام"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "مدرج 1 هـ"],
      },
      {
        id: "A-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م.م/ أحمد عادل", "م/ تقى صادق"],
        daysAndPeriods: "الأحد - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 5 هـ", "مدرج 12 و", "مدرج 5 و"],
      },
      {
        id: "A-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م/ إسراء حمدي"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 1 هـ", "مدرج 1 و"],
      },
      {
        id: "A-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ رحمة أحمد", "م/ أسماء سعيد"],
        daysAndPeriods: "الأحد - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "مدرج 10 و", "مدرج 11 و"],
      },
      {
        id: "A-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد عطية"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 1 هـ"],
      },
    ],
  },
  {
    id: "B",
    name: "ب",
    label: "المجموعة ب",
    sectionFrom: 13,
    sectionTo: 24,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 13 إلى 24",
    subjects: [
      {
        id: "B-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ ندى مراد", "م/ أرينا أحمد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "قاعة 304 د", "قاعة 404 د"],
      },
      {
        id: "B-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م/ محمد الشاذلي", "م/ إسراء الشحات", "م/ تقى صادق", "م.م/ أحمد عادل"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 5 هـ", "قاعة 307 د", "قاعة 301 هـ", "مدرج 2 هـ"],
      },
      {
        id: "B-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م/ رضوى عبد الباري", "م/ إسراء حمدي"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 1 هـ", "مدرج 5 هـ", "مدرج 1 و"],
      },
      {
        id: "B-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ أسماء سعيد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 2 د", "مدرج 11 و"],
      },
      {
        id: "B-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد عطية"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 2 د"],
      },
    ],
  },
  {
    id: "C",
    name: "ج",
    label: "المجموعة ج",
    sectionFrom: 25,
    sectionTo: 36,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 25 إلى 36",
    subjects: [
      {
        id: "C-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ محمد سلام", "م/ ندى مراد", "م/ أرينا أحمد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "مدرج 2 و", "مدرج 4 د", "قاعة 309 هـ"],
      },
      {
        id: "C-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م/ مؤمن", "م/ تقى صادق"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 5 هـ", "مدرج 7 و", "مدرج 1 هـ"],
      },
      {
        id: "C-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م.م/ رضوى عبد الباري"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 1 هـ", "مدرج 3 و"],
      },
      {
        id: "C-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ رحمة أحمد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 2 د", "مدرج 10 و"],
      },
      {
        id: "C-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد نعمان"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 3 هـ"],
      },
    ],
  },
  {
    id: "D",
    name: "د",
    label: "المجموعة د",
    sectionFrom: 37,
    sectionTo: 48,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 37 إلى 48",
    subjects: [
      {
        id: "D-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ ندى مراد", "م/ محمد سلام"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "قاعة 007 د", "مدرج 4 د"],
      },
      {
        id: "D-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م/ تقى صادق", "م/ إسراء الشحات", "م/ سامي رتيب", "م/ مؤمن"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 7 هـ", "مدرج 5 و", "قاعة 211 هـ", "قاعة 310 هـ"],
      },
      {
        id: "D-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م/ إسراء حمدي", "م.م/ رضوى عبد الباري"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 9 و", "مدرج 12 و", "مدرج 3 و"],
      },
      {
        id: "D-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ أسماء جمال"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 2 د", "مدرج 7 و"],
      },
      {
        id: "D-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد نعمان"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 3 هـ"],
      },
    ],
  },
  {
    id: "E",
    name: "هـ",
    label: "المجموعة هـ",
    sectionFrom: 49,
    sectionTo: 60,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 49 إلى 60",
    subjects: [
      {
        id: "E-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ محمد سلام", "م/ ندى مراد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 3 د", "مدرج 11 و", "مدرج 4 د"],
      },
      {
        id: "E-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م.م/ أحمد عادل", "م/ إسراء الشحات", "م/ تقى صادق", "م/ مؤمن"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 7 هـ", "مدرج 1 هـ", "قاعة 009 هـ", "مدرج 5 هـ"],
      },
      {
        id: "E-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م/ إسراء حمدي"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 9 و", "مدرج 2 د"],
      },
      {
        id: "E-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ رحمة أحمد"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 2 د", "مدرج 3 و", "مدرج 10 و"],
      },
      {
        id: "E-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد عطية"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 3 هـ"],
      },
    ],
  },
  {
    id: "F",
    name: "و",
    label: "المجموعة و",
    sectionFrom: 61,
    sectionTo: 73,
    summary: "الفرقة الأولى - نظم المعلومات الإدارية (لائحة ثانية) | سكشن 61 إلى 73",
    subjects: [
      {
        id: "F-mgmt",
        subject: "إدارة أعمال",
        staff: ["د/ هدى عبد العال", "م/ محمد سلام"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 11 و", "مدرج 12 و"],
      },
      {
        id: "F-acc",
        subject: "محاسبة مالية",
        staff: ["أ.م.د/ علاء كامل", "م/ إسراء الشحات", "م/ تقى صادق"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["قاعة 404 د", "مدرج 2 هـ", "مدرج 5 هـ", "قاعة هـ211"],
      },
      {
        id: "F-eco",
        subject: "مبادئ اقتصاد",
        staff: ["أ.د/ إيهاب يونس", "م/ إسراء حمدي"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 2 د", "مدرج 9 و"],
      },
      {
        id: "F-eng",
        subject: "لغة أجنبية 1",
        staff: ["أ.د/ محمود كامل", "م/ أسماء جمال"],
        daysAndPeriods: "السبت - الخميس (الفترات 1 إلى 8)",
        rooms: ["مدرج 4 و", "مدرج 12 و"],
      },
      {
        id: "F-law",
        subject: "مبادئ القانون",
        staff: ["د/ أحمد عطية"],
        daysAndPeriods: "حسب جدول المحاضرات الأسبوعي",
        rooms: ["مدرج 3 هـ"],
      },
    ],
  },
];

export function cloneDefaultGroups(): GroupInfo[] {
  return JSON.parse(JSON.stringify(DEFAULT_FIRST_YEAR_GROUPS)) as GroupInfo[];
}

export function loadScheduleGroups(): GroupInfo[] {
  if (typeof window === "undefined") return cloneDefaultGroups();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultGroups();
    const parsed = JSON.parse(raw) as GroupInfo[];
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefaultGroups();
    return parsed;
  } catch {
    return cloneDefaultGroups();
  }
}

export function saveScheduleGroups(groups: GroupInfo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function resetScheduleGroups(): GroupInfo[] {
  const fresh = cloneDefaultGroups();
  saveScheduleGroups(fresh);
  return fresh;
}
