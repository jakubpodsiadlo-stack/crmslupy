-- =============================================================================
-- calculator_codes — naprawa 42501 (RLS)
-- Supabase → SQL Editor → wklej CAŁOŚĆ → Run
-- =============================================================================
-- Jeśli nadal błąd: wykonaj najpierw diagnostykę (na dole pliku) i sprawdź wynik.
-- =============================================================================

-- 1) Uprawnienia do tabeli (bez tego czasem API zwraca błędy dostępu / dziwne RLS)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.calculator_codes to anon, authenticated;

-- 2) Usuń WSZYSTKIE istniejące polityki na tej tabeli (stare / restrictive mogą blokować)
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'calculator_codes'
  loop
    execute format('drop policy if exists %I on public.calculator_codes', r.policyname);
  end loop;
end $$;

-- 3) RLS włączone
alter table public.calculator_codes enable row level security;

-- 4) Jedna polityka FOR ALL na rolę (SELECT + INSERT + UPDATE + DELETE — upsert OK)
create policy "calculator_codes_anon_all"
  on public.calculator_codes
  as permissive
  for all
  to anon
  using (true)
  with check (true);

create policy "calculator_codes_authenticated_all"
  on public.calculator_codes
  as permissive
  for all
  to authenticated
  using (true)
  with check (true);

-- =============================================================================
-- DIAGNOSTYKA (opcjonalnie — osobne uruchomienie, zobacz wynik w zakładce Results)
-- =============================================================================
-- select policyname, permissive, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'calculator_codes';
