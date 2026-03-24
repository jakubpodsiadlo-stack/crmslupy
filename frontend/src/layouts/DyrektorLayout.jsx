import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { PrezesPreviewBanner } from '../components/PrezesPreviewBanner'
import { PylonIcon } from '../components/icons/PylonIcon'
import { usePrezesForeignPanelPreview } from '../lib/usePrezesForeignPanelPreview'

function IconLayout() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function IconContract() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h4" />
    </svg>
  )
}

function IconTeamPoints() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function navClass(isActive) {
  return isActive ? 'dash__nav-link--active' : undefined
}

function getInitials(fullName, email) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return fullName.trim().slice(0, 2).toUpperCase()
  }
  const local = email?.split('@')[0] ?? '?'
  return local.slice(0, 2).toUpperCase()
}

function HeaderUser() {
  const { user, profile } = useAuth()
  const email = user?.email ?? ''
  const displayName =
    profile?.full_name?.trim() || (email ? email.split('@')[0] : 'Użytkownik')
  const initials = getInitials(profile?.full_name, email)
  const tip = email ? `${displayName} — ${email}` : displayName

  return (
    <div className="dash__user" title={tip}>
      <span className="dash__user-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="dash__user-name">{displayName}</span>
    </div>
  )
}

export function DyrektorLayout({ children, title }) {
  const { signOut } = useAuth()
  const prezesPreview = usePrezesForeignPanelPreview()

  return (
    <div className={prezesPreview ? 'dash dash--prezes-preview' : 'dash'}>
      <aside className="dash__sidebar">
        <div className="dash__brand">
          <NavLink to="/panel/dyrektor" end className="dash__brand-link">
            <PylonIcon className="dash__brand-icon" />
            <span className="dash__brand-text">EASYEKO</span>
          </NavLink>
        </div>
        <div className="dash__entity">Panel dyrektora</div>
        <nav className="dash__nav" aria-label="Menu dyrektora">
          <NavLink to="/panel/dyrektor" end className={({ isActive }) => navClass(isActive)}>
            <IconLayout />
            Start
          </NavLink>
          <NavLink to="/panel/dyrektor/umowy" end className={({ isActive }) => navClass(isActive)}>
            <IconContract />
            Umowy zespołu
          </NavLink>
          <NavLink to="/panel/dyrektor/punkty" end className={({ isActive }) => navClass(isActive)}>
            <IconTeamPoints />
            Punkty zespołu
          </NavLink>
        </nav>
        <div className="dash__sidebar-foot">
          <button
            type="button"
            className="dash__btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => signOut()}
          >
            Wyloguj
          </button>
        </div>
      </aside>
      <div className="dash__main">
        <PrezesPreviewBanner />
        <header className="dash__header">
          <div className="dash__header-top">
            <h1 className="dash__header-title">{title}</h1>
            <div className="dash__header-actions">
              <HeaderUser />
            </div>
          </div>
        </header>
        <div className="dash__content">{children}</div>
      </div>
    </div>
  )
}
