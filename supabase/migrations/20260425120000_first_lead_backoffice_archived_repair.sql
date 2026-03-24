-- Uzupełnij datę archiwum BO dla wpisów już „zweryfikowany”, gdzie timestamp był NULL
-- (np. weryfikacja przed wdrożeniem kolumny lub błąd zapisu).

update public.first_lead
set backoffice_archived_at = coalesce(backoffice_archived_at, verified_at, now())
where backoffice_status = 'zweryfikowany'::text;
