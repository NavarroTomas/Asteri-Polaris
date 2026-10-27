-- This test creates fixtures only inside a rolled-back transaction.
begin;
do $test$
declare staff uuid; player_user uuid:=gen_random_uuid(); fan_user uuid:=gen_random_uuid(); player_id uuid; group_id uuid;
begin
  select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
  insert into auth.users(id,email,raw_user_meta_data) values
    (player_user,'roster-player-'||player_user||'@asteri-test.invalid','{"display_name":"Roster test player"}'),
    (fan_user,'roster-fan-'||fan_user||'@asteri-test.invalid','{"display_name":"Roster test fan"}');
  update public.profiles set role='player',status='active' where id=player_user;
  update public.profiles set status='active' where id=fan_user;
  insert into public.players(user_id,nickname,slug,is_active) values(player_user,'Roster test','roster-test-'||player_user,true) returning id into player_id;
  if not exists(select 1 from public.players where id=player_id and roster_id='10000000-0000-4000-8000-000000000001') then raise exception 'FAIL: default roster'; end if;
  perform set_config('asteri.roster.staff',staff::text,true);
  perform set_config('asteri.roster.player',player_user::text,true);
  perform set_config('asteri.roster.fan',fan_user::text,true);
  perform set_config('asteri.roster.player_id',player_id::text,true);
end $test$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.roster.staff'),'role','authenticated')::text,true);
do $test$ declare r uuid;
begin
  insert into public.rosters(name,game,is_active,sort_order) values('Roster test '||gen_random_uuid(),'Counter-Strike 2',false,10) returning id into r;
  perform set_config('asteri.roster.group',r::text,true);
  update public.rosters set name=name||' editado' where id=r;
  if not exists(select 1 from public.rosters where id=r and not is_active and name like '% editado') then raise exception 'FAIL: staff edit draft'; end if;
  update public.players set roster_id=r where id=current_setting('asteri.roster.player_id')::uuid;
  if not exists(select 1 from public.players where id=current_setting('asteri.roster.player_id')::uuid and roster_id=r) then raise exception 'FAIL: staff assignment'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.roster.player'),'role','authenticated')::text,true);
do $test$ declare denied boolean:=false; n integer;
begin
  if exists(select 1 from public.rosters where id=current_setting('asteri.roster.group')::uuid) then raise exception 'FAIL: player sees draft'; end if;
  begin update public.players set roster_id='10000000-0000-4000-8000-000000000001' where id=current_setting('asteri.roster.player_id')::uuid;
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: player moved own roster'; end if;
  denied:=false;
  begin insert into public.rosters(name,game) values('Forbidden','Counter-Strike 2'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: player created roster'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.roster.fan'),'role','authenticated')::text,true);
do $test$ declare denied boolean:=false; n integer;
begin
  begin insert into public.rosters(name,game) values('Forbidden fan','Counter-Strike 2'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: fan created roster'; end if;
  update public.rosters set is_active=true where id=current_setting('asteri.roster.group')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: fan published draft'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.roster.staff'),'role','authenticated')::text,true);
update public.rosters set is_active=true where id=current_setting('asteri.roster.group')::uuid;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $test$ declare denied boolean:=false;
begin
  if not exists(select 1 from public.rosters where id=current_setting('asteri.roster.group')::uuid) then raise exception 'FAIL: published roster invisible'; end if;
  begin insert into public.rosters(name,game) values('Forbidden anon','CS2'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: anonymous write'; end if;
end $test$;
reset role;
do $test$ begin
  update public.rosters set is_active=false where id=current_setting('asteri.roster.group')::uuid;
  if has_table_privilege('authenticated','public.rosters','DELETE') then raise exception 'FAIL: destructive grant'; end if;
end $test$;
set local role anon;
do $test$ begin
  if exists(select 1 from public.rosters where id=current_setting('asteri.roster.group')::uuid) then raise exception 'FAIL: archived roster visible'; end if;
end $test$;
reset role;
select 'PASS: default roster, staff creation/edit/assignment, public visibility, archive, fan/player/anonymous write denial and own-roster protection' verification;
rollback;
