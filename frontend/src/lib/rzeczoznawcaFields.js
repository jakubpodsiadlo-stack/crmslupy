/**
 * Pola zakładki „Rzeczoznawca” — te same klucze co w calculator_codes / CC_LABELS.
 * Zapis w bazie: first_lead.rzeczoznawca_fields (jsonb).
 */

/**
 * Sekcje formularza: działka → energia → woda → gaz; ceny przy danej infrastrukturze, łącznie na końcu UI.
 */
export const RZECZOZNAWCA_SECTIONS = Object.freeze([
  {
    id: 'parcel',
    title: 'Działka i grunt',
    keys: ['parcel_type', 'land_value', 'area_km2', 'area_m2'],
  },
  {
    id: 'energy',
    title: 'Energia',
    keys: ['network_operator', 'network_operator_other', 'pole_type', 'pole_length_m', 'pole_count'],
    priceFrom: 'power_price_from',
    priceTo: 'power_price_to',
    priceLabel: 'Energia — cena',
  },
  {
    id: 'water',
    title: 'Woda',
    keys: ['water_type', 'water_length_m', 'water_m2'],
    priceFrom: 'water_price_from',
    priceTo: 'water_price_to',
    priceLabel: 'Woda — cena',
  },
  {
    id: 'gas',
    title: 'Gaz',
    keys: ['gas_length_m', 'gas_type', 'gas_m2'],
    priceFrom: 'gas_price_from',
    priceTo: 'gas_price_to',
    priceLabel: 'Gaz — cena',
  },
])

export const RZECZOZNAWCA_TOTAL_PRICE = Object.freeze({
  from: 'total_price_from',
  to: 'total_price_to',
  label: 'Cena całkowita',
})

export const RZECZOZNAWCA_SIMPLE_KEYS = Object.freeze(
  RZECZOZNAWCA_SECTIONS.flatMap((s) => s.keys),
)

/** Wszystkie klucze zapisywane w rzeczoznawca_fields (pola + zakresy cen). */
export function rzeczoznawcaAllPayloadKeys() {
  const keys = [...RZECZOZNAWCA_SIMPLE_KEYS]
  for (const s of RZECZOZNAWCA_SECTIONS) {
    if (s.priceFrom) {
      keys.push(s.priceFrom, s.priceTo)
    }
  }
  keys.push(RZECZOZNAWCA_TOTAL_PRICE.from, RZECZOZNAWCA_TOTAL_PRICE.to)
  return keys
}

/** Wartości jak w kalkulatorze (parcel-type-select). */
export const RZECZOZNAWCA_PARCEL_OPTIONS = Object.freeze([
  { value: 'MIESZKANIOWA', label: 'Mieszkaniowa' },
  { value: 'ROLNA', label: 'Rolna' },
  { value: 'LESNA', label: 'Leśna' },
  { value: 'INWESTYCYJNA', label: 'Inwestycyjna' },
])

/** Operator sieci (energia / gaz — lista jak w dokumentacji). */
export const RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS = Object.freeze([
  {
    value: 'PSE S.A. (Polskie Sieci Elektroenergetyczne)',
    label: 'PSE S.A. (Polskie Sieci Elektroenergetyczne)',
  },
  { value: 'PGE Dystrybucja S.A. (Grupa PGE)', label: 'PGE Dystrybucja S.A. (Grupa PGE)' },
  { value: 'GAZ-SYSTEM S.A.', label: 'GAZ-SYSTEM S.A.' },
  { value: 'TAURON Dystrybucja S.A.', label: 'TAURON Dystrybucja S.A.' },
  { value: 'Enea Operator Sp. z o.o.', label: 'Enea Operator Sp. z o.o.' },
  { value: 'Energa Operator S.A.', label: 'Energa Operator S.A.' },
  { value: 'Stoen Operator Sp. z o.o.', label: 'Stoen Operator Sp. z o.o.' },
  { value: 'PERN S.A.', label: 'PERN S.A.' },
  {
    value: 'Polska Spółka Gazownictwa Sp. z o.o.',
    label: 'Polska Spółka Gazownictwa Sp. z o.o.',
  },
  { value: 'inne', label: 'Inne' },
])

const NETWORK_OP_CANONICAL = new Set(RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS.map((o) => o.value))

/** Dopasowanie zapisanego operatora do listy (legacy / literówki). */
export function normalizeRzeczoznawcaNetworkOperator(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  if (NETWORK_OP_CANONICAL.has(s)) return s
  const byLen = RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS.map((o) => o.value).sort((a, b) => b.length - a.length)
  for (const v of byLen) {
    if (s === v || s.includes(v) || v.includes(s)) return v
  }
  return s
}

/** Teksty jak zapisuje kalkulator (rodzaj_slupa) — trzy napięcia; „Stacja energetyczna” tylko jako wartość legacy z kalkulatora. */
export const RZECZOZNAWCA_POLE_OPTIONS = Object.freeze([
  { value: 'Słup niskiego napięcia', label: 'Niskie napięcie' },
  { value: 'Słup średniego napięcia', label: 'Średnie napięcie' },
  { value: 'Słup wysokiego napięcia', label: 'Wysokie napięcie' },
])

/** Etykiety jak w kalkulatorze (select wody → rodzaj_wodociagu / water_type). */
export const RZECZOZNAWCA_WATER_OPTIONS = Object.freeze([
  { value: 'Rurociąg do 40 cm', label: 'Rurociąg do 40 cm' },
  { value: 'Rurociąg 40 - 60 cm', label: 'Rurociąg 40 - 60 cm' },
  {
    value: 'Rurociąg powyżej 60 cm (20 m)',
    label: 'Rurociąg powyżej 60 cm (20 m)',
  },
])

/** Etykiety jak w kalkulatorze (select gazociągu → rodzaj_gazociagu / gas_type). */
export const RZECZOZNAWCA_GAS_OPTIONS = Object.freeze([
  { value: 'Gazociąg 40 cm', label: 'Gazociąg 40 cm' },
  { value: 'Gazociąg 40 - 60 cm', label: 'Gazociąg 40 - 60 cm' },
  { value: 'Gazociąg powyżej 60 cm', label: 'Gazociąg powyżej 60 cm' },
])

const PARCEL_CANONICAL = new Set(RZECZOZNAWCA_PARCEL_OPTIONS.map((o) => o.value))
const POLE_CANONICAL = new Set(RZECZOZNAWCA_POLE_OPTIONS.map((o) => o.value))
const WATER_CANONICAL = new Set(RZECZOZNAWCA_WATER_OPTIONS.map((o) => o.value))
const GAS_CANONICAL = new Set(RZECZOZNAWCA_GAS_OPTIONS.map((o) => o.value))

/** Mapuje stary tekst / warianty na wartość z listy (dla select + spójność z kalkulatorem). */
export function normalizeRzeczoznawcaParcelType(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const up = s.toUpperCase().replaceAll('Ś', 'S').replaceAll('Ł', 'L')
  if (PARCEL_CANONICAL.has(up)) return up
  if (up.includes('MIESZK') || up.includes('BUDOWL')) return 'MIESZKANIOWA'
  if (up.includes('ROLN')) return 'ROLNA'
  if (up.includes('LESN')) return 'LESNA'
  if (up.includes('INWEST') || up.includes('KOMERC')) return 'INWESTYCYJNA'
  return ''
}

export function normalizeRzeczoznawcaPoleType(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  if (POLE_CANONICAL.has(s)) return s
  const u = s.toLowerCase()
  if (/\bniskiego\b|\bniskie\b/.test(u) || u === '3') return 'Słup niskiego napięcia'
  if (/\bśredniego\b|\bsredniego\b/.test(u) || /\b5\.2\b/.test(u)) return 'Słup średniego napięcia'
  if (/\bwysokiego\b|\bwysokie\b/.test(u) || /\b7\.1\b/.test(u)) return 'Słup wysokiego napięcia'
  if (/\bstacja\b/.test(u) || /\b7\.2\b/.test(u)) return 'Stacja energetyczna'
  return s
}

/** Pierwszy segment przy „typ1, typ2” z kalkulatora; dopasowanie do listy wodociągu. */
export function normalizeRzeczoznawcaWaterType(raw) {
  const full = String(raw ?? '').trim()
  if (!full) return ''
  const first = full.split(',')[0].trim().replace(/\s+/g, ' ')
  if (WATER_CANONICAL.has(first)) return first
  const byLen = RZECZOZNAWCA_WATER_OPTIONS.map((o) => o.value).sort((a, b) => b.length - a.length)
  for (const v of byLen) {
    if (first === v || first.includes(v)) return v
  }
  const u = first.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  if (first === '12') return 'Rurociąg do 40 cm'
  if (first === '16') return 'Rurociąg 40 - 60 cm'
  if (first === '20') return 'Rurociąg powyżej 60 cm (20 m)'
  if (u.includes('powyzej') || (u.includes('60') && u.includes('20'))) return 'Rurociąg powyżej 60 cm (20 m)'
  if (u.includes('40') && u.includes('60') && u.includes('-')) return 'Rurociąg 40 - 60 cm'
  if (u.includes('do') && u.includes('40')) return 'Rurociąg do 40 cm'
  return first
}

/** Pierwszy segment przy „typ1, typ2” z kalkulatora; dopasowanie do listy gazociągu. */
export function normalizeRzeczoznawcaGasType(raw) {
  const full = String(raw ?? '').trim()
  if (!full) return ''
  const first = full.split(',')[0].trim().replace(/\s+/g, ' ')
  if (GAS_CANONICAL.has(first)) return first
  const byLen = RZECZOZNAWCA_GAS_OPTIONS.map((o) => o.value).sort((a, b) => b.length - a.length)
  for (const v of byLen) {
    if (first === v || first.includes(v)) return v
  }
  const u = first.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  if (first === '12') return 'Gazociąg 40 cm'
  if (first === '16') return 'Gazociąg 40 - 60 cm'
  if (first === '20') return 'Gazociąg powyżej 60 cm'
  if (u.includes('40') && u.includes('60') && (u.includes('-') || u.includes('do'))) return 'Gazociąg 40 - 60 cm'
  if (u.includes('powyzej') || u.includes('>')) return 'Gazociąg powyżej 60 cm'
  if (u.includes('gazociag') && u.includes('40') && u.includes('cm') && !u.includes('60')) return 'Gazociąg 40 cm'
  return first
}

export const RZECZOZNAWCA_LABELS = Object.freeze({
  parcel_type: 'Typ działki',
  land_value: 'Wartość gruntu',
  network_operator: 'Operator sieci',
  network_operator_other: 'Operator (wpis własny)',
  pole_type: 'Typ słupa',
  pole_length_m: 'Długość linii (m)',
  area_km2: 'Powierzchnia (km²)',
  pole_count: 'Liczba słupów',
  water_type: 'Rodzaj wodociągu',
  water_length_m: 'Woda — długość (m)',
  water_m2: 'Woda (m²)',
  gas_length_m: 'Gaz — długość (m)',
  gas_type: 'Rodzaj gazociągu',
  total_price_from: 'Cena całkowita — od',
  total_price_to: 'Cena całkowita — do',
  power_price_from: 'Energia — cena od',
  power_price_to: 'Energia — cena do',
  water_price_from: 'Woda — cena od',
  water_price_to: 'Woda — cena do',
  gas_price_from: 'Gaz — cena od',
  gas_price_to: 'Gaz — cena do',
  area_m2: 'Powierzchnia (m²)',
  gas_m2: 'Gaz (m²)',
})

function normalizeCcRow(raw) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

/** Stan formularza: scalenie zapisu rzeczoznawcy z podpowiedzią z kalkulatora (gdy brak własnego wpisu). */
export function buildRzeczoznawcaDraftFromLead(lead) {
  const cc = normalizeCcRow(lead?.calculator_codes)
  const rz =
    lead?.rzeczoznawca_fields && typeof lead.rzeczoznawca_fields === 'object'
      ? lead.rzeczoznawca_fields
      : {}
  const draft = {}

  const pick = (k) => {
    const own = rz[k]
    if (own !== undefined && own !== null && String(own).trim() !== '') return String(own)
    const fallback = cc?.[k]
    if (fallback !== undefined && fallback !== null && String(fallback).trim() !== '')
      return String(fallback)
    return ''
  }

  for (const s of RZECZOZNAWCA_SECTIONS) {
    for (const k of s.keys) draft[k] = pick(k)
    if (s.priceFrom) {
      draft[s.priceFrom] = pick(s.priceFrom)
      draft[s.priceTo] = pick(s.priceTo)
    }
  }
  draft[RZECZOZNAWCA_TOTAL_PRICE.from] = pick(RZECZOZNAWCA_TOTAL_PRICE.from)
  draft[RZECZOZNAWCA_TOTAL_PRICE.to] = pick(RZECZOZNAWCA_TOTAL_PRICE.to)

  draft.parcel_type = normalizeRzeczoznawcaParcelType(draft.parcel_type)
  draft.pole_type = normalizeRzeczoznawcaPoleType(draft.pole_type)
  draft.network_operator = normalizeRzeczoznawcaNetworkOperator(draft.network_operator)
  draft.water_type = normalizeRzeczoznawcaWaterType(draft.water_type)
  draft.gas_type = normalizeRzeczoznawcaGasType(draft.gas_type)

  return draft
}

/** Obiekt do zapisu w kolumnie rzeczoznawca_fields (puste pola pomijane). */
export function draftToRzeczoznawcaFieldsPayload(draft) {
  const out = {}
  if (!draft || typeof draft !== 'object') return out
  const keys = rzeczoznawcaAllPayloadKeys()
  for (const k of keys) {
    const t = String(draft[k] ?? '').trim()
    if (t !== '') out[k] = t
  }
  if (String(draft.network_operator ?? '').trim() !== 'inne') delete out.network_operator_other
  return out
}
