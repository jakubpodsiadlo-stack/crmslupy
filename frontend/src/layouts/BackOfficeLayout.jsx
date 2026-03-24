import { useState } from 'react'
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

function IconBriefcase() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v4" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

function IconArchive() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="5" rx="1" />
      <path d="M4 9v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
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

export function BackOfficeLayout({ children, title }) {
  const { signOut, profile } = useAuth()
  const [tab, setTab] = useState('all')
  const showInfoliniaLink = profile?.role === 'administrator'

  return (
    <div className="dash">
      <aside className="dash__sidebar">
        <div className="dash__brand">
          <NavLink to="/" className="dash__brand-link" end>
            <PylonIcon className="dash__brand-icon" />
            <span className="dash__brand-text">EASYEKO</span>
          </NavLink>
        </div>
        <div className="dash__entity">Back office</div>
        <nav className="dash__nav" aria-label="Menu back office">
          <NavLink to="/panel/back-office" end className={({ isActive }) => navClass(isActive)}>
            <IconLayout />
            Start
          </NavLink>
          <NavLink to="/panel/back-office/pulpit" end className={({ isActive }) => navClass(isActive)}>
            <IconBriefcase />
            Pulpit
          </NavLink>
          <NavLink to="/panel/back-office/umowy" end className={({ isActive }) => navClass(isActive)}>
            <IconContract />
            Umowy
          </NavLink>
          <NavLink to="/panel/back-office/archiwum-umow" end className={({ isActive }) => navClass(isActive)}>
            <IconArchive />
            Archiwum umów
          </NavLink>
          <span className="dash__nav-item--soon">
            <IconUsers />
            Użytkownicy i role
            <span className="dash__nav-soon-badge">wkrótce</span>
          </span>
          {showInfoliniaLink ? (
            <NavLink to="/panel/infolinia/start" className={({ isActive }) => navClass(isActive)}>
              <IconPhone />
              Moduł infolinii
            </NavLink>
          ) : null}
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
              <label className="dash__search">
                <span className="visually-hidden">Szukaj</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input type="search" placeholder="Szukaj…" />
              </label>
              <HeaderUser />
              <button type="button" className="dash__icon-btn" aria-label="Powiadomienia">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            </div>
          </div>
          <div className="dash__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`dash__tab ${tab === 'all' ? 'dash__tab--active' : ''}`}
              onClick={() => setTab('all')}
            >
              Wszystkie
            </button>
            <button
              type="button"
              role="tab"
              className={`dash__tab ${tab === 'mine' ? 'dash__tab--active' : ''}`}
              onClick={() => setTab('mine')}
            >
              Moje
            </button>
            <button
              type="button"
              role="tab"
              className={`dash__tab ${tab === 'reports' ? 'dash__tab--active' : ''}`}
              onClick={() => setTab('reports')}
            >
              Raporty
            </button>
          </div>
        </header>
        <div className="dash__content">{children}</div>
      </div>
    </div>
  )
}
