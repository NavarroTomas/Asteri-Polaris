begin;
grant delete on public.rosters to authenticated;
create policy rosters_delete_staff on public.rosters for delete to authenticated
using ((select public.is_staff()) and id <> '10000000-0000-4000-8000-000000000001'::uuid);
commit;
