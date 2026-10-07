import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { formatDistance } from '../utils.js'
import { glyphSvg } from './Icons.jsx'

const INDIA_CENTER = [22.5, 79]

// Plain HTML/CSS markers (see .place-pin in index.css) — no image files needed.
const userIcon = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })

function placeIcon(category, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="place-pin${selected ? ' is-selected' : ''}">${glyphSvg(category)}</div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38],
  })
}

/**
 * The map: your position, the search circle, one pin per place and the route line.
 * Built with Leaflet; the grayscale base map keeps the black pins easy to spot.
 */
export default function MapView({ origin, radiusKm, places, selectedId, route, onSelect, onMapClick }) {
  return (
    <MapContainer
      center={origin ? [origin.lat, origin.lng] : INDIA_CENTER}
      zoom={origin ? 14 : 5}
      className="h-full w-full"
      zoomControl={false}
    >
      {/* Standard OpenStreetMap tiles, turned grayscale in index.css (.leaflet-tile-pane). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <ClickHandler onMapClick={onMapClick} />
      <Camera origin={origin} radiusKm={radiusKm} places={places} selectedId={selectedId} route={route} />

      {origin && (
        <>
          <Circle
            center={[origin.lat, origin.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#000000', weight: 1, dashArray: '4 4', fillColor: '#000000', fillOpacity: 0.03 }}
          />
          <Marker position={[origin.lat, origin.lng]} icon={userIcon} zIndexOffset={1000}>
            <Popup>
              <p className="type-body-sm-strong">{origin.label}</p>
            </Popup>
          </Marker>
        </>
      )}

      {places.map((p) => (
        <PlaceMarker key={p.id} place={p} selected={p.id === selectedId} onSelect={onSelect} />
      ))}

      {route && (
        <>
          {/* White casing under a black line, so the route reads on any background. */}
          <Polyline positions={route.coords} pathOptions={{ color: '#ffffff', weight: 9, opacity: 1 }} />
          <Polyline positions={route.coords} pathOptions={{ color: '#000000', weight: 4, opacity: 1 }} />
        </>
      )}
    </MapContainer>
  )
}

function PlaceMarker({ place, selected, onSelect }) {
  const icon = useMemo(() => placeIcon(place.category, selected), [place.category, selected])
  return (
    <Marker
      position={[place.latitude, place.longitude]}
      icon={icon}
      zIndexOffset={selected ? 500 : 0}
      eventHandlers={{ click: () => onSelect(place.id) }}
    >
      <Popup>
        <p className="type-eyebrow text-ink">{place.categoryLabel}</p>
        <p className="mt-1 font-display text-[18px] leading-[22px] text-ink">{place.name}</p>
        {place.distanceKm != null && <p className="type-caption mt-1 text-body">{formatDistance(place.distanceKm)} away</p>}
      </Popup>
    </Marker>
  )
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/** Moves the map: fit the search circle, fly to a selected place, or fit a route. */
function Camera({ origin, radiusKm, places, selectedId, route }) {
  const map = useMap()

  useEffect(() => {
    if (origin) {
      map.fitBounds(L.latLng(origin.lat, origin.lng).toBounds(radiusKm * 2000), { padding: [20, 20] })
    }
    // Only when the search centre/radius changes, not on every render.
  }, [map, origin, radiusKm])

  useEffect(() => {
    const place = places.find((p) => p.id === selectedId)
    // When a route to this place is shown, the route effect below frames the whole path instead.
    if (place && route?.placeId !== selectedId) {
      map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 16), { duration: 0.6 })
    }
    // Places list changes shouldn't re-trigger the fly animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId])

  useEffect(() => {
    if (route) map.fitBounds(route.coords, { padding: [40, 40] })
  }, [map, route])

  return null
}
