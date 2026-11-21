type DbError = { message: string; code?: string };

/** يحوّل أخطاء Postgres إلى رسالة عربية مفهومة وكود HTTP مناسب. */
export function describeDbError(error: DbError): { status: number; message: string } {
  switch (error.code) {
    case '23503':
      return { status: 400, message: 'الربط غير صحيح: تأكد من المادة والمجموعة والسكشن والدكتور.' };
    case '23514':
      return /capacity/i.test(error.message)
        ? { status: 400, message: 'السعة أقل من عدد الطلاب المسكّنين حالياً في الميعاد.' }
        : { status: 400, message: 'إحدى القيم غير مقبولة.' };
    case '22P02':
      return { status: 400, message: 'قيمة غير صالحة.' };
    case 'PGRST116':
      return { status: 404, message: 'الميعاد غير موجود.' };
    default:
      return { status: 500, message: 'تعذّر تنفيذ العملية. حاول مرة أخرى.' };
  }
}
