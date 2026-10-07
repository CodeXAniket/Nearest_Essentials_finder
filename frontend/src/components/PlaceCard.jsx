import { directionsUrl, formatDistance, formatDuration } from '../utils.js'
import { ArrowIcon, CategoryIcon, ClockIcon, PhoneIcon, RouteIcon, StarIcon } from './Icons.jsx'

/**
 * One result, laid out like a magazine story row: running number, category
 * eyebrow, serif headline, serif address, then actions. Rows are separated by
 * hairlines; the selected row gets a soft fill and a black bar on the left.
 */
export default function PlaceCard({
  index,
  place,
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
      className={`relative border-b border-hairline px-4 py-5 sm:px-5 ${
        selected ? 'bg-canvas-soft before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-ink' : 'bg-canvas'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="w-7 shrink-0 pt-0.5 font-display text-[20px] leading-6 text-body" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>

        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="type-eyebrow mb-1.5 flex items-center gap-1.5 text-ink">
            <CategoryIcon category={place.category} size={13} />
            {place.categoryLabel}
          </p>
          <h3 className="font-display text-[22px] leading-[26px] text-ink">{place.name}</h3>
          {place.address && <p className="mt-1.5 font-serif text-[15px] leading-[22px] text-body">{place.address}</p>}
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {distanceKm != null && (
            <span className="whitespace-nowrap font-display text-[20px] leading-6 text-ink">
              {formatDistance(distanceKm)}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={place.favorite ? 'Remove from saved places' : 'Save this place'}
            title={place.favorite ? 'Saved' : 'Save'}
            className={`grid h-9 w-9 place-items-center rounded-full border ${
              place.favorite ? 'border-ink bg-ink text-canvas' : 'border-hairline bg-canvas text-ink hover:border-ink'
            }`}
          >
            <StarIcon filled={place.favorite} width={16} height={16} />
          </button>
        </div>
      </div>

      <div className="pl-11">
        {(place.openingHours || place.phone) && (
          <div className="type-caption mt-3 flex flex-wrap gap-x-4 gap-y-1 text-ink-soft">
            {place.openingHours && (
              <span className="flex items-center gap-1.5">
                <ClockIcon width={13} height={13} /> {place.openingHours}
              </span>
            )}
            {place.phone && (
              <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 text-link hover:underline">
                <PhoneIcon width={13} height={13} /> {place.phone}
              </a>
            )}
          </div>
        )}

        {showingRoute && (
          <p className="type-body-sm-strong mt-3 border-l-2 border-ink pl-3 text-ink">
            {travelMode === 'car' ? 'Drive' : 'Walk'} {formatDistance(route.distanceKm)}
            <span className="font-normal text-body"> · about {formatDuration(route.durationMin)}</span>
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRoute}
            disabled={!origin || routeLoading}
            className="type-body-sm-strong flex flex-1 items-center justify-center gap-1.5 border border-ink bg-canvas px-3 py-2.5 text-ink hover:bg-canvas-soft disabled:opacity-40"
          >
            <RouteIcon width={15} height={15} />
            {routeLoading ? 'Loading route…' : showingRoute ? 'Hide route' : 'Show route'}
          </button>
          <a
            href={directionsUrl(origin, place, travelMode)}
            target="_blank"
            rel="noreferrer"
            className="type-body-sm-strong flex flex-1 items-center justify-center gap-1.5 bg-ink px-3 py-2.5 text-canvas hover:bg-ink-soft"
          >
            Navigate
            <ArrowIcon width={15} height={15} />
          </a>
        </div>
      </div>
    </li>
  )
}
