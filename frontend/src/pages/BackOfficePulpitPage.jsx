import { useEffect, useMemo, useState } from 'react'
import { BackOfficeLayout } from '../layouts/BackOfficeLayout'
import { countBackOfficeUmowyPipeline, formatSupabaseError } from '../lib/firstLeadQueries'
import { supabase } from '../lib/supabase'

const nf = new Intl.NumberFormat('pl-PL')

function fmtVal(v) {
  return typeof v === 'number' ? nf.format(v) : v
}

export function BackOfficePulpitPage() {
  const [umowyActive, setUmowyActive] = useState(null)
  const [umowyPending, setUmowyPending] = useState(null)
  const [umowyLoading, setUmowyLoading] = useState(true)
  const [umowyErr, setUmowyErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setUmowyLoading(true)
      setUmowyErr(null)
      const { activeCount, pendingAcceptanceCount, error } = await countBackOfficeUmowyPipeline(supabase)
      if (cancelled) return
      setUmowyLoading(false)
      if (error) {
        setUmowyErr(formatSupabaseError(error))
        setUmowyActive(null)
        setUmowyPending(null)
        return
      }
      setUmowyActive(activeCount)
      setUmowyPending(pendingAcceptanceCount)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const umowyKpi = useMemo(() => {
    const dash = '—'
    if (umowyLoading || umowyErr) {
      return {
        title: 'Umowy w obiegu',
        left: { v: dash, l: 'Aktywne' },
        right: { v: dash, l: 'Do akceptacji' },
      }
    }
    return {
      title: 'Umowy w obiegu',
      left: { v: umowyActive ?? 0, l: 'Aktywne' },
      right: { v: umowyPending ?? 0, l: 'Do akceptacji' },
    }
  }, [umowyLoading, umowyErr, umowyActive, umowyPending])

  const otherKpi = useMemo(
    () => [
      { title: 'Faktury (miesiąc)', left: { v: 156, l: 'Wystawione' }, right: { v: 12, l: 'Oczekujące' } },
      { title: 'Zgłoszenia od infolinii', left: { v: 23, l: 'Tydzień' }, right: { v: 5, l: 'Nowe dziś' } },
      { title: 'SLA dokumentów', left: { v: '91%', l: 'Zgodność' }, right: { v: '88%', l: 'Cel' } },
    ],
    [],
  )

  return (
    <BackOfficeLayout title="Pulpit back office">
      {umowyErr ? (
        <p className="error" style={{ margin: '0 0 1rem', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
          {umowyErr}
        </p>
      ) : null}
      <section className="dash__grid-kpi" aria-label="Wskaźniki back office">
        <article key={umowyKpi.title} className="dash-kpi">
          <h2 className="dash-kpi__title">{umowyKpi.title}</h2>
          <div className="dash-kpi__row">
            <div>
              <p className="dash-kpi__val">{fmtVal(umowyKpi.left.v)}</p>
              <p className="dash-kpi__lbl">{umowyKpi.left.l}</p>
            </div>
            <div>
              <p className="dash-kpi__val">{fmtVal(umowyKpi.right.v)}</p>
              <p className="dash-kpi__lbl">{umowyKpi.right.l}</p>
            </div>
          </div>
        </article>
        {otherKpi.map((k) => (
          <article key={k.title} className="dash-kpi">
            <h2 className="dash-kpi__title">{k.title}</h2>
            <div className="dash-kpi__row">
              <div>
                <p className="dash-kpi__val">{fmtVal(k.left.v)}</p>
                <p className="dash-kpi__lbl">{k.left.l}</p>
              </div>
              <div>
                <p className="dash-kpi__val">{fmtVal(k.right.v)}</p>
                <p className="dash-kpi__lbl">{k.right.l}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="dash-panel" style={{ marginTop: '1.25rem', maxWidth: 640 }}>
        <h2 className="dash-panel__title">Następne kroki</h2>
        <ul className="dash-list" style={{ margin: 0 }}>
          <li>
            <span className="dash-muted">Integracja z tabelami ERP / umów</span>
          </li>
          <li>
            <span className="dash-muted">Lista zadań i przydziały (Moje / Wszystkie)</span>
          </li>
          <li>
            <span className="dash-muted">Raporty eksportowalne (CSV / PDF)</span>
          </li>
        </ul>
      </section>
    </BackOfficeLayout>
  )
}
