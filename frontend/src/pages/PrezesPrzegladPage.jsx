import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { pieDataBo, pieDataInfolinia, pieDataRzecz } from '../lib/prezesAnalytics'

const CHART_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#818cf8', '#2dd4bf', '#fcd34d']

const tipStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
}

function StatCard({ label, value, hint }) {
  return (
    <div className="dash-prezes-stat">
      <p className="dash-prezes-stat__label">{label}</p>
      <p className="dash-prezes-stat__value">{value}</p>
      {hint ? <p className="dash-prezes-stat__hint">{hint}</p> : null}
    </div>
  )
}

function formatInt(n) {
  try {
    return new Intl.NumberFormat('pl-PL').format(n)
  } catch {
    return String(n)
  }
}

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) return '—'
  try {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n) + ' zł'
  } catch {
    return String(Math.round(n)) + ' zł'
  }
}

export function PrezesPrzegladPage() {
  const { loading, err, mergeWarning, aggregates } = useOutletContext()

  const pieIn = useMemo(() => pieDataInfolinia(aggregates), [aggregates])
  const pieBo = useMemo(() => pieDataBo(aggregates), [aggregates])
  const pieRz = useMemo(() => pieDataRzecz(aggregates), [aggregates])

  if (loading && aggregates.total === 0) {
    return <p className="dash-muted">Ładowanie danych…</p>
  }

  return (
    <div className="dash-prezes-page">
      {err ? (
        <p className="error" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          {err}
        </p>
      ) : null}
      {mergeWarning ? (
        <p className="dash-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
          {mergeWarning}
        </p>
      ) : null}

      <section className="dash-prezes-kpi" aria-label="Kluczowe liczby">
        <StatCard label="Umowy łącznie" value={formatInt(aggregates.total)} />
        <StatCard
          label="Aktywne na infolinii"
          value={formatInt(aggregates.activeInfolinia)}
          hint="Bez archiwum infolinii"
        />
        <StatCard label="Zweryfikowane BO" value={formatInt(aggregates.boOk)} />
        <StatCard label="Przekazane do kancelarii" value={formatInt(aggregates.kancelaria)} />
        <StatCard
          label="Średni szacunek (wycena rzecz.)"
          value={formatMoney(aggregates.avgEstimate)}
          hint={
            aggregates.countWithEstimate
              ? `Z ${formatInt(aggregates.countWithEstimate)} umów z polem ceny`
              : 'Brak danych w rzeczoznawca_fields'
          }
        />
      </section>

      <div className="dash-prezes-chart-grid">
        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Infolinia — weryfikacja</h3>
          <div className="dash-prezes-chart-card__plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieIn} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72}>
                  {pieIn.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Back office</h3>
          <div className="dash-prezes-chart-card__plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieBo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72}>
                  {pieBo.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Obieg rzeczoznawcy (BO gotowe)</h3>
          <div className="dash-prezes-chart-card__plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieRz} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={72}>
                  {pieRz.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card dash-prezes-chart-card--wide">
          <h3 className="dash-prezes-chart-card__title">Nowe kody wg miesiąca</h3>
          <div className="dash-prezes-chart-card__plot dash-prezes-chart-card__plot--tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregates.byMonthChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="umowy" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Umowy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card dash-prezes-chart-card--wide">
          <h3 className="dash-prezes-chart-card__title">Top handlowcy (liczba umów)</h3>
          <div className="dash-prezes-chart-card__plot dash-prezes-chart-card__plot--tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregates.topAgents} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-28} textAnchor="end" height={70} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Line type="monotone" dataKey="umowy" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Umowy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
