import { useState } from 'react'
import { api } from '../api.js'
import { CrosshairIcon, PinIcon, SearchIcon } from './Icons.jsx'

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
    <section className="space-y-5 p-4 sm:p-5">
      {/* ---------- Where ---------- */}
      <div>
        <Label>Where</Label>
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm ring-1 ring-brand-100">
          <PinIcon className="shrink-0 text-brand-700" />
          <span className="min-w-0 flex-1 truncate font-medium text-brand-900">
            {origin ? origin.label : 'No location yet'}
          </span>
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm ring-1 ring-brand-100 hover:bg-brand-50 disabled:opacity-60"
          >
            <CrosshairIcon width={14} height={14} />
            {locating ? 'Locating…' : 'My location'}
          </button>
        </div>

        <form onSubmit={lookUpPlace} className="relative">
          <input
            value={placeText}
            onChange={(e) => setPlaceText(e.target.value)}
            placeholder="Or type an area, e.g. Katpadi, Vellore"
            aria-label="Search for an area"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-3 pr-20 text-sm outline-none placeholder:text-stone-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={geoLoading}
            className="absolute right-1.5 top-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {geoLoading ? '…' : 'Find'}
          </button>
          {suggestions.length > 0 && (
            <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <li key={`${s.latitude},${s.longitude}`}>
                  <button
                    type="button"
                    onClick={() => choose(s)}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        {geoError && <p className="mt-1.5 text-xs text-red-600">{geoError}</p>}
        <p className="mt-1.5 text-xs text-stone-500">Tip: you can also click anywhere on the map.</p>
      </div>

      {/* ---------- What ---------- */}
      <div>
        <Label>What do you need?</Label>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!filters.category} onClick={() => set({ category: '' })} color="#44403c">
            All essentials
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={filters.category === c.id} onClick={() => set({ category: c.id })} color={c.color}>
              {c.label}
            </Chip>
          ))}
        </div>
        <input
          value={filters.keyword}
          onChange={(e) => set({ keyword: e.target.value })}
          placeholder="Name or keyword (optional), e.g. Apollo"
          aria-label="Keyword"
          className="mt-2.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-stone-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* ---------- How far ---------- */}
      <div>
        <div className="flex items-baseline justify-between">
          <Label>Within</Label>
          <span className="text-sm font-bold text-brand-800">{filters.radiusKm} km</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={filters.radiusKm}
          onChange={(e) => set({ radiusKm: Number(e.target.value) })}
          aria-label="Search radius in kilometres"
          className="w-full"
        />
      </div>

      <button
        onClick={onSearch}
        disabled={!origin || searching}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        <SearchIcon />
        {searching ? 'Searching…' : origin ? 'Search nearby' : 'Pick a location first'}
      </button>
    </section>
  )
}

function Label({ children }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">{children}</p>
}

function Chip({ active, onClick, color, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {children}
    </button>
  )
}

/** "Katpadi, Vellore, Tamil Nadu, 632007, India" -> "Katpadi, Vellore" */
function shortLabel(label) {
  return label.split(',').slice(0, 2).join(',').trim()
}
