-- Preparation only. Run on the ASTERI project, and COMMIT before part 02.
-- No existing account, player or permission is changed by this preparation.
do $$
declare role_type record;
begin
  if to_regclass('public.profiles') is null or to_regclass('public.players') is null then
    raise exception 'Expected ASTERI profiles and players tables. Stop and verify the project.';
  end if;
  select t.typtype, n.nspname, t.typname into role_type
  from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace n on n.oid=t.typnamespace
  where a.attrelid='public.profiles'::regclass and a.attname='role' and not a.attisdropped;
  if role_type.typtype='e' then
    execute format('alter type %I.%I add value if not exists %L', role_type.nspname, role_type.typname, 'fan');
  elsif role_type.typtype is distinct from 'b' then
    raise exception 'Review the profiles.role domain/type before installing fan accounts.';
  end if;
end $$;
