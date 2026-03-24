import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

/** Prezes przegląda inny panel (poza /panel/prezes) — podgląd bez pełnych uprawnień edycji. */
export function usePrezesForeignPanelPreview() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  if (profile?.role !== 'prezes') return false
  return !pathname.startsWith('/panel/prezes')
}
