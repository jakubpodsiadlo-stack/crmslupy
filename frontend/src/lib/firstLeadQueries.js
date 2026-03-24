/**
 * Pobiera first_lead + dopina calculator_codes po kodzie (bez embed PostgREST).
 * @param {{ archived?: boolean, verifiedOnly?: boolean, backofficeActive?: boolean, backofficeArchived?: boolean }} options
 *   — archived=true: zarchiwizowane (infolinia); verifiedOnly: tylko verification_status = zweryfikowany;
 *   — backofficeActive: kolejka BO (backoffice_status = niezweryfikowany); backofficeArchived: archiwum BO (= zweryfikowany).
 */
function archivedColumnMissingFromError(err) {
  if (!err) return false
  const blob = [err.message, err.details, err.hint, String(err.code ?? '')].filter(Boolean).join(' ')
  return /archived_at/i.test(blob) && (/does not exist|42703|undefined column|nie istnieje/i.test(blob) || String(err.code) === '42703')
}

function verificationStatusColumnMissingFromError(err) {
  if (!err) return false
  const blob = [err.message, err.details, err.hint, String(err.code ?? '')].filter(Boolean).join(' ')
  return (
    /verification_status/i.test(blob) &&
    (/does not exist|42703|undefined column|schema cache|nie istnieje/i.test(blob) || String(err.code) === '42703')
  )
}

export async function fetchFirstLeadsWithCalculator(supabase, options = {}) {
  const archived = Boolean(options.archived)
  const verifiedOnly = Boolean(options.verifiedOnly)
  const backofficeActive = Boolean(options.backofficeActive)
  const backofficeArchived = Boolean(options.backofficeArchived)
  let usedArchivedFallback = false
  let skipVerifiedEq = false

  const orderCol = backofficeArchived ? 'verified_at' : archived ? 'archived_at' : 'created_at'

  function buildQuery() {
    let q = supabase.from('first_lead').select('*')
    q = archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null)
    if (verifiedOnly && !skipVerifiedEq) q = q.eq('verification_status', 'zweryfikowany')
    if (backofficeActive) q = q.eq('backoffice_status', 'niezweryfikowany')
    if (backofficeArchived) q = q.eq('backoffice_status', 'zweryfikowany')
    return q.order(orderCol, { ascending: false })
  }

  let { data: leads, error: errLeads } = await buildQuery()

  if (errLeads && verifiedOnly && verificationStatusColumnMissingFromError(errLeads)) {
    skipVerifiedEq = true
    ;({ data: leads, error: errLeads } = await buildQuery())
  }

  if (errLeads && archivedColumnMissingFromError(errLeads)) {
    usedArchivedFallback = true
    const r = await supabase.from('first_lead').select('*').order('created_at', { ascending: false })
    leads = r.data
    errLeads = r.error
  }

  if (errLeads) {
    return { rows: [], error: errLeads, mergeWarning: null }
  }

  let list = leads ?? []
  if (usedArchivedFallback) {
    list = list.filter((r) => (archived ? Boolean(r.archived_at) : !r.archived_at))
    if (archived) {
      list = [...list].sort((a, b) => {
        const ta = a.archived_at ? new Date(a.archived_at).getTime() : 0
        const tb = b.archived_at ? new Date(b.archived_at).getTime() : 0
        return tb - ta
      })
    }
  }

  if (verifiedOnly) {
    list = list.filter((r) => r.verification_status === 'zweryfikowany')
  }

  if (backofficeActive) {
    list = list.filter((r) => r.backoffice_status !== 'zweryfikowany')
  }
  if (backofficeArchived) {
    list = list.filter((r) => r.backoffice_status === 'zweryfikowany')
    list = [...list].sort((a, b) => {
      const ta = a.backoffice_archived_at ? new Date(a.backoffice_archived_at).getTime() : 0
      const tb = b.backoffice_archived_at ? new Date(b.backoffice_archived_at).getTime() : 0
      if (tb !== ta) return tb - ta
      const va = a.verified_at ? new Date(a.verified_at).getTime() : 0
      const vb = b.verified_at ? new Date(b.verified_at).getTime() : 0
      return vb - va
    })
  }

  const codes = [
    ...new Set(
      list.map((r) => (r.calculator_code != null ? String(r.calculator_code) : '')).filter(Boolean),
    ),
  ]

  const archiveHint =
    usedArchivedFallback &&
    'Brak kolumny archived_at w tabeli first_lead. W Supabase: SQL Editor → migracja (np. 20260403120000_first_lead_schema_catchup.sql). Bez tego po weryfikacji zapis się nie powiedzie; lista KODY pokaże na razie wszystkie wpisy.'

  const mergeHints = archiveHint || null

  if (codes.length === 0) {
    return {
      rows: list.map((r) => ({ ...r, calculator_codes: null })),
      error: null,
      mergeWarning: mergeHints,
    }
  }

  const { data: ccRows, error: errCc } = await supabase.from('calculator_codes').select('*').in('code', codes)

  if (errCc) {
    console.warn('[first_lead] calculator_codes:', errCc.message)
    const calcWarn =
      'Nie udało się wczytać powiązanego kalkulatora (sprawdź RLS lub tabelę calculator_codes). Kody są widoczne bez szczegółów z kalkulatora.'
    return {
      rows: list.map((r) => ({ ...r, calculator_codes: null })),
      error: null,
      mergeWarning: [mergeHints, calcWarn].filter(Boolean).join('\n\n') || null,
    }
  }

  const byCode = Object.fromEntries((ccRows ?? []).map((c) => [String(c.code), c]))

  return {
    rows: list.map((r) => ({
      ...r,
      calculator_codes: r.calculator_code != null ? byCode[String(r.calculator_code)] ?? null : null,
    })),
    error: null,
    mergeWarning: mergeHints,
  }
}

/**
 * Liczniki pod pulpit BO — zgodne z zakładkami „Umowy”:
 * - active: zweryfikowane przez infolinię, w kolejce BO (archiwum infolinii + BO niezweryfikowany),
 * - pendingAcceptance: przed weryfikacją infolinii, nadal w kolejce BO (lista kodów + BO niezweryfikowany).
 * @returns {{ activeCount: number, pendingAcceptanceCount: number, error: object | null }}
 */
export async function countBackOfficeUmowyPipeline(supabase) {
  const qActive = () =>
    supabase
      .from('first_lead')
      .select('id', { count: 'exact', head: true })
      .not('archived_at', 'is', null)
      .eq('verification_status', 'zweryfikowany')
      .eq('backoffice_status', 'niezweryfikowany')

  const qPending = () =>
    supabase
      .from('first_lead')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null)
      .eq('backoffice_status', 'niezweryfikowany')
      .or('verification_status.is.null,verification_status.eq.niezweryfikowany')

  let { count: activeCount, error: errActive } = await qActive()

  if (errActive && verificationStatusColumnMissingFromError(errActive)) {
    ;({ count: activeCount, error: errActive } = await supabase
      .from('first_lead')
      .select('id', { count: 'exact', head: true })
      .not('archived_at', 'is', null)
      .eq('backoffice_status', 'niezweryfikowany'))
  }

  if (errActive) {
    return { activeCount: 0, pendingAcceptanceCount: 0, error: errActive }
  }

  let { count: pendingCount, error: errPending } = await qPending()

  if (errPending && verificationStatusColumnMissingFromError(errPending)) {
    ;({ count: pendingCount, error: errPending } = await supabase
      .from('first_lead')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null)
      .eq('backoffice_status', 'niezweryfikowany'))
  }

  if (errPending) {
    return {
      activeCount: activeCount ?? 0,
      pendingAcceptanceCount: 0,
      error: errPending,
    }
  }

  return {
    activeCount: activeCount ?? 0,
    pendingAcceptanceCount: pendingCount ?? 0,
    error: null,
  }
}

export function formatSupabaseError(error) {
  if (!error) return ''
  const bits = [error.message || 'Błąd Supabase']
  if (error.code) bits.push(`[${error.code}]`)
  if (error.details) bits.push(error.details)
  if (error.hint) bits.push(`→ ${error.hint}`)
  return bits.join(' ')
}

/** PostgREST: brak kolumny w cache — po migracji SQL warto przeładować schemat w panelu Supabase. */
export function formatFirstLeadSchemaError(error) {
  const base = formatSupabaseError(error)
  const blob = [error?.message, error?.details, String(error?.hint ?? '')].join(' ')
  if (/schema cache|could not find the .* column|column.*does not exist|42703/i.test(blob)) {
    return `${base}

→ Dodaj brakujące kolumny: Supabase → SQL Editor → migracje m.in. 20260423120000_first_lead_backoffice.sql, 20260424130000_first_lead_backoffice_archived.sql, 20260425120000_first_lead_backoffice_archived_repair.sql (uzupełnia datę archiwum dla już zweryfikowanych).
→ Potem: Project Settings → Data API → „Reload schema” / odśwież cache (albo odczekaj ok. 1 min).`
  }
  return base
}
