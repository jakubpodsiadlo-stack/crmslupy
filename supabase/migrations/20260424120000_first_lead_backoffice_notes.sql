-- Notatka wewnętrzna back office (osobno od infolinii `notes`).

alter table public.first_lead add column if not exists backoffice_notes text null;

comment on column public.first_lead.backoffice_notes is
  'Notatka BO przy umowie (wewnętrzna); pole infolinii to `notes`.';
