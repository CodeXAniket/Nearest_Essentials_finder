// Small inline SVG icons so the app needs no icon library.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const LogoMark = (props) => (
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" {...props}>
    <path d="M16 2C10.5 2 6 6.4 6 11.9 6 19.3 16 30 16 30s10-10.7 10-18.1C26 6.4 21.5 2 16 2z" fill="currentColor" />
    <path d="M14.2 8h3.6v3.2H21v3.6h-3.2V18h-3.6v-3.2H11v-3.6h3.2z" fill="#fff" />
  </svg>
)

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
  <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
  </svg>
)

export const RouteIcon = (p) => (
  <svg {...base} {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" /></svg>
)

export const ExternalIcon = (p) => (
  <svg {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
)

export const PhoneIcon = (p) => (
  <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
)

export const ClockIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)

export const WalkIcon = (p) => (
  <svg {...base} {...p}><circle cx="13" cy="4" r="2" /><path d="m9 21 3-7 3 3v4M7 12l3-4 4 1 2 3M12 14l-1-6" /></svg>
)

export const CarIcon = (p) => (
  <svg {...base} {...p}><path d="M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4z" /><circle cx="8" cy="14" r=".5" /><circle cx="16" cy="14" r=".5" /></svg>
)

export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
)

export const HistoryIcon = (p) => (
  <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
)
