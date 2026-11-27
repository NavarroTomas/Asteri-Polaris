begin;
alter table public.vods add column roster_id uuid references public.rosters(id) on delete restrict;
alter table public.vods add column roster_label text not null default '' check(char_length(roster_label)<=80);
create index vods_roster_id_idx on public.vods(roster_id);
create function public.set_match_roster_label() returns trigger language plpgsql security invoker set search_path='' as $body$
begin
 if tg_op='UPDATE' and new.roster_id is not distinct from old.roster_id then new.roster_label:=old.roster_label;return new;end if;
 if new.roster_id is null then new.roster_label:='';return new;end if;
 select r.name into new.roster_label from public.rosters r where r.id=new.roster_id;
 if not found then raise exception 'El plantel no existe o no tenés permiso para usarlo.' using errcode='23503';end if;
 return new;
end;$body$;
revoke all on function public.set_match_roster_label() from public,anon,authenticated;
create trigger match_roster_label before insert or update of roster_id,roster_label on public.vods for each row execute function public.set_match_roster_label();
comment on column public.vods.roster_label is 'Roster name at assignment, preserved for archived rosters and player transfers.';
CREATE OR REPLACE FUNCTION public.save_vod_structure(target_vod_id uuid, match_form jsonb, map_entries jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare f public.vods; target uuid; entry jsonb; map_id uuid; seq integer:=0; fmt text; score_a integer;score_b integer; max_maps integer;
begin
 if not (select public.is_staff()) then raise exception 'Solo administración puede guardar partidos.' using errcode='42501';end if;
 if jsonb_typeof(map_entries) is distinct from 'array' then raise exception 'La lista de mapas no es válida.';end if;
 if jsonb_typeof(match_form) is distinct from 'object' then raise exception 'Los datos del partido no son válidos.';end if;
 f:=jsonb_populate_record(null::public.vods,match_form);
 fmt:=coalesce(nullif(f.series_format,''),'bo1');
 max_maps:=case fmt when 'bo1' then 1 when 'bo2' then 2 when 'bo3' then 3 when 'bo5' then 5 else 0 end;
 if max_maps=0 or jsonb_array_length(map_entries)>max_maps then raise exception 'La cantidad de mapas no coincide con el formato.';end if;
 if nullif(btrim(f.opponent),'') is null or f.match_date is null then raise exception 'Completá rival y fecha.';end if;
 if f.status='played' and (jsonb_array_length(map_entries)=0 or exists(select 1 from jsonb_array_elements(map_entries) m where nullif(m->>'score_asteri','') is null or nullif(m->>'score_opponent','') is null)) then raise exception 'Completá los resultados de los mapas jugados.';end if;
 if exists(select 1 from jsonb_array_elements(map_entries) m where nullif(btrim(m->>'map_name'),'') is null) or (select count(distinct m->>'map_name') from jsonb_array_elements(map_entries) m)<>jsonb_array_length(map_entries) then raise exception 'Los mapas deben ser distintos y tener nombre.';end if;
 for entry in select value from jsonb_array_elements(map_entries) loop
  if nullif(entry->>'score_asteri','')::integer<0 or nullif(entry->>'score_opponent','')::integer<0 then raise exception 'El resultado no puede ser negativo.';end if;
  if jsonb_typeof(entry->'player_ids') is distinct from 'array' or jsonb_array_length(entry->'player_ids')>5 then raise exception 'Elegí hasta cinco jugadores por mapa.';end if;
 end loop;
 target:=coalesce(target_vod_id,gen_random_uuid());
 if target_vod_id is not null then
  perform 1 from public.vods where id=target_vod_id for update;
  if not found then raise exception 'El partido ya no existe o no tenés permiso.';end if;
 end if;
 if fmt='bo1' then
  score_a:=nullif(map_entries->0->>'score_asteri','')::integer;score_b:=nullif(map_entries->0->>'score_opponent','')::integer;
 else
  select count(*) filter(where nullif(m->>'score_asteri','')::integer>nullif(m->>'score_opponent','')::integer),count(*) filter(where nullif(m->>'score_opponent','')::integer>nullif(m->>'score_asteri','')::integer) into score_a,score_b from jsonb_array_elements(map_entries) m;
 end if;
 insert into public.vods(id,slug,title,opponent,competition,match_date,match_time,map_name,score_asteri,score_opponent,status,match_outcome,calendar_filter_id,result_type,series_format,result_label,youtube_url,vod_download_url,description,is_published,created_by,tournament_id,roster_id)
 values(target,f.slug,coalesce(nullif(btrim(f.title),''),'ASTERI vs '||btrim(f.opponent)),btrim(f.opponent),f.competition,f.match_date,f.match_time,case when fmt='bo1' then map_entries->0->>'map_name' end,score_a,score_b,coalesce(f.status,'upcoming'),coalesce(f.match_outcome,'auto'),f.calendar_filter_id,case when fmt='bo1' then 'rounds' else 'series' end,case when fmt<>'bo1' then fmt end,null,f.youtube_url,f.vod_download_url,f.description,coalesce(f.is_published,false),auth.uid(),f.tournament_id,f.roster_id)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,opponent=excluded.opponent,competition=excluded.competition,match_date=excluded.match_date,match_time=excluded.match_time,map_name=excluded.map_name,score_asteri=excluded.score_asteri,score_opponent=excluded.score_opponent,status=excluded.status,match_outcome=excluded.match_outcome,calendar_filter_id=excluded.calendar_filter_id,result_type=excluded.result_type,series_format=excluded.series_format,result_label=null,youtube_url=excluded.youtube_url,vod_download_url=excluded.vod_download_url,description=excluded.description,is_published=excluded.is_published,tournament_id=excluded.tournament_id,roster_id=excluded.roster_id;
 delete from public.vod_maps where vod_id=target;
 delete from public.vod_players where vod_id=target;
 for entry in select value from jsonb_array_elements(map_entries) loop
  seq:=seq+1;
  insert into public.vod_maps(vod_id,map_order,map_name,score_asteri,score_opponent) values(target,seq,entry->>'map_name',nullif(entry->>'score_asteri','')::integer,nullif(entry->>'score_opponent','')::integer) returning id into map_id;
  insert into public.vod_map_players(map_id,player_id,lineup_order) select map_id,p.value::uuid,p.ordinality::integer from jsonb_array_elements_text(entry->'player_ids') with ordinality p(value,ordinality);
 end loop;
 insert into public.vod_players(vod_id,player_id,lineup_order)
 select target,mp.player_id,min(mp.lineup_order) from public.vod_map_players mp join public.vod_maps m on m.id=mp.map_id where m.vod_id=target group by mp.player_id;
 return target;
end;$function$;
notify pgrst,'reload schema';
commit;
