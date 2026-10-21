-- Run with the installation inside one transaction; all fixtures are rolled back.
begin;
do $test$
declare owner_id uuid; admin_id uuid:=gen_random_uuid(); fan_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); before_count integer;
begin
  select id into strict owner_id from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  insert into auth.users(id,email,raw_user_meta_data) values
    (admin_id,'approval-admin-'||admin_id||'@asteri-test.invalid','{"display_name":"Test admin"}'),
    (fan_id,'approval-fan-'||fan_id||'@asteri-test.invalid','{"display_name":"Test fan","role":"owner","status":"active","owner_approved_at":"2026-01-01"}'),
    (other_id,'approval-other-'||other_id||'@asteri-test.invalid','{"display_name":"Test other"}');
  if not exists(select 1 from public.profiles where id=fan_id and role='fan' and status='pending' and owner_approved_at is null) then raise exception 'FAIL: metadata bypass'; end if;
  update public.profiles set role='admin',status='active' where id=admin_id;
  perform set_config('asteri.test.admin',admin_id::text,true);
  perform set_config('asteri.test.fan',fan_id::text,true);
  perform set_config('asteri.test.other',other_id::text,true);
  perform set_config('asteri.test.owner',owner_id::text,true);
end $test$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.test.admin'),'role','authenticated')::text,true);
do $test$
declare target uuid:=current_setting('asteri.test.fan')::uuid; denied boolean;
begin
  denied:=false;
  begin perform public.review_fan_registration(target,true); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: admin approved'; end if;
  denied:=false;
  begin update public.profiles set status='active' where id=target; exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: REST approval bypass'; end if;
  perform public.set_member_status(target,'suspended');
  denied:=false;
  begin perform public.set_member_status(target,'active'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: suspension approval bypass'; end if;
  perform public.set_member_status(target,'pending');
  denied:=false;
  begin perform public.admin_make_fan_account(target); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: old fan RPC approval bypass'; end if;
  denied:=false;
  begin perform public.admin_assign_player_account(target,null,'Test guard','guard-test-'||target); exception when insufficient_privilege then denied:=true; end;
  if not denied or exists(select 1 from public.players where user_id=target) then raise exception 'FAIL: player promotion approval bypass'; end if;
  denied:=false;
  begin update public.profiles set owner_approved_at=now() where id=target; exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: forged approval timestamp'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.test.fan'),'role','authenticated')::text,true);
do $test$ declare denied boolean:=false;
begin
  begin perform public.save_fan_preferences('Pending fan',null,''); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: pending account can edit'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.test.owner'),'role','authenticated')::text,true);
select public.review_fan_registration(current_setting('asteri.test.fan')::uuid,true);
select public.review_fan_registration(current_setting('asteri.test.other')::uuid,false);
do $test$ begin
  if not exists(select 1 from public.profiles where id=current_setting('asteri.test.fan')::uuid and status='active' and role='fan' and owner_approved_at is not null) then raise exception 'FAIL: owner approval'; end if;
  if not exists(select 1 from public.profiles where id=current_setting('asteri.test.other')::uuid and status='suspended' and role='fan' and owner_approved_at is null) then raise exception 'FAIL: owner rejection'; end if;
end $test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.test.fan'),'role','authenticated')::text,true);
select public.save_fan_preferences('Approved fan',null,'Mi perfil');
reset role;
-- SQL Editor cannot impersonate supabase_auth_admin. Verify its grants below;
-- exercise Auth's actual invocation separately after enabling the hook.
do $test$
declare first_result jsonb; second_result jsonb; n integer;
begin
  first_result:=asteri_private.before_user_created('{"metadata":{"ip_address":"192.0.2.198"},"user":{}}');
  second_result:=asteri_private.before_user_created('{"metadata":{"ip_address":"192.0.2.198"},"user":{"user_metadata":{"ip_address":"198.51.100.198"}}}');
  if first_result<>'{}'::jsonb or second_result->'error'->>'http_code'<>'429' then raise exception 'FAIL: per-IP limit'; end if;
  if asteri_private.before_user_created('{"metadata":{"ip_address":"::ffff:192.0.2.198"}}')->'error'->>'http_code'<>'429' then raise exception 'FAIL: mapped IPv4 bypass'; end if;
  if asteri_private.before_user_created('{"metadata":{"ip_address":"198.51.100.198"}}')<>'{}'::jsonb then raise exception 'FAIL: unrelated IP blocked'; end if;
  if asteri_private.before_user_created('{"metadata":{"ip_address":"2001:db8:198::1"}}')<>'{}'::jsonb then raise exception 'FAIL: IPv6 first registration'; end if;
  if asteri_private.before_user_created('{"metadata":{"ip_address":"2001:db8:198::2"}}')->'error'->>'http_code'<>'429' then raise exception 'FAIL: IPv6 privacy bypass'; end if;
  if asteri_private.before_user_created('{"user":{"user_metadata":{"ip_address":"203.0.113.198"}}}')->'error'->>'http_code'<>'400' then raise exception 'FAIL: untrusted client IP'; end if;
  if asteri_private.before_user_created('{"metadata":{"ip_address":"invalid"}}')->'error'->>'http_code'<>'400' then raise exception 'FAIL: invalid IP'; end if;
  select count(*) into n from asteri_private.signup_ip_cooldowns;
  if n<>3 then raise exception 'FAIL: unexpected fingerprints: %',n; end if;
  update asteri_private.signup_ip_cooldowns set expires_at=now()-interval '1 second';
  if asteri_private.before_user_created('{"metadata":{"ip_address":"192.0.2.198"}}')<>'{}'::jsonb then raise exception 'FAIL: expiration'; end if;
  if (select count(*) from asteri_private.signup_ip_cooldowns)<>1 then raise exception 'FAIL: expired rows not purged'; end if;
end $test$;
reset role;
do $test$ begin
  if has_function_privilege('anon','asteri_private.before_user_created(jsonb)','EXECUTE') or has_function_privilege('authenticated','asteri_private.before_user_created(jsonb)','EXECUTE') then raise exception 'FAIL: public hook execution'; end if;
  if has_table_privilege('authenticated','asteri_private.signup_ip_cooldowns','SELECT') or has_table_privilege('anon','asteri_private.signup_guard_secret','SELECT') then raise exception 'FAIL: public IP data'; end if;
  if not has_function_privilege('supabase_auth_admin','asteri_private.before_user_created(jsonb)','EXECUTE') or not has_table_privilege('supabase_auth_admin','asteri_private.signup_ip_cooldowns','INSERT,UPDATE,DELETE,SELECT') then raise exception 'FAIL: Auth grants'; end if;
end $test$;
select 'PASS: owner-only approval, RPC/REST bypass prevention, pending permissions, rejection, IP cooldown, IPv4/IPv6, expiry and private storage' verification;
rollback;
