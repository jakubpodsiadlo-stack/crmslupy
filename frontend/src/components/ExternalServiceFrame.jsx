/**
 * Osadzenie zewnętrznej usługi (Geoportal itd.). Część serwisów blokuje iframe — wtedy link w nowej karcie.
 */
export function ExternalServiceFrame({ heading, iframeTitle, src, children }) {
  return (
    <section className="dash-panel" style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {heading ? <h2 className="dash-panel__title dash-panel__title--kody">{heading}</h2> : null}
      {children}
      <div
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid color-mix(in srgb, var(--dash-border, #2a2f3a) 80%, transparent)',
          background: 'var(--dash-surface-2, #151922)',
        }}
      >
        <iframe
          title={iframeTitle}
          src={src}
          style={{
            display: 'block',
            width: '100%',
            height: 'min(72vh, 900px)',
            border: 'none',
          }}
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
      </div>
      <p className="dash-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
        Jeśli mapa się nie wczytuje (blokada ramki po stronie serwisu),{' '}
        <a href={src} target="_blank" rel="noopener noreferrer">
          otwórz w nowej karcie
        </a>
        .
      </p>
    </section>
  )
}
