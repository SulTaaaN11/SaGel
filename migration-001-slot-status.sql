-- =====================================================================
-- Migration 001: حالة الميعاد (فتح/إغلاق التسجيل من لوحة الإدارة)
-- شغّله مرة واحدة في Supabase SQL Editor بعد schema.sql.
-- يضيف slots.is_open ويحدّث دالتي التسكين والاقتراحات لتحترمه.
-- (CREATE OR REPLACE يحافظ على صلاحيات التنفيذ الحالية)
-- =====================================================================

alter table public.slots add column if not exists is_open boolean not null default true;

create or replace function public.enroll_internal(p_student uuid, p_slot uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot     public.slots%rowtype;
  v_conflict text;
begin
  if not exists (select 1 from public.students where id = p_student) then
    return jsonb_build_object('ok', false, 'code', 'STUDENT_NOT_FOUND',
      'message', 'سجّل بياناتك الأول من الصفحة الرئيسية.');
  end if;

  -- القفل يسلسل الطلبات المتزامنة على نفس الميعاد فلا يمكن تجاوز السعة
  select * into v_slot from public.slots where id = p_slot for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'SLOT_NOT_FOUND',
      'message', 'الميعاد ده لم يعد متاحاً.');
  end if;

  if not v_slot.is_open then
    return jsonb_build_object('ok', false, 'code', 'SLOT_CLOSED',
      'message', 'التسجيل في الميعاد ده مغلق من الإدارة.');
  end if;

  if exists (select 1 from public.enrollments e
              where e.student_id = p_student
                and e.subject_id = v_slot.subject_id
                and e.kind = v_slot.kind) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_ENROLLED',
      'message', 'أنت مسجل في المادة دي بالفعل. احذفها الأول لو عايز تغيّر الميعاد.');
  end if;

  select sub.name into v_conflict
    from public.enrollments e
    join public.subjects sub on sub.id = e.subject_id
   where e.student_id = p_student and e.day = v_slot.day and e.period = v_slot.period
   limit 1;
  if found then
    return jsonb_build_object('ok', false, 'code', 'TIME_CONFLICT',
      'message', 'الميعاد ده يتعارض مع مادة ' || v_conflict || ' في جدولك.',
      'conflicts_with', v_conflict);
  end if;

  if v_slot.enrolled_count >= v_slot.capacity then
    return jsonb_build_object('ok', false, 'code', 'SLOT_FULL',
      'message', 'الميعاد وصل للحد الأقصى (' || v_slot.capacity || ' طالب).');
  end if;

  begin
    insert into public.enrollments (student_id, slot_id)
    values (p_student, p_slot);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'CONCURRENT_CONFLICT',
      'message', 'حصل تعارض أثناء الحفظ، جرّب تاني.');
  end;

  return jsonb_build_object('ok', true, 'slot_id', p_slot);
end;
$$;

create or replace function public.suggest_slots(
  p_subject_id smallint,
  p_kind       public.slot_kind,
  p_free       jsonb   default null,
  p_limit      integer default 30
) returns table (
  slot_id        uuid,
  group_name     text,
  section_number smallint,
  staff_name     text,
  room           text,
  day_no         smallint,
  period_no      smallint,
  starts_at      time,
  ends_at        time,
  enrolled_count integer,
  capacity       integer,
  tier           smallint,
  status         text,
  reason         text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select
      s.id             as slot_id,
      g.name           as group_name,
      sec.number       as section_number,
      st.full_name     as staff_name,
      s.room           as room,
      s.day            as day_no,
      s.period         as period_no,
      p.starts_at      as starts_at,
      p.ends_at        as ends_at,
      s.enrolled_count as enrolled_count,
      s.capacity       as capacity,
      (case
         when s.group_id = me.group_id and s.kind = 'lecture' then 1
         when s.group_id = me.group_id and s.section_id = me.section_id then 1
         when s.group_id = me.group_id then 2
         else 3
       end)::smallint as tier,
      (case
         when mine.id is not null then 'already_enrolled'
         when not s.is_open then 'closed'
         when clash.subject_name is not null then 'conflict'
         when p_free is not null and not exists (
                select 1 from jsonb_to_recordset(p_free) as f(day smallint, period smallint)
                 where f.day = s.day and f.period = s.period) then 'not_free'
         when s.enrolled_count >= s.capacity then 'full'
         else 'available'
       end) as status,
      (case
         when mine.id is not null then 'مسجل في المادة دي بالفعل'
         when not s.is_open then 'الميعاد مغلق من الإدارة'
         when clash.subject_name is not null then 'يتعارض مع مادة ' || clash.subject_name
         when p_free is not null and not exists (
                select 1 from jsonb_to_recordset(p_free) as f(day smallint, period smallint)
                 where f.day = s.day and f.period = s.period) then 'خارج أوقات فراغك'
         when s.enrolled_count >= s.capacity then 'مكتمل العدد (' || s.capacity || ')'
         else 'متاح'
       end) as reason
    from public.students me
    join public.slots s      on s.subject_id = p_subject_id and s.kind = p_kind
    join public.groups g     on g.id = s.group_id
    left join public.sections sec on sec.id = s.section_id
    join public.staff st     on st.id = s.staff_id
    join public.periods p    on p.id = s.period
    left join public.enrollments mine
           on mine.student_id = me.id and mine.subject_id = s.subject_id and mine.kind = s.kind
    left join lateral (
      select sub.name as subject_name
        from public.enrollments e
        join public.subjects sub on sub.id = e.subject_id
       where e.student_id = me.id and e.day = s.day and e.period = s.period
       limit 1
    ) clash on true
    where me.id = (select auth.uid())
  ) x
  order by (x.status <> 'available'), x.tier, x.day_no, x.period_no
  limit p_limit;
$$;
