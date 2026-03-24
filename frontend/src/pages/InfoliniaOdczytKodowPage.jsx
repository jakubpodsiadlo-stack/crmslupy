import { useCallback, useEffect, useMemo, useState } from 'react'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { IconSearch } from '../components/icons/CodeModalIcons'
import {
  getAgentDisplay,
  getCodeTimestamp,
  getVerificationLabel,
} from '../lib/firstLeadDisplay'
import { fetchFirstLeadsWithCalculator, formatSupabaseError } from '../lib/firstLeadQueries'
import { DashboardLayout } from '../layouts/DashboardLayout'
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
      {ok ? 'Zweryfikowany' : 'Niezweryfikowany'}
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

export function InfoliniaOdczytKodowPage() {
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
      archived: false,
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
      return null
    })
    if (warn) setMergeWarning(warn)
  }, [])

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
    <DashboardLayout title="Odczyt kodów">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">KODY</h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        {err ? (
          <p className="error" style={{ marginBottom: '0.75rem' }}>
            {err}
          </p>
        ) : null}
        {mergeWarning ? (
          <p className="dash-muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            {mergeWarning}
          </p>
        ) : null}
        {!err ? (
          <div className="dash-code-toolbar">
            <div className="dash-code-filter">
              <span className="dash-code-filter__icon">
                <IconSearch size={18} />
              </span>
              <label htmlFor="code-filter-input" className="visually-hidden">
                Filtruj po kodzie
              </label>
              <input
                id="code-filter-input"
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
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Data i godzina kodu</th>
                  <th scope="col">Kod</th>
                  <th scope="col">Handlowiec</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {showNoRowsMessage ? (
                  <tr>
                    <td colSpan={5} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      {showFilterEmpty ? (
                        <>Brak kodów pasujących do filtra. Wyczyść pole wyszukiwania lub wpisz inny fragment kodu.</>
                      ) : (
                        <>
                          Brak kodów w <code>first_lead</code>. Dodaj wiersz z <code>calculator_code</code> zgodnym z{' '}
                          <code>calculator_codes.code</code>.
                        </>
                      )}
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const agent = getAgentDisplay(row) || '—'
                  const ver = getVerificationLabel(row)
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
                      <td>{agent}</td>
                      <td>
                        <VerificationPill status={ver} />
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
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </DashboardLayout>
  )
}
