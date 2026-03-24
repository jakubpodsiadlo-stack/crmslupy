import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAllLeadsMerged } from '../lib/fetchHandlowiecLeads'
import { getAgentDisplay, isBackofficeVerifiedForHandlowiecPoints } from '../lib/firstLeadDisplay'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { DyrektorLayout } from '../layouts/DyrektorLayout'
import { supabase } from '../lib/supabase'

function formatInt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function StatCard({ label, value, hint }) {
  return (
    <div
      className="dash-panel"
      style={{
        padding: '1.1rem 1.25rem',
        minWidth: 0,
        flex: '1 1 12rem',
        maxWidth: '20rem',
      }}
    >
      <p className="dash-muted" style={{ margin: '0 0 0.35rem', fontSize: '0.82rem', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</p>
      {hint ? (
        <p className="dash-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function DyrektorStartPage() {
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
    setRows(data)
    if (warn) setMergeWarning(warn)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const total = rows.length
    const activeInfolinia = rows.filter((r) => r.archived_at == null).length
    const boDone = rows.filter((r) => isBackofficeVerifiedForHandlowiecPoints(r)).length
    const agents = new Set()
    for (const r of rows) {
      const a = getAgentDisplay(r)?.trim()
      if (a) agents.add(a)
    }
    return { total, activeInfolinia, boDone, handlowcy: agents.size }
  }, [rows])

  return (
    <DyrektorLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: '56rem' }}>
        <div className="dash-panel__head" style={{ marginBottom: '1rem' }}>
          <h2 className="dash-funnel__title" style={{ margin: 0 }}>
            Panel dyrektora
          </h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Przegląd <strong>wszystkich umów</strong> w systemie (jak w bazie — RLS dla zalogowanych). W{' '}
          <strong>Umowy zespołu</strong> filtrujesz i otwierasz podgląd (tylko odczyt). W{' '}
          <strong>Punkty zespołu</strong> widzisz szacunek <strong>100 pkt</strong> za umowę po weryfikacji BO, wg przypisanego
          handlowca.
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
        {loading ? (
          <p className="dash-muted">Ładowanie statystyk…</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
            <StatCard label="Umowy łącznie" value={formatInt(stats.total)} />
            <StatCard
              label="Na liście infolinii (aktywne)"
              value={formatInt(stats.activeInfolinia)}
              hint="Wiersze bez archived_at — nadal w obiegu infolinii."
            />
            <StatCard
              label="Zweryfikowane BO"
              value={formatInt(stats.boDone)}
              hint="Liczy się do punktów handlowca (100 pkt / umowę)."
            />
            <StatCard label="Handlowcy z umowami" value={formatInt(stats.handlowcy)} hint="Unikalne nazwisko z leadu." />
          </div>
        )}
      </section>
    </DyrektorLayout>
  )
}
