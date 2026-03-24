import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaStartPage() {
  return (
    <RzeczoznawcaLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: 720 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Panel rzeczoznawcy
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          W <strong>Umowy</strong> — lista z <strong>gotowym BO</strong>, podzakładki: dostarczone / weryfikacja / kancelaria;
          w <strong>Podgląd</strong> zakładka{' '}
          <strong>Rzeczoznawca</strong> z kalkulatorem wyceny (bez kodów 6-cyfrowych). Status w tabeli lub w nagłówku
          podglądu. <strong>Kalendarz</strong> — widok miesiąca. <strong>Geoportal 2</strong> i <strong>NCR</strong> —
          mapy. Pliki i BO — back office / infolinia.
        </p>
      </section>
    </RzeczoznawcaLayout>
  )
}
