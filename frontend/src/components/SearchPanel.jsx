import { useState } from 'react'
import { api } from '../api.js'
import { CategoryIcon, CrosshairIcon, PinIcon, SearchIcon } from './Icons.jsx'

/**
 * The search form: where (GPS or typed place), what (category + keyword) and how far (radius).
 */
export default function SearchPanel({
  categories,
  origin,
  locating,
  onUseMyLocation,
  onPickLocation,
  filters,
  onFiltersChange,
  onSearch,
  searching,
}) {
  const [placeText, setPlaceText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  async function lookUpPlace(e) {
    e.preventDefault()
    if (placeText.trim().length < 2) return
    setGeoLoading(true)
    setGeoError('')
    try {
      const results = await api.geocode(placeText.trim())
      setSuggestions(results)
      if (results.length === 0) setGeoError('No matching place found. Try adding the city name.')
    } catch (err) {
      setGeoError(err.message)
    } finally {
      setGeoLoading(false)
    }
  }

  function choose(result) {
    setSuggestions([])
    setPlaceText('')
    onPickLocation({ lat: result.latitude, lng: result.longitude, label: shortLabel(result.label) })
  }

  const set = (patch) => onFiltersChange({ ...filters, ...patch })

  return (
    <section>
      {/* ---------- Intro ---------- */}
      <div className="border-b border-hairline px-4 pb-6 pt-7 sm:px-5">
        <p className="type-eyebrow mb-3 text-ink">Local guide</p>
        <h2 className="type-display-sm text-ink sm:type-display-md">Everyday essentials, nearest first.</h2>
        <p className="type-body-serif-md mt-3 text-body">
          Groceries, medicines, cash, fuel and post, found from live map data and sorted by how far you have to go.
        </p>
      </div>

      {/* ---------- Where ---------- */}
      <div className="border-b border-hairline px-4 py-5 sm:px-5">
        <Label>Where</Label>
        <div className="mb-3 flex items-center gap-3">
          <PinIcon className="shrink-0 text-ink" />
          <span className="type-body-md-strong min-w-0 flex-1 truncate text-ink">
            {origin ? origin.label : 'No location yet'}
          </span>
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="type-body-sm-strong flex shrink-0 items-center gap-1.5 border border-ink bg-canvas px-3 py-2 text-ink hover:bg-canvas-soft disabled:opacity-50"
          >
            <CrosshairIcon width={14} height={14} />
            {locating ? 'Locating…' : 'My location'}
          </button>
        </div>

        <form onSubmit={lookUpPlace} className="relative flex">
          <input
            value={placeText}
            onChange={(e) => setPlaceText(e.target.value)}
            placeholder="Or type an area, e.g. Katpadi, Vellore"
            aria-label="Search for an area"
            className="type-body-md min-w-0 flex-1 border border-ink bg-canvas px-4 py-3 text-ink outline-none placeholder:text-body focus:shadow-[inset_0_0_0_1px_var(--color-ink)]"
          />
          <button
            type="submit"
            disabled={geoLoading}
            className="type-body-sm-strong shrink-0 border border-l-0 border-ink bg-ink px-4 text-canvas hover:bg-ink-soft disabled:opacity-60"
          >
            {geoLoading ? '…' : 'Find'}
          </button>
          {suggestions.length > 0 && (
            <ul className="absolute top-full z-[1000] mt-[-1px] w-full border border-ink bg-canvas">
              {suggestions.map((s) => (
                <li key={`${s.latitude},${s.longitude}`} className="border-b border-hairline last:border-b-0">
                  <button
                    type="button"
                    onClick={() => choose(s)}
                    className="type-body-sm w-full px-4 py-3 text-left text-ink hover:bg-canvas-soft"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        {geoError && <p className="type-body-sm-strong mt-2 text-ink">{geoError}</p>}
        <p className="type-caption mt-2 text-body">Tip: you can also click anywhere on the map.</p>
      </div>

      {/* ---------- What ---------- */}
      <div className="border-b border-hairline px-4 py-5 sm:px-5">
        <Label>What do you need?</Label>
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.category} onClick={() => set({ category: '' })} category="ALL">
            All essentials
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={filters.category === c.id} onClick={() => set({ category: c.id })} category={c.id}>
              {c.label}
            </Chip>
          ))}
        </div>
        <input
          value={filters.keyword}
          onChange={(e) => set({ keyword: e.target.value })}
          placeholder="Name or keyword (optional), e.g. Apollo"
          aria-label="Keyword"
          className="type-body-md mt-3 w-full border border-ink bg-canvas px-4 py-3 text-ink outline-none placeholder:text-body focus:shadow-[inset_0_0_0_1px_var(--color-ink)]"
        />
      </div>

      {/* ---------- How far ---------- */}
      <div className="px-4 py-5 sm:px-5">
        <div className="flex items-baseline justify-between">
          <Label>Within</Label>
          <span className="font-display text-[26px] leading-none text-ink">{filters.radiusKm} km</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={filters.radiusKm}
          onChange={(e) => set({ radiusKm: Number(e.target.value) })}
          aria-label="Search radius in kilometres"
          className="mt-2 w-full"
        />

        <button
          onClick={onSearch}
          disabled={!origin || searching}
          className="type-button mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-5 py-3 text-canvas hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-body"
        >
          <SearchIcon />
          {searching ? 'Searching…' : origin ? 'Search nearby' : 'Pick a location first'}
        </button>
      </div>
    </section>
  )
}

function Label({ children }) {
  return <p className="type-eyebrow mb-3 text-ink">{children}</p>
}

function Chip({ active, onClick, category, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`type-body-sm flex items-center gap-2 border px-3 py-2 ${
        active ? 'border-ink bg-ink text-canvas' : 'border-hairline bg-canvas text-ink hover:border-ink'
      }`}
    >
      <CategoryIcon category={category} size={14} />
      {children}
    </button>
  )
}

/** "Katpadi, Vellore, Tamil Nadu, 632007, India" -> "Katpadi, Vellore" */
function shortLabel(label) {
  return label.split(',').slice(0, 2).join(',').trim()
}
