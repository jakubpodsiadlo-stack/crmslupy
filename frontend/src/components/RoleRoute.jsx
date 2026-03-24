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

function RoleGate({ children, allow }) {
  const { profile, user } = useAuth()

  if (user && !profile) {
    return (
      <div className="screen-center muted">
        <p>Ładowanie profilu…</p>
      </div>
    )
  }

  if (!profile || !allow.includes(profile.role)) {
    return (
      <div className="dash-access-page">
        <div className="dash-access">
          <h1>Brak dostępu</h1>
          <p>
            Ten widok jest przeznaczony dla roli: {allow.join(', ')}. Twoja rola:{' '}
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
