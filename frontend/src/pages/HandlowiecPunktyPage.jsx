import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { FirstLeadDetailModal } from '../components/FirstLeadDetailModal'
import { fetchLeadsForSalesAgent } from '../lib/fetchHandlowiecLeads'
import {
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getVerificationLabel,
  isBackofficeVerifiedForHandlowiecPoints,
} from '../lib/firstLeadDisplay'
import { useModalSessionRestoreGate } from '../lib/useModalSessionRestoreGate'
import { formatSupabaseError } from '../lib/firstLeadQueries'
import { HandlowiecLayout } from '../layouts/HandlowiecLayout'
import { supabase } from '../lib/supabase'

const PKT_ZA_UMOWE_BO = 100

const NAGRODY = [
  {
    prog: 30_000,
    tytul: 'Zontes C2125',
    opis: 'Motocykl Zontes C2125 po osiągnięciu progu punktowego. Zdjęcie: linia Zontes (wizualizacja stylu nagrody).',
    zdjecia: [
      {
        src: `${import.meta.env.BASE_URL}rewards/zontes.png`,
        alt: 'Motocykl Zontes — wizualizacja nagrody (program: C2125)',
      },
    ],
  },
  {
    prog: 10_000_000,
    tytul: 'McLaren 600LT',
    opis: 'McLaren 600LT po osiągnięciu progu punktowego — zdjęcie studyjne modelu.',
    zdjecia: [
      {
        src: `${import.meta.env.BASE_URL}rewards/mclaren-600lt.png`,
        alt: 'McLaren 600LT — widok z tyłu',
      },
    ],
  },
]

function formatPkt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function formatDt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function VerificationPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'}>
      {ok ? 'Infolinia OK' : 'Infolinia — oczekuje'}
    </span>
  )
}

function missingEnvHint() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key) return null
  return 'Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w pliku frontend/.env i zrestartuj Vite (npm run dev).'
}

export function HandlowiecPunktyPage() {
  const location = useLocation()
  const restoreModalOnce = useModalSessionRestoreGate(location.pathname)
  const { profile } = useAuth()
  const agentName = profile?.full_name?.trim() ?? ''

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [mergeWarning, setMergeWarning] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    setMergeWarning(null)
    setLoading(true)

    const envHint = missingEnvHint()
    if (envHint) {
      setLoading(false)
      setErr(envHint)
      setRows([])
      return
    }

    const { rows: data, error, mergeWarning: warn } = await fetchLeadsForSalesAgent(supabase, agentName)

    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    setRows(data)
    setSelected((prev) => {
      if (prev?.id) {
        const next = data.find((r) => r.id === prev.id)
        return next ?? null
      }
      return restoreModalOnce(data)
    })
    if (warn) setMergeWarning(warn)
  }, [agentName, location.pathname, restoreModalOnce])

  useEffect(() => {
    load()
  }, [load])

  const punktyRows = useMemo(
    () => rows.filter((r) => isBackofficeVerifiedForHandlowiecPoints(r)),
    [rows],
  )
  const sumaPunktow = punktyRows.length * PKT_ZA_UMOWE_BO

  const nagrodyPosortowane = useMemo(() => [...NAGRODY].sort((a, b) => a.prog - b.prog), [])

  return (
    <HandlowiecLayout title="Moje punkty">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-panel__title dash-panel__title--kody">Moje punkty</h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>

        {!loading && !err ? (
          <div
            className="dash-panel"
            style={{
              marginBottom: '1.25rem',
              padding: '1.25rem 1.5rem',
              maxWidth: '28rem',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
              border: '1px solid rgba(147, 197, 253, 0.45)',
              borderRadius: '16px',
            }}
          >
            <div className="dash-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Bilans punktów
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--dash-text, #0f172a)', lineHeight: 1.15 }}>
              {sumaPunktow}{' '}
              <span style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.85 }}>pkt</span>
            </div>
            <div className="dash-muted" style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {punktyRows.length} umów z weryfikacją BO × {PKT_ZA_UMOWE_BO} pkt
            </div>
          </div>
        ) : null}

        {!loading && !err ? (
          <section style={{ marginBottom: '1.75rem' }}>
            <h3 className="dash-panel__title dash-panel__title--kody" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
              Nagrody
            </h3>
            <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.88rem', maxWidth: '52rem' }}>
              Zdjęcia pochodzą z <strong>materiałów programu nagród</strong>; ostateczna specyfikacja i odbiór nagrody wg regulaminu w
              momencie wymiany punktów.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '1rem',
                alignItems: 'stretch',
              }}
            >
              {nagrodyPosortowane.map((n) => {
                const odblokowana = sumaPunktow >= n.prog
                const brakuje = Math.max(0, n.prog - sumaPunktow)
                return (
                  <article
                    key={n.prog}
                    style={{
                      border: '1px solid rgba(147, 197, 253, 0.5)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: odblokowana
                        ? 'linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, rgba(255,255,255,0.5) 100%)'
                        : 'rgba(255,255,255,0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(147, 197, 253, 0.35)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--dash-text, #0f172a)' }}>{n.tytul}</div>
                          <div className="dash-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Próg: <strong>{formatPkt(n.prog)} pkt</strong>
                          </div>
                        </div>
                        <span
                          className={odblokowana ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'}
                          style={{ flexShrink: 0 }}
                        >
                          {odblokowana ? 'Próg zdobyty' : 'Zablokowane'}
                        </span>
                      </div>
                      <p className="dash-muted" style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
                        {n.opis}
                      </p>
                      {!odblokowana ? (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--dash-muted)' }}>
                          Brakuje <strong>{formatPkt(brakuje)} pkt</strong>.
                        </p>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        overflowX: 'auto',
                        flex: 1,
                        alignItems: 'stretch',
                        background: 'rgba(241, 245, 249, 0.6)',
                      }}
                    >
                      {n.zdjecia.map((z, i) => (
                        <figure
                          key={i}
                          style={{
                            margin: 0,
                            minWidth: n.zdjecia.length > 1 ? 'min(72%, 260px)' : '100%',
                            flex: n.zdjecia.length > 1 ? '0 0 auto' : '1 1 auto',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                          }}
                        >
                          <img
                            src={z.src}
                            alt={z.alt}
                            loading="lazy"
                            style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                          />
                        </figure>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {err ? (
          <p className="error" style={{ marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
            {err}
          </p>
        ) : null}
        {mergeWarning ? (
          <p className="dash-muted" style={{ marginBottom: '0.75rem', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
            {mergeWarning}
          </p>
        ) : null}

        {loading ? (
          <p className="dash-muted">Ładowanie…</p>
        ) : !err ? (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Data (kod)</th>
                  <th scope="col">Kod</th>
                  <th scope="col">Infolinia</th>
                  <th scope="col">BO</th>
                  <th scope="col">Punkty</th>
                  <th scope="col" style={{ width: '1%' }}>
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {punktyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="dash-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      Brak umów z weryfikacją BO — gdy back office dokończy umowę, pojawi się tutaj i dostaniesz {PKT_ZA_UMOWE_BO}{' '}
                      pkt.
                    </td>
                  </tr>
                ) : null}
                {punktyRows.map((row) => {
                  const ver = getVerificationLabel(row)
                  const bo = getBackofficeStatusLabel(row)
                  return (
                    <tr key={row.id}>
                      <td>{formatDt(getCodeTimestamp(row))}</td>
                      <td>
                        {row.calculator_code ? <code>{row.calculator_code}</code> : <span className="dash-muted">—</span>}
                      </td>
                      <td>
                        <VerificationPill status={ver} />
                      </td>
                      <td>
                        <span className="dash-pill dash-pill--ok" title="Back office">
                          BO: {bo === 'zweryfikowany' ? 'gotowe' : bo}
                        </span>
                      </td>
                      <td>
                        <strong>+{PKT_ZA_UMOWE_BO}</strong>
                      </td>
                      <td>
                        <button type="button" className="dash-table__btn" onClick={() => setSelected(row)}>
                          Podgląd
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <FirstLeadDetailModal
        variant="handlowiec"
        open={Boolean(selected)}
        lead={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </HandlowiecLayout>
  )
}
