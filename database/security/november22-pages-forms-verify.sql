-- New tournament page fields + external Google Forms. All fixtures are rolled back.
-- No account is changed and no Google form or other external service is contacted.
begin;
do $setup$
declare staff uuid; pub uuid; draft uuid; opened uuid; closed uuid; legacy uuid; response_id uuid;
begin
 select id into strict staff from public.profiles where role='owner' and status='active' limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
 insert into public.tournaments(title,starts_on,is_published,page_title,page_body,format,location,rules_url)
 values('QA detail published '||gen_random_uuid(),current_date,true,'QA public page','QA plain text body','BO3','Online','https://example.invalid/rules') returning id into pub;
 insert into public.tournaments(title,starts_on,is_published,page_title,page_body)
 values('QA detail draft '||gen_random_uuid(),current_date,false,'QA draft page','QA draft body') returning id into draft;
 insert into public.application_openings(title,area,is_open,google_form_url)
 values('QA Google open '||gen_random_uuid(),'QA',true,'https://forms.gle/QAForm123') returning id into opened;
 insert into public.application_openings(title,area,is_open,google_form_url)
 values('QA Google closed '||gen_random_uuid(),'QA',false,'https://docs.google.com/forms/d/e/QAForm123/viewform') returning id into closed;
 insert into public.application_openings(title,area,is_open,questions)
 values('QA preserved legacy '||gen_random_uuid(),'QA',false,'["Old question"]') returning id into legacy;
 insert into public.applications(opening_id,user_id,nickname,contact,answers)
 values(legacy,staff,'QA prior applicant','QA contact','{"Old question":"QA original answer"}') returning id into response_id;
 perform set_config('asteri.qa22.staff',staff::text,true);
 perform set_config('asteri.qa22.pub',pub::text,true);
 perform set_config('asteri.qa22.draft',draft::text,true);
 perform set_config('asteri.qa22.opened',opened::text,true);
 perform set_config('asteri.qa22.closed',closed::text,true);
 perform set_config('asteri.qa22.legacy',legacy::text,true);
 perform set_config('asteri.qa22.response',response_id::text,true);
end $setup$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $public$ begin
 if not exists(select 1 from public.tournaments where id=current_setting('asteri.qa22.pub')::uuid and page_title='QA public page' and page_body='QA plain text body' and format='BO3' and location='Online') then raise exception 'FAIL: public tournament page fields unavailable'; end if;
 if exists(select 1 from public.tournaments where id=current_setting('asteri.qa22.draft')::uuid) then raise exception 'FAIL: draft page leaked'; end if;
 if not exists(select 1 from public.application_openings where id=current_setting('asteri.qa22.opened')::uuid and google_form_url='https://forms.gle/QAForm123') then raise exception 'FAIL: open Google form card unavailable'; end if;
 if exists(select 1 from public.application_openings where id in(current_setting('asteri.qa22.closed')::uuid,current_setting('asteri.qa22.legacy')::uuid)) then raise exception 'FAIL: closed opening exposed'; end if;
end $public$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
do $nonstaff$ declare n integer; begin
 update public.tournaments set page_body='Forbidden' where id=current_setting('asteri.qa22.pub')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: nonstaff changed tournament page'; end if;
 update public.application_openings set google_form_url='https://forms.gle/Forbidden' where id=current_setting('asteri.qa22.opened')::uuid; get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL: nonstaff changed form destination'; end if;
end $nonstaff$;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('asteri.qa22.staff'),'role','authenticated')::text,true);
do $validation$
declare blocked boolean; invalid_url text;
begin
 foreach invalid_url in array array['http://forms.gle/QA','javascript:alert(1)','https://forms.gle.evil.invalid/QA','https://docs.google.com.evil.invalid/forms/QA','https://docs.google.com/document/d/QA','https://user:secret@docs.google.com/forms/QA','https://forms.gle:444/QA'] loop
  blocked:=false;
  begin insert into public.application_openings(title,area,is_open,google_form_url) values('QA invalid','QA',false,invalid_url);
  exception when check_violation then blocked:=true; end;
  if not blocked then raise exception 'FAIL: invalid Google form URL accepted'; end if;
 end loop;
 blocked:=false;
 begin insert into public.application_openings(title,area,is_open) values('QA missing URL','QA',true);
 exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'FAIL: opened without Google form'; end if;
 blocked:=false;
 begin update public.application_openings set is_open=true where id=current_setting('asteri.qa22.legacy')::uuid;
 exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'FAIL: legacy opening published without Google form'; end if;
 update public.application_openings set google_form_url='https://forms.gle/QAUpdated',is_open=true where id=current_setting('asteri.qa22.legacy')::uuid;
 update public.application_openings set is_open=false where id=current_setting('asteri.qa22.legacy')::uuid;
 if not exists(select 1 from public.applications where id=current_setting('asteri.qa22.response')::uuid and answers->>'Old question'='QA original answer') then raise exception 'FAIL: legacy response lost'; end if;
 blocked:=false;
 begin delete from public.application_openings where id=current_setting('asteri.qa22.legacy')::uuid;
 exception when foreign_key_violation then blocked:=true; end;
 if not blocked then raise exception 'FAIL: opening with legacy responses deleted'; end if;
 update public.tournaments set page_title='QA edited page',page_body='QA edited text',format='BO5',location='LAN' where id=current_setting('asteri.qa22.pub')::uuid;
 if not exists(select 1 from public.tournaments where id=current_setting('asteri.qa22.pub')::uuid and page_title='QA edited page' and format='BO5' and location='LAN') then raise exception 'FAIL: staff page editing'; end if;
end $validation$;

reset role;
select 'PASS: tournament page publication/editing, draft and nonstaff restrictions, Google URL checks, publication requires a form, legacy answers preserved; all fixtures rolled back' verification;
rollback;
