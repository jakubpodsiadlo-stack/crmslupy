-- Status obiegu u rzeczoznawcy (tylko sensowny przy BO zweryfikowanym).
alter table public.first_lead add column if not exists rzeczoznawca_status text null;

alter table public.first_lead drop constraint if exists first_lead_rzeczoznawca_status_check;

alter table public.first_lead
  add constraint first_lead_rzeczoznawca_status_check check (
    rzeczoznawca_status is null
    or rzeczoznawca_status = any (
      array[
        'dostarczono'::text,
        'w trakcie weryfikacji'::text,
        'przekazano do kancelarii'::text
      ]
    )
  );

comment on column public.first_lead.rzeczoznawca_status is
  'Obieg rzeczoznawcy: dostarczono | w trakcie weryfikacji | przekazano do kancelarii; dla BO=zweryfikowany domyślnie dostarczono.';

create index if not exists first_lead_rzeczoznawca_status_idx
  on public.first_lead using btree (rzeczoznawca_status)
  where rzeczoznawca_status is not null;

-- Istniejące umowy z gotowym BO: start obiegu
update public.first_lead
set rzeczoznawca_status = 'dostarczono'
where backoffice_status = 'zweryfikowany'
  and rzeczoznawca_status is null;

create or replace function public.first_lead_rzeczoznawca_status_default()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.backoffice_status = 'zweryfikowany'::text and new.rzeczoznawca_status is null then
    new.rzeczoznawca_status := 'dostarczono';
  end if;
  return new;
end;
$$;

drop trigger if exists first_lead_rzeczoznawca_status_default_trg on public.first_lead;

create trigger first_lead_rzeczoznawca_status_default_trg
  before insert or update on public.first_lead
  for each row
  execute function public.first_lead_rzeczoznawca_status_default();
