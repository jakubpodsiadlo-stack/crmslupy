const PREFIX = 'fl_modal_v1:'

/** @typedef {{ leadId: string, boTab?: string, rzeczoznawcaModalTab?: string, variant?: string, restoreOnReload?: boolean }} FirstLeadModalSessionPayload */

/**
 * @param {string} scope — np. pathname z useLocation()
 */
export function readModalSession(scope) {
  if (typeof window === 'undefined' || !scope) return null
  try {
    const raw = sessionStorage.getItem(PREFIX + scope)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (!o || typeof o.leadId !== 'string' || o.leadId.trim() === '') return null
    return o
  } catch {
    return null
  }
}

/**
 * @param {string} scope
 * @param {FirstLeadModalSessionPayload} payload
 */
export function writeModalSession(scope, payload) {
  if (typeof window === 'undefined' || !scope || !payload?.leadId) return
  try {
    sessionStorage.setItem(PREFIX + scope, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function clearModalSession(scope) {
  if (typeof window === 'undefined' || !scope) return
  try {
    sessionStorage.removeItem(PREFIX + scope)
  } catch {
    /* ignore */
  }
}

/**
 * Przywraca wiersz leada z sesji (po odświeżeniu), jeśli jest na liście.
 * @param {string} scope
 * @param {unknown[]} rows
 * @returns {unknown | null}
 */
export function pickLeadRowFromModalSession(scope, rows) {
  const snap = readModalSession(scope)
  if (!snap?.leadId || snap.restoreOnReload !== true || !Array.isArray(rows)) return null
  // One-shot restore: after successful hydration do not reopen modal on next refresh.
  clearModalSession(scope)
  return rows.find((r) => r && r.id === snap.leadId) ?? null
}
