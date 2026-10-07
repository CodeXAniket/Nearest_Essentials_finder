import { timeAgo } from '../utils.js'
import { CategoryIcon } from './Icons.jsx'

export default function HistoryList({ items, onRepeat, onClear }) {
  if (items.length === 0) {
    return <Empty>Your searches will show up here so you can run them again in one tap.</Empty>
  }
  return (
    <div>
      <div className="flex justify-end border-b border-hairline px-4 py-2 sm:px-5">
        <button onClick={onClear} className="type-caption font-bold text-ink underline underline-offset-4">
          Clear history
        </button>
      </div>
      <ul>
        {items.map((h) => (
          <li key={h.id} className="border-b border-hairline">
            <button
              onClick={() => onRepeat(h)}
              className="flex w-full items-start gap-4 px-4 py-4 text-left hover:bg-canvas-soft sm:px-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center bg-ink text-canvas">
                <CategoryIcon category={h.category ?? 'ALL'} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[19px] leading-6 text-ink">
                  {h.categoryLabel}
                  {h.keyword && <span className="text-body"> · “{h.keyword}”</span>}
                </span>
                <span className="type-caption mt-0.5 block truncate text-body">
                  {h.locationLabel ?? `${h.latitude.toFixed(3)}, ${h.longitude.toFixed(3)}`} · {h.radiusKm} km ·{' '}
                  {h.resultCount} found
                </span>
              </span>
              <span className="type-caption shrink-0 text-body">{timeAgo(h.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Empty({ children }) {
  return (
    <div className="px-4 py-5 sm:px-5">
      <p className="type-body-serif-md bg-canvas-soft px-6 py-8 text-center italic text-ink-soft">{children}</p>
    </div>
  )
}
