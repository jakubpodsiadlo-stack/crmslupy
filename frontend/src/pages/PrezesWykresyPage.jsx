import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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

export function PrezesWykresyPage() {
  const { loading, err, aggregates } = useOutletContext()

  const pieIn = useMemo(() => pieDataInfolinia(aggregates), [aggregates])
  const pieBo = useMemo(() => pieDataBo(aggregates), [aggregates])
  const pieRz = useMemo(() => pieDataRzecz(aggregates), [aggregates])

  const composed = useMemo(() => {
    return aggregates.byMonthChart.map((row) => ({
      ...row,
      skumulowane: aggregates.byMonthChart
        .filter((r) => r.name <= row.name)
        .reduce((s, r) => s + r.umowy, 0),
    }))
  }, [aggregates.byMonthChart])

  if (loading && aggregates.total === 0) {
    return <p className="dash-muted">Ładowanie…</p>
  }

  return (
    <div className="dash-prezes-page">
      {err ? (
        <p className="error" style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          {err}
        </p>
      ) : null}

      <p className="dash-muted" style={{ marginBottom: '1.25rem', maxWidth: '48rem', lineHeight: 1.55 }}>
        Zestawienie wykresów na podstawie tej samej bazy co pozostałe zakładki — wyłącznie do analizy, bez wpływu na
        dane operacyjne.
      </p>

      <div className="dash-prezes-chart-grid dash-prezes-chart-grid--dense">
        <div className="dash-prezes-chart-card dash-prezes-chart-card--wide">
          <h3 className="dash-prezes-chart-card__title">Skumulowany przyrost umów (wg miesiąca kodu)</h3>
          <div className="dash-prezes-chart-card__plot dash-prezes-chart-card__plot--tall">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={composed} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Legend />
                <Bar yAxisId="left" dataKey="umowy" fill="#22d3ee" name="W miesiącu" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="skumulowane"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  name="Skumulowanie"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card dash-prezes-chart-card--wide">
          <h3 className="dash-prezes-chart-card__title">Trend miesięczny (obszar)</h3>
          <div className="dash-prezes-chart-card__plot dash-prezes-chart-card__plot--tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregates.byMonthChart} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="prezesArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Area type="monotone" dataKey="umowy" stroke="#22d3ee" fill="url(#prezesArea)" name="Umowy" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Handlowcy — słupki</h3>
          <div className="dash-prezes-chart-card__plot dash-prezes-chart-card__plot--tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregates.topAgents} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="umowy" name="Umowy" radius={[0, 6, 6, 0]}>
                  {aggregates.topAgents.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Porównanie: infolinia / BO / rzecz.</h3>
          <div className="dash-prezes-chart-card__plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieIn} dataKey="value" nameKey="name" cx="34%" cy="50%" innerRadius={40} outerRadius={58}>
                  {pieIn.map((_, i) => (
                    <Cell key={`i-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Pie data={pieBo} dataKey="value" nameKey="name" cx="66%" cy="50%" innerRadius={40} outerRadius={58}>
                  {pieBo.map((_, i) => (
                    <Cell key={`b-${i}`} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-prezes-chart-card">
          <h3 className="dash-prezes-chart-card__title">Rzeczoznawca — pierścienie</h3>
          <div className="dash-prezes-chart-card__plot">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieRz} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78}>
                  {pieRz.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
