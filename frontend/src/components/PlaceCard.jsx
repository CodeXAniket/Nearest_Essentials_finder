import { directionsUrl, formatDistance, formatDuration } from '../utils.js'
import { ClockIcon, ExternalIcon, PhoneIcon, RouteIcon, StarIcon } from './Icons.jsx'

export default function PlaceCard({
  place,
  color,
  distanceKm,
  origin,
  selected,
  route,
  routeLoading,
  travelMode,
  onSelect,
  onRoute,
  onToggleFavorite,
}) {
  const showingRoute = route && route.placeId === place.id

  return (
    <li
      className={`rounded-2xl border bg-white p-3.5 transition ${
        selected ? 'border-brand-600 shadow-md ring-2 ring-brand-100' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {place.categoryLabel}
          </p>
          <h3 className="truncate text-[15px] font-bold text-stone-900">{place.name}</h3>
          {place.address && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{place.address}</p>}
        </button>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {distanceKm != null && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
              {formatDistance(distanceKm)}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={place.favorite ? 'Remove from saved places' : 'Save this place'}
            title={place.favorite ? 'Saved' : 'Save'}
            className={`rounded-lg p-1.5 ${place.favorite ? 'text-amber-500' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <StarIcon filled={place.favorite} />
          </button>
        </div>
      </div>

      {(place.openingHours || place.phone) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          {place.openingHours && (
            <span className="flex items-center gap-1">
              <ClockIcon width={13} height={13} /> {place.openingHours}
            </span>
          )}
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-1 hover:text-brand-700">
              <PhoneIcon width={13} height={13} /> {place.phone}
            </a>
          )}
        </div>
      )}

      {showingRoute && (
        <p className="mt-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-900">
          {travelMode === 'car' ? 'Drive' : 'Walk'}: {formatDistance(route.distanceKm)} · about{' '}
          {formatDuration(route.durationMin)}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onRoute}
          disabled={!origin || routeLoading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-300 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        >
          <RouteIcon width={15} height={15} />
          {routeLoading ? 'Loading route…' : showingRoute ? 'Hide route' : 'Show route'}
        </button>
        <a
          href={directionsUrl(origin, place, travelMode)}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-700"
        >
          <ExternalIcon width={15} height={15} />
          Navigate
        </a>
      </div>
    </li>
  )
}
