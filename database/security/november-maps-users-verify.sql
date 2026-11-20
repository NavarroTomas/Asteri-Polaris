-- All users, sessions, players and matches below are temporary transaction fixtures.
-- No existing account is changed; no password, email or file is sent. ROLLBACK restores everything.
begin;
do $setup$
declare real_owner uuid; actor uuid:=gen_random_uuid(); other_owner uuid:=gen_random_uuid();
  admin_user uuid:=gen_random_uuid(); fan uuid:=gen_random_uuid(); doomed uuid:=gen_random_uuid();
  p1 uuid; p2 uuid; linked uuid;
begin
  select id into strict real_owner from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',real_owner,'role','authenticated')::text,true);
  insert into auth.users(id,email,raw_user_meta_data) values
    (actor,'qa-owner-'||actor||'@asteri-test.invalid','{"display_name":"QA owner"}'),
    (other_owner,'qa-owner-'||other_owner||'@asteri-test.invalid','{"display_name":"QA other owner"}'),
    (admin_user,'qa-admin-'||admin_user||'@asteri-test.invalid','{"display_name":"QA admin"}'),
    (fan,'qa-fan-'||fan||'@asteri-test.invalid','{"display_name":"QA fan"}'),
    (doomed,'qa-target-'||doomed||'@asteri-test.invalid','{"display_name":"QA delete target"}');
  update public.profiles set role='owner',status='active' where id in(actor,other_owner);
  update public.profiles set role='admin',status='active' where id=admin_user;
  update public.profiles set role='fan',status='active' where id=fan;
  update public.profiles set role='player',status='active' where id=doomed;
  insert into public.players(nickname,slug,is_active) values('QA maps A','qa-map-a-'||gen_random_uuid(),false) returning id into p1;
  insert into public.players(nickname,slug,is_active) values('QA maps B','qa-map-b-'||gen_random_uuid(),false) returning id into p2;
  insert into public.players(nickname,slug,user_id,is_active) values('QA retained player','qa-linked-'||gen_random_uuid(),doomed,false) returning id into linked;
  insert into public.player_stats(player_id,maps,rating,kills) values(p1,0,1.23,77),(p2,0,1.11,66);
  perform set_config('asteri.qa_maps.owner',actor::text,true);
  perform set_config('asteri.qa_maps.other_owner',other_owner::text,true);
  perform set_config('asteri.qa_maps.admin',admin_user::text,true);
  perform set_config('asteri.qa_maps.fan',fan::text,true);
  perform set_config('asteri.qa_maps.doomed',doomed::text,true);
  perform set_config('asteri.qa_maps.p1',p1::text,true);
  perform set_config('asteri.qa_maps.p2',p2::text,true);
  perform set_config('asteri.qa_maps.linked',linked::text,true);
end $setup$;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_maps.owner'),'role','authenticated')::text,true);
do $maps$
declare p1 uuid:=current_setting('asteri.qa_maps.p1')::uuid; p2 uuid:=current_setting('asteri.qa_maps.p2')::uuid;
  v uuid; f jsonb; entries jsonb; swapped jsonb; before_ids uuid[]; after_ids uuid[]; blocked boolean; s text;
begin
  f:=jsonb_build_object('slug','qa-map-'||gen_random_uuid(),'title','QA atomic match','opponent','QA opponent',
    'match_date',current_date::text,'status','played','series_format','bo3','is_published',false);
  entries:=jsonb_build_array(
    jsonb_build_object('map_name','mirage','score_asteri',13,'score_opponent',8,'player_ids',jsonb_build_array(p1,p2)),
    jsonb_build_object('map_name','nuke','score_asteri',13,'score_opponent',9,'player_ids',jsonb_build_array(p2)));
  v:=public.save_vod_structure(null,f,entries);
  perform set_config('asteri.qa_maps.vod',v::text,true);
  if not exists(select 1 from public.vods where id=v and score_asteri=2 and score_opponent=0 and result_type='series') then raise exception 'FAIL: series result'; end if;
  if not exists(select 1 from public.player_stats where player_id=p1 and maps=1 and rating=1.23 and kills=77) or
     not exists(select 1 from public.player_stats where player_id=p2 and maps=2 and rating=1.11 and kills=66) then raise exception 'FAIL: per-map counts or manual stats'; end if;
  perform public.save_vod_structure(v,f,entries);
  if (select count(*) from public.vod_maps where vod_id=v)<>2 or
     (select count(*) from public.vod_players where vod_id=v)<>2 or
     not exists(select 1 from public.player_stats where player_id=p2 and maps=2) then raise exception 'FAIL: re-save duplicated maps or counts'; end if;

  swapped:=jsonb_build_array(
    jsonb_build_object('map_name','mirage','score_asteri',13,'score_opponent',8,'player_ids',jsonb_build_array(p2)),
    jsonb_build_object('map_name','nuke','score_asteri',13,'score_opponent',9,'player_ids',jsonb_build_array(p1)));
  perform public.save_vod_structure(v,f,swapped);
  if not exists(select 1 from public.player_stats where player_id=p1 and maps=1) or
     not exists(select 1 from public.player_stats where player_id=p2 and maps=1) then raise exception 'FAIL: lineup swaps did not recalculate'; end if;
  for s in select unnest(array['upcoming','cancelled']) loop
    perform public.save_vod_structure(v,f||jsonb_build_object('status',s),swapped);
    if exists(select 1 from public.player_stats where player_id in(p1,p2) and maps<>0) then raise exception 'FAIL: upcoming/cancelled counted'; end if;
  end loop;
  perform public.save_vod_structure(v,f,swapped);
  update public.vod_maps set score_asteri=null where vod_id=v and map_name='mirage';
  if not exists(select 1 from public.player_stats where player_id=p2 and maps=0) or not exists(select 1 from public.player_stats where player_id=p1 and maps=1) then raise exception 'FAIL: map without score counted'; end if;
  update public.vod_maps set score_asteri=13 where vod_id=v and map_name='mirage';
  select array_agg(id order by map_order) into before_ids from public.vod_maps where vod_id=v;
  blocked:=false;
  begin
    perform public.save_vod_structure(v,f||'{"title":"SHOULD ROLLBACK"}'::jsonb,
      jsonb_set(swapped,'{1,player_ids}',jsonb_build_array(gen_random_uuid())));
  exception when foreign_key_violation then blocked:=true; end;
  if not blocked then raise exception 'FAIL: nonexistent player accepted'; end if;
  select array_agg(id order by map_order) into after_ids from public.vod_maps where vod_id=v;
  if after_ids is distinct from before_ids or not exists(select 1 from public.vods where id=v and title='QA atomic match') then raise exception 'FAIL: invalid lineup did not roll back match and maps'; end if;
  blocked:=false;
  begin perform public.save_vod_structure(v,f,null); exception when others then blocked:=true; end;
  if not blocked then raise exception 'FAIL: null map array accepted'; end if;
end $maps$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_maps.fan'),'role','authenticated')::text,true);
do $fan$
declare blocked boolean:=false;
begin
  begin perform public.save_vod_structure(current_setting('asteri.qa_maps.vod')::uuid,'{}','[]'); exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'FAIL: fan saved match'; end if;
  if exists(select 1 from public.vod_map_players mp join public.vod_maps m on m.id=mp.map_id where m.vod_id=current_setting('asteri.qa_maps.vod')::uuid) then raise exception 'FAIL: draft map lineup exposed'; end if;
  blocked:=false;
  begin perform public.admin_delete_user(current_setting('asteri.qa_maps.doomed')::uuid); exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'FAIL: fan deleted user'; end if;
end $fan$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_maps.admin'),'role','authenticated')::text,true);
do $admin$
declare blocked boolean:=false;
begin
  begin perform public.admin_delete_user(current_setting('asteri.qa_maps.doomed')::uuid); exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'FAIL: admin deleted user'; end if;
end $admin$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_maps.owner'),'role','authenticated')::text,true);
do $owner_guards$
declare blocked boolean:=false;
begin
  begin perform public.admin_delete_user(current_setting('asteri.qa_maps.owner')::uuid); exception when others then blocked:=true; end;
  if not blocked then raise exception 'FAIL: owner self-deletion'; end if;
  blocked:=false;
  begin perform public.admin_delete_user(current_setting('asteri.qa_maps.other_owner')::uuid); exception when others then blocked:=true; end;
  if not blocked then raise exception 'FAIL: deletion of another owner'; end if;
end $owner_guards$;

reset role;
-- Insert a real temporary session so revocation is exercised rather than checked vacuously.
insert into auth.sessions(id,user_id) values(gen_random_uuid(),current_setting('asteri.qa_maps.doomed')::uuid);
do $session_fixture$ begin
  if not exists(select 1 from auth.sessions where user_id=current_setting('asteri.qa_maps.doomed')::uuid) then raise exception 'FAIL: session fixture missing'; end if;
end $session_fixture$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_maps.owner'),'role','authenticated')::text,true);
select public.admin_delete_user(current_setting('asteri.qa_maps.doomed')::uuid);
reset role;
do $retention$
begin
  if exists(select 1 from auth.users where id=current_setting('asteri.qa_maps.doomed')::uuid) or
     exists(select 1 from public.profiles where id=current_setting('asteri.qa_maps.doomed')::uuid) then raise exception 'FAIL: user/profile remains'; end if;
  if not exists(select 1 from public.players where id=current_setting('asteri.qa_maps.linked')::uuid and user_id is null) then raise exception 'FAIL: public player deleted or not unlinked'; end if;
  if exists(select 1 from auth.sessions where user_id=current_setting('asteri.qa_maps.doomed')::uuid) then raise exception 'FAIL: sessions remain'; end if;
  if not exists(select 1 from public.audit_logs where actor_user_id=current_setting('asteri.qa_maps.owner')::uuid and action='USER_DELETE' and entity_id::text=current_setting('asteri.qa_maps.doomed')) then raise exception 'FAIL: deletion audit missing'; end if;
end $retention$;

select 'PASS: atomic map saves, per-map counts, swaps, re-save, manual stats preservation, upcoming/cancelled exclusion, invalid-player rollback, JSON validation, permissions and owner-only account deletion/session revocation; rollback all temporary fixtures' verification;
rollback;
