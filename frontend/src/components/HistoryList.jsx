import { timeAgo } from '../utils.js'
import { HistoryIcon } from './Icons.jsx'

export default function HistoryList({ items, onRepeat, onClear }) {
  if (items.length === 0) {
    return <Empty>Your searches will show up here so you can run them again in one tap.</Empty>
  }
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={onClear} className="text-xs font-semibold text-stone-500 hover:text-red-600">
          Clear history
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => onRepeat(h)}
              className="flex w-full items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-left hover:border-brand-600"
            >
              <HistoryIcon className="mt-0.5 shrink-0 text-stone-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-stone-900">
                  {h.categoryLabel}
                  {h.keyword && <span className="font-medium text-stone-500"> · “{h.keyword}”</span>}
                </span>
                <span className="block truncate text-xs text-stone-500">
                  {h.locationLabel ?? `${h.latitude.toFixed(3)}, ${h.longitude.toFixed(3)}`} · {h.radiusKm} km ·{' '}
                  {h.resultCount} found
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-stone-400">{timeAgo(h.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Empty({ children }) {
  return (
    <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-4 py-8 text-center text-sm text-stone-500">
      {children}
    </p>
  )
}
