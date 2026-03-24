-- first_lead — infolinia / pierwszy lead (schemat docelowy).
-- Wymaga wcześniejszej migracji calculator_codes (FK poniżej).
-- FK do calculator_codes: potrzebne do embed calculator_codes(*) w Supabase JS.

create table public.first_lead (
  id uuid not null default gen_random_uuid(),
  calculator_code text null,
  notes text null,
  status text null default 'new'::text,
  created_at timestamptz not null default now(),
  created_by uuid null,
  code_generated_at timestamptz null,
  sales_agent_name text null,
  verification_status text not null default 'niezweryfikowany'::text,
  constraint first_lead_pkey primary key (id),
  constraint first_lead_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null,
  constraint first_lead_calculator_code_fkey
    foreign key (calculator_code) references public.calculator_codes (code) on delete set null,
  constraint first_lead_verification_status_check check (
    verification_status = any (
      array['zweryfikowany'::text, 'niezweryfikowany'::text]
    )
  )
) tablespace pg_default;

comment on table public.first_lead is 'Pierwszy kontakt / lead infolinii; link do calculator_codes.code.';
comment on column public.first_lead.code_generated_at is 'Data i godzina wygenerowania kodu (kalkulator).';
comment on column public.first_lead.sales_agent_name is 'Imię i nazwisko handlowca.';
comment on column public.first_lead.verification_status is 'zweryfikowany | niezweryfikowany (infolinia).';

create index if not exists first_lead_calculator_code_idx
  on public.first_lead using btree (calculator_code) tablespace pg_default
  where calculator_code is not null;

create index if not exists first_lead_created_at_idx
  on public.first_lead using btree (created_at desc) tablespace pg_default;

create index if not exists first_lead_verification_status_idx
  on public.first_lead using btree (verification_status) tablespace pg_default;

create index if not exists first_lead_code_generated_at_idx
  on public.first_lead using btree (code_generated_at desc nulls last) tablespace pg_default;

alter table public.first_lead enable row level security;

create policy "first_lead_select_authenticated"
  on public.first_lead for select
  to authenticated
  using (true);

create policy "first_lead_insert_authenticated"
  on public.first_lead for insert
  to authenticated
  with check (true);

create policy "first_lead_update_authenticated"
  on public.first_lead for update
  to authenticated
  using (true)
  with check (true);

create policy "first_lead_delete_authenticated"
  on public.first_lead for delete
  to authenticated
  using (true);

-- Upgrade (tylko gdy masz starą first_lead z wcześniejszej wersji migracji bez poniższych kolumn):
-- alter table public.first_lead add column if not exists code_generated_at timestamptz;
-- alter table public.first_lead add column if not exists sales_agent_name text;
-- alter table public.first_lead add column if not exists verification_status text not null default 'niezweryfikowany';
-- ... oraz constraint first_lead_verification_status_check + indeksy jak wyżej + opcjonalnie FK calculator_code.
