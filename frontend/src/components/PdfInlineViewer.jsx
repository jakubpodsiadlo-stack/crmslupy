import { useEffect, useState } from 'react'

function isHttpOrHttpsUrl(u) {
  try {
    const parsed = new URL(u)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function contentTypeLooksWrongForPdf(ct) {
  if (!ct) return false
  const lower = ct.toLowerCase()
  if (lower.includes('pdf')) return false
  if (lower.includes('octet-stream')) return false
  return lower.startsWith('text/') || lower.includes('html')
}

/**
 * Podgląd PDF przez wbudowany viewer przeglądarki (Edge/Chrome) — iframe.
 * Wysokość dopasowana do ciemnego obszaru kolumny (flex); zoom na obudowie (.pdf-native-shell).
 */
export function PdfInlineViewer({ url, title }) {
  const [probe, setProbe] = useState({
    phase: 'idle',
    status: null,
    ok: null,
    contentType: null,
  })

  useEffect(() => {
    if (!url || !isHttpOrHttpsUrl(url)) {
      setProbe({ phase: 'skipped', status: null, ok: null, contentType: null })
      return
    }

    let cancelled = false
    const ac = new AbortController()
    setProbe({ phase: 'loading', status: null, ok: null, contentType: null })

    fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
      signal: ac.signal,
    })
      .then((res) => {
        if (cancelled) return
        setProbe({
          phase: 'done',
          status: res.status,
          ok: res.ok,
          contentType: res.headers.get('content-type'),
        })
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setProbe({ phase: 'unavailable', status: null, ok: null, contentType: null })
      })

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [url])

  if (!url) {
    return (
      <div className="bo-files-layout__pdf-fallback">
        <p className="dash-muted" style={{ margin: 0 }}>
          Brak adresu pliku PDF.
        </p>
      </div>
    )
  }

  const showHttpHint =
    probe.phase === 'done' && probe.status != null && probe.ok === false
  const showTypeHint =
    probe.phase === 'done' &&
    probe.ok === true &&
    contentTypeLooksWrongForPdf(probe.contentType)

  return (
    <div className="bo-files-layout__pdf-frame-wrap bo-files-layout__pdf-frame-wrap--native">
      <div className="bo-files-layout__pdf-canvas-scroll">
        <div className="bo-files-layout__pdf-native-toolbar">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="dash__btn-primary bo-files-layout__pdf-native-toolbar__open"
          >
            Otwórz w nowej karcie
          </a>
          {probe.phase === 'loading' ? (
            <span className="bo-files-layout__pdf-native-toolbar__muted">Sprawdzanie adresu…</span>
          ) : null}
          {showHttpHint ? (
            <p className="bo-files-layout__pdf-native-toolbar__warn" role="status">
              Serwer zwrócił HTTP {probe.status}. Podgląd w ramce może nie działać — użyj „Otwórz w nowej
              karcie”.
            </p>
          ) : null}
          {probe.phase === 'unavailable' ? (
            <p className="bo-files-layout__pdf-native-toolbar__hint" role="status">
              Nie udało się sprawdzić adresu z przeglądarki (np. polityka CORS). Jeśli ramka jest pusta, otwórz
              plik w nowej karcie.
            </p>
          ) : null}
          {showTypeHint ? (
            <p className="bo-files-layout__pdf-native-toolbar__hint" role="status">
              Typ odpowiedzi: {probe.contentType || 'nieznany'} — oczekiwany PDF.
            </p>
          ) : null}
        </div>
        <div className="bo-files-layout__pdf-native-viewport">
          <div className="bo-files-layout__pdf-native-shell">
            <iframe
              key={url}
              title={title || 'Podgląd PDF'}
              src={url}
              className="bo-files-layout__pdf-native-iframe"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
