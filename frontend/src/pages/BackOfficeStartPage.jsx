import { BackOfficeLayout } from '../layouts/BackOfficeLayout'

export function BackOfficeStartPage() {
  return (
    <BackOfficeLayout title="Back office">
      <section className="dash-panel" style={{ maxWidth: 720 }}>
        <h2 className="dash-funnel__title" style={{ marginBottom: '0.75rem' }}>
          Witaj w panelu back office
        </h2>
        <p style={{ margin: 0, color: 'var(--dash-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          <strong>Umowy</strong> — kolejka po weryfikacji infolinii. Po oznaczeniu jako zweryfikowanej w BO wpis trafia do{' '}
          <strong>Archiwum umów</strong>. W podglądzie: zakładka <strong>Dodaj pliki</strong> (OCR, Cloudinary, dane
          klienta). <strong>Pulpit</strong> — zbiorczy podgląd (przykładowe dane).
        </p>
      </section>
    </BackOfficeLayout>
  )
}
