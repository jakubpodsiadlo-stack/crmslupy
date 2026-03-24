-- Role aplikacji (rozszerzamy w kolejnych krokach)
create type public.app_role as enum (
  'administrator',
  'prezes',
  'dyrektor',
  'backoffice',
  'handlowiec',
  'infolinia',
  'rzeczoznawca',
  'mecenas'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'handlowiec',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatyczny profil po rejestracji (auth.users)
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
    'handlowiec'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

comment on table public.profiles is 'Profil CRM powiązany z auth.users; role domyślnie handlowiec — pierwszego admina ustaw ręcznie w SQL.';
