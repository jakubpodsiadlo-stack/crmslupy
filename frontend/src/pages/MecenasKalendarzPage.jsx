import { DashboardMonthCalendar } from '../components/DashboardMonthCalendar'
import { MecenasLayout } from '../layouts/MecenasLayout'

export function MecenasKalendarzPage() {
  return (
    <MecenasLayout title="Kalendarz" contentClassName="dash__content--calendar-full">
      <DashboardMonthCalendar
        intro={
          <p style={{ margin: 0 }}>
            Widok miesiąca (start od poniedziałku). Wspólny układ z panelem rzeczoznawcy — terminy można rozbudować później.
          </p>
        }
      />
    </MecenasLayout>
  )
}
