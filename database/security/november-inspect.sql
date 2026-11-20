-- Read-only schema inspection. Contains no user rows, emails, tokens or credentials.
-- Run as the project database administrator in the SQL editor.
begin read only;

with target_tables as (
  select c.oid, n.nspname, c.relname
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in
    ('vods','vod_maps','vod_players','player_stats','players','profiles','audit_logs')
), trigger_functions as (
  select distinct t.tgfoid
  from pg_trigger t join target_tables c on c.oid=t.tgrelid
  where not t.tgisinternal and c.relname in ('vods','vod_players','player_stats','players')
), objects as (
  select 'columns' object_kind,
    format('%I.%I',t.nspname,t.relname) object_name,
    jsonb_pretty(jsonb_agg(jsonb_build_object(
      'column',a.attname,'type',format_type(a.atttypid,a.atttypmod),
      'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),
      'identity',a.attidentity,'generated',a.attgenerated
    ) order by a.attnum)) definition
  from target_tables t
  join pg_attribute a on a.attrelid=t.oid and a.attnum>0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid=t.oid and d.adnum=a.attnum
  group by t.nspname,t.relname

  union all
  select case when con.contype='f' then 'foreign_key' else 'constraint' end,
    con.conrelid::regclass::text||'.'||con.conname,
    pg_get_constraintdef(con.oid,true)
  from pg_constraint con
  where con.conrelid in (select oid from target_tables)
    or (con.contype='f' and con.confrelid in ('auth.users'::regclass,'public.profiles'::regclass))

  union all
  select 'trigger',format('%I.%I.%I',c.nspname,c.relname,t.tgname),
    pg_get_triggerdef(t.oid,true)||'; -- enabled='||t.tgenabled
  from pg_trigger t join target_tables c on c.oid=t.tgrelid
  where not t.tgisinternal and c.relname in ('vods','vod_players','player_stats','players')

  union all
  select 'function',p.oid::regprocedure::text,pg_get_functiondef(p.oid)
  from pg_proc p
  where p.prokind in ('f','p') and
    (p.proname='recalculate_player_match_count' or p.oid in (select tgfoid from trigger_functions))

  union all
  select 'row_security',format('%I.%I',t.nspname,t.relname),
    jsonb_build_object('enabled',c.relrowsecurity,'forced',c.relforcerowsecurity)::text
  from target_tables t join pg_class c on c.oid=t.oid

  union all
  select 'policy',format('%I.%I.%I',schemaname,tablename,policyname),
    jsonb_build_object('command',cmd,'roles',roles,'using',qual,'with_check',with_check)::text
  from pg_policies where schemaname='public' and tablename in
    ('vods','vod_maps','vod_players','player_stats','players','profiles','audit_logs')
)
select object_kind,object_name,definition from objects order by object_kind,object_name;

commit;
