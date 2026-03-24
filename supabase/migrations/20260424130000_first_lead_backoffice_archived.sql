-- Archiwum back office: po weryfikacji BO wpis znika z listy „Umowy” i trafia tu (osobno od archiwum infolinii).

alter table public.first_lead add column if not exists backoffice_archived_at timestamptz null;

comment on column public.first_lead.backoffice_archived_at is
  'NULL = umowa w obiegu BO; ustawiane przy „zweryfikowany (BO)” — wpis na liście archiwum BO.';

create index if not exists first_lead_backoffice_archived_at_idx
  on public.first_lead using btree (backoffice_archived_at desc nulls last) tablespace pg_default
  where backoffice_archived_at is not null;

-- Wcześniej zweryfikowane w BO bez daty archiwum
update public.first_lead
set backoffice_archived_at = coalesce(verified_at, now())
where backoffice_status = 'zweryfikowany'::text
  and backoffice_archived_at is null;
