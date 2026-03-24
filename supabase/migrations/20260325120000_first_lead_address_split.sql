-- Rozbicie adresu zamieszkania na pola (infolinia). Kolumna residence_address zostaje dla starych danych.

alter table public.first_lead
  add column if not exists residence_street text null,
  add column if not exists residence_postal_code text null,
  add column if not exists residence_city text null;

comment on column public.first_lead.residence_street is 'Ulica i numer (adres klienta, infolinia).';
comment on column public.first_lead.residence_postal_code is 'Kod pocztowy.';
comment on column public.first_lead.residence_city is 'Miejscowość.';
