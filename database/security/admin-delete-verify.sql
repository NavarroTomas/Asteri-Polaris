-- Every fixture and deletion is rolled back; no real player is removed.
begin;
do $$ declare staff uuid; p uuid; r uuid; begin
select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
insert into public.rosters(name,game,is_active) values('Delete test '||gen_random_uuid(),'CS2',true) returning id into r;
insert into public.players(nickname,slug,roster_id) values('Delete test','delete-test-'||gen_random_uuid(),r) returning id into p;
insert into public.player_stats(player_id) values(p);
insert into public.player_configs(player_id) values(p);
perform set_config('asteri.delete.staff',staff::text,true);
perform set_config('asteri.delete.player',p::text,true);
perform set_config('asteri.delete.roster',r::text,true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $$ declare n integer; begin
delete from public.players where id=current_setting('asteri.delete.player')::uuid; get diagnostics n=row_count;
if n<>0 then raise exception 'FAIL: nonstaff deleted player'; end if;
delete from public.rosters where id=current_setting('asteri.delete.roster')::uuid; get diagnostics n=row_count;
if n<>0 then raise exception 'FAIL: nonstaff deleted roster'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.delete.staff'),'role','authenticated')::text,true);
do $$ declare blocked boolean:=false; n integer; begin
begin delete from public.rosters where id=current_setting('asteri.delete.roster')::uuid; exception when foreign_key_violation then blocked:=true; end;
if not blocked then raise exception 'FAIL: nonempty roster deleted'; end if;
delete from public.players where id=current_setting('asteri.delete.player')::uuid; get diagnostics n=row_count;
if n<>1 then raise exception 'FAIL: staff player deletion'; end if;
if exists(select 1 from public.player_stats where player_id=current_setting('asteri.delete.player')::uuid) or exists(select 1 from public.player_configs where player_id=current_setting('asteri.delete.player')::uuid) then raise exception 'FAIL: dependent data'; end if;
delete from public.rosters where id=current_setting('asteri.delete.roster')::uuid; get diagnostics n=row_count;
if n<>1 then raise exception 'FAIL: empty roster deletion'; end if;
end $$;
reset role;
do $$ begin
if has_table_privilege('anon','public.rosters','DELETE') then raise exception 'FAIL: anonymous roster deletion'; end if;
if not exists(select 1 from pg_policies where tablename='rosters' and policyname='rosters_delete_staff' and qual like '%10000000-0000-4000-8000-000000000001%') then raise exception 'FAIL: default roster guard'; end if;
end $$;
select 'PASS: staff deletion, dependent cleanup, nonstaff denial, nonempty and default roster protection' verification;
rollback;
