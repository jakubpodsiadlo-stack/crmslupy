import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import {
  getAgentDisplay,
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getVerificationLabel,
} from '../lib/firstLeadDisplay'
import {
  BO_UMOWY_BASE_PATH,
  BO_UMOWY_TABS,
  boUmowyTabSlugToVerified,
  isValidBoUmowyTabSlug,
} from '../lib/backOfficeUmowyTabs'
import {
  fetchFirstLeadsWithCalculator,
  formatSupabaseError,
} from '../lib/firstLeadQueries'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'
import { BackOfficeLayout } from '../layouts/BackOfficeLayout'
import { supabase } from '../lib/supabase'

function formatDt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function BackofficePill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'} title="Status weryfikacji back office">
      {ok ? 'BO OK' : 'BO — do obsługi'}
    </span>
  )
}

function InfoliniaPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'} title="Weryfikacja infolinii">
      {ok ? 'Infolinia OK' : 'Infolinia — oczekuje'}
    </span>
  )
}

function missingEnvHint() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key) return null
  return 'Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w pliku frontend/.env i zrestartuj Vite (npm run dev).'
}

function normalizeCodeFilter(q) {
  return q.trim().toLowerCase().replace(/\s+/g, '')
}

function clientDisplay(row) {
  const n = row.client_full_name?.trim()
  if (n) return n
  return '—'
}

function cityDisplay(row) {
  const c = row.residence_city?.trim()
  if (c) return c
  return '—'
}

export function BackOfficeUmowyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { boUmowyTab } = useParams()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [mergeWarning, setMergeWarning] = useState(null)
  const [selected, setSelected] = useState(null)
  const [codeFilter, setCodeFilter] = useState('')

  const infoliniVerified = useMemo(() => boUmowyTabSlugToVerified(boUmowyTab), [boUmowyTab])

  useEffect(() => {
    if (boUmowyTab && !isValidBoUmowyTabSlug(boUmowyTab)) {
      navigate(`${BO_UMOWY_BASE_PATH}/zweryfikowana-infolinia`, { replace: true })
    }
  }, [boUmowyTab, navigate])

  useEffect(() => {
    setSelected(null)
  }, [boUmowyTab])

  const load = useCallback(async () => {
    setErr(null)
    setMergeWarning(null)
    setLoading(true)

    if (infoliniVerified === null) {
      setLoading(false)
      return
    }

    const envHint = missingEnvHint()
    if (envHint) {
      setLoading(false)
      setErr(envHint)
      setRows([])
      return
    }

    const fetchOpts = infoliniVerified
      ? {
          archived: true,
          verifiedOnly: true,
          backofficeActive: true,
        }
      : {
          archived: false,
          verifiedOnly: false,
          backofficeActive: true,
        }

    const { rows: data, error, mergeWarning: warn } = await fetchFirstLeadsWithCalculator(
      supabase,
      fetchOpts,
    )

    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }

    let list = data ?? []
    if (!infoliniVerified) {
      list = list.filter((r) => getVerificationLabel(r) !== 'zweryfikowany')
    }

    setRows(list)
    setSelected((prev) => {
      if (prev?.id) {
        const next = list.find((r) => r.id === prev.id)
        return next ?? null
      }
      return restoreModalOnce(list)
    })
    if (warn) setMergeWarning(warn)
  }, [infoliniVerified, location.pathname, restoreModalOnce])

  useEffect(() => {
    load()
  }, [load])

  const needle = normalizeCodeFilter(codeFilter)
  const filteredRows = useMemo(() => {
    if (!needle) return rows
    return rows.filter((row) => {
      const code = row.calculator_code != null ? String(row.calculator_code).toLowerCase().replace(/\s+/g, '') : ''
      return code.includes(needle)
    })
  }, [rows, needle])

  const showFilterEmpty = !loading && !err && rows.length > 0 && filteredRows.length === 0 && needle.length > 0
  const showTableEmpty = !loading && !err && rows.length === 0
  const showNoRowsMessage = showFilterEmpty || showTableEmpty

  const dateColumnLabel = infoliniVerified ? 'Data weryfikacji (infolinia)' : 'Data kodu'

  return (
    <BackOfficeLayout title="Umowy">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {!err ? (
            <div className="dash-code-toolbar" style={{ marginBottom: 0, flex: 1 }}>
              <div className="dash-code-filter">
                <span className="dash-code-filter__icon">
                  <IconSearch size={18} />
                </span>
                <label htmlFor="bo-umowy-code-filter" className="visually-hidden">
                  Filtruj po kodzie
                </label>
                <input
                  id="bo-umowy-code-filter"
                  type="search"
                  className="dash-code-filter__input"
                  placeholder="Filtruj po kodzie…"
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {needle ? (
                <p className="dash-code-filter__hint">
                  Wyniki: {filteredRows.length} z {rows.length}
                </p>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        {!err ? (
          <div
            className="dash-umowy-subtabs"
            role="tablist"
            aria-label="Umowy według weryfikacji infolinii"
            style={{ marginBottom: '1rem' }}
          >
            {BO_UMOWY_TABS.map(({ slug, label }) => (
              <NavLink
                key={slug}
                to={`${BO_UMOWY_BASE_PATH}/${slug}`}
                role="tab"
                aria-selected={boUmowyTab === slug}
                className={({ isActive }) => (isActive ? 'dash__tab dash__tab--active' : 'dash__tab')}
              >
                {label}
              </NavLink>
            ))}
          </div>
        ) : null}
        {err ? (
          <p className="error" style={{ marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
            {err}
          </p>
        ) : null}
        {mergeWarning ? (
          <p className="dash-muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
            {mergeWarning}
          </p>
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">{dateColumnLabel}</th>
                  <th scope="col">Infolinia</th>
                  <th scope="col">Kod</th>
                  <th scope="col">Klient</th>
                  <th scope="col">Miejscowość</th>
                  <th scope="col">Handlowiec</th>
                  <th scope="col">Back office</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {showNoRowsMessage ? (
                  <tr>
                    <td colSpan={8} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      {showFilterEmpty ? (
                        <>Brak pozycji pasujących do filtra.</>
                      ) : infoliniVerified ? (
                        <>
                          Brak umów w obiegu (po weryfikacji infolinii). Po weryfikacji BO wpis trafia do archiwum umów.
                        </>
                      ) : (
                        <>
                          Brak umów z listy kodów infolinii oczekujących na weryfikację. Po weryfikacji na infolinii wpis
                          pojawi się w zakładce „Zweryfikowane przez infolinię”.
                        </>
                      )}
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const agent = getAgentDisplay(row) || '—'
                  const bo = getBackofficeStatusLabel(row)
                  const inf = getVerificationLabel(row)
                  const dateCell = infoliniVerified ? formatDt(row.verified_at) : formatDt(getCodeTimestamp(row))
                  return (
                    <tr key={row.id}>
                      <td>{dateCell}</td>
                      <td>
                        <InfoliniaPill status={inf} />
                      </td>
                      <td>
                        {row.calculator_code ? (
                          <code>{row.calculator_code}</code>
                        ) : (
                          <span className="dash-muted">—</span>
                        )}
                      </td>
                      <td>{clientDisplay(row)}</td>
                      <td>{cityDisplay(row)}</td>
                      <td>{agent}</td>
                      <td>
                        <BackofficePill status={bo} />
                      </td>
                      <td>
                        <button type="button" className="dash-table__btn" onClick={() => setSelected(row)}>
                          Podgląd
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FirstLeadDetailModal
        variant="backoffice"
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </BackOfficeLayout>
  )
}
