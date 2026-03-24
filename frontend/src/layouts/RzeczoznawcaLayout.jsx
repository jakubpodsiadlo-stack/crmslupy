import { NavLink, useLocation } from 'react-router-dom'
import { RZECZ_UMOWY_BASE_PATH, RZECZ_UMOWY_TABS } from '../lib/rzeczoznawcaUmowyTabs'
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

function IconMap() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinejoin="round" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function IconNcr() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

export function RzeczoznawcaLayout({ children, title, contentClassName = '' }) {
  const { signOut } = useAuth()
  const { pathname } = useLocation()
  const umowySectionActive = pathname.startsWith(`${RZECZ_UMOWY_BASE_PATH}`)
  const prezesPreview = usePrezesForeignPanelPreview()

  return (
    <div className={prezesPreview ? 'dash dash--prezes-preview' : 'dash'}>
      <aside className="dash__sidebar">
        <div className="dash__brand">
          <NavLink to="/panel/rzeczoznawca" end className="dash__brand-link">
            <PylonIcon className="dash__brand-icon" />
            <span className="dash__brand-text">EASYEKO</span>
          </NavLink>
        </div>
        <div className="dash__entity">Panel rzeczoznawcy</div>
        <nav className="dash__nav" aria-label="Menu rzeczoznawcy">
          <NavLink to="/panel/rzeczoznawca" end className={({ isActive }) => navClass(isActive)}>
            <IconLayout />
            Start
          </NavLink>
          <NavLink
            to={`${RZECZ_UMOWY_BASE_PATH}/dostarczone`}
            className={() => navClass(umowySectionActive)}
          >
            <IconContract />
            Umowy
          </NavLink>
          <div className="dash__nav-umowy-sub" role="group" aria-label="Umowy — status">
            {RZECZ_UMOWY_TABS.map(({ slug, label }) => (
              <NavLink
                key={slug}
                to={`${RZECZ_UMOWY_BASE_PATH}/${slug}`}
                end
                className={({ isActive }) => (isActive ? 'dash__nav-sublink dash__nav-sublink--active' : 'dash__nav-sublink')}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <NavLink to="/panel/rzeczoznawca/kalendarz" end className={({ isActive }) => navClass(isActive)}>
            <IconCalendar />
            Kalendarz
          </NavLink>
          <NavLink to="/panel/rzeczoznawca/geoportal" end className={({ isActive }) => navClass(isActive)}>
            <IconMap />
            Geoportal 2
          </NavLink>
          <NavLink to="/panel/rzeczoznawca/ncr" end className={({ isActive }) => navClass(isActive)}>
            <IconNcr />
            NCR
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
        <div className={`dash__content${contentClassName ? ` ${contentClassName}` : ''}`}>{children}</div>
      </div>
    </div>
  )
}
