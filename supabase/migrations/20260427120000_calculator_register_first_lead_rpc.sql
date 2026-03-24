-- Wpis first_lead po zapisie kodu z kalkulatora (anon). RLS na first_lead = tylko authenticated.
create or replace function public.calculator_register_first_lead(
  p_code text,
  p_sales_agent_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_id uuid;
begin
  v_code := trim(coalesce(p_code, ''));
  if v_code = '' then
    raise exception 'code required';
  end if;

  if not exists (select 1 from public.calculator_codes c where c.code = v_code) then
    raise exception 'calculator code not found';
  end if;

  select fl.id into v_id
  from public.first_lead fl
  where fl.calculator_code = v_code
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.first_lead (
    calculator_code,
    sales_agent_name,
    code_generated_at,
    verification_status,
    notes,
    created_by
  )
  values (
    v_code,
    nullif(trim(coalesce(p_sales_agent_name, '')), ''),
    now(),
    'niezweryfikowany',
    null,
    null
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.calculator_register_first_lead(text, text) is
  'Tworzy first_lead dla kodu z kalkulatora (jeśli jeszcze nie istnieje). Wymaga wiersza w calculator_codes.';

revoke all on function public.calculator_register_first_lead(text, text) from public;
grant execute on function public.calculator_register_first_lead(text, text) to anon, authenticated;
