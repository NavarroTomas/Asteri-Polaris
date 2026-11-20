begin;
alter table public.rosters add column game_logo_url text;
alter table public.site_settings add column presentation_video_url text;

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(btrim(title)) between 2 and 140),
  game text not null default 'Counter-Strike 2',
  description text not null default '' check(char_length(description)<=3000),
  starts_on date not null, ends_on date,
  cover_url text check(cover_url is null or cover_url ~ '^https://'), external_url text check(external_url is null or external_url ~ '^https://'), faceit_id text unique,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check(ends_on is null or ends_on>=starts_on)
);
alter table public.tournaments enable row level security;
revoke all on public.tournaments from public,anon,authenticated;
grant select on public.tournaments to anon,authenticated;
grant insert,update,delete on public.tournaments to authenticated;
create policy tournaments_read on public.tournaments for select to anon,authenticated using(is_published or (select public.is_staff()));
create policy tournaments_insert on public.tournaments for insert to authenticated with check((select public.is_staff()));
create policy tournaments_update on public.tournaments for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
create policy tournaments_delete on public.tournaments for delete to authenticated using((select public.is_staff()));
alter table public.vods add column tournament_id uuid references public.tournaments(id) on delete set null;
create index vods_tournament_id_idx on public.vods(tournament_id);

create table public.application_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(btrim(title)) between 2 and 140),
  area text not null check(char_length(btrim(area)) between 2 and 100),
  description text not null default '' check(char_length(description)<=5000),
  questions jsonb not null default '[]'::jsonb check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)<=12 and not jsonb_path_exists(questions, '$[*] ? (@.type() != "string")')),
  closes_on date,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);
create function public.validate_opening_questions() returns trigger language plpgsql security invoker set search_path='' as $body$
begin
 if jsonb_typeof(new.questions)<>'array' then raise exception 'Las preguntas deben ser una lista.'; end if;
 if exists(select 1 from jsonb_array_elements_text(new.questions) q where char_length(btrim(q))=0 or char_length(q)>500)
 or (select count(distinct lower(btrim(q))) from jsonb_array_elements_text(new.questions) q)<>jsonb_array_length(new.questions)
 then raise exception 'Usá preguntas distintas, de entre 1 y 500 caracteres.'; end if;
 return new;
end;$body$;
revoke all on function public.validate_opening_questions() from public,anon,authenticated;
create trigger validate_opening_questions before insert or update on public.application_openings for each row execute function public.validate_opening_questions();
alter table public.application_openings enable row level security;
revoke all on public.application_openings from public,anon,authenticated;
grant select on public.application_openings to anon,authenticated;
grant insert,update,delete on public.application_openings to authenticated;
create policy openings_read on public.application_openings for select to anon,authenticated using(is_open or (select public.is_staff()));
create policy openings_insert on public.application_openings for insert to authenticated with check((select public.is_staff()));
create policy openings_update on public.application_openings for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
create policy openings_delete on public.application_openings for delete to authenticated using((select public.is_staff()));

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid not null references public.application_openings(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null check(char_length(btrim(nickname)) between 2 and 80),
  contact text not null check(char_length(btrim(contact)) between 2 and 150),
  answers jsonb not null default '{}'::jsonb check(jsonb_typeof(answers)='object' and octet_length(answers::text)<=20000),
  status text not null default 'pending' check(status in ('pending','reviewing','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique(opening_id,user_id)
);
create index applications_user_id_idx on public.applications(user_id);
alter table public.applications enable row level security;
revoke all on public.applications from public,anon,authenticated;
grant select,insert,update on public.applications to authenticated;
create policy applications_read on public.applications for select to authenticated using((select public.is_staff()) or user_id=(select auth.uid()));
create policy applications_insert on public.applications for insert to authenticated with check(
 user_id=(select auth.uid()) and status='pending'
 and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active')
 and exists(select 1 from public.application_openings where id=opening_id and is_open and (closes_on is null or closes_on >= (now() at time zone 'America/Argentina/Buenos_Aires')::date))
);
create policy applications_update on public.applications for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));

insert into public.calendar_filters(name,color,is_active,sort_order)
select v.name,v.color,true,v.sort_order from (values
 ('Torneo','#00b96b',10),('Esea league','#687a70',20),('Scrim','#8b918d',30),('Amistoso','#98a69f',40),('Serie C','#588772',50),('GC','#719180',60)
) v(name,color,sort_order) where not exists(select 1 from public.calendar_filters c where lower(trim(c.name))=lower(v.name));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media','site-media',false,52428800,array['image/webp','image/png','image/jpeg','video/mp4','video/webm'])
on conflict(id) do nothing;

create policy site_media_staff_insert on storage.objects for insert to authenticated with check(bucket_id='site-media' and (select public.is_staff()));

create table public.media_posts (
 id uuid primary key default gen_random_uuid(), title text not null check(char_length(btrim(title)) between 2 and 140),
 kind text not null check(kind in ('image','video')), media_url text not null check(media_url ~ '^https://'),
 description text not null default '' check(char_length(description)<=2000), is_published boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.media_posts enable row level security;
revoke all on public.media_posts from public,anon,authenticated;
grant select on public.media_posts to anon,authenticated;
grant insert,update,delete on public.media_posts to authenticated;
create policy media_posts_read on public.media_posts for select to anon,authenticated using(is_published or (select public.is_staff()));
create policy media_posts_insert on public.media_posts for insert to authenticated with check((select public.is_staff()));
create policy media_posts_update on public.media_posts for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
create policy media_posts_delete on public.media_posts for delete to authenticated using((select public.is_staff()));

create policy site_media_read_published_or_staff on storage.objects for select to anon,authenticated using (
 bucket_id='site-media' and (
 (select public.is_staff())
 or exists(select 1 from public.media_posts p where p.is_published and right(p.media_url,char_length(storage.objects.name)+12)='/site-media/'||storage.objects.name)
 or exists(select 1 from public.tournaments t where t.is_published and right(t.cover_url,char_length(storage.objects.name)+12)='/site-media/'||storage.objects.name)
 or exists(select 1 from public.rosters r where r.is_active and right(r.game_logo_url,char_length(storage.objects.name)+12)='/site-media/'||storage.objects.name)
 or exists(select 1 from public.site_settings s where s.id=1 and right(s.presentation_video_url,char_length(storage.objects.name)+12)='/site-media/'||storage.objects.name)
 ));
commit;
