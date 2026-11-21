import { ServiceError } from './errors';
import type { DB } from './types';

let pending: Promise<string> | null = null;

/**
 * يضمن وجود جلسة للطالب (Anonymous Sign-in) ويرجع auth.uid().
 * الاستدعاءات المتزامنة تشترك في طلب واحد.
 */
export function ensureSession(db: DB): Promise<string> {
  if (!pending) {
    pending = (async () => {
      const {
        data: { session },
      } = await db.auth.getSession();
      if (session?.user) return session.user.id;

      const { data, error } = await db.auth.signInAnonymously();
      if (error || !data.user) {
        throw new ServiceError('NOT_SIGNED_IN', 'تعذّر بدء الجلسة. تأكد من تفعيل الدخول المجهول في Supabase.', error);
      }
      return data.user.id;
    })().finally(() => {
      pending = null;
    });
  }
  return pending;
}
