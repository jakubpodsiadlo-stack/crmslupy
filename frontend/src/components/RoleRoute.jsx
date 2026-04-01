import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'

/** Dzieci tylko gdy profile.role jest na liście `allow`. */
export function RoleRoute({ children, allow }) {
  return (
    <ProtectedRoute>
      <RoleGate allow={allow}>{children}</RoleGate>
    </ProtectedRoute>
  )
}

function normalizeAppRole(role) {
  if (role == null || typeof role !== 'string') return null
  const t = role.trim().toLowerCase()
  return t || null
}

function RoleGate({ children, allow }) {
  const { profile, user, profileLoading, profileFetchError, refreshProfile } = useAuth()

  if (user && profileLoading) {
    return (
      <div className="screen-center muted">
        <p>Ładowanie profilu…</p>
      </div>
    )
  }

  if (user && !profile) {
    return (
      <div className="dash-access-page">
        <div className="dash-access">
          <h1>Profil niedostępny</h1>
          <p>
            {profileFetchError
              ? `Nie udało się wczytać profilu: ${profileFetchError}`
              : 'W bazie nie ma rekordu profilu powiązanego z tym kontem. Skontaktuj się z administratorem.'}
          </p>
          <p>
            <button type="button" className="linkish" onClick={() => refreshProfile()}>
              Spróbuj ponownie
            </button>
          </p>
          <p>
            <Link to="/">Wróć do strony głównej</Link>
          </p>
        </div>
      </div>
    )
  }

  const current = normalizeAppRole(profile?.role)
  const allowed = allow.some((a) => normalizeAppRole(a) === current)

  if (!profile || !current || !allowed) {
    return (
      <div className="dash-access-page">
        <div className="dash-access">
          <h1>Brak dostępu</h1>
          <p>
            Ten widok jest przeznaczony dla ról: {allow.join(', ')}. Twoja rola:{' '}
            <strong>{profile?.role ?? '—'}</strong>.
          </p>
          <p>
            <Link to="/">Wróć do strony głównej</Link>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
