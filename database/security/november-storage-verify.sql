-- Storage publication/RLS checks using metadata only. No real file is uploaded or removed.
-- Do not DELETE storage.objects directly. ROLLBACK removes these temporary fixture rows.
begin;
do $setup$
declare staff uuid; object_name text:='qa-private-'||gen_random_uuid()||'.webp'; p uuid;
begin
  if not exists(select 1 from storage.buckets where id='site-media' and public=false) then raise exception 'FAIL: site-media must be private'; end if;
  select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
  insert into storage.objects(bucket_id,name) values('site-media',object_name);
  insert into public.media_posts(title,kind,media_url,is_published)
    values('QA private storage fixture','image','https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/site-media/'||object_name,false)
    returning id into p;
  perform set_config('asteri.qa_storage.owner',staff::text,true);
  perform set_config('asteri.qa_storage.name',object_name,true);
  perform set_config('asteri.qa_storage.post',p::text,true);
end $setup$;

set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_storage.owner'),'role','authenticated')::text,true);
do $staff_draft$ begin
  if not exists(select 1 from storage.objects where bucket_id='site-media' and name=current_setting('asteri.qa_storage.name')) then raise exception 'FAIL: staff cannot read draft object'; end if;
end $staff_draft$;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $anonymous_draft$ begin
  if exists(select 1 from storage.objects where bucket_id='site-media' and name=current_setting('asteri.qa_storage.name')) then raise exception 'FAIL: anonymous reads unpublished object'; end if;
end $anonymous_draft$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_storage.owner'),'role','authenticated')::text,true);
update public.media_posts set is_published=true where id=current_setting('asteri.qa_storage.post')::uuid;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $published$ begin
  if not exists(select 1 from storage.objects where bucket_id='site-media' and name=current_setting('asteri.qa_storage.name')) then raise exception 'FAIL: anonymous cannot read published object'; end if;
end $published$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_storage.owner'),'role','authenticated')::text,true);
update public.media_posts set is_published=false where id=current_setting('asteri.qa_storage.post')::uuid;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $unpublished$ begin
  if exists(select 1 from storage.objects where bucket_id='site-media' and name=current_setting('asteri.qa_storage.name')) then raise exception 'FAIL: hidden publication leaves anonymous object access'; end if;
end $unpublished$;

reset role;
select 'PASS: private bucket, staff draft access, anonymous draft denial, publication enables anonymous read and hiding disables it; metadata fixtures rolled back, no files touched' verification;
rollback;
