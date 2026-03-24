-- Odpowiedniki wszystkich zdenormalizowanych pól z public.calculator_codes na first_lead,
-- z prefiksem rzeczoznawca_ (wartości wprowadzane przez rzeczoznawcę; nie nadpisują calculator_codes).
-- Pole code (PK kalkulatora) pominięte — lead ma calculator_code.
-- Typy jak w 20260323130000_calculator_codes.sql.

alter table public.first_lead
  add column if not exists rzeczoznawca_payload jsonb null,
  add column if not exists rzeczoznawca_client_id text null,
  add column if not exists rzeczoznawca_parcel_type text null,
  add column if not exists rzeczoznawca_land_value numeric null,
  add column if not exists rzeczoznawca_pole_type text null,
  add column if not exists rzeczoznawca_pole_length_m numeric null,
  add column if not exists rzeczoznawca_area_km2 numeric null,
  add column if not exists rzeczoznawca_pole_count numeric null,
  add column if not exists rzeczoznawca_water_type text null,
  add column if not exists rzeczoznawca_water_length_m numeric null,
  add column if not exists rzeczoznawca_water_m2 numeric null,
  add column if not exists rzeczoznawca_gas_length_m numeric null,
  add column if not exists rzeczoznawca_gas_type text null,
  add column if not exists rzeczoznawca_water_mk2 numeric null,
  add column if not exists rzeczoznawca_total_price_from numeric null,
  add column if not exists rzeczoznawca_total_price_to numeric null,
  add column if not exists rzeczoznawca_power_price_from numeric null,
  add column if not exists rzeczoznawca_power_price_to numeric null,
  add column if not exists rzeczoznawca_water_price_from numeric null,
  add column if not exists rzeczoznawca_water_price_to numeric null,
  add column if not exists rzeczoznawca_gas_price_from numeric null,
  add column if not exists rzeczoznawca_gas_price_to numeric null,
  add column if not exists rzeczoznawca_updated_at timestamptz null,
  add column if not exists rzeczoznawca_sales_agent_name text null,
  add column if not exists rzeczoznawca_sales_agent_number text null,
  add column if not exists rzeczoznawca_gas_m2 numeric null,
  add column if not exists rzeczoznawca_area_m2 numeric null;

comment on column public.first_lead.rzeczoznawca_payload is
  'Opcjonalny pełny JSON (jak payload w calculator_codes) — snapshot po stronie rzeczoznawcy.';
comment on column public.first_lead.rzeczoznawca_client_id is 'Odpowiednik client_id z kalkulatora.';
comment on column public.first_lead.rzeczoznawca_parcel_type is 'Typ działki (od rzeczoznawcy).';
comment on column public.first_lead.rzeczoznawca_land_value is 'Wartość gruntu.';
comment on column public.first_lead.rzeczoznawca_pole_type is 'Typ słupa.';
comment on column public.first_lead.rzeczoznawca_pole_length_m is 'Długość linii (m).';
comment on column public.first_lead.rzeczoznawca_area_km2 is 'Powierzchnia (km²).';
comment on column public.first_lead.rzeczoznawca_pole_count is 'Liczba słupów.';
comment on column public.first_lead.rzeczoznawca_water_type is 'Typ wody.';
comment on column public.first_lead.rzeczoznawca_water_length_m is 'Woda — długość (m).';
comment on column public.first_lead.rzeczoznawca_water_m2 is 'Woda (m²).';
comment on column public.first_lead.rzeczoznawca_gas_length_m is 'Gaz — długość (m).';
comment on column public.first_lead.rzeczoznawca_gas_type is 'Typ gazu.';
comment on column public.first_lead.rzeczoznawca_water_mk2 is 'Woda mk2.';
comment on column public.first_lead.rzeczoznawca_total_price_from is 'Cena całkowita — od.';
comment on column public.first_lead.rzeczoznawca_total_price_to is 'Cena całkowita — do.';
comment on column public.first_lead.rzeczoznawca_power_price_from is 'Energia — cena od.';
comment on column public.first_lead.rzeczoznawca_power_price_to is 'Energia — cena do.';
comment on column public.first_lead.rzeczoznawca_water_price_from is 'Woda — cena od.';
comment on column public.first_lead.rzeczoznawca_water_price_to is 'Woda — cena do.';
comment on column public.first_lead.rzeczoznawca_gas_price_from is 'Gaz — cena od.';
comment on column public.first_lead.rzeczoznawca_gas_price_to is 'Gaz — cena do.';
comment on column public.first_lead.rzeczoznawca_updated_at is 'Czas ostatniej zmiany wyceny rzeczoznawcy.';
comment on column public.first_lead.rzeczoznawca_sales_agent_name is 'Handlowiec (jak w kalkulatorze).';
comment on column public.first_lead.rzeczoznawca_sales_agent_number is 'Numer handlowca.';
comment on column public.first_lead.rzeczoznawca_gas_m2 is 'Gaz (m²).';
comment on column public.first_lead.rzeczoznawca_area_m2 is 'Powierzchnia (m²).';

-- Backfill z rzeczoznawca_fields (jsonb) — bezpieczne rzutowanie liczb.
create or replace function public._migrate_rzecz_fields_txt_to_num(p_text text)
returns numeric
language plpgsql
immutable
as $$
declare
  t text;
begin
  if p_text is null then
    return null;
  end if;
  t := trim(p_text);
  if t = '' then
    return null;
  end if;
  t := replace(replace(t, ',', '.'), ' ', '');
  return t::numeric;
exception
  when others then
    return null;
end;
$$;

-- Backfill tylko gdy istnieje kolumna rzeczoznawca_fields (migracja 20260430120000); inaczej pomijamy bez błędu.
do $migrate$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'first_lead'
      and c.column_name = 'rzeczoznawca_fields'
  ) then
    update public.first_lead fl
    set
      rzeczoznawca_client_id = coalesce(fl.rzeczoznawca_client_id, nullif(trim(fl.rzeczoznawca_fields ->> 'client_id'), '')),
      rzeczoznawca_parcel_type = coalesce(fl.rzeczoznawca_parcel_type, nullif(trim(fl.rzeczoznawca_fields ->> 'parcel_type'), '')),
      rzeczoznawca_land_value = coalesce(fl.rzeczoznawca_land_value, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'land_value')),
      rzeczoznawca_pole_type = coalesce(fl.rzeczoznawca_pole_type, nullif(trim(fl.rzeczoznawca_fields ->> 'pole_type'), '')),
      rzeczoznawca_pole_length_m = coalesce(fl.rzeczoznawca_pole_length_m, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'pole_length_m')),
      rzeczoznawca_area_km2 = coalesce(fl.rzeczoznawca_area_km2, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'area_km2')),
      rzeczoznawca_pole_count = coalesce(fl.rzeczoznawca_pole_count, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'pole_count')),
      rzeczoznawca_water_type = coalesce(fl.rzeczoznawca_water_type, nullif(trim(fl.rzeczoznawca_fields ->> 'water_type'), '')),
      rzeczoznawca_water_length_m = coalesce(fl.rzeczoznawca_water_length_m, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'water_length_m')),
      rzeczoznawca_water_m2 = coalesce(fl.rzeczoznawca_water_m2, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'water_m2')),
      rzeczoznawca_gas_length_m = coalesce(fl.rzeczoznawca_gas_length_m, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'gas_length_m')),
      rzeczoznawca_gas_type = coalesce(fl.rzeczoznawca_gas_type, nullif(trim(fl.rzeczoznawca_fields ->> 'gas_type'), '')),
      rzeczoznawca_water_mk2 = coalesce(fl.rzeczoznawca_water_mk2, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'water_mk2')),
      rzeczoznawca_total_price_from = coalesce(fl.rzeczoznawca_total_price_from, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'total_price_from')),
      rzeczoznawca_total_price_to = coalesce(fl.rzeczoznawca_total_price_to, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'total_price_to')),
      rzeczoznawca_power_price_from = coalesce(fl.rzeczoznawca_power_price_from, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'power_price_from')),
      rzeczoznawca_power_price_to = coalesce(fl.rzeczoznawca_power_price_to, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'power_price_to')),
      rzeczoznawca_water_price_from = coalesce(fl.rzeczoznawca_water_price_from, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'water_price_from')),
      rzeczoznawca_water_price_to = coalesce(fl.rzeczoznawca_water_price_to, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'water_price_to')),
      rzeczoznawca_gas_price_from = coalesce(fl.rzeczoznawca_gas_price_from, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'gas_price_from')),
      rzeczoznawca_gas_price_to = coalesce(fl.rzeczoznawca_gas_price_to, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'gas_price_to')),
      rzeczoznawca_sales_agent_name = coalesce(fl.rzeczoznawca_sales_agent_name, nullif(trim(fl.rzeczoznawca_fields ->> 'sales_agent_name'), '')),
      rzeczoznawca_sales_agent_number = coalesce(fl.rzeczoznawca_sales_agent_number, nullif(trim(fl.rzeczoznawca_fields ->> 'sales_agent_number'), '')),
      rzeczoznawca_gas_m2 = coalesce(fl.rzeczoznawca_gas_m2, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'gas_m2')),
      rzeczoznawca_area_m2 = coalesce(fl.rzeczoznawca_area_m2, public._migrate_rzecz_fields_txt_to_num(fl.rzeczoznawca_fields ->> 'area_m2'))
    where
      fl.rzeczoznawca_fields is not null
      and fl.rzeczoznawca_fields <> '{}'::jsonb;
  end if;
end;
$migrate$;

drop function if exists public._migrate_rzecz_fields_txt_to_num(text);

-- Opcjonalnie: po przełączeniu aplikacji na kolumny rzeczoznawca_*:
-- alter table public.first_lead drop column if exists rzeczoznawca_fields;
