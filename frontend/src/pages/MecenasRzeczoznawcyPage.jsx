import { useCallback, useEffect, useState } from 'react'
import { IconX } from '../components/icons/CodeModalIcons'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { MecenasLayout } from '../layouts/MecenasLayout'
import { supabase } from '../lib/supabase'

function formatDt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

export function MecenasRzeczoznawcyPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    const { data, error } = await supabase.rpc('list_rzeczoznawcy_for_mecenas')
    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    setRows(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <MecenasLayout title="Rzeczoznawcy">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Rzeczoznawcy</h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem', maxWidth: '52rem' }}>
          Lista kont z rolą rzeczoznawcy — <strong>tylko podgląd</strong> (bez edycji profilu z tego panelu).
        </p>
        {err ? (
          <p className="error" style={{ marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
            {err}
          </p>
        ) : null}
        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Imię i nazwisko</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Telefon</th>
                  <th scope="col">Profil od</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      Brak rzeczoznawców w systemie (lub brak uprawnień do listy).
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.full_name?.trim() ? r.full_name : <span className="dash-muted">—</span>}</td>
                      <td>
                        {r.email?.trim() ? (
                          <a href={`mailto:${r.email}`}>{r.email}</a>
                        ) : (
                          <span className="dash-muted">—</span>
                        )}
                      </td>
                      <td>
                        {r.phone?.trim() ? (
                          <a href={`tel:${r.phone.replace(/\s/g, '')}`}>{r.phone}</a>
                        ) : (
                          <span className="dash-muted">—</span>
                        )}
                      </td>
                      <td>{formatDt(r.created_at)}</td>
                      <td>
                        <button type="button" className="dash-table__btn" onClick={() => setSelected(r)}>
                          Podgląd
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected ? (
        <div
          className="dash-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
        >
          <div className="dash-modal" role="dialog" aria-modal="true" aria-labelledby="mecenas-rzecz-preview-title">
            <header className="dash-modal__head" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <h2 id="mecenas-rzecz-preview-title" style={{ flex: 1 }}>
                Rzeczoznawca — podgląd
              </h2>
              <button
                type="button"
                className="dash-code-modal__close"
                onClick={() => setSelected(null)}
                aria-label="Zamknij"
              >
                <IconX size={22} />
              </button>
            </header>
            <div className="dash-modal__body" style={{ paddingTop: '0.5rem' }}>
              <dl style={{ margin: 0, display: 'grid', gap: '0.65rem' }}>
                <div>
                  <dt className="dash-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                    Imię i nazwisko
                  </dt>
                  <dd style={{ margin: 0 }}>{selected.full_name?.trim() || '—'}</dd>
                </div>
                <div>
                  <dt className="dash-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                    E-mail
                  </dt>
                  <dd style={{ margin: 0 }}>
                    {selected.email?.trim() ? (
                      <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="dash-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                    Telefon
                  </dt>
                  <dd style={{ margin: 0 }}>
                    {selected.phone?.trim() ? (
                      <a href={`tel:${selected.phone.replace(/\s/g, '')}`}>{selected.phone}</a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="dash-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                    Identyfikator konta
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <code style={{ fontSize: '0.85rem' }}>{selected.id}</code>
                  </dd>
                </div>
                <div>
                  <dt className="dash-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                    Profil utworzono
                  </dt>
                  <dd style={{ margin: 0 }}>{formatDt(selected.created_at)}</dd>
                </div>
              </dl>
              <p className="dash-muted" style={{ margin: '1rem 0 0', fontSize: '0.85rem' }}>
                Edycja danych użytkownika odbywa się poza tym panelem (administrator / przyszły moduł ustawień).
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </MecenasLayout>
  )
}
