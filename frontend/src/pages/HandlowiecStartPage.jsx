import { HandlowiecLayout } from '../layouts/HandlowiecLayout'

export function HandlowiecStartPage() {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const mapSrc = token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=false&zoomwheel=true&access_token=${encodeURIComponent(token)}`
    : null

  return (
    <HandlowiecLayout title="Start" contentClassName="dash__content--map-full">
      <section className="dash-mapbox-full" aria-label="Mapa handlowca">
        {mapSrc ? (
          <iframe
            title="Mapa handlowca (Mapbox)"
            src={mapSrc}
            className="dash-mapbox-full__iframe"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="dash-mapbox-full__missing">
            Ustaw `VITE_MAPBOX_ACCESS_TOKEN` w `frontend/.env`, aby włączyć mapę Mapbox.
          </div>
        )}
      </section>
    </HandlowiecLayout>
  )
}
