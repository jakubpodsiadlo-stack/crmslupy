import { ExternalServiceFrame } from '../components/ExternalServiceFrame'
import { GEOPORTAL_2_FRAME_URL } from '../lib/rzeczoznawcaExternalFrames'
import { RzeczoznawcaLayout } from '../layouts/RzeczoznawcaLayout'

export function RzeczoznawcaGeoportalPage() {
  return (
    <RzeczoznawcaLayout title="Geoportal 2">
      <ExternalServiceFrame
        heading="Geoportal 2"
        iframeTitle="Geoportal 2 — mapy geoportal.gov.pl"
        src={GEOPORTAL_2_FRAME_URL}
      />
    </RzeczoznawcaLayout>
  )
}
