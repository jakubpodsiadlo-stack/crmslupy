import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import { fetchAllLeadsMerged } from '../lib/fetchHandlowiecLeads'
import {
  getAgentDisplay,
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getRzeczoznawcaStatusForTable,
  getRzeczoznawcaStatusValue,
  getVerificationLabel,
  rzeczoznawcaStatusPillClass,
} from '../lib/firstLeadDisplay'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'
import { MecenasLayout } from '../layouts/MecenasLayout'
import { supabase } from '../lib/supabase'

const KANCELARIA_STATUS = 'przekazano do kancelarii'

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

function normalizeFilter(q) {
  return q.trim().toLowerCase().replace(/\s+/g, '')
}

export function MecenasUmowyPage() {
  const location = useLocation()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [mergeWarning, setMergeWarning] = useState(null)
  const [selected, setSelected] = useState(null)
  const [codeFilter, setCodeFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

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

    const { rows: data, error, mergeWarning: warn } = await fetchAllLeadsMerged(supabase, {
      backofficeVerifiedOnly: true,
    })

    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    const kancelaria = (data ?? []).filter((r) => getRzeczoznawcaStatusValue(r) === KANCELARIA_STATUS)
    setRows(kancelaria)
    setSelected((prev) => {
      if (prev?.id) {
        const next = kancelaria.find((r) => r.id === prev.id)
        return next ?? null
      }
      return restoreModalOnce(kancelaria)
    })
    if (warn) setMergeWarning(warn)
  }, [location.pathname, restoreModalOnce])

  useEffect(() => {
    load()
  }, [load])

  const codeNeedle = normalizeFilter(codeFilter)
  const agentNeedle = normalizeFilter(agentFilter)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (codeNeedle) {
        const code = row.calculator_code != null ? String(row.calculator_code).toLowerCase().replace(/\s+/g, '') : ''
        if (!code.includes(codeNeedle)) return false
      }
      if (agentNeedle) {
        const agent = getAgentDisplay(row)
        const hay = agent != null ? normalizeFilter(String(agent)) : ''
        if (!hay.includes(agentNeedle)) return false
      }
      return true
    })
  }, [rows, codeNeedle, agentNeedle])

  const showFilterEmpty =
    !loading && !err && rows.length > 0 && filteredRows.length === 0 && (codeNeedle.length > 0 || agentNeedle.length > 0)
  const showTableEmpty = !loading && !err && rows.length === 0

  return (
    <MecenasLayout title="Umowy do rozpatrzenia">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Umowy do rozpatrzenia</h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem', maxWidth: '52rem' }}>
          Umowy z <strong>gotowym BO</strong>, które rzeczoznawca oznaczył jako{' '}
          <strong>„{KANCELARIA_STATUS}”</strong>. Podgląd w modalu — jak u rzeczoznawcy, ale{' '}
          <strong>bez możliwości zapisu</strong> (status, pliki, wycena).
        </p>
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
          <div className="dash-code-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="dash-code-filter" style={{ minWidth: '12rem', flex: '1 1 14rem' }}>
              <span className="dash-code-filter__icon">
                <IconSearch size={18} />
              </span>
              <label htmlFor="mecenas-umowy-code-filter" className="visually-hidden">
                Filtruj po kodzie kalkulatora
              </label>
              <input
                id="mecenas-umowy-code-filter"
                type="search"
                className="dash-code-filter__input"
                placeholder="Kod kalkulatora…"
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="dash-code-filter" style={{ minWidth: '12rem', flex: '1 1 14rem' }}>
              <span className="dash-code-filter__icon">
                <IconSearch size={18} />
              </span>
              <label htmlFor="mecenas-umowy-agent-filter" className="visually-hidden">
                Filtruj po handlowcu
              </label>
              <input
                id="mecenas-umowy-agent-filter"
                type="search"
                className="dash-code-filter__input"
                placeholder="Handlowiec (imię, fragment)…"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {codeNeedle || agentNeedle ? (
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
                  <th scope="col">Kod</th>
                  <th scope="col">Handlowiec</th>
                  <th scope="col">Infolinia</th>
                  <th scope="col">BO</th>
                  <th scope="col">Status rzeczoznawcy</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {showFilterEmpty || showTableEmpty ? (
                  <tr>
                    <td colSpan={7} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      {showFilterEmpty ? (
                        <>Brak pozycji pasujących do filtrów.</>
                      ) : (
                        <>
                          Brak umów ze statusem rzeczoznawcy „{KANCELARIA_STATUS}”. Gdy rzeczoznawca przekaże sprawę do
                          kancelarii, pojawi się tutaj.
                        </>
                      )}
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const ver = getVerificationLabel(row)
                  const bo = getBackofficeStatusLabel(row)
                  const rz = getRzeczoznawcaStatusForTable(row)
                  const agent = getAgentDisplay(row)
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
                      <td>{agent ? <span title={agent}>{agent}</span> : <span className="dash-muted">—</span>}</td>
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
        variant="mecenas"
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </MecenasLayout>
  )
}
