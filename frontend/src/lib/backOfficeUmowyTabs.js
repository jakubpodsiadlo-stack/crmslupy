/**
 * Podzakładki „Umowy” (panel back office): slug w URL ↔ filtr weryfikacji infolinii.
 */
export const BO_UMOWY_TABS = Object.freeze([
  {
    slug: 'zweryfikowana-infolinia',
    infoliniVerified: true,
    label: 'Zweryfikowane przez infolinię',
  },
  {
    slug: 'niezweryfikowana-infolinia',
    infoliniVerified: false,
    label: 'Niezweryfikowane przez infolinię',
  },
])

const SLUG_TO_VERIFIED = Object.fromEntries(BO_UMOWY_TABS.map((t) => [t.slug, t.infoliniVerified]))

/** @param {string | undefined} slug */
export function boUmowyTabSlugToVerified(slug) {
  if (slug == null || slug === '') return null
  if (!(slug in SLUG_TO_VERIFIED)) return null
  return SLUG_TO_VERIFIED[slug]
}

/** @param {string | undefined} slug */
export function isValidBoUmowyTabSlug(slug) {
  return slug != null && slug !== '' && slug in SLUG_TO_VERIFIED
}

export const BO_UMOWY_BASE_PATH = '/panel/back-office/umowy'
