import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const PANEL_INFOLINIA_ROLES = ['infolinia', 'administrator']
const PANEL_BACKOFFICE_ROLES = ['backoffice']
const PANEL_HANDLOWIEC_ROLES = ['handlowiec']
const PANEL_DYREKTOR_ROLES = ['dyrektor']
const PANEL_RZECZOZNAWCA_ROLES = ['rzeczoznawca']
const PANEL_MECENAS_ROLES = ['mecenas']
const PANEL_PREZES_ROLES = ['prezes']

export function HomePage() {
  const { profile, user, signOut } = useAuth()

  if (user && !profile) {
    return (
      <div className="shell">
        <header className="topbar">
          <strong>EASYEKO</strong>
          <button type="button" className="linkish" onClick={() => signOut()}>
            Wyloguj
          </button>
        </header>
        <main className="main">
          <p className="muted">Ładowanie profilu…</p>
        </main>
      </div>
    )
  }

  if (profile && PANEL_BACKOFFICE_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/back-office" replace />
  }

  if (profile && PANEL_INFOLINIA_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/infolinia/start" replace />
  }

  if (profile && PANEL_HANDLOWIEC_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/handlowiec" replace />
  }

  if (profile && PANEL_DYREKTOR_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/dyrektor" replace />
  }

  if (profile && PANEL_RZECZOZNAWCA_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/rzeczoznawca" replace />
  }

  if (profile && PANEL_MECENAS_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/mecenas" replace />
  }

  if (profile && PANEL_PREZES_ROLES.includes(profile.role)) {
    return <Navigate to="/panel/prezes" replace />
  }

  const isNoPanelRole = profile?.role === 'brak_panelu'

  return (
    <div className="shell">
      <header className="topbar">
        <strong>EASYEKO</strong>
        <button type="button" className="linkish" onClick={() => signOut()}>
          Wyloguj
        </button>
      </header>
      <main className="main">
        <h1>Witaj</h1>
        <p className="muted">
          Zalogowany: <code>{user?.email}</code>
        </p>
        <p>
          Rola: <strong>{profile?.role ?? '—'}</strong>
          {profile?.full_name ? <> · {profile.full_name}</> : null}
        </p>
        <p className="muted small">
          {isNoPanelRole
            ? 'Twoje konto czeka na przypisanie panelu przez administratora/prezesa.'
            : 'Dla Twojej roli nie ma jeszcze dedykowanego panelu — dodamy go w kolejnych krokach.'}
        </p>
      </main>
    </div>
  )
}
