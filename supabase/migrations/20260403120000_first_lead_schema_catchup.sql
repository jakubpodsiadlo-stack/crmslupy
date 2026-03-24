-- Jednorazowe uzupełnienie first_lead o kolumny z wcześniejszych migracji (bezpieczne IF NOT EXISTS).
-- Uruchom w Supabase SQL Editor jeśli widzisz: schema cache / column does not exist.

-- Klient (modal)
alter table public.first_lead
  add column if not exists client_full_name text null,
  add column if not exists residence_address text null;

comment on column public.first_lead.client_full_name is 'Imię i nazwisko klienta (infolinia).';
comment on column public.first_lead.residence_address is 'Adres (legacy); prefer residence_street + kod + miasto.';

-- Adres rozbity
alter table public.first_lead
  add column if not exists residence_street text null,
  add column if not exists residence_postal_code text null,
  add column if not exists residence_city text null;

comment on column public.first_lead.residence_street is 'Ulica i numer (infolinia).';
comment on column public.first_lead.residence_postal_code is 'Kod pocztowy.';
comment on column public.first_lead.residence_city is 'Miejscowość.';

alter table public.first_lead drop column if exists residence_country;

-- Weryfikacja: kto / kiedy
alter table public.first_lead
  add column if not exists verified_by uuid null,
  add column if not exists verified_at timestamptz null;

alter table public.first_lead drop constraint if exists first_lead_verified_by_fkey;

alter table public.first_lead
  add constraint first_lead_verified_by_fkey
  foreign key (verified_by) references auth.users (id) on delete set null;

comment on column public.first_lead.verified_by is 'auth.users.id — kto zweryfikował.';
comment on column public.first_lead.verified_at is 'Czas ostatniej weryfikacji.';

create index if not exists first_lead_verified_at_idx
  on public.first_lead using btree (verified_at desc nulls last) tablespace pg_default;

-- Archiwum
alter table public.first_lead add column if not exists archived_at timestamptz null;

comment on column public.first_lead.archived_at is 'NULL = na liście KODY; ustawiane przy weryfikacji (aplikacja); przywrócenie przez NULL.';

create index if not exists first_lead_active_idx
  on public.first_lead using btree (created_at desc) tablespace pg_default
  where archived_at is null;

create index if not exists first_lead_archived_at_idx
  on public.first_lead using btree (archived_at desc nulls last) tablespace pg_default
  where archived_at is not null;
