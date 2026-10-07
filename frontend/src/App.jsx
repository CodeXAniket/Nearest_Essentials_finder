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

  const colors = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.color])), [categories])
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

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setHint('Your browser cannot share its location. Type an area or click on the map instead.')
      return
    }
    setLocating(true)
    setHint('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Your current location' }
        setOrigin(here)
        runSearch(here, filtersRef.current)
      },
      () => {
        setLocating(false)
        setHint('Location access was blocked. Type an area above or click anywhere on the map to search there.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [runSearch])

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
    locateMe()
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
            colors={colors}
            selectedId={selectedId}
            route={route}
            onSelect={setSelectedId}
            onMapClick={(pt) => pickLocation({ ...pt, label: 'Pinned on map' })}
          />
        </div>

        <aside className="min-h-0 flex-1 overflow-y-auto bg-stone-50 lg:order-1 lg:w-[430px] lg:flex-none lg:border-r lg:border-stone-200">
          <SearchPanel
            categories={categories}
            origin={origin}
            locating={locating}
            onUseMyLocation={locateMe}
            onPickLocation={pickLocation}
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={() => runSearch(origin, filters)}
            searching={searching}
          />

          <div className="border-t border-stone-200 p-4 sm:p-5">
            {hint && <Banner tone="info">{hint}</Banner>}
            {error && <Banner tone="error">{error}</Banner>}
            {results?.notice && tab === 'results' && <Banner tone="warn">{results.notice}</Banner>}

            <div className="mb-3 flex items-center justify-between gap-2">
              <div role="tablist" className="flex rounded-xl bg-stone-200/70 p-1 text-xs font-bold">
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
                <div className="flex rounded-xl bg-stone-200/70 p-1" aria-label="Travel mode">
                  <ModeButton active={travelMode === 'foot'} onClick={() => changeTravelMode('foot')} label="Walking">
                    <WalkIcon width={16} height={16} />
                  </ModeButton>
                  <ModeButton active={travelMode === 'car'} onClick={() => changeTravelMode('car')} label="Driving">
                    <CarIcon width={16} height={16} />
                  </ModeButton>
                </div>
              )}
            </div>

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
              <ul className="space-y-2.5">
                {listedPlaces.map((p) => (
                  <PlaceCard
                    key={p.id}
                    place={p}
                    color={colors[p.category] ?? '#44403c'}
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
      className={`rounded-lg px-3 py-1.5 transition ${active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
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
      className={`rounded-lg px-2.5 py-1.5 ${active ? 'bg-white text-brand-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
    >
      {children}
    </button>
  )
}

function Banner({ tone, children }) {
  const styles = {
    info: 'bg-sky-50 text-sky-900 ring-sky-100',
    warn: 'bg-amber-50 text-amber-900 ring-amber-100',
    error: 'bg-red-50 text-red-800 ring-red-100',
  }
  return <p className={`mb-3 rounded-xl px-3 py-2.5 text-sm ring-1 ${styles[tone]}`}>{children}</p>
}

function LoadingList() {
  return (
    <div>
      <p className="mb-3 text-xs text-stone-500">
        Looking around… the first search in a new area pulls live map data and can take a few seconds.
      </p>
      <ul className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-white" />
        ))}
      </ul>
    </div>
  )
}
