-- Content/RLS regression checks. All fixture rows are rolled back.
-- No account is created, no existing record is edited and no media file is uploaded.
begin;
do $setup$
declare staff uuid; suffix text:=gen_random_uuid()::text; t uuid; d uuid; o uuid; closed uuid; expired uuid; m uuid;
begin
  select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
  insert into public.tournaments(title,starts_on,is_published) values('QA published '||suffix,current_date,true) returning id into t;
  insert into public.tournaments(title,starts_on,is_published) values('QA draft '||suffix,current_date,false) returning id into d;
  insert into public.application_openings(title,area,questions,is_open) values('QA open '||suffix,'QA','["Question"]',true) returning id into o;
  insert into public.application_openings(title,area,is_open) values('QA closed '||suffix,'QA',false) returning id into closed;
  insert into public.application_openings(title,area,is_open,closes_on) values('QA expired '||suffix,'QA',true,(now() at time zone 'America/Argentina/Buenos_Aires')::date-1) returning id into expired;
  insert into public.media_posts(title,kind,media_url,is_published) values('QA photo '||suffix,'image','https://example.invalid/photo.webp',true) returning id into m;
  insert into public.media_posts(title,kind,media_url,is_published) values('QA private '||suffix,'image','https://example.invalid/draft.webp',false);
  perform set_config('asteri.qa_content.staff',staff::text,true);
  perform set_config('asteri.qa_content.tournament',t::text,true);
  perform set_config('asteri.qa_content.draft',d::text,true);
  perform set_config('asteri.qa_content.open',o::text,true);
  perform set_config('asteri.qa_content.closed',closed::text,true);
  perform set_config('asteri.qa_content.expired',expired::text,true);
  perform set_config('asteri.qa_content.media',m::text,true);
end $setup$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $anonymous$
declare denied boolean:=false;
begin
  if not exists(select 1 from public.tournaments where id=current_setting('asteri.qa_content.tournament')::uuid) then raise exception 'FAIL: public tournament hidden'; end if;
  if exists(select 1 from public.tournaments where id=current_setting('asteri.qa_content.draft')::uuid) then raise exception 'FAIL: draft tournament exposed'; end if;
  if exists(select 1 from public.application_openings where id=current_setting('asteri.qa_content.closed')::uuid) then raise exception 'FAIL: closed opening exposed'; end if;
  if not exists(select 1 from public.media_posts where id=current_setting('asteri.qa_content.media')::uuid) then raise exception 'FAIL: published media hidden'; end if;
  begin perform 1 from public.applications; exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: anonymous access to application data'; end if;
  denied:=false;
  begin insert into public.tournaments(title,starts_on) values('Forbidden',current_date); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: anonymous content write'; end if;
end $anonymous$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $nonstaff$
declare n integer; denied boolean:=false;
begin
  if exists(select 1 from public.tournaments where id=current_setting('asteri.qa_content.draft')::uuid) then raise exception 'FAIL: nonstaff reads draft'; end if;
  update public.tournaments set is_published=false where id=current_setting('asteri.qa_content.tournament')::uuid; get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: nonstaff edits tournament'; end if;
  delete from public.media_posts where id=current_setting('asteri.qa_content.media')::uuid; get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: nonstaff deletes media'; end if;
  begin insert into public.applications(opening_id,user_id,nickname,contact)
    values(current_setting('asteri.qa_content.open')::uuid,current_setting('asteri.qa_content.staff')::uuid,'Forbidden','QA contact');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: forged application user'; end if;
end $nonstaff$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa_content.staff'),'role','authenticated')::text,true);
do $submission$
declare a uuid; denied boolean:=false; n integer;
begin
  -- The active staff profile is used as an applicant without editing that profile.
  -- INSERT has the same ownership/opening/date restrictions for staff and members.
  insert into public.applications(opening_id,user_id,nickname,contact,answers)
    values(current_setting('asteri.qa_content.open')::uuid,auth.uid(),'QA applicant','QA contact','{"Question":"QA answer"}') returning id into a;
  perform set_config('asteri.qa_content.application',a::text,true);
  begin insert into public.applications(opening_id,user_id,nickname,contact)
    values(current_setting('asteri.qa_content.open')::uuid,auth.uid(),'Duplicate','QA contact');
  exception when unique_violation then denied:=true; end;
  if not denied then raise exception 'FAIL: duplicate application accepted'; end if;
  denied:=false;
  begin insert into public.applications(opening_id,user_id,nickname,contact)
    values(current_setting('asteri.qa_content.closed')::uuid,auth.uid(),'Closed','QA contact');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: closed opening accepts application'; end if;
  denied:=false;
  begin insert into public.applications(opening_id,user_id,nickname,contact)
    values(current_setting('asteri.qa_content.expired')::uuid,auth.uid(),'Expired','QA contact');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'FAIL: expired opening accepts application'; end if;
  update public.applications set status='reviewing' where id=a; get diagnostics n=row_count;
  if n<>1 then raise exception 'FAIL: staff cannot review application'; end if;
  denied:=false;
  begin delete from public.application_openings where id=current_setting('asteri.qa_content.open')::uuid;
  exception when foreign_key_violation then denied:=true; end;
  if not denied then raise exception 'FAIL: opening with responses deleted'; end if;
end $submission$;

select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $privacy$
declare n integer;
begin
  if exists(select 1 from public.applications where id=current_setting('asteri.qa_content.application')::uuid) then raise exception 'FAIL: another user reads application'; end if;
  update public.applications set status='accepted' where id=current_setting('asteri.qa_content.application')::uuid; get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: another user reviews application'; end if;
end $privacy$;

reset role;
select 'PASS: published/draft visibility, anonymous denial, nonstaff write/read denial, application ownership/duplicate/closed/expiry checks, staff review and response preservation; all fixtures rolled back' verification;
rollback;
