begin;

-- The current authenticated-user policies are indirectly referencing a
-- forbidden/nonexistent "users" relation, which causes 42501 errors on
-- user_profiles, contratos and consultas_chat for normal logged-in users.
-- Replace them with direct auth.uid()/auth.jwt()-based policies.

do $$
declare
  pol record;
begin
  for pol in
    select policyname, schemaname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_profiles', 'contratos', 'consultas_chat')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  end loop;
end $$;

alter table public.user_profiles enable row level security;
alter table public.contratos enable row level security;
alter table public.consultas_chat enable row level security;

grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update on table public.contratos to authenticated;
grant select, insert, update on table public.consultas_chat to authenticated;

create policy user_profiles_select_self_or_admin
on public.user_profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy user_profiles_insert_self_or_admin
on public.user_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy user_profiles_update_self_or_admin
on public.user_profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
)
with check (
  (select auth.uid()) = id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy contratos_select_self_or_admin
on public.contratos
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy contratos_insert_self_or_admin
on public.contratos
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy contratos_update_self_or_admin
on public.contratos
for update
to authenticated
using (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
)
with check (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy consultas_chat_select_self_or_admin
on public.consultas_chat
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy consultas_chat_insert_self_or_admin
on public.consultas_chat
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

create policy consultas_chat_update_self_or_admin
on public.consultas_chat
for update
to authenticated
using (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
)
with check (
  (select auth.uid()) = user_id
  or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'f@feche.xyz'
);

commit;
