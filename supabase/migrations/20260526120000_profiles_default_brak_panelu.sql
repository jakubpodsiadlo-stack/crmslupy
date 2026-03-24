-- Nowe konta po rejestracji nie dostają automatycznie panelu operacyjnego.
-- Rola jest nadawana ręcznie przez administratora/prezesa.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'app_role'
      and e.enumlabel = 'brak_panelu'
  ) then
    alter type public.app_role add value 'brak_panelu';
  end if;
end;
$$;

alter table public.profiles
  alter column role set default 'brak_panelu'::public.app_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'brak_panelu'::public.app_role
  );
  return new;
end;
$$;

comment on table public.profiles is
  'Profil CRM powiązany z auth.users; nowe konta dostają rolę brak_panelu do czasu ręcznego przypisania panelu.';
