# تشغيل المشروع

## 1) الحزم
```bash
npm i @supabase/supabase-js @supabase/ssr server-only
```

## 2) قاعدة البيانات (بالترتيب في Supabase SQL Editor)
1. `schema.sql`   (الجداول والدوال والصلاحيات والـ Realtime)
2. `migration-001-slot-status.sql`   (حالة الميعاد: فتح/إغلاق التسجيل)
3. `seed.sql`   (اختياري: بيانات تجريبية)

وفعّل Authentication > Providers > Anonymous Sign-ins.

## 3) متغيرات البيئة
انسخ `.env.example` إلى `.env.local` واملأه (وأضف نفس القيم في Vercel).

## 4) ملفات تُحذف/تُستبدل
- احذف `app/admin/layout.tsx` لو لسه موجود (الحارس بقى جوه الصفحة وواجهات الـ API).
- استبدل `app/layout.tsx` و`app/globals.css` و`app/page.tsx` بالنسخ المرفقة.
- مسارات `route.ts` المرفقة لا تحتوي `runtime` ولا `dynamic` (متوافقة مع cacheComponents).

## 5) التشغيل
```bash
npm run build && npm run start
```
