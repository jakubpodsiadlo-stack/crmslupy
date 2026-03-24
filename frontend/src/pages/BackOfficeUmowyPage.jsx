import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import { getAgentDisplay, getBackofficeStatusLabel } from '../lib/firstLeadDisplay'
import {
  fetchFirstLeadsWithCalculator,
  formatSupabaseError,
} from '../lib/firstLeadQueries'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'
import { BackOfficeLayout } from '../layouts/BackOfficeLayout'
import { useBackOfficeTasksTab } from '../layouts/BackOfficeTasksTabContext'
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
  const tasksTab = useBackOfficeTasksTab()?.tab ?? 'all'
  const location = useLocation()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [mergeWarning, setMergeWarning] = useState(null)
  const [selected, setSelected] = useState(null)
  const [codeFilter, setCodeFilter] = useState('')

  const load = useCallback(async () => {
    setErr(null)
    setMergeWarning(null)
    setLoading(true)

    const envHint = missingEnvHint()
    if (envHint) {
      setLoading(false)
      setErr(envHint)
      setRows([])
      return
    }

    const { rows: data, error, mergeWarning: warn } = await fetchFirstLeadsWithCalculator(supabase, {
      archived: true,
      verifiedOnly: true,
      backofficeActive: true,
    })

    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    setRows(data)
    setSelected((prev) => {
      if (prev?.id) {
        const next = data.find((r) => r.id === prev.id)
        return next ?? null
      }
      return restoreModalOnce(data)
    })
    if (warn) setMergeWarning(warn)
  }, [location.pathname, restoreModalOnce])

  useEffect(() => {
    load()
  }, [load])

  const needle = normalizeCodeFilter(codeFilter)
  const queueRows = useMemo(() => {
    if (tasksTab === 'done') return []
    return rows
  }, [rows, tasksTab])

  const filteredRows = useMemo(() => {
    if (!needle) return queueRows
    return queueRows.filter((row) => {
      const code = row.calculator_code != null ? String(row.calculator_code).toLowerCase().replace(/\s+/g, '') : ''
      return code.includes(needle)
    })
  }, [queueRows, needle])

  const showFilterEmpty =
    !loading &&
    !err &&
    queueRows.length > 0 &&
    filteredRows.length === 0 &&
    needle.length > 0
  const showTableEmpty = !loading && !err && queueRows.length === 0
  const showNoRowsMessage = showFilterEmpty || showTableEmpty

  return (
    <BackOfficeLayout title="Umowy">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
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
        {tasksTab === 'mine' ? (
          <p className="dash-muted" style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
            <strong>Moje zadania</strong> — po wprowadzeniu przypisań w bazie zobaczysz tu tylko umowy przypisane do Ciebie.
            Na razie widzisz całą kolejkę jak w zakładce Wszystkie.
          </p>
        ) : null}
        {tasksTab === 'done' ? (
          <div
            className="dash-panel"
            style={{
              marginBottom: '0.85rem',
              padding: '0.9rem 1rem',
              maxWidth: '40rem',
              background: 'var(--dash-panel-soft, #f8fafc)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              Umowy <strong>zakończone w BO</strong> (zweryfikowane) są na liście{' '}
              <NavLink to="/panel/back-office/archiwum-umow" className="linkish">
                Archiwum umów
              </NavLink>
              .
            </p>
          </div>
        ) : null}
        {!err ? (
          <div className="dash-code-toolbar">
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
                Wyniki: {filteredRows.length} z {queueRows.length}
              </p>
            ) : null}
          </div>
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Data weryfikacji</th>
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
                    <td colSpan={7} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      {showFilterEmpty ? (
                        <>Brak pozycji pasujących do filtra.</>
                      ) : tasksTab === 'done' ? (
                        <>Brak pozycji na tej zakładce — zakończone umowy są w archiwum.</>
                      ) : (
                        <>
                          Brak umów w obiegu. Po weryfikacji na infolinii wpis trafia tutaj; po weryfikacji BO — do
                          archiwum umów.
                        </>
                      )}
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const agent = getAgentDisplay(row) || '—'
                  const bo = getBackofficeStatusLabel(row)
                  return (
                    <tr key={row.id}>
                      <td>{formatDt(row.verified_at)}</td>
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
                        <button
                          type="button"
                          className="dash-table__btn"
                          onClick={() => setSelected(row)}
                        >
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
