/**
 * Podzakładki „Umowy” (panel rzeczoznawcy): slug w URL ↔ rzeczoznawca_status w bazie.
 */
export const RZECZ_UMOWY_TABS = Object.freeze([
  { slug: 'dostarczone', status: 'dostarczono', label: 'Dostarczone' },
  { slug: 'w-trakcie-weryfikacji', status: 'w trakcie weryfikacji', label: 'W trakcie weryfikacji' },
  { slug: 'przekazane-do-kancelarii', status: 'przekazano do kancelarii', label: 'Przekazane do kancelarii' },
])

const SLUG_TO_STATUS = Object.fromEntries(RZECZ_UMOWY_TABS.map((t) => [t.slug, t.status]))
const STATUS_TO_SLUG = Object.fromEntries(RZECZ_UMOWY_TABS.map((t) => [t.status, t.slug]))

/** @param {string | undefined} slug */
export function umowyTabSlugToStatus(slug) {
  if (slug == null || slug === '') return null
  return SLUG_TO_STATUS[slug] ?? null
}

/** @param {string} status */
export function umowyStatusToSlug(status) {
  return STATUS_TO_SLUG[status] ?? 'dostarczone'
}

/** @param {string | undefined} slug */
export function isValidUmowyTabSlug(slug) {
  return slug != null && slug !== '' && SLUG_TO_STATUS[slug] != null
}

export const RZECZ_UMOWY_BASE_PATH = '/panel/rzeczoznawca/umowy'
