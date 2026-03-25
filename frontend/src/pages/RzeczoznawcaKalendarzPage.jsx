import { DashboardMonthCalendar } from '../components/DashboardMonthCalendar'
import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaKalendarzPage() {
  return (
    <RzeczoznawcaLayout title="Kalendarz" contentClassName="dash__content--calendar-full">
      <DashboardMonthCalendar />
    </RzeczoznawcaLayout>
  )
}
