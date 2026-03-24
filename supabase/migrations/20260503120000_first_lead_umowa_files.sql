-- Pliki umowy (np. załączniki dodawane przy szczegółach umowy przez rzeczoznawcę).
-- Ten sam kształt JSON co backoffice_files: metadane Cloudinary.

alter table public.first_lead add column if not exists umowa_files jsonb null;

update public.first_lead set umowa_files = '[]'::jsonb where umowa_files is null;

alter table public.first_lead alter column umowa_files set default '[]'::jsonb;
alter table public.first_lead alter column umowa_files set not null;

comment on column public.first_lead.umowa_files is
  'JSON [{ public_id, secure_url, original_filename?, resource_type?, format? }] — pliki umowy w Cloudinary (osobno od backoffice_files).';
