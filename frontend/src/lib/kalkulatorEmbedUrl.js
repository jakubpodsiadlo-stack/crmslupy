/**
 * URL kalkulatora w trybie bez kodu 6-cyfrowego (?noCode=1).
 * - VITE_KALKULATOR_URL — pełny origin (np. http://localhost:5174) lub ścieżka produkcyjna
 * - dev bez env: proxy Vite `/embed-kalkulator` → serwer kalkulatora (vite.config.js)
 * - prod bez env: statyczny build w `public/kalkulator/` (npm run build w folderze kalkulator)
 */
export function getKalkulatorNoCodeEmbedSrc() {
  const envUrl = import.meta.env.VITE_KALKULATOR_URL
  if (envUrl != null && String(envUrl).trim() !== '') {
    return `${String(envUrl).replace(/\/$/, '')}/?noCode=1`
  }
  if (import.meta.env.DEV) {
    return '/embed-kalkulator/?noCode=1'
  }
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}kalkulator/?noCode=1`.replace(/([^:]\/)\/+/g, '$1')
}
