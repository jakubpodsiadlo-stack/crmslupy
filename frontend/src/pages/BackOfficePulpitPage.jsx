import { BackOfficeLayout } from '../layouts/BackOfficeLayout'

const nf = new Intl.NumberFormat('pl-PL')

const KPI = [
  { title: 'Umowy w obiegu', left: { v: 42, l: 'Aktywne' }, right: { v: 8, l: 'Do akceptacji' } },
  { title: 'Faktury (miesiąc)', left: { v: 156, l: 'Wystawione' }, right: { v: 12, l: 'Oczekujące' } },
  { title: 'Zgłoszenia od infolinii', left: { v: 23, l: 'Tydzień' }, right: { v: 5, l: 'Nowe dziś' } },
  { title: 'SLA dokumentów', left: { v: '91%', l: 'Zgodność' }, right: { v: '88%', l: 'Cel' } },
]

function fmtVal(v) {
  return typeof v === 'number' ? nf.format(v) : v
}

export function BackOfficePulpitPage() {
  return (
    <BackOfficeLayout title="Pulpit back office">
      <p className="dash-muted" style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', maxWidth: '40rem' }}>
        Poniższe liczby są <strong>przykładowe</strong> — podłączymy je pod rzeczywiste źródła danych.
      </p>
      <section className="dash__grid-kpi" aria-label="Wskaźniki back office">
        {KPI.map((k) => (
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
