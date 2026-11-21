// الأنواع هنا مطابقة لملف schema.sql المنفّذ في Supabase.
// ملاحظة: نستخدم type aliases (وليس interfaces) لأن supabase-js يتطلب ذلك.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SlotKind = 'lecture' | 'section';
export type StaffRole = 'doctor' | 'assistant';
export type SlotStatus = 'available' | 'full' | 'closed' | 'conflict' | 'not_free' | 'already_enrolled';
export type Tier = 1 | 2 | 3;

// ---------- Rows ----------
export type PeriodRow = { id: number; starts_at: string; ends_at: string };
export type GroupRow = { id: number; name: string; sort_order: number };
export type SectionRow = { id: number; group_id: number; number: number };
export type SubjectRow = { id: number; name: string };
export type StaffRow = { id: number; full_name: string; role: StaffRole };
export type StudentRow = {
  id: string;
  full_name: string;
  university_code: string;
  group_id: number;
  section_id: number;
  created_at: string;
};
export type SlotRow = {
  id: string;
  subject_id: number;
  kind: SlotKind;
  group_id: number;
  section_id: number | null;
  staff_id: number;
  room: string;
  day: number; // 0=السبت ... 5=الخميس
  period: number; // 1..8
  capacity: number;
  enrolled_count: number;
  is_open: boolean;
  created_at: string;
};
export type EnrollmentRow = {
  id: string;
  student_id: string;
  slot_id: string;
  subject_id: number;
  kind: SlotKind;
  day: number;
  period: number;
  created_at: string;
};

// ---------- نتائج الدوال (RETURNS TABLE) ----------
export type SuggestedSlotRow = {
  slot_id: string;
  group_name: string;
  section_number: number | null;
  staff_name: string;
  room: string;
  day_no: number;
  period_no: number;
  starts_at: string;
  ends_at: string;
  enrolled_count: number;
  capacity: number;
  tier: Tier;
  status: SlotStatus;
  reason: string;
};

export type MyScheduleRow = {
  enrollment_id: string;
  subject_name: string;
  kind: SlotKind;
  group_name: string;
  section_number: number | null;
  staff_name: string;
  room: string;
  day_no: number;
  period_no: number;
  starts_at: string;
  ends_at: string;
};

export type RosterRow = {
  enrollment_id: string;
  full_name: string;
  university_code: string;
  group_name: string;
  section_number: number;
  enrolled_at: string;
};

type Table<R, I, U = Partial<I>> = { Row: R; Insert: I; Update: U; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      periods: Table<PeriodRow, PeriodRow>;
      groups: Table<GroupRow, { name: string; sort_order?: number }>;
      sections: Table<SectionRow, { group_id: number; number: number }>;
      subjects: Table<SubjectRow, { name: string }>;
      staff: Table<StaffRow, { full_name: string; role: StaffRole }>;
      students: Table<
        StudentRow,
        {
          id: string;
          full_name: string;
          university_code: string;
          group_id: number;
          section_id: number;
          created_at?: string;
        }
      >;
      slots: Table<
        SlotRow,
        {
          id?: string;
          subject_id: number;
          kind: SlotKind;
          group_id: number;
          section_id?: number | null;
          staff_id: number;
          room: string;
          day: number;
          period: number;
          capacity?: number;
          is_open?: boolean;
          created_at?: string;
        }
      >;
      enrollments: Table<
        EnrollmentRow,
        {
          id?: string;
          student_id: string;
          slot_id: string;
          // تُملأ تلقائياً بواسطة trigger من الميعاد
          subject_id?: number;
          kind?: SlotKind;
          day?: number;
          period?: number;
          created_at?: string;
        }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      register_student: {
        Args: { p_full_name: string; p_code: string; p_group_id: number; p_section_id: number };
        Returns: Json;
      };
      enroll_student: { Args: { p_slot_id: string }; Returns: Json };
      suggest_slots: {
        Args: { p_subject_id: number; p_kind: SlotKind; p_free?: Json | null; p_limit?: number };
        Returns: SuggestedSlotRow[];
      };
      quick_enroll: {
        Args: { p_subject_id: number; p_kind: SlotKind; p_free?: Json | null };
        Returns: Json;
      };
      drop_enrollment: { Args: { p_enrollment_id: string }; Returns: Json };
      my_schedule: { Args: Record<PropertyKey, never>; Returns: MyScheduleRow[] };
      doctor_roster: {
        Args: {
          p_slot_id: string;
          p_group_id?: number | null;
          p_section_id?: number | null;
          p_query?: string | null;
        };
        Returns: RosterRow[];
      };
      // service_role فقط (من Route Handlers في السيرفر)
      admin_delete_slot: { Args: { p_slot_id: string; p_force?: boolean }; Returns: Json };
    };
    Enums: { slot_kind: SlotKind; staff_role: StaffRole };
    CompositeTypes: { [_ in never]: never };
  };
};
