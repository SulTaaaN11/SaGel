export type ServiceErrorCode = 'NOT_SIGNED_IN' | 'NETWORK' | 'UNKNOWN';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly details?: unknown;
  constructor(code: ServiceErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

type PgError = { message: string; code?: string };

/** يحوّل أخطاء Supabase/PostgREST إلى أخطاء خدمة بسيطة برسائل عربية. */
export function toServiceError(error: PgError): ServiceError {
  const msg = error.message ?? '';
  if (error.code === '42501' || error.code === 'PGRST301' || /jwt/i.test(msg)) {
    return new ServiceError('NOT_SIGNED_IN', 'الجلسة انتهت. أعد فتح الصفحة وحاول مرة أخرى.', error);
  }
  if (/failed to fetch|network|fetch failed/i.test(msg)) {
    return new ServiceError('NETWORK', 'تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.', error);
  }
  return new ServiceError('UNKNOWN', 'حدث خطأ غير متوقع. حاول مرة أخرى.', error);
}
