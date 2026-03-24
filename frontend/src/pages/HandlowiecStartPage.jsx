import { HandlowiecLayout } from '../layouts/HandlowiecLayout'

export function HandlowiecStartPage() {
  return (
    <HandlowiecLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: 720 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Panel handlowca
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          W <strong>Moje umowy</strong> masz listę zgłoszeń / umów powiązanych z Tobą jako handlowcem (zgodność z{' '}
          <strong>imię i nazwisko</strong> w profilu i polem handlowiec w systemie). Podgląd umowy jest{' '}
          <strong>tylko do odczytu</strong> — weryfikacja i edycja danych klienta to infolinia i back office. W{' '}
          <strong>Moje punkty</strong> widzisz podsumowanie: <strong>100 pkt</strong> za każdą umowę po weryfikacji przez
          back office oraz <strong>nagrody</strong> m.in. przy <strong>30{'\u00a0'}000 pkt</strong> (Zontes C2125) i{' '}
          <strong>10{'\u00a0'}000{'\u00a0'}000 pkt</strong> (McLaren — najnowszy model, galeria zdjęć).
        </p>
      </section>
    </HandlowiecLayout>
  )
}
