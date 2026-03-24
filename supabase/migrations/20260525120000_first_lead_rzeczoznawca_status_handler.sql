-- Kto ostatnio zmienił status obiegu u rzeczoznawcy (powiązanie ze zgłoszeniem).
-- Wypełniane automatycznie w triggerze przy każdej zmianie kolumny rzeczoznawca_status.

alter table public.first_lead
  add column if not exists rzeczoznawca_status_updated_by uuid null references auth.users (id) on delete set null;

alter table public.first_lead
  add column if not exists rzeczoznawca_status_updated_at timestamptz null;

comment on column public.first_lead.rzeczoznawca_status_updated_by is
  'auth.users.id — ostatni użytkownik, który zmienił rzeczoznawca_status (panel rzeczoznawcy).';

comment on column public.first_lead.rzeczoznawca_status_updated_at is
  'Czas ostatniej zmiany rzeczoznawca_status.';

create index if not exists first_lead_rzecz_status_updated_by_idx
  on public.first_lead using btree (rzeczoznawca_status_updated_by)
  where rzeczoznawca_status_updated_by is not null;

-- Jedna funkcja BEFORE INSERT OR UPDATE: najpierw domyślny status przy BO, potem audyt zmiany statusu.
create or replace function public.first_lead_rzeczoznawca_status_default()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.backoffice_status = 'zweryfikowany'::text and new.rzeczoznawca_status is null then
    new.rzeczoznawca_status := 'dostarczono';
  end if;

  if tg_op = 'UPDATE' then
    if new.rzeczoznawca_status is distinct from old.rzeczoznawca_status then
      new.rzeczoznawca_status_updated_at := now();
      new.rzeczoznawca_status_updated_by := auth.uid();
    end if;
  elsif tg_op = 'INSERT' then
    -- Pierwsze ustawienie statusu przy wstawieniu (np. już z wartością lub po ustawieniu powyżej).
    if new.rzeczoznawca_status is not null then
      new.rzeczoznawca_status_updated_at := now();
      new.rzeczoznawca_status_updated_by := auth.uid();
    end if;
  end if;

  return new;
end;
$$;

comment on function public.first_lead_rzeczoznawca_status_default() is
  'Domyślny rzeczoznawca_status przy BO zweryfikowanym; zapisuje kto i kiedy zmienił status (auth.uid()).';
