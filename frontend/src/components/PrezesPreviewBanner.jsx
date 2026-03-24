import { NavLink } from 'react-router-dom'
import { usePrezesForeignPanelPreview } from '../lib/usePrezesForeignPanelPreview'

/**
 * Pasek dla roli prezes podczas podglądu cudzych paneli — powrót do pulpitu prezesa.
 */
export function PrezesPreviewBanner() {
  const active = usePrezesForeignPanelPreview()
  if (!active) return null

  return (
    <div className="dash-prezes-preview-banner" role="region" aria-label="Tryb podglądu prezesa">
      <p className="dash-prezes-preview-banner__text">
        <strong>Podgląd panelu</strong> — nawigacja jak u operatorów; zmiany w bazie są wyłączone w szczegółach umów.
        Unikaj pól zapisu — część przycisków może być nieaktywna.
      </p>
      <NavLink to="/panel/prezes/panele" className="dash-prezes-preview-banner__back">
        Wróć do panelu prezesa
      </NavLink>
    </div>
  )
}
