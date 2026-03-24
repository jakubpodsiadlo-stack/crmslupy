import { getAgentDisplay, getCodeTimestamp, isBackofficeVerifiedForHandlowiecPoints } from './firstLeadDisplay'
import { fetchFirstLeadsWithCalculator } from './firstLeadQueries'

function normalizeAgentLabel(s) {
  if (s == null || typeof s !== 'string') return ''
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Czy wiersz first_lead (z ewentualnym calculator_codes) jest przypisany do handlowca po nazwie z profilu.
 */
export function leadMatchesSalesAgent(row, profileFullName) {
  const needle = normalizeAgentLabel(profileFullName)
  if (!needle) return false
  const disp = getAgentDisplay(row)
  if (!disp?.trim()) return false
  const hay = normalizeAgentLabel(disp)
  if (hay === needle) return true
  if (hay.includes(needle) || needle.includes(hay)) return true
  return false
}

/**
 * Wszystkie leady (aktywne + archiwum infolinii) przypisane do handlowca wg sales_agent_name / kalkulator / notatki.
 */
export async function fetchLeadsForSalesAgent(supabase, profileFullName) {
  const needle = normalizeAgentLabel(profileFullName)
  if (!needle) {
    return {
      rows: [],
      error: null,
      mergeWarning:
        'Uzupełnij imię i nazwisko w profilu (Ustawienia konta / baza profiles.full_name), żeby dopasować kody — musi być zgodne z polem handlowiec w leadzie.',
    }
  }

  const [active, arch] = await Promise.all([
    fetchFirstLeadsWithCalculator(supabase, { archived: false }),
    fetchFirstLeadsWithCalculator(supabase, { archived: true }),
  ])

  if (active.error) {
    return { rows: [], error: active.error, mergeWarning: active.mergeWarning }
  }
  if (arch.error) {
    return { rows: [], error: arch.error, mergeWarning: arch.mergeWarning }
  }

  const byId = new Map()
  for (const r of [...(active.rows ?? []), ...(arch.rows ?? [])]) {
    if (r?.id && !byId.has(r.id)) byId.set(r.id, r)
  }

  const merged = [...byId.values()].filter((r) => leadMatchesSalesAgent(r, profileFullName))
  merged.sort((a, b) => {
    const ta = new Date(getCodeTimestamp(a) || 0).getTime()
    const tb = new Date(getCodeTimestamp(b) || 0).getTime()
    return tb - ta
  })

  const mergeWarning = [active.mergeWarning, arch.mergeWarning].filter(Boolean).join('\n\n') || null

  return { rows: merged, error: null, mergeWarning }
}

/**
 * Wszystkie leady (aktywne + archiwum infolinii) — np. podgląd dyrektora.
 * @param {{ backofficeVerifiedOnly?: boolean }} [options] — jeśli true, tylko umowy ze statusem BO „zweryfikowany” (gotowe).
 */
export async function fetchAllLeadsMerged(supabase, options = {}) {
  const backofficeVerifiedOnly = Boolean(options.backofficeVerifiedOnly)

  const [active, arch] = await Promise.all([
    fetchFirstLeadsWithCalculator(supabase, { archived: false }),
    fetchFirstLeadsWithCalculator(supabase, { archived: true }),
  ])

  if (active.error) {
    return { rows: [], error: active.error, mergeWarning: active.mergeWarning }
  }
  if (arch.error) {
    return { rows: [], error: arch.error, mergeWarning: arch.mergeWarning }
  }

  const byId = new Map()
  for (const r of [...(active.rows ?? []), ...(arch.rows ?? [])]) {
    if (r?.id && !byId.has(r.id)) byId.set(r.id, r)
  }

  let merged = [...byId.values()]
  if (backofficeVerifiedOnly) {
    merged = merged.filter((r) => isBackofficeVerifiedForHandlowiecPoints(r))
  }
  merged.sort((a, b) => {
    const ta = new Date(getCodeTimestamp(a) || 0).getTime()
    const tb = new Date(getCodeTimestamp(b) || 0).getTime()
    return tb - ta
  })

  const mergeWarning = [active.mergeWarning, arch.mergeWarning].filter(Boolean).join('\n\n') || null

  return { rows: merged, error: null, mergeWarning }
}
