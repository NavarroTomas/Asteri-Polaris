-- Regression: deleting a player participating in a VOD must not recreate player_stats.
-- Entire transaction is rolled back. Only freshly generated fixture IDs are deleted.
-- No account is created, modified or deleted, and no file or email is sent.
begin;

do $setup$
declare staff uuid; p uuid; v uuid; c uuid;
begin
  select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
  insert into public.players(nickname,slug,is_active)
    values('QA delete linked player','qa-delete-'||gen_random_uuid(),false) returning id into p;
  insert into public.player_stats(player_id,maps) values(p,0);
  insert into public.player_configs(player_id) values(p);
  insert into public.vods(title,slug,opponent,match_date,status,is_published,created_by,
    map_name,score_asteri,score_opponent,result_type)
    values('QA delete linked player','qa-delete-'||gen_random_uuid(),'QA opponent',current_date,
      'played',false,staff,'mirage',13,8,'rounds') returning id into v;
  insert into public.vod_players(vod_id,player_id,lineup_order) values(v,p,1);
  if not exists(select 1 from public.player_stats where player_id=p and maps=1) then
    raise exception 'FAIL: fixture participation did not recalculate maps';
  end if;
  insert into public.clips(vod_id,player_id,title,source_type,video_url,is_published,created_by)
    values(v,p,'QA preserved clip','external','https://example.invalid/qa.mp4',false,staff) returning id into c;
  perform set_config('asteri.qa_delete.clip',c::text,true);
  perform set_config('asteri.qa_delete.staff',staff::text,true);
  perform set_config('asteri.qa_delete.player',p::text,true);
  perform set_config('asteri.qa_delete.vod',v::text,true);
end $setup$;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $nonstaff$
declare n integer;
begin
  delete from public.players where id=current_setting('asteri.qa_delete.player')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: nonstaff deleted player'; end if;
end $nonstaff$;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $anonymous$
declare n integer;
begin
  begin
    delete from public.players where id=current_setting('asteri.qa_delete.player')::uuid;
    get diagnostics n=row_count;
    if n<>0 then raise exception 'FAIL: anonymous deleted player'; end if;
  exception when insufficient_privilege then null;
  end;
end $anonymous$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_delete.staff'),'role','authenticated')::text,true);
do $delete$
declare n integer; p uuid:=current_setting('asteri.qa_delete.player')::uuid;
begin
  delete from public.players where id=p;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'FAIL: staff did not delete fixture player'; end if;
  if exists(select 1 from public.players where id=p) then raise exception 'FAIL: player remains'; end if;
  if exists(select 1 from public.player_stats where player_id=p) then raise exception 'FAIL: stats remain or were recreated'; end if;
  if exists(select 1 from public.player_configs where player_id=p) then raise exception 'FAIL: config remains'; end if;
  if exists(select 1 from public.vod_players where player_id=p) then raise exception 'FAIL: lineup remains'; end if;
  if not exists(select 1 from public.vods where id=current_setting('asteri.qa_delete.vod')::uuid) then raise exception 'FAIL: VOD was removed'; end if;
  if not exists(select 1 from public.clips where id=current_setting('asteri.qa_delete.clip')::uuid and player_id is null and vod_id=current_setting('asteri.qa_delete.vod')::uuid) then raise exception 'FAIL: clip removed or player reference not cleared'; end if;
end $delete$;

reset role;
do $missing$
begin
  perform asteri_private.recalculate_player_match_count(current_setting('asteri.qa_delete.player')::uuid);
  if exists(select 1 from public.player_stats where player_id=current_setting('asteri.qa_delete.player')::uuid) then
    raise exception 'FAIL: explicit recalc recreated missing player stats';
  end if;
end $missing$;

select 'PASS: linked player deletion, stats/config/lineup cleanup, preserved VOD/clip, missing-player recalc and nonstaff/anonymous denial; all fixture changes rolled back' verification;
rollback;
