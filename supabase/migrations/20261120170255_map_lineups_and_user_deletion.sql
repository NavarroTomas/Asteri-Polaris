begin;
create table asteri_private.player_stats_before_maps_20261120 as select * from public.player_stats;
alter table asteri_private.player_stats_before_maps_20261120 enable row level security;
revoke all on asteri_private.player_stats_before_maps_20261120 from public,anon,authenticated;

create table public.vod_map_players (
 map_id uuid not null references public.vod_maps(id) on delete cascade,
 player_id uuid not null references public.players(id) on delete cascade,
 lineup_order integer not null default 0,
 primary key(map_id,player_id)
);
create index vod_map_players_player_idx on public.vod_map_players(player_id);
alter table public.vod_map_players enable row level security;
revoke all on public.vod_map_players from public,anon,authenticated;
grant select on public.vod_map_players to anon,authenticated;
grant insert,update,delete on public.vod_map_players to authenticated;
create policy map_lineups_read on public.vod_map_players for select to anon,authenticated using((select public.is_staff()) or exists(select 1 from public.vod_maps m join public.vods v on v.id=m.vod_id where m.id=map_id and v.is_published));
create policy map_lineups_insert on public.vod_map_players for insert to authenticated with check((select public.is_staff()));
create policy map_lineups_update on public.vod_map_players for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
create policy map_lineups_delete on public.vod_map_players for delete to authenticated using((select public.is_staff()));

-- Preserve existing formations for every map already recorded.
insert into public.vod_maps(vod_id,map_order,map_name,score_asteri,score_opponent)
select v.id,1,v.map_name,v.score_asteri,v.score_opponent from public.vods v
where nullif(btrim(v.map_name),'') is not null and v.result_type<>'series'
and not exists(select 1 from public.vod_maps m where m.vod_id=v.id);
insert into public.vod_map_players(map_id,player_id,lineup_order)
select m.id,p.player_id,p.lineup_order from public.vod_maps m join public.vod_players p on p.vod_id=m.vod_id;

create or replace function asteri_private.recalculate_player_match_count(target_player_id uuid)
returns void language plpgsql security definer set search_path='' as $body$
begin
 perform 1 from public.players where id=target_player_id for key share;
 if not found then return; end if;
 insert into public.player_stats(player_id,maps) values(target_player_id,(
  select count(distinct m.id)::integer from public.vod_map_players mp
  join public.vod_maps m on m.id=mp.map_id join public.vods v on v.id=m.vod_id
  where mp.player_id=target_player_id and v.status='played'
  and m.score_asteri is not null and m.score_opponent is not null
 )) on conflict(player_id) do update set maps=excluded.maps,updated_at=now();
end;$body$;

create function asteri_private.sync_map_lineup_stats() returns trigger language plpgsql security definer set search_path='' as $body$
begin
 if tg_op='DELETE' then perform asteri_private.recalculate_player_match_count(old.player_id);return old;end if;
 if tg_op='UPDATE' and old.player_id is distinct from new.player_id then perform asteri_private.recalculate_player_match_count(old.player_id);end if;
 perform asteri_private.recalculate_player_match_count(new.player_id);return new;
end;$body$;
revoke all on function asteri_private.sync_map_lineup_stats() from public,anon,authenticated;
create trigger map_lineup_stats after insert or update or delete on public.vod_map_players for each row execute function asteri_private.sync_map_lineup_stats();

create function asteri_private.sync_map_result_stats() returns trigger language plpgsql security definer set search_path='' as $body$
declare p uuid;begin
 for p in select player_id from public.vod_map_players where map_id=new.id loop perform asteri_private.recalculate_player_match_count(p);end loop;
 return new;
end;$body$;
revoke all on function asteri_private.sync_map_result_stats() from public,anon,authenticated;
create trigger map_result_stats after update of score_asteri,score_opponent on public.vod_maps for each row execute function asteri_private.sync_map_result_stats();

create function public.save_vod_structure(target_vod_id uuid,match_form jsonb,map_entries jsonb)
returns uuid language plpgsql security invoker set search_path='' as $body$
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
 insert into public.vods(id,slug,title,opponent,competition,match_date,match_time,map_name,score_asteri,score_opponent,status,match_outcome,calendar_filter_id,result_type,series_format,result_label,youtube_url,vod_download_url,description,is_published,created_by,tournament_id)
 values(target,f.slug,coalesce(nullif(btrim(f.title),''),'ASTERI vs '||btrim(f.opponent)),btrim(f.opponent),f.competition,f.match_date,f.match_time,case when fmt='bo1' then map_entries->0->>'map_name' end,score_a,score_b,coalesce(f.status,'upcoming'),coalesce(f.match_outcome,'auto'),f.calendar_filter_id,case when fmt='bo1' then 'rounds' else 'series' end,case when fmt<>'bo1' then fmt end,null,f.youtube_url,f.vod_download_url,f.description,coalesce(f.is_published,false),auth.uid(),f.tournament_id)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,opponent=excluded.opponent,competition=excluded.competition,match_date=excluded.match_date,match_time=excluded.match_time,map_name=excluded.map_name,score_asteri=excluded.score_asteri,score_opponent=excluded.score_opponent,status=excluded.status,match_outcome=excluded.match_outcome,calendar_filter_id=excluded.calendar_filter_id,result_type=excluded.result_type,series_format=excluded.series_format,result_label=null,youtube_url=excluded.youtube_url,vod_download_url=excluded.vod_download_url,description=excluded.description,is_published=excluded.is_published,tournament_id=excluded.tournament_id;
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
end;$body$;
revoke all on function public.save_vod_structure(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_vod_structure(uuid,jsonb,jsonb) to authenticated;

-- Recompute only the map count; keep rating, kills and other manual fields intact.
do $body$ declare p uuid;begin for p in select id from public.players loop perform asteri_private.recalculate_player_match_count(p);end loop;end;$body$;

create function asteri_private.admin_delete_user(target_user_id uuid) returns void language plpgsql security definer set search_path='' as $body$
declare actor public.profiles; target public.profiles;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.id is null or actor.role<>'owner' or actor.status<>'active' then raise exception 'Solo el owner puede eliminar cuentas.' using errcode='42501';end if;
 if target_user_id=actor.id then raise exception 'No podés eliminar tu propia cuenta.';end if;
 select * into target from public.profiles where id=target_user_id for update;
 if target.id is null then raise exception 'La cuenta ya no existe.';end if;
 if target.role='owner' then raise exception 'No se puede eliminar una cuenta owner.';end if;
 delete from auth.sessions where user_id=target_user_id;
 -- The auth.users FK detaches the public player, preserving match history.
 delete from auth.users where id=target_user_id;
 insert into public.audit_logs(actor_user_id,actor_role,action,entity_type,entity_id,old_data)
 values(actor.id,actor.role::text,'USER_DELETE','users',target_user_id::text,jsonb_build_object('id',target_user_id,'role',target.role));
end;$body$;
revoke all on function asteri_private.admin_delete_user(uuid) from public,anon,authenticated;
grant execute on function asteri_private.admin_delete_user(uuid) to authenticated;
create function public.admin_delete_user(target_user_id uuid) returns void language sql security invoker set search_path='' as $body$ select asteri_private.admin_delete_user($1); $body$;
revoke all on function public.admin_delete_user(uuid) from public,anon,authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
commit;
