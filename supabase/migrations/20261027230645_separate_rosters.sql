begin;
create table public.rosters (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(btrim(name)) between 2 and 80),
  game text not null check(char_length(btrim(game)) between 2 and 80),
  description text not null default '' check(char_length(description)<=500),
  is_active boolean not null default false,
  sort_order integer not null default 0 check(sort_order between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index rosters_name_game_unique on public.rosters(lower(btrim(name)),lower(btrim(game)));
alter table public.rosters enable row level security;
revoke all on public.rosters from public,anon,authenticated;
grant select on public.rosters to anon,authenticated;
grant insert,update on public.rosters to authenticated;
create policy rosters_read_public_or_staff on public.rosters for select to anon,authenticated
using(is_active or (select public.is_staff()));
create policy rosters_insert_staff on public.rosters for insert to authenticated
with check((select public.is_staff()));
create policy rosters_update_staff on public.rosters for update to authenticated
using((select public.is_staff())) with check((select public.is_staff()));

insert into public.rosters(id,name,game,is_active,sort_order)
values('10000000-0000-4000-8000-000000000001','Counter-Strike 2','Counter-Strike 2',true,0);
alter table public.players add column roster_id uuid not null
default '10000000-0000-4000-8000-000000000001'
references public.rosters(id) on delete restrict;
create index players_roster_id_idx on public.players(roster_id);

-- Player accounts can edit their own ficha, but cannot move themselves to a team.
create function asteri_private.guard_player_roster() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.roster_id is distinct from old.roster_id and auth.uid() is not null and not coalesce(public.is_staff(),false) then
    raise exception 'Solo administración puede cambiar el plantel de un jugador.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function asteri_private.guard_player_roster() from public,anon,authenticated;
create trigger guard_player_roster before update on public.players
for each row execute function asteri_private.guard_player_roster();
create trigger rosters_updated_at before update on public.rosters
for each row execute function public.set_updated_at();
create trigger audit_rosters after insert or update on public.rosters
for each row execute function public.write_audit_log();
notify pgrst,'reload schema';
commit;
