import { useMemo, useState } from 'react'

const WEEKDAYS_PL = ['pon', 'wto', 'śro', 'czw', 'pt', 'so', 'nd']

function mondayIndexFromSunday(jsDay) {
  return (jsDay + 6) % 7
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)
  const daysInMonth = last.getDate()
  const lead = mondayIndexFromSunday(first.getDay())
  const cells = []

  const prevLast = new Date(year, monthIndex, 0).getDate()
  for (let i = 0; i < lead; i += 1) {
    const d = prevLast - lead + i + 1
    cells.push({
      key: `p-${year}-${monthIndex}-${i}`,
      date: new Date(year, monthIndex - 1, d),
      inMonth: false,
    })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      key: `c-${year}-${monthIndex}-${d}`,
      date: new Date(year, monthIndex, d),
      inMonth: true,
    })
  }
  const tail = 42 - cells.length
  for (let i = 0; i < tail; i += 1) {
    cells.push({
      key: `n-${year}-${monthIndex}-${i}`,
      date: new Date(year, monthIndex + 1, i + 1),
      inMonth: false,
    })
  }
  return cells.slice(0, 42)
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Wspólny kalendarz miesięczny (start od poniedziałku) — layout strony ustawia rodzic.
 */
export function DashboardMonthCalendar({ intro }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  const cells = useMemo(() => buildMonthCells(cursor.y, cursor.m), [cursor.y, cursor.m])

  const monthTitle = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(
        new Date(cursor.y, cursor.m, 1),
      )
    } catch {
      return `${cursor.m + 1} / ${cursor.y}`
    }
  }, [cursor.y, cursor.m])

  function prevMonth() {
    setCursor(({ y, m }) => {
      const d = new Date(y, m - 1, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  function nextMonth() {
    setCursor(({ y, m }) => {
      const d = new Date(y, m + 1, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  function goToday() {
    const n = new Date()
    setCursor({ y: n.getFullYear(), m: n.getMonth() })
  }

  const today = new Date()

  return (
    <section className="dash-panel dash-calendar-panel dash-calendar-panel--full">
      {intro ? (
        <div className="dash-calendar-panel__head dash-calendar-panel__head--compact">
          <div className="dash-muted" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
            {intro}
          </div>
        </div>
      ) : null}

      <div className="dash-calendar-toolbar dash-calendar-toolbar--compact">
        <button type="button" className="dash-table__btn" onClick={prevMonth} aria-label="Poprzedni miesiąc">
          « Poprzedni
        </button>
        <div className="dash-calendar-toolbar__title" aria-live="polite">
          {monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}
        </div>
        <button type="button" className="dash-table__btn" onClick={nextMonth} aria-label="Następny miesiąc">
          Następny »
        </button>
        <button type="button" className="dash__btn-primary dash-calendar-toolbar__today" onClick={goToday}>
          Dziś
        </button>
      </div>

      <div className="dash-calendar-grid" role="grid" aria-label="Kalendarz miesięczny">
        {WEEKDAYS_PL.map((wd) => (
          <div key={wd} className="dash-calendar-grid__weekday" role="columnheader">
            {wd}
          </div>
        ))}
        {cells.map((cell) => {
          const isToday = isSameDay(cell.date, today)
          return (
            <div
              key={cell.key}
              role="gridcell"
              className={`dash-calendar-grid__cell ${cell.inMonth ? '' : 'dash-calendar-grid__cell--muted'} ${isToday ? 'dash-calendar-grid__cell--today' : ''}`}
            >
              <span className="dash-calendar-grid__day-num">{cell.date.getDate()}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
