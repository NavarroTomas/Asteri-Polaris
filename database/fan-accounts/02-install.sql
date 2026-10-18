-- Apply only after part 01 is committed and the existing ASTERI schema,
-- triggers, policies and RPC authorization have been reviewed.
begin;

-- Extend the role CHECK when profiles.role is text. Other checks stay intact.
do $$
declare item record; role_attribute smallint;
begin
  select attnum into role_attribute from pg_attribute where attrelid='public.profiles'::regclass and attname='role';
  for item in select conname, conkey from pg_constraint where conrelid='public.profiles'::regclass and contype='c' and role_attribute=any(conkey)
  loop
    if cardinality(item.conkey) <> 1 then raise exception 'Review multi-column role constraint % before continuing.', item.conname; end if;
    execute format('alter table public.profiles drop constraint %I', item.conname);
  end loop;
end $$;
alter table public.profiles add constraint profiles_supported_account_role check (role::text in ('fan','player','admin','owner'));
alter table public.profiles alter column role set default 'fan';
alter table public.profiles alter column status set default 'active';

create function public.asteri_new_account_is_fan() returns trigger language plpgsql security definer set search_path='' as $$
begin
  -- Ignore any role/status provided by a signup payload or metadata.
  new.role := 'fan';
  new.status := 'active';
  return new;
end $$;
create trigger zzzz_asteri_signup_fan before insert on public.profiles for each row execute function public.asteri_new_account_is_fan();
revoke all on function public.asteri_new_account_is_fan() from public, anon, authenticated;

create table public.fan_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  favorite_player_id uuid references public.players(id) on delete set null,
  bio text not null default '' check (char_length(bio)<=160),
  updated_at timestamptz not null default now()
);
create index fan_preferences_favorite_player_idx on public.fan_preferences(favorite_player_id);
alter table public.fan_preferences enable row level security;
revoke all on public.fan_preferences from public, anon, authenticated;
grant select on public.fan_preferences to authenticated;
create policy fan_preferences_read_own on public.fan_preferences for select to authenticated using (
  user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status::text='active')
);

create function public.save_fan_preferences(new_display_name text, new_favorite_player_id uuid default null, new_bio text default '') returns void
language plpgsql security definer set search_path='' as $$
declare member public.profiles;
begin
  select * into member from public.profiles where id=auth.uid() for update;
  if member.id is null or member.status::text is distinct from 'active' or member.role::text is distinct from 'fan' then raise exception 'Se necesita una cuenta de hincha activa.'; end if;
  if new_display_name is null or char_length(btrim(new_display_name)) not between 2 and 50 then raise exception 'El nombre debe tener entre 2 y 50 caracteres.'; end if;
  if char_length(coalesce(new_bio,''))>160 then raise exception 'La presentación admite hasta 160 caracteres.'; end if;
  if new_favorite_player_id is not null and not exists(select 1 from public.players where id=new_favorite_player_id and (is_active or id=(select favorite_player_id from public.fan_preferences where user_id=member.id))) then raise exception 'Elegí un jugador del plantel activo.'; end if;
  update public.profiles set display_name=btrim(new_display_name),updated_at=now() where id=member.id;
  insert into public.fan_preferences(user_id,favorite_player_id,bio) values(member.id,new_favorite_player_id,btrim(coalesce(new_bio,'')))
  on conflict(user_id) do update set favorite_player_id=excluded.favorite_player_id,bio=excluded.bio,updated_at=now();
end $$;
revoke all on function public.save_fan_preferences(text,uuid,text) from public, anon;
grant execute on function public.save_fan_preferences(text,uuid,text) to authenticated;

create function public.admin_assign_player_account(target_user_id uuid,target_player_id uuid default null,new_nickname text default null,new_slug text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles; member public.profiles; selected_player public.players; assigned_player_id uuid;
begin
  select * into actor from public.profiles where id=auth.uid();
  if actor.id is null or actor.status::text is distinct from 'active' or coalesce(actor.role::text,'') not in ('admin','owner') then raise exception 'Solo administración puede habilitar jugadores.'; end if;
  select * into member from public.profiles where id=target_user_id for update;
  if member.id is null or coalesce(member.role::text,'') not in ('fan','player') or coalesce(member.status::text,'') not in ('active','pending') then raise exception 'La cuenta no puede habilitarse como jugador.'; end if;
  if exists(select 1 from public.players where user_id=target_user_id) then raise exception 'La cuenta ya tiene una ficha vinculada.'; end if;
  if target_player_id is null then
    if new_nickname is null or char_length(btrim(new_nickname)) not between 2 and 50 then raise exception 'Ingresá un nickname de 2 a 50 caracteres.'; end if;
    if new_slug is null or char_length(new_slug)>80 or new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'La dirección de la ficha no es válida.'; end if;
    insert into public.players(user_id,slug,nickname,is_active,country_code,sort_order) values(target_user_id,new_slug,btrim(new_nickname),false,'AR',0) returning id into assigned_player_id;
    insert into public.player_stats(player_id) values(assigned_player_id);
    insert into public.player_configs(player_id) values(assigned_player_id);
  else
    select * into selected_player from public.players where id=target_player_id for update;
    if selected_player.id is null or selected_player.user_id is not null then raise exception 'La ficha no está disponible.'; end if;
    update public.players set user_id=target_user_id where id=target_player_id;
    assigned_player_id:=target_player_id;
  end if;
  update public.profiles set role='player',status='active',updated_at=now() where id=target_user_id;
  return assigned_player_id;
end $$;
revoke all on function public.admin_assign_player_account(uuid,uuid,text,text) from public,anon;
grant execute on function public.admin_assign_player_account(uuid,uuid,text,text) to authenticated;

create function public.admin_make_fan_account(target_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles; member public.profiles;
begin
  select * into actor from public.profiles where id=auth.uid();
  if actor.id is null or actor.status::text is distinct from 'active' or coalesce(actor.role::text,'') not in ('admin','owner') then raise exception 'Solo administración puede cambiar este rol.'; end if;
  select * into member from public.profiles where id=target_user_id for update;
  if member.id is null or coalesce(member.role::text,'') not in ('fan','player') or coalesce(member.status::text,'') not in ('active','pending') then raise exception 'La cuenta no puede convertirse en hincha.'; end if;
  update public.players set user_id=null where user_id=target_user_id;
  update public.profiles set role='fan',status='active',updated_at=now() where id=target_user_id;
end $$;
revoke all on function public.admin_make_fan_account(uuid) from public,anon;
grant execute on function public.admin_make_fan_account(uuid) to authenticated;

-- The registration form stays closed until the installation is committed.
create function public.fan_accounts_ready() returns boolean language sql stable set search_path='' as $$ select true $$;
revoke all on function public.fan_accounts_ready() from public;
grant execute on function public.fan_accounts_ready() to anon,authenticated;
notify pgrst,'reload schema';
commit;
