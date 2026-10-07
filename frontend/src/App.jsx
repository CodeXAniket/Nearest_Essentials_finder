import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, fetchRoute, getToken, setToken } from './api.js'
import { distanceKm } from './utils.js'
import Header from './components/Header.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import MapView from './components/MapView.jsx'
import PlaceCard from './components/PlaceCard.jsx'
import AuthModal from './components/AuthModal.jsx'
import HistoryList, { Empty } from './components/HistoryList.jsx'
import { CarIcon, WalkIcon } from './components/Icons.jsx'

export default function App() {
  // ---------- data from the backend ----------
  const [categories, setCategories] = useState([])
  const [results, setResults] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [user, setUser] = useState(null)

  // ---------- what the user has chosen ----------
  const [origin, setOrigin] = useState(null) // { lat, lng, label }
  const [filters, setFilters] = useState({ category: '', keyword: '', radiusKm: 2 })
  const [selectedId, setSelectedId] = useState(null)
  const [travelMode, setTravelMode] = useState('foot')
  const [route, setRoute] = useState(null)
  const [tab, setTab] = useState('results')
  const [authModal, setAuthModal] = useState(null)

  // ---------- loading + messages ----------
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [routeLoadingId, setRouteLoadingId] = useState(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites])

  const refreshUserData = useCallback(async () => {
    try {
      const [favs, hist] = await Promise.all([api.favorites(), api.history()])
      setFavorites(favs)
      setHistory(hist)
    } catch {
      // Not fatal: the lists just stay as they were.
    }
  }, [])

  // Each search gets a number; only the newest one may update the screen.
  // (Otherwise a slow older search could finish last and overwrite newer results.)
  const searchSeq = useRef(0)

  const runSearch = useCallback(
    async (at, f) => {
      if (!at) return
      const seq = ++searchSeq.current
      setSearching(true)
      setError('')
      setResults(null)
      setRoute(null)
      setSelectedId(null)
      setTab('results')
      try {
        const data = await api.nearby({
          lat: at.lat.toFixed(6),
          lng: at.lng.toFixed(6),
          radiusKm: f.radiusKm,
          category: f.category,
          q: f.keyword.trim(),
          label: at.label,
        })
        if (seq !== searchSeq.current) return
        setResults(data)
        if (getToken()) refreshUserData()
      } catch (err) {
        if (seq === searchSeq.current) setError(err.message)
      } finally {
        if (seq === searchSeq.current) setSearching(false)
      }
    },
    [refreshUserData],
  )

  // Keep the latest filters available to callbacks that fire later (like geolocation).
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const originRef = useRef(origin)
  originRef.current = origin

  /**
   * auto = the attempt made on page load. If the user has picked a place by the
   * time the browser answers, that answer (or refusal) is ignored.
   */
  const locateMe = useCallback(
    (auto = false) => {
      if (!navigator.geolocation) {
        setHint('Your browser cannot share its location. Type an area or click on the map instead.')
        return
      }
      setLocating(true)
      setHint('')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false)
          if (auto && originRef.current) return
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Your current location' }
          setOrigin(here)
          runSearch(here, filtersRef.current)
        },
        () => {
          setLocating(false)
          if (auto && originRef.current) return
          setHint('Location access was blocked. Type an area above or click anywhere on the map to search there.')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    },
    [runSearch],
  )

  // First load: categories, restore login, try to locate the user once.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    api.categories().then(setCategories).catch((err) => setError(err.message))
    if (getToken()) {
      api
        .me()
        .then((u) => {
          setUser(u)
          refreshUserData()
        })
        .catch(() => setToken(null))
    }
    locateMe(true)
  }, [locateMe, refreshUserData])

  // ---------- handlers ----------

  function pickLocation(place) {
    setOrigin(place)
    setHint('')
    runSearch(place, filters)
  }

  function handleAuthSuccess({ token, user }) {
    setToken(token)
    setUser(user)
    setAuthModal(null)
    refreshUserData()
  }

  async function logout() {
    await api.logout().catch(() => {})
    setToken(null)
    setUser(null)
    setFavorites([])
    setHistory([])
    if (tab !== 'results') setTab('results')
  }

  async function toggleFavorite(place) {
    if (!user) {
      setAuthModal('login')
      return
    }
    try {
      if (favoriteIds.has(place.id)) await api.removeFavorite(place.id)
      else await api.addFavorite(place.id)
      setFavorites(await api.favorites())
    } catch (err) {
      setError(err.message)
    }
  }

  async function showRoute(place, mode = travelMode) {
    setRouteLoadingId(place.id)
    setError('')
    try {
      const r = await fetchRoute(origin, { lat: place.latitude, lng: place.longitude }, mode)
      setRoute({ ...r, placeId: place.id })
      setSelectedId(place.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setRouteLoadingId(null)
    }
  }

  function toggleRoute(place) {
    if (route?.placeId === place.id) setRoute(null)
    else showRoute(place)
  }

  function changeTravelMode(mode) {
    setTravelMode(mode)
    const place = route && listedPlaces.find((p) => p.id === route.placeId)
    if (place) showRoute(place, mode)
  }

  function repeatSearch(h) {
    const f = { category: h.category ?? '', keyword: h.keyword ?? '', radiusKm: h.radiusKm }
    const at = { lat: h.latitude, lng: h.longitude, label: h.locationLabel ?? 'Earlier search' }
    setFilters(f)
    setOrigin(at)
    runSearch(at, f)
  }

  // ---------- what to show ----------

  const listedPlaces = useMemo(() => {
    const source = tab === 'saved' ? favorites : (results?.places ?? [])
    return source.map((p) => ({
      ...p,
      favorite: favoriteIds.has(p.id),
      distanceKm:
        p.distanceKm ?? (origin ? distanceKm(origin, { lat: p.latitude, lng: p.longitude }) : null),
    }))
  }, [tab, favorites, results, favoriteIds, origin])

  return (
    <div className="flex h-full flex-col">
      <Header user={user} onLogin={() => setAuthModal('login')} onLogout={logout} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative isolate h-[40vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <MapView
            origin={origin}
            radiusKm={filters.radiusKm}
            places={tab === 'history' ? [] : listedPlaces}
            selectedId={selectedId}
            route={route}
            onSelect={setSelectedId}
            onMapClick={(pt) => pickLocation({ ...pt, label: 'Pinned on map' })}
          />
        </div>

        <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas lg:order-1 lg:w-[440px] lg:flex-none lg:border-r lg:border-ink">
          <SearchPanel
            categories={categories}
            origin={origin}
            locating={locating}
            onUseMyLocation={() => locateMe()}
            onPickLocation={pickLocation}
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={() => runSearch(origin, filters)}
            searching={searching}
          />

          <div className="flex-1 border-t border-ink">
            <div className="flex items-end justify-between gap-2 border-b border-hairline px-4 sm:px-5">
              <div role="tablist" className="flex gap-5">
                <Tab active={tab === 'results'} onClick={() => setTab('results')}>
                  Results{results ? ` (${results.count})` : ''}
                </Tab>
                <Tab active={tab === 'saved'} onClick={() => (user ? setTab('saved') : setAuthModal('login'))}>
                  Saved{user ? ` (${favorites.length})` : ''}
                </Tab>
                <Tab active={tab === 'history'} onClick={() => (user ? setTab('history') : setAuthModal('login'))}>
                  History
                </Tab>
              </div>
              {tab !== 'history' && (
                <div className="mb-2 flex border border-ink" role="group" aria-label="Travel mode">
                  <ModeButton active={travelMode === 'foot'} onClick={() => changeTravelMode('foot')} label="Walking">
                    <WalkIcon width={16} height={16} />
                  </ModeButton>
                  <ModeButton active={travelMode === 'car'} onClick={() => changeTravelMode('car')} label="Driving">
                    <CarIcon width={16} height={16} />
                  </ModeButton>
                </div>
              )}
            </div>

            {hint && <Banner label="Note">{hint}</Banner>}
            {error && <Banner label="Error">{error}</Banner>}
            {results?.notice && tab === 'results' && <Banner label="Heads up">{results.notice}</Banner>}

            {tab === 'history' ? (
              <HistoryList
                items={history}
                onRepeat={repeatSearch}
                onClear={async () => {
                  await api.clearHistory().catch((err) => setError(err.message))
                  setHistory([])
                }}
              />
            ) : searching ? (
              <LoadingList />
            ) : listedPlaces.length > 0 ? (
              <ul>
                {listedPlaces.map((p, i) => (
                  <PlaceCard
                    key={p.id}
                    index={i}
                    place={p}
                    distanceKm={p.distanceKm}
                    origin={origin}
                    selected={p.id === selectedId}
                    route={route}
                    routeLoading={routeLoadingId === p.id}
                    travelMode={travelMode}
                    onSelect={() => setSelectedId(p.id)}
                    onRoute={() => toggleRoute(p)}
                    onToggleFavorite={() => toggleFavorite(p)}
                  />
                ))}
              </ul>
            ) : tab === 'saved' ? (
              <Empty>Tap the star on any result to save it here.</Empty>
            ) : results ? (
              <Empty>
                Nothing found within {results.radiusKm} km. Try a bigger radius, another category or no keyword.
              </Empty>
            ) : (
              <Empty>
                Allow location access, type an area, or click the map — then pick what you need and search.
              </Empty>
            )}
          </div>

          <footer className="bg-ink px-4 py-8 text-canvas sm:px-5">
            <p className="font-display text-[22px] leading-none">Nearest Essentials</p>
            <p className="type-caption mt-3 text-canvas/70">
              Map and place data © OpenStreetMap contributors. Routes by OSRM.
            </p>
          </footer>
        </aside>
      </div>

      {authModal && (
        <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} onSuccess={handleAuthSuccess} />
      )}
    </div>
  )
}

function Tab({ active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`type-body-sm-strong -mb-px border-b-2 py-3.5 ${
        active ? 'border-ink text-ink' : 'border-transparent text-body hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function ModeButton({ active, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-8 w-9 place-items-center ${active ? 'bg-ink text-canvas' : 'bg-canvas text-ink hover:bg-canvas-soft'}`}
    >
      {children}
    </button>
  )
}

/** Messages use the ink + grey hierarchy only: an eyebrow label and a black rule on the left. */
function Banner({ label, children }) {
  return (
    <div role="status" className="mx-4 mt-4 border-l-2 border-ink bg-canvas-soft px-4 py-3 sm:mx-5">
      <p className="type-eyebrow text-ink">{label}</p>
      <p className="type-body-sm mt-1 text-ink-soft">{children}</p>
    </div>
  )
}

function LoadingList() {
  return (
    <div>
      <p className="type-body-serif-md px-4 pt-4 italic text-ink-soft sm:px-5">
        Looking around… the first search in a new area pulls live map data and can take a few seconds.
      </p>
      <ul className="mt-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex animate-pulse gap-4 border-b border-hairline px-4 py-5 sm:px-5">
            <span className="h-6 w-7 bg-canvas-soft" />
            <span className="flex-1 space-y-2.5">
              <span className="block h-3 w-24 bg-canvas-soft" />
              <span className="block h-5 w-3/4 bg-canvas-soft" />
              <span className="block h-4 w-1/2 bg-canvas-soft" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
