begin;
create or replace function asteri_private.recalculate_player_match_count(target_player_id uuid)
returns void language plpgsql security definer set search_path='' as $function$
begin
  perform 1 from public.players where id=target_player_id for key share;
  if not found then return; end if;
  insert into public.player_stats(player_id,maps)
  values(target_player_id,(
    select count(distinct vp.vod_id)::integer from public.vod_players vp
    join public.vods v on v.id=vp.vod_id
    where vp.player_id=target_player_id and coalesce(v.status,'upcoming')<>'cancelled'
  )) on conflict(player_id) do update set maps=excluded.maps,updated_at=now();
end;
$function$;
commit;
