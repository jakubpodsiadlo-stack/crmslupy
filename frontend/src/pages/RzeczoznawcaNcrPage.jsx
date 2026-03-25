import { ExternalServiceFrame } from '../components/ExternalServiceFrame'
import { NCR_RCN_FRAME_URL } from '../lib/rzeczoznawcaExternalFrames'
import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaNcrPage() {
  return (
    <RzeczoznawcaLayout title="NCR — rejestr cen">
      <ExternalServiceFrame
        heading="Rejestr cen nieruchomości (RCN)"
        src={NCR_RCN_FRAME_URL}
      >
        <p className="dash-muted" style={{ margin: 0, fontSize: '0.9rem', maxWidth: '52rem' }}>
          Moduł <strong>RCN</strong> (rejestr cen nieruchomości) w mapach Geoportalu — zgrupowane informacje o cenach
          transakcji. W menu skrót <strong>NCR</strong>.
        </p>
      </ExternalServiceFrame>
    </RzeczoznawcaLayout>
  )
}
