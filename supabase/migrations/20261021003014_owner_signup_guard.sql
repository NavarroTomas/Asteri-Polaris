begin;
create extension if not exists pg_cron;

-- Existing accounts keep their current access. Only new registrations need review.
alter table public.profiles add column owner_approved_at timestamptz;
update public.profiles set owner_approved_at=now();
alter table public.profiles alter column status set default 'pending';

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,email,display_name,role,status)
  values(new.id,new.email,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),nullif(btrim(new.raw_user_meta_data->>'name'),''),split_part(coalesce(new.email,'hincha'),'@',1)),50),'fan','pending')
  on conflict(id) do update set email=excluded.email,display_name=coalesce(public.profiles.display_name,excluded.display_name),updated_at=now();
  return new;
end $$;

-- This guard applies to every UPDATE, including direct REST writes and older RPCs.
create function asteri_private.guard_owner_approval() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.owner_approved_at is distinct from old.owner_approved_at then
    raise exception 'La aprobación solo puede establecerse al activar la cuenta.';
  end if;
  if old.owner_approved_at is null and new.status='active' then
    if not coalesce(public.is_owner(),false) then
      raise exception 'Solo el owner puede aprobar una cuenta nueva.' using errcode='42501';
    end if;
    new.owner_approved_at:=now();
  end if;
  return new;
end $$;
revoke all on function asteri_private.guard_owner_approval() from public,anon,authenticated;
create trigger guard_owner_approval before update on public.profiles
for each row execute function asteri_private.guard_owner_approval();

create function asteri_private.review_fan_registration(target_user_id uuid, approve boolean) returns void
language plpgsql security definer set search_path='' as $$
declare member public.profiles;
begin
  if not coalesce(public.is_owner(),false) then
    raise exception 'Solo el owner puede revisar las cuentas nuevas.' using errcode='42501';
  end if;
  if approve is null then raise exception 'Elegí aprobar o rechazar.'; end if;
  select * into member from public.profiles where id=target_user_id for update;
  if member.id is null or member.owner_approved_at is not null or member.status<>'pending' or member.role<>'fan' then
    raise exception 'La cuenta no tiene una solicitud de hincha pendiente.';
  end if;
  update public.profiles set status=case when approve then 'active' else 'suspended' end,updated_at=now() where id=target_user_id;
end $$;
revoke all on function asteri_private.review_fan_registration(uuid,boolean) from public,anon,authenticated;
grant execute on function asteri_private.review_fan_registration(uuid,boolean) to authenticated;
create function public.review_fan_registration(target_user_id uuid, approve boolean) returns void
language sql security invoker set search_path='' as $$ select asteri_private.review_fan_registration($1,$2); $$;
revoke all on function public.review_fan_registration(uuid,boolean) from public,anon,authenticated;
grant execute on function public.review_fan_registration(uuid,boolean) to authenticated;

-- Private, keyed fingerprints: no plain IP, email or user ID is stored here.
create table asteri_private.signup_guard_secret (
  singleton boolean primary key default true check(singleton),
  secret bytea not null default extensions.gen_random_bytes(32)
);
insert into asteri_private.signup_guard_secret(singleton) values(true);
create table asteri_private.signup_ip_cooldowns (
  fingerprint bytea primary key,
  expires_at timestamptz not null
);
create index signup_ip_cooldowns_expiry_idx on asteri_private.signup_ip_cooldowns(expires_at);
alter table asteri_private.signup_guard_secret enable row level security;
alter table asteri_private.signup_ip_cooldowns enable row level security;
revoke all on asteri_private.signup_guard_secret,asteri_private.signup_ip_cooldowns from public,anon,authenticated;
grant usage on schema asteri_private,extensions to supabase_auth_admin;
grant select on asteri_private.signup_guard_secret to supabase_auth_admin;
grant select,insert,update,delete on asteri_private.signup_ip_cooldowns to supabase_auth_admin;
create policy signup_secret_auth_only on asteri_private.signup_guard_secret for select to supabase_auth_admin using(true);
create policy signup_cooldowns_auth_only on asteri_private.signup_ip_cooldowns for all to supabase_auth_admin using(true) with check(true);

-- Invoked only by Auth, so metadata.ip_address is supplied by the server.
create function asteri_private.before_user_created(event jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare address inet; normalized text; signing_key bytea; ip_hash bytea; admitted boolean:=false;
begin
  begin
    address:=nullif(btrim(event->'metadata'->>'ip_address'),'')::inet;
  exception when invalid_text_representation then
    return jsonb_build_object('error',jsonb_build_object('http_code',400,'message','No se pudo verificar el origen del registro. Volvé a intentar.'));
  end;
  if address is null then
    return jsonb_build_object('error',jsonb_build_object('http_code',400,'message','No se pudo verificar el origen del registro. Volvé a intentar.'));
  end if;
  -- Treat mapped IPv4 as IPv4; group IPv6 privacy addresses by their /64 network.
  if address <<= '::ffff:0:0/96'::inet then
    address:=('0.0.0.0'::inet+(address-'::ffff:0:0'::inet));
  end if;
  normalized:=case when family(address)=6 then network(set_masklen(address,64))::text else host(address) end;
  select secret into strict signing_key from asteri_private.signup_guard_secret where singleton;
  ip_hash:=extensions.hmac(convert_to(normalized,'UTF8'),signing_key,'sha256');
  delete from asteri_private.signup_ip_cooldowns where expires_at<=clock_timestamp();
  insert into asteri_private.signup_ip_cooldowns(fingerprint,expires_at)
  values(ip_hash,clock_timestamp()+interval '10 minutes')
  on conflict(fingerprint) do update set expires_at=excluded.expires_at
    where asteri_private.signup_ip_cooldowns.expires_at<=clock_timestamp()
  returning true into admitted;
  if not coalesce(admitted,false) then
    return jsonb_build_object('error',jsonb_build_object('http_code',429,'message','Ya se creó una cuenta desde esta conexión. Esperá 10 minutos antes de crear otra.'));
  end if;
  return '{}'::jsonb;
end $$;
revoke all on function asteri_private.before_user_created(jsonb) from public,anon,authenticated;
grant execute on function asteri_private.before_user_created(jsonb) to supabase_auth_admin;

-- Purge expired fingerprints even when the site receives no further signups.
select cron.schedule('asteri-signup-cooldown-cleanup','* * * * *',
  $cleanup$delete from asteri_private.signup_ip_cooldowns where expires_at<=clock_timestamp()$cleanup$);
notify pgrst,'reload schema';
commit;
