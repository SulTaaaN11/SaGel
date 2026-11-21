-- =====================================================================
-- بيانات تجريبية اختيارية (Seed) لتجربة التسكين والـ Realtime
-- شغّله بعد schema.sql في Supabase SQL Editor. آمن لإعادة التشغيل (لا يكرر الصفوف).
-- يضيف: 4 سكاشن لكل مجموعة، دكتور لكل مادة، 4 معيدين، ومواعيد بسعة 250.
--   * محاضرة لكل (مادة × مجموعة) = 30 ميعاد  (الفترات 1-4)
--   * سكشن  لكل (مادة × مجموعة × سكشن) = 120 ميعاد (الفترات 5-8)
-- جدول أي طالب داخل مجموعته وسكشنه بدون تعارض؛ التعارضات تظهر عند اختيار
-- مواعيد مجموعات أخرى، وده مفيد لتجربة مسار حل المشاكل.
-- ملاحظة: المعيد رقم k يدرّس السكشن k في كل المجموعات، وممكن يتزامن له ميعادين (بيانات اختبار فقط).
-- =====================================================================

-- 1) السكاشن
insert into public.sections (group_id, number)
select g.id, n
  from public.groups g
 cross join generate_series(1, 4) as n
on conflict (group_id, number) do nothing;

-- 2) الدكاترة (واحد لكل مادة) والمعيدين
insert into public.staff (full_name, role)
select 'د. تجريبي - ' || s.name, 'doctor'::public.staff_role
  from public.subjects s
 where not exists (
   select 1 from public.staff x where x.full_name = 'د. تجريبي - ' || s.name
 );

insert into public.staff (full_name, role)
select 'م. تجريبي ' || n, 'assistant'::public.staff_role
  from generate_series(1, 4) as n
 where not exists (
   select 1 from public.staff x where x.full_name = 'م. تجريبي ' || n
 );

-- 3) المحاضرات (سعة 250)
with sub as (
  select id, name, row_number() over (order by id) - 1 as s_idx from public.subjects
), grp as (
  select id, row_number() over (order by sort_order, id) - 1 as g_idx from public.groups
)
insert into public.slots (subject_id, kind, group_id, section_id, staff_id, room, day, period, capacity)
select sub.id,
       'lecture'::public.slot_kind,
       grp.id,
       null::integer,
       st.id,
       'مدرج ' || (grp.g_idx % 3 + 1),
       ((sub.s_idx + grp.g_idx) % 6)::smallint,
       (1 + grp.g_idx % 4)::smallint,
       250
  from sub
 cross join grp
  join public.staff st on st.full_name = 'د. تجريبي - ' || sub.name
 where not exists (
   select 1 from public.slots x
    where x.subject_id = sub.id and x.kind = 'lecture' and x.group_id = grp.id
 );

-- 90) السكاشن (سعة 250)
with sub as (
  select id, row_number() over (order by id) - 1 as s_idx from public.subjects
), grp as (
  select id, row_number() over (order by sort_order, id) - 1 as g_idx from public.groups
)
insert into public.slots (subject_id, kind, group_id, section_id, staff_id, room, day, period, capacity)
select sub.id,
       'section'::public.slot_kind,
       grp.id,
       sec.id,
       st.id,
       'قاعة ' || (100 + sec.number * 10 + grp.g_idx + 1),
       ((sub.s_idx + grp.g_idx + sec.number) % 6)::smallint,
       (5 + (sec.number + grp.g_idx) % 4)::smallint,
       250
  from sub
 cross join grp
  join public.sections sec on sec.group_id = grp.id
  join public.staff st on st.full_name = 'م. تجريبي ' || sec.number
 where not exists (
   select 1 from public.slots x
    where x.subject_id = sub.id and x.kind = 'section' and x.group_id = grp.id and x.section_id = sec.id
 );

-- 5) فحص سريع للنتيجة (المتوقع: lecture=30 و section=120)
select kind, count(*) as slots_count, min(capacity) as min_capacity, max(capacity) as max_capacity
  from public.slots
 group by kind
 order by kind;

-- ---------------------------------------------------------------------
-- (اختياري) لتجربة امتلاء السعة: صغّر سعة أول ميعاد ثم سكّن طالبين وجرّب التالت
-- update public.slots set capacity = 2
--  where id = (select id from public.slots where kind = 'lecture' order by day, period limit 1);
-- للرجوع للوضع الطبيعي:
-- update public.slots set capacity = 250 where capacity = 2;
--
-- (اختياري) لتجربة الـ Realtime: افتح /doctor لأي دكتور تجريبي وسكّن طالب من /student،
-- وهتشوف العدّاد يتحدث لحظياً.
--
-- (اختياري) حذف البيانات التجريبية (يلغي أي تسكين عليها):
-- delete from public.enrollments where slot_id in (
--   select id from public.slots where staff_id in (select id from public.staff where full_name like '%تجريبي%'));
-- delete from public.slots where staff_id in (select id from public.staff where full_name like '%تجريبي%');
-- delete from public.staff where full_name like '%تجريبي%';
-- ---------------------------------------------------------------------
