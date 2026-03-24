import { BackOfficeLayout } from '../layouts/BackOfficeLayout'

export function BackOfficeZadaniaPage() {
  return (
    <BackOfficeLayout title="Zadania">
      <section className="dash-panel" style={{ maxWidth: 720 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Zadania back office
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Tu pojawi się lista zadań dla zespołu back office. Zakładka została dodana do menu pod pozycją{' '}
          <strong>Archiwum umów</strong>.
        </p>
      </section>
    </BackOfficeLayout>
  )
}
