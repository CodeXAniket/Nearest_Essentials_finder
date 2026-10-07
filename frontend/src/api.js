// All calls to the Spring Boot backend live here.
// In development Vite forwards /api/* to http://localhost:8080 (see vite.config.js).
const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'nef.token'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage can be blocked (private mode). The app still works, the user just isn't remembered.
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running on port 8080?', 0)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status)
  }
  return data
}

/** Drops empty values so the URL stays clean: {a: 1, b: ''} -> "a=1" */
function query(params) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return new URLSearchParams(clean).toString()
}

export const api = {
  categories: () => request('/api/categories'),
  nearby: (params) => request(`/api/places/nearby?${query(params)}`),
  geocode: (q) => request(`/api/geocode?${query({ q })}`),

  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  favorites: () => request('/api/me/favorites'),
  addFavorite: (placeId) => request(`/api/me/favorites/${placeId}`, { method: 'POST' }),
  removeFavorite: (placeId) => request(`/api/me/favorites/${placeId}`, { method: 'DELETE' }),
  history: () => request('/api/me/searches'),
  clearHistory: () => request('/api/me/searches', { method: 'DELETE' }),
}

/**
 * Road route between two points from the public OSRM servers run by openstreetmap.de.
 * mode is "foot" or "car". Returns { coords: [[lat, lng], ...], distanceKm, durationMin }.
 */
export async function fetchRoute(from, to, mode) {
  const profile = mode === 'car' ? 'routed-car' : 'routed-foot'
  const url =
    `https://routing.openstreetmap.de/${profile}/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Route service is unavailable right now')
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found to this place')

  return {
    // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  }
}
