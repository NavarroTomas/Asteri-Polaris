-- All fixtures, role changes and preferences are rolled back. No email is sent.
begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); staff uuid:=gen_random_uuid();
begin
  insert into auth.users(id,email,raw_user_meta_data) values
    (a,'fan-test-'||a||'@asteri-test.invalid','{"display_name":"Fan test A","role":"owner","status":"active"}'::jsonb),
    (b,'fan-test-'||b||'@asteri-test.invalid','{"display_name":"Fan test B"}'::jsonb),
    (staff,'fan-test-'||staff||'@asteri-test.invalid','{"display_name":"Staff test"}'::jsonb);
  if (select count(*) from public.profiles where id in(a,b,staff) and role='fan' and status='active')<>3 then raise exception 'FAIL: signup defaults or metadata escalation'; end if;
  update public.profiles set role='admin' where id=staff;
  perform set_config('app.test_fan_a',a::text,true);
  perform set_config('app.test_fan_b',b::text,true);
  perform set_config('app.test_fan_staff',staff::text,true);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$
declare favorite uuid;
begin
  if public.is_staff() or public.is_active_member() or public.current_player_id() is not null then raise exception 'FAIL: fan team privileges'; end if;
  select id into favorite from public.players where is_active order by sort_order limit 1;
  perform public.save_fan_preferences('Fan test updated',favorite,'Hincha de prueba');
  if not exists(select 1 from public.fan_preferences where user_id=auth.uid() and favorite_player_id is not distinct from favorite and bio='Hincha de prueba') then raise exception 'FAIL: saved preferences'; end if;
  if (select display_name from public.profiles where id=auth.uid())<>'Fan test updated' then raise exception 'FAIL: saved name'; end if;
  update public.profiles set role='owner' where id=auth.uid();
  if (select role from public.profiles where id=auth.uid())<>'fan' then raise exception 'FAIL: role self escalation'; end if;
  begin
    perform public.admin_assign_player_account(auth.uid(),null,'Bad','bad');
    raise exception 'FAIL: fan administrative RPC';
  exception when raise_exception then
    if sqlerrm<>'Solo administración puede habilitar jugadores.' then raise; end if;
  end;
  if exists(select 1 from public.vods where not is_published) or exists(select 1 from public.clips where not is_published) then raise exception 'FAIL: unpublished content visible'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('app.test_fan_b'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('app.test_fan_b'),'role','authenticated')::text,true);
  if exists(select 1 from public.fan_preferences) then raise exception 'FAIL: another fan preferences visible'; end if;
  begin
    insert into public.fan_preferences(user_id,bio) values(auth.uid(),'direct');
    raise exception 'FAIL: direct preferences write';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',current_setting('app.test_fan_staff'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('app.test_fan_staff'),'role','authenticated')::text,true);
end $$;
do $$
declare created uuid; a uuid:=current_setting('app.test_fan_a')::uuid; b uuid:=current_setting('app.test_fan_b')::uuid; slug text:='fan-test-'||a;
begin
  created:=public.admin_assign_player_account(a,null,'Fan promoted',slug);
  if not exists(select 1 from public.profiles where id=a and role='player' and status='active') or not exists(select 1 from public.players where id=created and user_id=a and not is_active) then raise exception 'FAIL: atomic creation/link'; end if;
  if not exists(select 1 from public.player_stats where player_id=created) or not exists(select 1 from public.player_configs where player_id=created) then raise exception 'FAIL: initial stats/config'; end if;
  begin
    perform public.admin_assign_player_account(b,null,'Duplicate',slug);
    raise exception 'FAIL: duplicate slug accepted';
  exception when unique_violation then null;
  end;
  if (select role from public.profiles where id=b)<>'fan' or exists(select 1 from public.players where user_id=b) then raise exception 'FAIL: partial creation on duplicate'; end if;
  begin
    perform public.admin_assign_player_account(b,created,null,null);
    raise exception 'FAIL: occupied player accepted';
  exception when raise_exception then
    if sqlerrm<>'La ficha no está disponible.' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  if not public.owns_player(created) or not public.is_active_member() then raise exception 'FAIL: promoted player permissions'; end if;
  update public.player_stats set rating=1.05 where player_id=created;
  if (select rating from public.player_stats where player_id=created)<>1.05 then raise exception 'FAIL: own stats edit'; end if;
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  update public.player_stats set rating=9 where player_id=created;
  if (select rating from public.player_stats where player_id=created)<>1.05 then raise exception 'FAIL: fan edited another player'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('app.test_fan_staff'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('app.test_fan_staff'),'role','authenticated')::text,true);
  perform public.admin_make_fan_account(a);
  if (select role from public.profiles where id=a)<>'fan' or not exists(select 1 from public.players where id=created and user_id is null) then raise exception 'FAIL: demotion preserves player'; end if;
  perform public.admin_assign_player_account(b,created,null,null);
  if not exists(select 1 from public.players where id=created and user_id=b) then raise exception 'FAIL: linking existing player'; end if;
  perform public.set_member_status(b,'suspended');
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  if public.owns_player(created) or public.is_active_member() or public.current_player_id() is not null then raise exception 'FAIL: suspended player privileges'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('app.test_fan_staff'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('app.test_fan_staff'),'role','authenticated')::text,true);
  perform public.set_member_status(a,'suspended');
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  begin
    perform public.save_fan_preferences('Suspended',null,'');
    raise exception 'FAIL: suspended preferences write';
  exception when raise_exception then
    if sqlerrm<>'Se necesita una cuenta de hincha activa.' then raise; end if;
  end;
end $$;
reset role;
set local role anon;
do $$
begin
  if not public.fan_accounts_ready() then raise exception 'FAIL: anonymous readiness'; end if;
  if has_table_privilege('anon','public.fan_preferences','SELECT') or has_function_privilege('anon','public.admin_assign_player_account(uuid,uuid,text,text)','EXECUTE') or has_function_privilege('anon','public.save_fan_preferences(text,uuid,text)','EXECUTE') then raise exception 'FAIL: anonymous private privileges'; end if;
end $$;
reset role;
select 'PASS: signup, metadata, fan preferences, isolation, private content, promotion, atomic rollback, player edits, demotion and suspension' as verification;
rollback;
