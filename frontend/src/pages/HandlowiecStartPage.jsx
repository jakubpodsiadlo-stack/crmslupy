import { HandlowiecLayout } from '../layouts/HandlowiecLayout'

export function HandlowiecStartPage() {
  return (
    <HandlowiecLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: 720 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Panel handlowca
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          W <strong>Moje punkty</strong> widzisz bilans i <strong>nagrody</strong> m.in. przy{' '}
          <strong>30{'\u00a0'}000 pkt</strong> (Zontes C2125) i{' '}
          <strong>10{'\u00a0'}000{'\u00a0'}000 pkt</strong> (McLaren — najnowszy model, galeria zdjęć).
        </p>
      </section>
    </HandlowiecLayout>
  )
}
