import { useMemo } from 'react'
import { NavLink, useOutletContext } from 'react-router-dom'
import { getAgentDisplay } from '../lib/firstLeadDisplay'

function formatInt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function PanelCard({ title, accent, previewHref, archiveHref, children }) {
  return (
    <article className={`dash-prezes-panel-card dash-prezes-panel-card--${accent}`}>
      <h3 className="dash-prezes-panel-card__title">{title}</h3>
      <div className="dash-prezes-panel-card__body">{children}</div>
      {previewHref ? (
        <div className="dash-prezes-panel-card__preview">
          <NavLink to={previewHref} className="dash-prezes-panel-card__preview-link">
            Wejdź w podgląd panelu (bez zapisu)
          </NavLink>
          {archiveHref ? (
            <NavLink to={archiveHref} className="dash-prezes-panel-card__preview-link">
              Otwórz archiwum
            </NavLink>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function PrezesPanelePage() {
  const { aggregates, rows, loading, err } = useOutletContext()

  const handlowcyCount = useMemo(() => {
    const s = new Set()
    for (const r of rows) {
      const a = getAgentDisplay(r)?.trim()
      if (a) s.add(a)
    }
    return s.size
  }, [rows])

  return (
    <div className="dash-prezes-page">
      {err ? (
        <p className="error" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          {err}
        </p>
      ) : null}

      <p className="dash-muted" style={{ marginBottom: '1.5rem', maxWidth: '52rem', lineHeight: 1.6 }}>
        Poniżej skrót metryk oraz link <strong>Wejdź w podgląd panelu</strong> — otwierasz prawdziwy widok jak u
        operatora (nawigacja, listy). W szczegółach umów zapis do bazy jest wyłączony; nad treścią pojawi się pasek z
        przyciskiem powrotu do pulpitu prezesa.
      </p>

      {loading ? <p className="dash-muted">Ładowanie…</p> : null}

      <div className="dash-prezes-panel-grid">
        <PanelCard
          title="Infolinia"
          accent="cyan"
          previewHref="/panel/infolinia/start"
          archiveHref="/panel/infolinia/archiwum"
        >
          <p className="dash-prezes-panel-card__metric">{formatInt(aggregates.infoliniaOk)}</p>
          <p className="dash-prezes-panel-card__label">zweryfikowanych leadów</p>
          <p className="dash-prezes-panel-card__meta">
            Oczekuje: <strong>{formatInt(aggregates.infoliniaPending)}</strong> · Aktywnych (nie archiwum):{' '}
            <strong>{formatInt(aggregates.activeInfolinia)}</strong>
          </p>
          <p className="dash-prezes-panel-card__foot">
            W panelu infolinii: lista kodów, archiwum, weryfikacja — tylko rola infolinia / administrator.
          </p>
        </PanelCard>

        <PanelCard
          title="Back office"
          accent="violet"
          previewHref="/panel/back-office"
          archiveHref="/panel/back-office/archiwum-umow"
        >
          <p className="dash-prezes-panel-card__metric">{formatInt(aggregates.boQueue)}</p>
          <p className="dash-prezes-panel-card__label">umów w kolejce BO</p>
          <p className="dash-prezes-panel-card__meta">
            Gotowe BO: <strong>{formatInt(aggregates.boOk)}</strong>
          </p>
          <p className="dash-prezes-panel-card__foot">
            Pulpit BO: weryfikacja dokumentów, pliki klienta — edycja tylko dla backoffice.
          </p>
        </PanelCard>

        <PanelCard title="Handlowiec" accent="emerald" previewHref="/panel/handlowiec">
          <p className="dash-prezes-panel-card__metric">{formatInt(handlowcyCount)}</p>
          <p className="dash-prezes-panel-card__label">unikalnych handlowców (pole na leadzie)</p>
          <p className="dash-prezes-panel-card__meta">
            Umowy łącznie w bazie: <strong>{formatInt(aggregates.total)}</strong>
          </p>
          <p className="dash-prezes-panel-card__foot">
            Panel handlowca: własne umowy i punkty — filtrowane po profilu.
          </p>
        </PanelCard>

        <PanelCard title="Dyrektor" accent="amber" previewHref="/panel/dyrektor">
          <p className="dash-prezes-panel-card__metric">{formatInt(aggregates.total)}</p>
          <p className="dash-prezes-panel-card__label">wszystkie umowy (podgląd zespołu)</p>
          <p className="dash-prezes-panel-card__meta">
            Top handlowiec w rankingu:{' '}
            <strong>{aggregates.topAgents[0]?.name ?? '—'}</strong>
            {aggregates.topAgents[0] ? ` (${aggregates.topAgents[0].umowy})` : null}
          </p>
          <p className="dash-prezes-panel-card__foot">
            Dyrektor widzi pełną listę i punkty zespołu — tutaj tylko zbiorczy obraz.
          </p>
        </PanelCard>

        <PanelCard title="Rzeczoznawca" accent="rose" previewHref="/panel/rzeczoznawca">
          <p className="dash-prezes-panel-card__metric">{formatInt(aggregates.rzeczForBo['w trakcie weryfikacji'])}</p>
          <p className="dash-prezes-panel-card__label">w trakcie weryfikacji (BO gotowe)</p>
          <p className="dash-prezes-panel-card__meta">
            Dostarczono: <strong>{formatInt(aggregates.rzeczForBo['dostarczono'])}</strong> · Do kancelarii:{' '}
            <strong>{formatInt(aggregates.rzeczForBo['przekazano do kancelarii'])}</strong>
          </p>
          <p className="dash-prezes-panel-card__foot">
            Panel rzeczoznawcy: statusy, pliki umowy, wycena — edycja tylko dla roli rzeczoznawca.
          </p>
        </PanelCard>

        <PanelCard title="Mecenas / kancelaria" accent="slate" previewHref="/panel/mecenas">
          <p className="dash-prezes-panel-card__metric">{formatInt(aggregates.kancelaria)}</p>
          <p className="dash-prezes-panel-card__label">umów „przekazano do kancelarii”</p>
          <p className="dash-prezes-panel-card__meta">
            Kolejka do rozpatrzenia przez kancelarię (wg statusu rzeczoznawcy).
          </p>
          <p className="dash-prezes-panel-card__foot">
            Panel mecenasa: umowy z tego statusu, lista rzeczoznawców, kalendarz — podgląd bez zapisu operacji.
          </p>
        </PanelCard>
      </div>
    </div>
  )
}
