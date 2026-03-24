-- Lista rzeczoznawców dla panelu mecenasa (profiles są chronione RLS — tylko „swój” wiersz).
create or replace function public.list_rzeczoznawcy_for_mecenas()
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('mecenas'::public.app_role, 'administrator'::public.app_role)
  ) then
    raise exception 'Brak uprawnień' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    (nullif(trim(coalesce(p.full_name, '')), ''))::text as full_name,
    (nullif(trim(coalesce(p.phone, '')), ''))::text as phone,
    coalesce(u.email, '')::text as email,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.role = 'rzeczoznawca'::public.app_role
  order by lower(trim(coalesce(p.full_name, ''))) nulls last, p.created_at;
end;
$$;

comment on function public.list_rzeczoznawcy_for_mecenas() is
  'Rzeczoznawcy (profiles + email z auth.users) — wyłącznie dla roli mecenas / administrator.';

revoke all on function public.list_rzeczoznawcy_for_mecenas() from public;
grant execute on function public.list_rzeczoznawcy_for_mecenas() to authenticated, service_role;
