import type { EnrollmentRow, RosterRow, SlotRow } from '@/lib/database.types';
import { toServiceError } from './errors';
import type { DB } from './types';

export type RosterFilters = { groupId?: number | null; sectionId?: number | null; query?: string | null };

/** كشف الطلاب المسكّنين في ميعاد (RPC عام: doctor_roster). */
export async function fetchRoster(db: DB, slotId: string, filters: RosterFilters = {}): Promise<RosterRow[]> {
  const { data, error } = await db.rpc('doctor_roster', {
    p_slot_id: slotId,
    p_group_id: filters.groupId ?? null,
    p_section_id: filters.sectionId ?? null,
    p_query: filters.query?.trim() || null,
  });
  if (error) throw toServiceError(error);
  return data ?? [];
}

/**
 * تحديث لحظي لعدّادات مواعيد دكتور/معيد معين (Realtime على جدول slots).
 * الأسماء لا تُبث مباشرة (خصوصية)، فالواجهة تعيد استدعاء fetchRoster عند وصول تحديث.
 * يرجع دالة لإلغاء الاشتراك.
 */
export function subscribeToStaffSlots(db: DB, staffId: number, onChange: (slot: SlotRow) => void): () => void {
  const channel = db
    .channel(`staff-slots-${staffId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'slots', filter: `staff_id=eq.${staffId}` },
      (payload) => onChange(payload.new as SlotRow),
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}

/** تحديث لحظي لتسكين الطالب الحالي (يخضع لـ RLS: صفوفه فقط). */
export function subscribeToMyEnrollments(db: DB, userId: string, onChange: (row: EnrollmentRow | null) => void): () => void {
  const channel = db
    .channel(`my-enrollments-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'enrollments', filter: `student_id=eq.${userId}` },
      (payload) => onChange((payload.new as EnrollmentRow | undefined) ?? null),
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}
