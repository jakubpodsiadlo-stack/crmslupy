import { DashboardLayout } from '../layouts/DashboardLayout'

const nf = new Intl.NumberFormat('pl-PL')

const KPI = [
  { title: 'Połączenia odebrane', left: { v: 128, l: 'Dziś' }, right: { v: 142, l: 'Cel' } },
  { title: 'Średni czas rozmowy', left: { v: '4:12', l: 'Minuty' }, right: { v: '5:00', l: 'Limit' } },
  { title: 'W poczekalni', left: { v: 3, l: 'Teraz' }, right: { v: 0, l: 'Max SLA' } },
  { title: 'E-maile obsłużone', left: { v: 44, l: 'Dziś' }, right: { v: 50, l: 'Cel' } },
  { title: 'SLA pierwszej odpowiedzi', left: { v: '94%', l: 'Zgodność' }, right: { v: '90%', l: 'Cel' } },
  { title: 'Zgłoszenia zamknięte', left: { v: 89, l: 'Dziś' }, right: { v: 76, l: 'Wczoraj' } },
]

const NOTIFS = [
  { who: 'Anna K.', what: 'przekazała ticket #4821 z leadem premium' },
  { who: 'System', what: 'przekroczono czas oczekiwania w kolejce — priorytet' },
  { who: 'Marek T.', what: 'zapisał notatkę do kontaktu Energa SA' },
]

const MAILS = [
  { who: 'noreply@urzad.pl', what: 'Potwierdzenie zgłoszenia — ref. ZG/2025/883' },
  { who: 'handel@partner.pl', what: 'Prośba o wycenę instalacji PV 40 kWp' },
  { who: 'biuro@klient.eu', what: 'FW: Umowa OZE — termin do piątku' },
]

const FUNNEL = [
  { name: 'Kolejka wejściowa', sum: '128 400 zł', count: 24, bg: '#f87171' },
  { name: 'Pierwszy kontakt', sum: '96 200 zł', count: 18, bg: '#fb923c' },
  { name: 'Kwalifikacja', sum: '74 900 zł', count: 14, bg: '#fbbf24' },
  { name: 'Rozwiązanie / oferta', sum: '51 300 zł', count: 9, bg: '#22d3ee' },
  { name: 'Zamknięte dziś', sum: '38 100 zł', count: 7, bg: '#6366f1' },
]

function fmtVal(v) {
  return typeof v === 'number' ? nf.format(v) : v
}

export function InfoliniaPanel() {
  return (
    <DashboardLayout title="Panel infolinii">
      <section className="dash__grid-kpi" aria-label="Wskaźniki">
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

      <div className="dash__grid-bottom">
        <div className="dash-panel">
          <div className="dash-panel__head">
            <h2 className="dash-panel__title">
              Nowe powiadomienia
              <span className="dash-badge" aria-label="nieprzeczytane">
                3
              </span>
            </h2>
            <a className="dash-panel__link" href="#">
              Zobacz wszystkie
            </a>
          </div>
          <ul className="dash-list">
            {NOTIFS.map((n, i) => (
              <li key={i}>
                <a href="#">{n.who}</a> <span className="dash-muted">— {n.what}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-panel">
          <div className="dash-panel__head">
            <h2 className="dash-panel__title">
              Nowe wiadomości
              <span className="dash-badge" aria-label="nieprzeczytane">
                5
              </span>
            </h2>
            <a className="dash-panel__link" href="#">
              Zobacz wszystkie
            </a>
          </div>
          <ul className="dash-list">
            {MAILS.map((m, i) => (
              <li key={i}>
                <a href="#">{m.who}</a> <span className="dash-muted">— {m.what}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-panel">
          <h2 className="dash-funnel__title">Proces obsługi zgłoszeń</h2>
          {FUNNEL.map((f) => (
            <div key={f.name} className="dash-funnel__item">
              <div className="dash-funnel__bar" style={{ background: f.bg }}>
                <span>{f.name}</span>
                <span>{f.sum}</span>
              </div>
              <div className="dash-funnel__meta">
                <span>Liczba: {f.count}</span>
                <span>Suma: {f.sum}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
