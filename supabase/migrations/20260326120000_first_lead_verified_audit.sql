-- Usunięcie pola „kraj” (jeśli było z wcześniejszej wersji migracji adresu).
alter table public.first_lead drop column if exists residence_country;

-- Kto i kiedy ostatnio oznaczył rekord jako zweryfikowany (infolinia).
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
