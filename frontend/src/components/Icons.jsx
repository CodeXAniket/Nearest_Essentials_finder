// Small inline SVG icons so the app needs no icon library.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
}

/**
 * One monochrome glyph per category. The palette has no accent colours, so
 * categories are told apart by shape. Stored as raw SVG markup because the
 * same glyph is also put inside Leaflet map pins (which take an HTML string).
 */
export const CATEGORY_GLYPHS = {
  ALL: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  GROCERY: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12h11L21 7H6"/>',
  PHARMACY: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="m7 7 7 7"/>',
  HOSPITAL: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  ATM: '<path d="M2 6h20v12H2z"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  BANK: '<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  BAKERY: '<path d="M4 12a8 5.5 0 0 1 16 0v7H4z"/><path d="M9 9.5v3M12 8.5v3M15 9.5v3"/>',
  FUEL: '<path d="M4 21V3h10v18M2 21h14M4 10h10"/><path d="M14 8h3v8a2 2 0 0 0 4 0V8l-3-3"/>',
  POST_OFFICE: '<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>',
}

export function glyphSvg(category, size = 16) {
  const paths = CATEGORY_GLYPHS[category] ?? CATEGORY_GLYPHS.ALL
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="square" aria-hidden="true">${paths}</svg>`
  )
}

export function CategoryIcon({ category, size = 16, className = '' }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center ${className}`}
      // Glyphs are fixed strings defined above, never user input.
      dangerouslySetInnerHTML={{ __html: glyphSvg(category, size) }}
    />
  )
}

export const SearchIcon = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export const CrosshairIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="2" /></svg>
)

export const PinIcon = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)

export const StarIcon = ({ filled, ...p }) => (
  <svg {...base} strokeLinejoin="round" {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
  </svg>
)

export const RouteIcon = (p) => (
  <svg {...base} {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" /></svg>
)

export const ArrowIcon = (p) => (
  <svg {...base} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>
)

export const PhoneIcon = (p) => (
  <svg {...base} strokeLinejoin="round" {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
)

export const ClockIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)

export const WalkIcon = (p) => (
  <svg {...base} strokeLinecap="round" {...p}><circle cx="13" cy="4" r="2" /><path d="m9 21 3-7 3 3v4M7 12l3-4 4 1 2 3M12 14l-1-6" /></svg>
)

export const CarIcon = (p) => (
  <svg {...base} {...p}><path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4z" /><path d="M8 14h.01M16 14h.01" /></svg>
)

export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
