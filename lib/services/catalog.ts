import type { GroupRow, PeriodRow, SectionRow, SlotKind, SlotRow, StaffRow, SubjectRow } from '@/lib/database.types';
import { toServiceError } from './errors';
import type { DB } from './types';

export type Catalog = {
  groups: GroupRow[];
  sections: SectionRow[];
  subjects: SubjectRow[];
  staff: StaffRow[];
  periods: PeriodRow[];
};

/** البيانات المرجعية (قراءة عامة): المجموعات، السكاشن، المواد، الدكاترة والمعيدين، الفترات. */
export async function fetchCatalog(db: DB): Promise<Catalog> {
  const [groups, sections, subjects, staff, periods] = await Promise.all([
    db.from('groups').select('*').order('sort_order'),
    db.from('sections').select('*').order('group_id').order('number'),
    db.from('subjects').select('*').order('id'),
    db.from('staff').select('*').order('full_name'),
    db.from('periods').select('*').order('id'),
  ]);

  for (const r of [groups, sections, subjects, staff, periods]) {
    if (r.error) throw toServiceError(r.error);
  }
  return {
    groups: groups.data ?? [],
    sections: sections.data ?? [],
    subjects: subjects.data ?? [],
    staff: staff.data ?? [],
    periods: periods.data ?? [],
  };
}

export type SlotFilters = { subjectId?: number; staffId?: number; groupId?: number; kind?: SlotKind };

export async function fetchSlots(db: DB, filters: SlotFilters = {}): Promise<SlotRow[]> {
  let q = db.from('slots').select('*').order('day').order('period');
  if (filters.subjectId !== undefined) q = q.eq('subject_id', filters.subjectId);
  if (filters.staffId !== undefined) q = q.eq('staff_id', filters.staffId);
  if (filters.groupId !== undefined) q = q.eq('group_id', filters.groupId);
  if (filters.kind !== undefined) q = q.eq('kind', filters.kind);
  const { data, error } = await q;
  if (error) throw toServiceError(error);
  return data ?? [];
}
