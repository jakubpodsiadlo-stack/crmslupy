-- Kody z kalkulatora (payload JSON + pola wyceny).
-- Pod infolinię / pierwszy lead — później możesz powiązać z tabelą leadów.

create table public.calculator_codes (
  code text not null,
  payload jsonb not null,
  client_id text null,
  parcel_type text null,
  land_value numeric null,
  pole_type text null,
  pole_length_m numeric null,
  area_km2 numeric null,
  pole_count numeric null,
  water_type text null,
  water_length_m numeric null,
  water_m2 numeric null,
  gas_length_m numeric null,
  gas_type text null,
  water_mk2 numeric null,
  total_price_from numeric null,
  total_price_to numeric null,
  power_price_from numeric null,
  power_price_to numeric null,
  water_price_from numeric null,
  water_price_to numeric null,
  gas_price_from numeric null,
  gas_price_to numeric null,
  updated_at timestamp with time zone null default now(),
  sales_agent_name text null,
  sales_agent_number text null,
  gas_m2 numeric null,
  area_m2 numeric null,
  constraint calculator_codes_pkey primary key (code)
) TABLESPACE pg_default;

comment on table public.calculator_codes is 'Zapisane kody/wyceny z kalkulatora; JSON payload + zdenormalizowane pola pod tabelę / infolinię.';

create index calculator_codes_client_id_idx on public.calculator_codes (client_id) where client_id is not null;
create index calculator_codes_updated_at_idx on public.calculator_codes (updated_at desc);

-- Automatyczne odświeżanie updated_at przy UPDATE
create or replace function public.calculator_codes_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger calculator_codes_set_updated_at
  before update on public.calculator_codes
  for each row
  execute function public.calculator_codes_set_updated_at();

alter table public.calculator_codes enable row level security;

-- Na start: każdy zalogowany może czytać i zapisywać (zaostrzy polityki pod role, gdy będzie first_lead).
create policy "calculator_codes_select_authenticated"
  on public.calculator_codes for select
  to authenticated
  using (true);

create policy "calculator_codes_insert_authenticated"
  on public.calculator_codes for insert
  to authenticated
  with check (true);

create policy "calculator_codes_update_authenticated"
  on public.calculator_codes for update
  to authenticated
  using (true)
  with check (true);

create policy "calculator_codes_delete_authenticated"
  on public.calculator_codes for delete
  to authenticated
  using (true);

-- Tabela first_lead: osobna migracja 20260323140000_first_lead.sql (po calculator_codes).
