import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { formatDistance } from '../utils.js'

const INDIA_CENTER = [22.5, 79]

// Plain HTML/CSS markers (see .place-pin in index.css) — no image files needed.
const userIcon = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

function placeIcon(color, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="place-pin${selected ? ' is-selected' : ''}" style="--pin:${color}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

/**
 * The map: your position, the search circle, one pin per place and the route line.
 * Built with Leaflet + free OpenStreetMap tiles.
 */
export default function MapView({ origin, radiusKm, places, colors, selectedId, route, onSelect, onMapClick }) {
  return (
    <MapContainer
      center={origin ? [origin.lat, origin.lng] : INDIA_CENTER}
      zoom={origin ? 14 : 5}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <Camera origin={origin} radiusKm={radiusKm} places={places} selectedId={selectedId} route={route} />

      {origin && (
        <>
          <Circle
            center={[origin.lat, origin.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#0f766e', weight: 1.5, fillColor: '#14b8a6', fillOpacity: 0.06 }}
          />
          <Marker position={[origin.lat, origin.lng]} icon={userIcon} zIndexOffset={1000}>
            <Popup>{origin.label}</Popup>
          </Marker>
        </>
      )}

      {places.map((p) => (
        <PlaceMarker
          key={p.id}
          place={p}
          color={colors[p.category] ?? '#44403c'}
          selected={p.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      {route && <Polyline positions={route.coords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }} />}
    </MapContainer>
  )
}

function PlaceMarker({ place, color, selected, onSelect }) {
  const icon = useMemo(() => placeIcon(color, selected), [color, selected])
  return (
    <Marker
      position={[place.latitude, place.longitude]}
      icon={icon}
      zIndexOffset={selected ? 500 : 0}
      eventHandlers={{ click: () => onSelect(place.id) }}
    >
      <Popup>
        <p className="font-bold">{place.name}</p>
        <p className="text-xs text-stone-500">
          {place.categoryLabel}
          {place.distanceKm != null && ` · ${formatDistance(place.distanceKm)}`}
        </p>
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
    if (place) {
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
