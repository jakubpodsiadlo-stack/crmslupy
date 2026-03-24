-- Operator sieci z wyceny rzeczoznawcy: odpowiedniki kluczy JSON
-- rzeczoznawca_fields->>'network_operator' i 'network_operator_other'.
-- Aplikacja zapisuje nadal głównie jsonb rzeczoznawca_fields; te kolumny służą
-- raportom / indeksom i są uzupełniane przy migracji (backfill).

alter table public.first_lead
  add column if not exists rzeczoznawca_network_operator text null,
  add column if not exists rzeczoznawca_network_operator_other text null;

comment on column public.first_lead.rzeczoznawca_network_operator is
  'Operator sieci (wartość z listy lub „inne”) — lustrzane z rzeczoznawca_fields.network_operator.';
comment on column public.first_lead.rzeczoznawca_network_operator_other is
  'Własna nazwa operatora przy wyborze „inne” — lustrzane z rzeczoznawca_fields.network_operator_other.';

do $migrate$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'first_lead'
      and c.column_name = 'rzeczoznawca_fields'
  ) then
    update public.first_lead fl
    set
      rzeczoznawca_network_operator = coalesce(
        fl.rzeczoznawca_network_operator,
        nullif(trim(fl.rzeczoznawca_fields ->> 'network_operator'), '')
      ),
      rzeczoznawca_network_operator_other = coalesce(
        fl.rzeczoznawca_network_operator_other,
        nullif(trim(fl.rzeczoznawca_fields ->> 'network_operator_other'), '')
      )
    where
      fl.rzeczoznawca_fields is not null
      and fl.rzeczoznawca_fields <> '{}'::jsonb
      and (
        nullif(trim(fl.rzeczoznawca_fields ->> 'network_operator'), '') is not null
        or nullif(trim(fl.rzeczoznawca_fields ->> 'network_operator_other'), '') is not null
      );
  end if;
end;
$migrate$;
