-- Wycena wprowadzona przez rzeczoznawcę (osobno od calculator_codes / infolinii).
-- Klucze w JSON jak w calculator_codes: parcel_type, total_price_from, water_price_to, area_m2, …

alter table public.first_lead add column if not exists rzeczoznawca_fields jsonb not null default '{}'::jsonb;

comment on column public.first_lead.rzeczoznawca_fields is
  'Wartości od rzeczoznawcy (wycena). Klucze zgodne z polami kalkulatora: typ działki, ceny od–do, powierzchnie itd.';
