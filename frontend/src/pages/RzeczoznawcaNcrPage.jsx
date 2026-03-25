import { ExternalServiceFrame } from '../components/ExternalServiceFrame'
import { NCR_RCN_FRAME_URL } from '../lib/rzeczoznawcaExternalFrames'
import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaNcrPage() {
  return (
    <RzeczoznawcaLayout title="NCR — rejestr cen">
      <ExternalServiceFrame
        iframeTitle="Rejestr cen nieruchomości — moduł RCN na Geoportalu"
        src={NCR_RCN_FRAME_URL}
      />
    </RzeczoznawcaLayout>
  )
}
