import type { MyScheduleRow, StudentRow } from '@/lib/database.types';
import { toServiceError } from './errors';
import { parseDropResult, parseRegisterResult } from './parse';
import { ensureSession } from './session';
import type { DB, DropResult, RegisterResult } from './types';

export type RegisterInput = {
  fullName: string;
  universityCode: string;
  groupId: number;
  sectionId: number;
};

/** تسجيل/تحديث بيانات الطالب (يبدأ جلسة مجهولة لو مفيش). */
export async function registerStudent(db: DB, input: RegisterInput): Promise<RegisterResult> {
  try {
    await ensureSession(db);
  } catch (err) {
    return { ok: false, code: 'NOT_SIGNED_IN', message: err instanceof Error ? err.message : 'تعذّر بدء الجلسة.' };
  }

  const { data, error } = await db.rpc('register_student', {
    p_full_name: input.fullName,
    p_code: input.universityCode,
    p_group_id: input.groupId,
    p_section_id: input.sectionId,
  });
  if (error) {
    const e = toServiceError(error);
    return { ok: false, code: e.code === 'UNKNOWN' ? 'UNKNOWN' : e.code, message: e.message };
  }
  return parseRegisterResult(data);
}

/** بيانات الطالب الحالي (RLS يسمح له بصفه فقط). null لو لسه مسجلش. */
export async function getMyProfile(db: DB): Promise<StudentRow | null> {
  const userId = await ensureSession(db);
  const { data, error } = await db.from('students').select('*').eq('id', userId).maybeSingle();
  if (error) throw toServiceError(error);
  return data;
}

/** جدول الطالب الحالي مرتباً باليوم والفترة. */
export async function getMySchedule(db: DB): Promise<MyScheduleRow[]> {
  await ensureSession(db);
  const { data, error } = await db.rpc('my_schedule');
  if (error) throw toServiceError(error);
  return data ?? [];
}

export async function dropEnrollment(db: DB, enrollmentId: string): Promise<DropResult> {
  const { data, error } = await db.rpc('drop_enrollment', { p_enrollment_id: enrollmentId });
  if (error) {
    const e = toServiceError(error);
    return { ok: false, code: e.code === 'NETWORK' ? 'NETWORK' : 'UNKNOWN', message: e.message };
  }
  return parseDropResult(data);
}

