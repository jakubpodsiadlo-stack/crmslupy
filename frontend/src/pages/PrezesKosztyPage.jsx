import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getAgentDisplay, getCodeTimestamp } from '../lib/firstLeadDisplay'
import { RZECZOZNAWCA_TOTAL_PRICE } from '../lib/rzeczoznawcaFields'
import { parsePriceField } from '../lib/prezesAnalytics'

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) return '—'
  try {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n) + ' zł'
  } catch {
    return String(Math.round(n)) + ' zł'
  }
}

function formatDt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short' }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

export function PrezesKosztyPage() {
  const { rows, loading, err, aggregates } = useOutletContext()

  const withEstimates = useMemo(() => {
    const out = []
    for (const r of rows) {
      const f = r.rzeczoznawca_fields
      if (!f || typeof f !== 'object') continue
      const to = parsePriceField(f[RZECZOZNAWCA_TOTAL_PRICE.to])
      const from = parsePriceField(f[RZECZOZNAWCA_TOTAL_PRICE.from])
      const mid = to != null ? to : from
      if (mid == null || mid < 0) continue
      out.push({
        id: r.id,
        code: r.calculator_code,
        agent: getAgentDisplay(r),
        date: getCodeTimestamp(r),
        from,
        to,
        mid,
      })
    }
    out.sort((a, b) => b.mid - a.mid)
    return out
  }, [rows])

  return (
    <div className="dash-prezes-page">
      {err ? (
        <p className="error" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          {err}
        </p>
      ) : null}

      <section className="dash-prezes-kpi" aria-label="Podsumowanie kosztów">
        <div className="dash-prezes-stat">
          <p className="dash-prezes-stat__label">Suma szacunków („do” lub „od”)</p>
          <p className="dash-prezes-stat__value">{formatMoney(aggregates.sumTotalMid)}</p>
          <p className="dash-prezes-stat__hint">Z wycen zapisanych przez rzeczoznawców</p>
        </div>
        <div className="dash-prezes-stat">
          <p className="dash-prezes-stat__label">Średnia na umowę z wyceną</p>
          <p className="dash-prezes-stat__value">{formatMoney(aggregates.avgEstimate)}</p>
          <p className="dash-prezes-stat__hint">
            {aggregates.countWithEstimate ? `${aggregates.countWithEstimate} pozycji` : 'Brak danych'}
          </p>
        </div>
      </section>

      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Ranking umów po szacunku</h2>
        </div>
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          Wartości z pola <code>rzeczoznawca_fields</code> (cena całkowita). Porównania biznesowe wymagają jednostek —
          tu pokazujemy surowe liczby z formularza.
        </p>
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Kod</th>
                  <th scope="col">Handlowiec</th>
                  <th scope="col">Data (kod)</th>
                  <th scope="col">Cena od</th>
                  <th scope="col">Cena do</th>
                  <th scope="col">Do rankingu</th>
                </tr>
              </thead>
              <tbody>
                {withEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      Brak zapisanych wycen całkowitych w danych rzeczoznawcy.
                    </td>
                  </tr>
                ) : (
                  withEstimates.slice(0, 80).map((x) => (
                    <tr key={x.id}>
                      <td>{x.code ? <code>{x.code}</code> : <span className="dash-muted">—</span>}</td>
                      <td>{x.agent || <span className="dash-muted">—</span>}</td>
                      <td>{formatDt(x.date)}</td>
                      <td>{x.from != null ? formatMoney(x.from) : '—'}</td>
                      <td>{x.to != null ? formatMoney(x.to) : '—'}</td>
                      <td>{formatMoney(x.mid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
