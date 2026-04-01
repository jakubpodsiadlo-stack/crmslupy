-- Po naprawie calculator_codes — ten sam błąd może pojawić się na first_lead

alter table public.first_lead enable row level security;

drop policy if exists "first_lead_anon_insert" on public.first_lead;
create policy "first_lead_anon_insert"
  on public.first_lead
  for insert
  to anon
  with check (true);

-- Opcjonalnie: odczyt z aplikacji (jeśli kiedyś będzie lista leadów)
drop policy if exists "first_lead_anon_select" on public.first_lead;
create policy "first_lead_anon_select"
  on public.first_lead
  for select
  to anon
  using (true);
