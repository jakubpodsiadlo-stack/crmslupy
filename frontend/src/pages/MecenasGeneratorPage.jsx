import { MecenasLayout } from '../layouts/MecenasLayout'

export function MecenasGeneratorPage() {
  return (
    <MecenasLayout title="Generator dokumentów">
      <section className="dash-panel" style={{ maxWidth: '48rem' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Generator dokumentów</h2>
        </div>
        <p className="dash-muted" style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
          Miejsce na narzędzie do tworzenia pism i szablonów pod kancelarię. Funkcja zostanie podpięta w kolejnym
          kroku (np. szablony DOCX/PDF, merge z danymi umowy).
        </p>
      </section>
    </MecenasLayout>
  )
}
