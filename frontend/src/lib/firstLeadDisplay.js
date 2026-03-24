/** Wyciąga fragment po "Nr handlowca:" / "Handlowca:" z notatek (gdy brak kolumny sales_agent_name). */
export function parseHandlowiecFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return null
  const m = notes.match(/(?:Nr handlowca|Handlowca)\s*:\s*(.+)/i)
  return m ? m[1].trim() : null
}

export function getAgentDisplay(row) {
  const a = row.sales_agent_name?.trim()
  if (a) return a
  const b = row.calculator_codes?.sales_agent_name?.trim()
  if (b) return b
  return parseHandlowiecFromNotes(row.notes) || null
}

/** Etykieta weryfikacji — kolumna verification_status albo heurystyka ze status. */
export function getVerificationLabel(row) {
  const v = row.verification_status
  if (v === 'zweryfikowany' || v === 'niezweryfikowany') return v
  if (row.status === 'zweryfikowany') return 'zweryfikowany'
  return 'niezweryfikowany'
}

export function getCodeTimestamp(row) {
  return row.code_generated_at || row.created_at
}

/** Czy w odpowiedzi API jest kolumna verification_status (wtedy działa przełącznik w modalu). */
export function hasVerificationColumn(row) {
  return row != null && Object.prototype.hasOwnProperty.call(row, 'verification_status')
}

/** Status weryfikacji back office (osobny od infolinii). */
export function getBackofficeStatusLabel(row) {
  const v = row?.backoffice_status
  if (v === 'zweryfikowany' || v === 'niezweryfikowany') return v
  return 'niezweryfikowany'
}

/** Umowa liczy się do punktów handlowca po pełnej weryfikacji BO. */
export function isBackofficeVerifiedForHandlowiecPoints(row) {
  return row?.backoffice_status === 'zweryfikowany'
}

/** Dozwolone wartości kolumny first_lead.rzeczoznawca_status (jak w CHECK w migracji). */
export const RZECZOZNAWCA_STATUS_OPTIONS = Object.freeze([
  'dostarczono',
  'w trakcie weryfikacji',
  'przekazano do kancelarii',
])

/** Aktualny status do UI (przy braku kolumny / NULL — traktuj jak „dostarczono” dla umów z BO gotowym). */
export function getRzeczoznawcaStatusValue(row) {
  const s = row?.rzeczoznawca_status
  if (typeof s === 'string' && RZECZOZNAWCA_STATUS_OPTIONS.includes(s)) return s
  return 'dostarczono'
}

/** Lista umów (handlowiec / dyrektor): status obiegu rzeczoznawcy tylko po BO gotowym; inaczej „—”. */
export function getRzeczoznawcaStatusForTable(row) {
  const s = row?.rzeczoznawca_status
  if (typeof s === 'string' && RZECZOZNAWCA_STATUS_OPTIONS.includes(s)) return s
  if (row?.backoffice_status === 'zweryfikowany') return 'dostarczono'
  return '—'
}

/** Klasy CSS pigułki statusu (tabela / podgląd). */
export function rzeczoznawcaStatusPillClass(status) {
  if (status === 'w trakcie weryfikacji') return 'dash-pill dash-pill--warn'
  if (status === 'przekazano do kancelarii') return 'dash-pill dash-pill--ok'
  if (status === 'dostarczono') return 'dash-pill dash-pill--neutral'
  return 'dash-pill dash-pill--neutral'
}
