-- Dane klienta uzupełniane z modala infolinii (Odczyt kodów).

alter table public.first_lead
  add column if not exists client_full_name text null,
  add column if not exists residence_address text null;

comment on column public.first_lead.client_full_name is 'Imię i nazwisko klienta (infolinia).';
comment on column public.first_lead.residence_address is 'Adres zamieszkania klienta (infolinia).';
