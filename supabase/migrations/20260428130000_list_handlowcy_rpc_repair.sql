-- Naprawa RPC list_handlowcy_for_calculator: anon musi mieć USAGE na schema public
-- oraz EXECUTE na funkcji. PL/pgSQL + SECURITY DEFINER odczytuje profiles mimo RLS.

grant usage on schema public to anon, authenticated;

drop function if exists public.list_handlowcy_for_calculator();

create or replace function public.list_handlowcy_for_calculator()
returns table (
  id uuid,
  full_name text,
  phone text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id,
    trim(p.full_name)::text as full_name,
    (nullif(trim(coalesce(p.phone, '')), ''))::text as phone
  from public.profiles p
  where p.role = 'handlowiec'::public.app_role
    and p.full_name is not null
    and trim(p.full_name) <> ''
  order by lower(trim(p.full_name));
end;
$$;

comment on function public.list_handlowcy_for_calculator() is
  'Lista handlowców (profiles.role=handlowiec) dla kalkulatora — wywołanie z klucza anon.';

revoke all on function public.list_handlowcy_for_calculator() from public;
grant execute on function public.list_handlowcy_for_calculator() to anon, authenticated, service_role;
