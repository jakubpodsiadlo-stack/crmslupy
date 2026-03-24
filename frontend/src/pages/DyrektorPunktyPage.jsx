import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAllLeadsMerged } from '../lib/fetchHandlowiecLeads'
import { getAgentDisplay, isBackofficeVerifiedForHandlowiecPoints } from '../lib/firstLeadDisplay'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { DyrektorLayout } from '../layouts/DyrektorLayout'
import { supabase } from '../lib/supabase'

const PKT_ZA_UMOWE_BO = 100

function formatPkt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function normalizeKey(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function DyrektorPunktyPage() {
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

  const ranking = useMemo(() => {
    /** @type {Map<string, { display: string, boVerified: number, total: number }>} */
    const map = new Map()
    for (const r of rows) {
      const raw = getAgentDisplay(r)?.trim()
      if (!raw) continue
      const key = normalizeKey(raw)
      let cur = map.get(key)
      if (!cur) {
        cur = { display: raw, boVerified: 0, total: 0 }
        map.set(key, cur)
      }
      cur.total += 1
      if (isBackofficeVerifiedForHandlowiecPoints(r)) cur.boVerified += 1
    }
    const list = [...map.values()].sort((a, b) => {
      const pa = a.boVerified * PKT_ZA_UMOWE_BO
      const pb = b.boVerified * PKT_ZA_UMOWE_BO
      if (pb !== pa) return pb - pa
      return b.total - a.total
    })
    return list
  }, [rows])

  const totals = useMemo(() => {
    let bo = 0
    for (const r of rows) {
      if (isBackofficeVerifiedForHandlowiecPoints(r)) bo += 1
    }
    return { bo, pkt: bo * PKT_ZA_UMOWE_BO }
  }, [rows])

  return (
    <DyrektorLayout title="Punkty zespołu">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Punkty zespołu</h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem', maxWidth: '52rem' }}>
          Ranking wg tej samej zasady co u handlowca: <strong>{PKT_ZA_UMOWE_BO} pkt</strong> za umowę po{' '}
          <strong>weryfikacji back office</strong>. Agregacja po nazwie handlowca z leadu (jak w panelu handlowca).
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
        {!loading && !err ? (
          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>
            Zespół łącznie (BO zweryfikowane): <strong>{formatPkt(totals.bo)}</strong> umów →{' '}
            <strong>{formatPkt(totals.pkt)} pkt</strong>
          </p>
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Handlowiec</th>
                  <th scope="col">Umowy BO (zweryf.)</th>
                  <th scope="col">Umowy łącznie</th>
                  <th scope="col">Punkty (szac.)</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      Brak przypisanych handlowców w danych lub brak umów.
                    </td>
                  </tr>
                ) : null}
                {ranking.map((row, i) => (
                  <tr key={row.display}>
                    <td>{i + 1}</td>
                    <td>{row.display}</td>
                    <td>{row.boVerified}</td>
                    <td>{row.total}</td>
                    <td>
                      <strong>{formatPkt(row.boVerified * PKT_ZA_UMOWE_BO)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DyrektorLayout>
  )
}
