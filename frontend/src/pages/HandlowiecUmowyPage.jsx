import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import { fetchLeadsForSalesAgent } from '../lib/fetchHandlowiecLeads'
import {
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getRzeczoznawcaStatusForTable,
  getVerificationLabel,
  rzeczoznawcaStatusPillClass,
} from '../lib/firstLeadDisplay'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { HandlowiecLayout } from '../layouts/HandlowiecLayout'
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

function VerificationPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'}>
      {ok ? 'Infolinia OK' : 'Infolinia — oczekuje'}
    </span>
  )
}

function BackofficeMiniPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'} title="Back office">
      {ok ? 'BO: gotowe' : 'BO: w toku'}
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

export function HandlowiecUmowyPage() {
  const location = useLocation()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const { profile } = useAuth()
  const agentName = profile?.full_name?.trim() ?? ''

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

    const { rows: data, error, mergeWarning: warn } = await fetchLeadsForSalesAgent(supabase, agentName)

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
  }, [agentName, location.pathname, restoreModalOnce])

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

  return (
    <HandlowiecLayout title="Moje umowy">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Moje umowy</h2>
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
        {!err ? (
          <div className="dash-code-toolbar">
            <div className="dash-code-filter">
              <span className="dash-code-filter__icon">
                <IconSearch size={18} />
              </span>
              <label htmlFor="handlowiec-umowy-code-filter" className="visually-hidden">
                Filtruj po kodzie kalkulatora
              </label>
              <input
                id="handlowiec-umowy-code-filter"
                type="search"
                className="dash-code-filter__input"
                placeholder="Filtruj po kodzie kalkulatora…"
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
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Data (kod)</th>
                  <th scope="col">Kod kalkulatora</th>
                  <th scope="col">Infolinia</th>
                  <th scope="col">BO</th>
                  <th scope="col">Status rzeczoznawcy</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {showNoRowsMessage ? (
                  <tr>
                    <td colSpan={6} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      {showFilterEmpty ? (
                        <>Brak umów pasujących do filtra.</>
                      ) : (
                        <>
                          Brak umów przypisanych do Ciebie. Upewnij się, że w profilu masz poprawne imię i nazwisko oraz że
                          w zgłoszeniu wpisano Ciebie jako handlowca.
                        </>
                      )}
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const ver = getVerificationLabel(row)
                  const bo = getBackofficeStatusLabel(row)
                  const rz = getRzeczoznawcaStatusForTable(row)
                  return (
                    <tr key={row.id}>
                      <td>{formatDt(getCodeTimestamp(row))}</td>
                      <td>
                        {row.calculator_code ? (
                          <code>{row.calculator_code}</code>
                        ) : (
                          <span className="dash-muted">—</span>
                        )}
                      </td>
                      <td>
                        <VerificationPill status={ver} />
                      </td>
                      <td>
                        <BackofficeMiniPill status={bo} />
                      </td>
                      <td>
                        {rz === '—' ? (
                          <span className="dash-muted">—</span>
                        ) : (
                          <span className={rzeczoznawcaStatusPillClass(rz)} title="Status rzeczoznawcy">
                            {rz}
                          </span>
                        )}
                      </td>
                      <td>
                        <button type="button" className="dash-table__btn" onClick={() => setSelected(row)}>
                          Podgląd umowy
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
        variant="handlowiec"
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </HandlowiecLayout>
  )
}
