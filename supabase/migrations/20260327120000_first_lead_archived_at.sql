-- Archiwum: rekordy z ustawionym archived_at nie pokazują się na liście „KODY”; można przywrócić (NULL).

alter table public.first_lead add column if not exists archived_at timestamptz null;

comment on column public.first_lead.archived_at is 'NULL = aktywny na liście kodów; ustawione = archiwum (przywrócenie przez NULL).';

create index if not exists first_lead_active_idx
  on public.first_lead using btree (created_at desc) tablespace pg_default
  where archived_at is null;

create index if not exists first_lead_archived_at_idx
  on public.first_lead using btree (archived_at desc nulls last) tablespace pg_default
  where archived_at is not null;
