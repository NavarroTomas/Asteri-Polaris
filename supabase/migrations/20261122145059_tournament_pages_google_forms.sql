begin;
alter table public.tournaments
 add column page_title text not null default '' check(char_length(page_title)<=180),
 add column page_body text not null default '' check(char_length(page_body)<=15000),
 add column format text not null default '' check(char_length(format)<=150),
 add column location text not null default '' check(char_length(location)<=150),
 add column rules_url text check(rules_url is null or rules_url ~ '^https://[^[:space:]]+$');
alter table public.application_openings add column google_form_url text
 check(google_form_url is null or google_form_url ~ '^https://(docs[.]google[.]com/forms/[^[:space:]]+|forms[.]gle/[^/[:space:]][^[:space:]]*)$');
create function public.require_google_form_for_opening() returns trigger language plpgsql security invoker set search_path='' as $body$
begin
 if new.is_open and new.google_form_url is null then raise exception 'Agregá un formulario de Google antes de abrir la convocatoria.'; end if;
 return new;
end;$body$;
revoke all on function public.require_google_form_for_opening() from public,anon,authenticated;
create trigger require_google_form_for_opening before insert or update on public.application_openings for each row execute function public.require_google_form_for_opening();
comment on column public.tournaments.page_body is 'Plain text paragraphs, never HTML.';
notify pgrst, 'reload schema';
commit;
