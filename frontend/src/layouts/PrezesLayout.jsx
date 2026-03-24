import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { fetchAllLeadsMerged } from '../lib/fetchHandlowiecLeads'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { buildPrezesAggregates } from '../lib/prezesAnalytics'
import { supabase } from '../lib/supabase'
import { PylonIcon } from '../components/icons/PylonIcon'

export const PREZES_BASE_PATH = '/panel/prezes'

function IconTabPrzeglad() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function IconTabUmowy() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h4" />
    </svg>
  )
}

function IconTabKoszty() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconTabWykresy() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconTabPanele() {
  return (
    <svg className="dash__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="9" height="8" rx="1" />
      <rect x="13" y="3" width="9" height="5" rx="1" />
      <rect x="13" y="11" width="9" height="10" rx="1" />
      <rect x="2" y="14" width="9" height="7" rx="1" />
    </svg>
  )
}

const TABS = [
  { to: 'przeglad', label: 'Przegląd', Icon: IconTabPrzeglad },
  { to: 'umowy', label: 'Umowy', Icon: IconTabUmowy },
  { to: 'koszty', label: 'Koszty', Icon: IconTabKoszty },
  { to: 'wykresy', label: 'Wykresy', Icon: IconTabWykresy },
  { to: 'panele', label: 'Podgląd paneli', Icon: IconTabPanele },
]

const SUBTITLE = {
  przeglad: 'Przegląd',
  umowy: 'Wszystkie umowy',
  koszty: 'Koszty i szacunki',
  wykresy: 'Wykresy analityczne',
  panele: 'Operacja — podgląd bez edycji',
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

export function PrezesLayout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [mergeWarning, setMergeWarning] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    setMergeWarning(null)
    setLoading(true)
    const { rows: data, error, mergeWarning: warn } = await fetchAllLeadsMerged(supabase)
    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    setRows(data ?? [])
    if (warn) setMergeWarning(warn)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const aggregates = useMemo(() => buildPrezesAggregates(rows), [rows])

  const parts = location.pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1] ?? 'przeglad'
  const seg = last === 'prezes' ? 'przeglad' : last
  const pageHint = SUBTITLE[seg] ?? 'Panel prezesa'

  const outletCtx = useMemo(
    () => ({
      rows,
      loading,
      err,
      mergeWarning,
      reload: load,
      aggregates,
    }),
    [rows, loading, err, mergeWarning, load, aggregates],
  )

  return (
    <div className="dash">
      <aside className="dash__sidebar">
        <div className="dash__brand">
          <NavLink to={`${PREZES_BASE_PATH}/przeglad`} className="dash__brand-link">
            <PylonIcon className="dash__brand-icon" />
            <span className="dash__brand-text">EASYEKO</span>
          </NavLink>
        </div>
        <div className="dash__entity">Panel prezesa</div>
        <nav className="dash__nav" aria-label="Menu prezesa">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={`${PREZES_BASE_PATH}/${to}`}
              end={to === 'przeglad'}
              className={({ isActive }) => navClass(isActive)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
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
        <header className="dash__header">
          <div className="dash__header-top">
            <div>
              <h1 className="dash__header-title">Panel prezesa</h1>
              <p className="dash-prezes-subtitle">{pageHint}</p>
            </div>
            <div className="dash__header-actions">
              <HeaderUser />
            </div>
          </div>
        </header>
        <div className="dash__content dash__content--prezes">
          <Outlet context={outletCtx} />
        </div>
      </div>
    </div>
  )
}
