-- Po każdym INSERT do calculator_codes tworzy od razu wiersz w first_lead (bez drugiego żądania z przeglądarki).
-- SECURITY DEFINER — zapis do first_lead nie zależy od RLS dla roli anon.
-- Uruchom w Supabase → SQL Editor.

create or replace function public.trg_calculator_codes_to_first_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.first_lead (
    calculator_code,
    sales_agent_name,
    code_generated_at,
    notes
  )
  values (
    new.code,
    new.sales_agent_name,
    coalesce(new.updated_at, now()),
    case
      when new.sales_agent_number is not null and trim(new.sales_agent_number) <> ''
      then 'Nr handlowca: ' || trim(new.sales_agent_number)
      else null
    end
  );
  return new;
end;
$$;

drop trigger if exists calculator_codes_after_insert_first_lead on public.calculator_codes;

create trigger calculator_codes_after_insert_first_lead
  after insert on public.calculator_codes
  for each row
  execute function public.trg_calculator_codes_to_first_lead();

comment on function public.trg_calculator_codes_to_first_lead() is
  'Tworzy wpis first_lead przy pierwszym zapisie kodu (INSERT do calculator_codes).';
