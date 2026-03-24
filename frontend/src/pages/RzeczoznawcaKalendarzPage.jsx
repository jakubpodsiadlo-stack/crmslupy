import { DashboardMonthCalendar } from '../components/DashboardMonthCalendar'
import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaKalendarzPage() {
  return (
    <RzeczoznawcaLayout title="Kalendarz" contentClassName="dash__content--calendar-full">
      <DashboardMonthCalendar
        intro={<p style={{ margin: 0 }}>Widok miesiąca (start od poniedziałku). Terminy i wizyty — w kolejnej iteracji.</p>}
      />
    </RzeczoznawcaLayout>
  )
}
