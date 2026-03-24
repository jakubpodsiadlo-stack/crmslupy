import { DashboardLayout } from '../layouts/DashboardLayout'

export function InfoliniaStartPage() {
  return (
    <DashboardLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: 640 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Witaj w module infolinii
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Wybierz pozycję w menu po lewej: <strong>Panel infolinii</strong> — podgląd wskaźników i zgłoszeń,{' '}
          <strong>Odczyt kodów</strong> — narzędzie do kodów (w budowie).
        </p>
      </section>
    </DashboardLayout>
  )
}
