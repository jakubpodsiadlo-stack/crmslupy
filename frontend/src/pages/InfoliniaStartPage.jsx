import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getCodeTimestamp, getVerificationLabel } from '../lib/firstLeadDisplay'
import { fetchFirstLeadsWithCalculator, formatSupabaseError } from '../lib/firstLeadQueries'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { supabase } from '../lib/supabase'

const PIE_COLORS = ['#22d3ee', '#94a3b8']
const tipStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
}

function fmtInt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function isToday(isoLike) {
  if (!isoLike) return false
  const d = new Date(isoLike)
  if (Number.isNaN(d.getTime())) return false
  const t = new Date()
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

export function InfoliniaStartPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const { rows: data, error } = await fetchFirstLeadsWithCalculator(supabase, { archived: false })
    setLoading(false)
    if (error) {
      setErr(formatSupabaseError(error))
      setRows([])
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    let verified = 0
    let unverified = 0
    let codesToday = 0
    let verifiedToday = 0
    let unverifiedToday = 0
    for (const row of rows) {
      const isVerified = getVerificationLabel(row) === 'zweryfikowany'
      if (isVerified) verified += 1
      else unverified += 1
      const ts = getCodeTimestamp(row)
      if (isToday(ts)) {
        codesToday += 1
        if (isVerified) verifiedToday += 1
        else unverifiedToday += 1
      }
    }
    return { verified, unverified, total: rows.length, codesToday, verifiedToday, unverifiedToday }
  }, [rows])

  const pieData = useMemo(
    () => [
      { name: 'Zweryfikowane', value: stats.verified },
      { name: 'Niezweryfikowane', value: stats.unverified },
    ],
    [stats.verified, stats.unverified],
  )

  const todayBarData = useMemo(
    () => [
      { name: 'Dziś', zweryfikowane: stats.verifiedToday, niezweryfikowane: stats.unverifiedToday },
    ],
    [stats.verifiedToday, stats.unverifiedToday],
  )

  return (
    <DashboardLayout title="Start">
      <section className="dash-panel" style={{ maxWidth: '100%' }}>
        <div className="dash-panel__head">
          <h2 className="dash-funnel__title" style={{ marginBottom: 0 }}>
            Start infolinii
          </h2>
          <button type="button" className="dash-table__btn" onClick={() => load()} disabled={loading}>
            Odśwież
          </button>
        </div>
        <p className="dash-muted" style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>
          Szybki podgląd jakości i tempa pracy: statusy kodów oraz ile kodów weszło dzisiaj.
        </p>
        {err ? (
          <p className="error" style={{ marginBottom: '0.75rem' }}>
            {err}
          </p>
        ) : null}
        <div className="dash-start-kpi">
          <article className="dash-start-kpi__card">
            <p className="dash-start-kpi__label">Kody aktywne</p>
            <p className="dash-start-kpi__value">{fmtInt(stats.total)}</p>
          </article>
          <article className="dash-start-kpi__card">
            <p className="dash-start-kpi__label">Zweryfikowane</p>
            <p className="dash-start-kpi__value">{fmtInt(stats.verified)}</p>
          </article>
          <article className="dash-start-kpi__card">
            <p className="dash-start-kpi__label">Niezweryfikowane</p>
            <p className="dash-start-kpi__value">{fmtInt(stats.unverified)}</p>
          </article>
          <article className="dash-start-kpi__card">
            <p className="dash-start-kpi__label">Kodów dziś</p>
            <p className="dash-start-kpi__value">{fmtInt(stats.codesToday)}</p>
          </article>
        </div>
        <div className="dash-start-charts">
          <article className="dash-start-chart">
            <h3 className="dash-start-chart__title">Zweryfikowane vs niezweryfikowane</h3>
            <div className="dash-start-chart__plot">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={82}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="dash-start-chart">
            <h3 className="dash-start-chart__title">Kody dziś</h3>
            <div className="dash-start-chart__plot">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todayBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="zweryfikowane" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="niezweryfikowane" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>
    </DashboardLayout>
  )
}
