-- Back office: status weryfikacji BO oraz załączniki (metadane z Cloudinary) na first_lead.

alter table public.first_lead add column if not exists backoffice_status text null;
alter table public.first_lead add column if not exists backoffice_files jsonb null;

update public.first_lead set backoffice_status = 'niezweryfikowany' where backoffice_status is null;

update public.first_lead
set backoffice_files = '[]'::jsonb
where backoffice_files is null;

alter table public.first_lead alter column backoffice_status set default 'niezweryfikowany'::text;
alter table public.first_lead alter column backoffice_status set not null;

alter table public.first_lead alter column backoffice_files set default '[]'::jsonb;
alter table public.first_lead alter column backoffice_files set not null;

alter table public.first_lead drop constraint if exists first_lead_backoffice_status_check;

alter table public.first_lead
  add constraint first_lead_backoffice_status_check check (
    backoffice_status = any (array['niezweryfikowany'::text, 'zweryfikowany'::text])
  );

comment on column public.first_lead.backoffice_status is
  'Po weryfikacji infolinii: niezweryfikowany → do obsługi w BO; zweryfikowany po BO.';
comment on column public.first_lead.backoffice_files is
  'JSON [{ public_id, secure_url, original_filename?, uploaded_at, resource_type? }] — pliki w Cloudinary.';

create index if not exists first_lead_backoffice_status_idx
  on public.first_lead using btree (backoffice_status)
  tablespace pg_default
  where archived_at is not null;
