-- Match roster snapshots and opening CRUD. All fixtures roll back; no real accounts/files change.
begin;
do $setup$
declare staff uuid; a uuid; b uuid; p uuid; suffix text:=gen_random_uuid()::text;
begin
 select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
 insert into public.rosters(name,game,is_active) values('QA Roster A '||suffix,'Counter-Strike 2',true) returning id into a;
 insert into public.rosters(name,game,is_active) values('QA Roster B '||suffix,'Counter-Strike 2',true) returning id into b;
 insert into public.players(nickname,slug,roster_id,is_active) values('QA roster player','qa-roster-'||suffix,a,false) returning id into p;
 insert into public.player_stats(player_id,maps,rating,kills) values(p,0,1.23,99);
 perform set_config('asteri.qa27.staff',staff::text,true);
 perform set_config('asteri.qa27.a',a::text,true);
 perform set_config('asteri.qa27.b',b::text,true);
 perform set_config('asteri.qa27.b_label','QA Roster B '||suffix,true);
 perform set_config('asteri.qa27.player',p::text,true);
end $setup$;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa27.staff'),'role','authenticated')::text,true);
do $staff$
declare a uuid:=current_setting('asteri.qa27.a')::uuid; b uuid:=current_setting('asteri.qa27.b')::uuid;
 p uuid:=current_setting('asteri.qa27.player')::uuid; v uuid; draft uuid; legacy uuid; f jsonb; entries jsonb;
 before_ids uuid[]; after_ids uuid[]; blocked boolean; opened uuid; closed uuid;
begin
 f:=jsonb_build_object('slug','qa27-match-'||gen_random_uuid(),'title','QA27 roster match','opponent','QA opponent','match_date',current_date::text,'status','played','series_format','bo1','is_published',true,'roster_id',a);
 entries:=jsonb_build_array(jsonb_build_object('map_name','mirage','score_asteri',13,'score_opponent',8,'player_ids',jsonb_build_array(p)));
 v:=public.save_vod_structure(null,f,entries);
 if not exists(select 1 from public.vods where id=v and roster_id=a and roster_label=(select name from public.rosters where id=a)) then raise exception 'FAIL: assigned roster snapshot'; end if;
 -- Only the match roster changes. Player membership, map formation and manual statistics remain intact.
 f:=f||jsonb_build_object('roster_id',b);
 perform public.save_vod_structure(v,f,entries);
 if not exists(select 1 from public.vods where id=v and roster_id=b and roster_label=current_setting('asteri.qa27.b_label')) then raise exception 'FAIL: changed roster snapshot'; end if;
 if not exists(select 1 from public.players where id=p and roster_id=a) then raise exception 'FAIL: assigning match roster moved player'; end if;
 if not exists(select 1 from public.player_stats where player_id=p and maps=1 and rating=1.23 and kills=99) then raise exception 'FAIL: assigning roster altered stats'; end if;
 if (select count(*) from public.vod_map_players mp join public.vod_maps m on m.id=mp.map_id where m.vod_id=v and mp.player_id=p)<>1 then raise exception 'FAIL: assigning roster lost map player'; end if;
 update public.rosters set name='QA archived roster',is_active=false where id=b;
 perform public.save_vod_structure(v,f,entries);
 update public.vods set roster_label='FORGED LABEL' where id=v;
 if not exists(select 1 from public.vods where id=v and roster_label=current_setting('asteri.qa27.b_label')) then raise exception 'FAIL: historic label changed after archive/rename/re-save'; end if;
 select array_agg(id order by map_order) into before_ids from public.vod_maps where vod_id=v;
 blocked:=false;
 begin perform public.save_vod_structure(v,f||jsonb_build_object('roster_id',gen_random_uuid(),'title','SHOULD ROLLBACK'),entries);
 exception when foreign_key_violation then blocked:=true; end;
 if not blocked then raise exception 'FAIL: nonexistent roster accepted'; end if;
 select array_agg(id order by map_order) into after_ids from public.vod_maps where vod_id=v;
 if before_ids is distinct from after_ids or not exists(select 1 from public.vods where id=v and title='QA27 roster match' and roster_id=b) then raise exception 'FAIL: bad roster did not roll back atomically'; end if;
 blocked:=false;
 begin delete from public.rosters where id=b; exception when foreign_key_violation then blocked:=true; end;
 if not blocked then raise exception 'FAIL: roster referenced by match deleted'; end if;
 draft:=public.save_vod_structure(null,f||jsonb_build_object('slug','qa27-draft-'||gen_random_uuid(),'status','upcoming','is_published',false),'[]');
 legacy:=public.save_vod_structure(null,f||jsonb_build_object('slug','qa27-legacy-'||gen_random_uuid(),'status','upcoming','roster_id',null),'[]');
 if not exists(select 1 from public.vods where id=legacy and roster_id is null and roster_label='') then raise exception 'FAIL: legacy roster was guessed'; end if;
 perform set_config('asteri.qa27.vod',v::text,true);
 perform set_config('asteri.qa27.draft',draft::text,true);
 perform set_config('asteri.qa27.legacy',legacy::text,true);
 insert into public.application_openings(title,area,description,is_open,google_form_url)
 values('QA27 opening','QA','Original',true,'https://forms.gle/QAForm123') returning id into opened;
 insert into public.application_openings(title,area,is_open) values('QA27 closed','QA',false) returning id into closed;
 update public.application_openings set title='QA27 updated opening',description='Updated',google_form_url='https://docs.google.com/forms/u/0/d/e/QAForm123/viewform' where id=opened;
 if not exists(select 1 from public.application_openings where id=opened and title='QA27 updated opening' and description='Updated') then raise exception 'FAIL: opening update'; end if;
 blocked:=false;
 begin update public.application_openings set is_open=true where id=closed; exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'FAIL: opened without responder URL'; end if;
 blocked:=false;
 begin insert into public.application_openings(title,area,is_open) values('QA27 invalid area','X',false); exception when check_violation then blocked:=true; end;
 if not blocked then raise exception 'FAIL: one-character area accepted'; end if;
 perform set_config('asteri.qa27.opened',opened::text,true);
 perform set_config('asteri.qa27.closed',closed::text,true);
end $staff$;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $public$ begin
 if not exists(select 1 from public.vods where id=current_setting('asteri.qa27.vod')::uuid and roster_label=current_setting('asteri.qa27.b_label')) then raise exception 'FAIL: archived roster label unavailable publicly'; end if;
 if exists(select 1 from public.rosters where id=current_setting('asteri.qa27.b')::uuid) then raise exception 'FAIL: archived private roster row exposed'; end if;
 if exists(select 1 from public.vods where id=current_setting('asteri.qa27.draft')::uuid) then raise exception 'FAIL: draft match exposed'; end if;
 if not exists(select 1 from public.application_openings where id=current_setting('asteri.qa27.opened')::uuid) or exists(select 1 from public.application_openings where id=current_setting('asteri.qa27.closed')::uuid) then raise exception 'FAIL: opening public visibility'; end if;
end $public$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $nonstaff$ declare blocked boolean:=false; n integer; begin
 begin perform public.save_vod_structure(current_setting('asteri.qa27.vod')::uuid,'{}','[]'); exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'FAIL: nonstaff saved roster match'; end if;
 update public.vods set roster_id=current_setting('asteri.qa27.a')::uuid where id=current_setting('asteri.qa27.vod')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: nonstaff changed roster'; end if;
 update public.application_openings set title='Forbidden' where id=current_setting('asteri.qa27.opened')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: nonstaff changed opening'; end if;
end $nonstaff$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa27.staff'),'role','authenticated')::text,true);
update public.application_openings set is_open=false where id=current_setting('asteri.qa27.opened')::uuid;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $closed$ begin
 if exists(select 1 from public.application_openings where id=current_setting('asteri.qa27.opened')::uuid) then raise exception 'FAIL: closed opening remains public'; end if;
end $closed$;
reset role;
select 'PASS: roster assignment/reassignment, map and stat preservation, archived snapshots, FK/atomicity, legacy NULL, draft/nonstaff restrictions, opening create/update/open/close and visibility; fixtures rolled back' verification;
rollback;
