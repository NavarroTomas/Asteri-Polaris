begin;
create table public.player_faceit_stats (
 player_id uuid primary key references public.players(id) on delete cascade,
 faceit_player_id uuid not null,
 nickname text not null,
 elo integer, level integer,
 lifetime jsonb not null default '{}'::jsonb check(jsonb_typeof(lifetime)='object' and octet_length(lifetime::text)<=50000),
 synced_at timestamptz not null default now()
);
alter table public.player_faceit_stats enable row level security;
revoke all on public.player_faceit_stats from public,anon,authenticated;
grant select on public.player_faceit_stats to anon,authenticated;
grant insert,update on public.player_faceit_stats to authenticated;
create policy faceit_read on public.player_faceit_stats for select to anon,authenticated using((select public.is_staff()) or exists(select 1 from public.players p join public.rosters r on r.id=p.roster_id where p.id=player_id and p.is_active and r.is_active));
create policy faceit_insert on public.player_faceit_stats for insert to authenticated with check((select public.is_staff()));
create policy faceit_update on public.player_faceit_stats for update to authenticated using((select public.is_staff())) with check((select public.is_staff()));
commit;
