import { useEffect, useMemo, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import {
  getAgentDisplay,
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getRzeczoznawcaStatusForTable,
  getVerificationLabel,
  rzeczoznawcaStatusPillClass,
} from '../lib/firstLeadDisplay'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'

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

function normalizeFilter(q) {
  return q.trim().toLowerCase().replace(/\s+/g, '')
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0%'
  return `${Math.round((numerator / denominator) * 100)}%`
}

export function PrezesUmowyPage() {
  const location = useLocation()
  const { rows, loading, err, mergeWarning, reload } = useOutletContext()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const [selected, setSelected] = useState(null)
  const [codeFilter, setCodeFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  useEffect(() => {
    setSelected((prev) => {
      if (prev?.id) {
        const next = rows.find((r) => r.id === prev.id)
        return next ?? null
      }
      return restoreModalOnce(rows)
    })
  }, [rows, restoreModalOnce])

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

  const agentStats = useMemo(() => {
    const map = new Map()
    for (const row of filteredRows) {
      const agentRaw = getAgentDisplay(row)?.trim()
      const agent = agentRaw || 'Nieprzypisany'
      const current = map.get(agent) || {
        agent,
        total: 0,
        infoliniaOk: 0,
        boOk: 0,
        kancelaria: 0,
      }
      current.total += 1
      if (getVerificationLabel(row) === 'zweryfikowany') current.infoliniaOk += 1
      if (getBackofficeStatusLabel(row) === 'zweryfikowany') current.boOk += 1
      if (getRzeczoznawcaStatusForTable(row) === 'przekazano do kancelarii') current.kancelaria += 1
      map.set(agent, current)
    }
    return [...map.values()].sort((a, b) => b.total - a.total || a.agent.localeCompare(b.agent, 'pl'))
  }, [filteredRows])

  const showFilterEmpty =
    !loading && !err && rows.length > 0 && filteredRows.length === 0 && (codeNeedle.length > 0 || agentNeedle.length > 0)
  const showTableEmpty = !loading && !err && rows.length === 0

  return (
    <div className="dash-prezes-page">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Wszystkie umowy</h2>
          <button type="button" className="dash-table__btn" onClick={() => reload()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem', maxWidth: '52rem' }}>
          Pełna lista zgłoszeń — <strong>tylko podgląd</strong>. Edycja odbywa się w poszczególnych panelach operacyjnych.
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
              <label htmlFor="prezes-umowy-code-filter" className="visually-hidden">
                Filtruj po kodzie kalkulatora
              </label>
              <input
                id="prezes-umowy-code-filter"
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
              <label htmlFor="prezes-umowy-agent-filter" className="visually-hidden">
                Filtruj po handlowcu
              </label>
              <input
                id="prezes-umowy-agent-filter"
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
        {!loading && !err ? (
          <div className="dash-table-wrap" style={{ marginBottom: '1rem' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Statystyki handlowców</th>
                  <th scope="col">Umowy</th>
                  <th scope="col">Infolinia OK</th>
                  <th scope="col">BO gotowe</th>
                  <th scope="col">Do kancelarii</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dash-muted" style={{ textAlign: 'center', padding: '1rem' }}>
                      Brak danych do statystyk handlowców.
                    </td>
                  </tr>
                ) : (
                  agentStats.slice(0, 12).map((s) => (
                    <tr key={s.agent}>
                      <td>{s.agent}</td>
                      <td>{s.total}</td>
                      <td>
                        {s.infoliniaOk} <span className="dash-muted">({formatPercent(s.infoliniaOk, s.total)})</span>
                      </td>
                      <td>
                        {s.boOk} <span className="dash-muted">({formatPercent(s.boOk, s.total)})</span>
                      </td>
                      <td>
                        {s.kancelaria} <span className="dash-muted">({formatPercent(s.kancelaria, s.total)})</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                        <>Brak umów pasujących do filtrów.</>
                      ) : (
                        <>Brak umów w bazie (lub brak uprawnień do odczytu).</>
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
        variant="prezes"
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={reload}
      />
    </div>
  )
}
