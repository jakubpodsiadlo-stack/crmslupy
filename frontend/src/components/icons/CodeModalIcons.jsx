/** Proste ikony SVG (stroke), kolor przez `currentColor` / klasy rodzica */

function Svg({ children, className, size = 20, ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </Svg>
  )
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  )
}

export function IconKey(props) {
  return (
    <Svg {...props}>
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="M11 12l8.5-8.5M16 5l3 3M19 2l1 1" />
    </Svg>
  )
}

export function IconClock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1a7 7 0 0114 0v1" />
    </Svg>
  )
}

export function IconHome(props) {
  return (
    <Svg {...props}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </Svg>
  )
}

export function IconMapPin(props) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  )
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" />
    </Svg>
  )
}

export function IconFileText(props) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6M8 13h8M8 17h6M8 9h4" />
    </Svg>
  )
}

export function IconHash(props) {
  return (
    <Svg {...props}>
      <path d="M4 9h16M4 15h16M10 4L8 20M16 4l-2 16" />
    </Svg>
  )
}

export function IconCalculator(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h2M8 15h2M12 15h2M16 15h2" />
    </Svg>
  )
}

export function IconTag(props) {
  return (
    <Svg {...props}>
      <path d="M3 5l9-2 9 9-9 9-9-9V5z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Svg>
  )
}

/** Kalkulator — pola wody */
export function IconDroplet(props) {
  return (
    <Svg {...props}>
      <path d="M12 3s6 7.5 6 11a6 6 0 11-12 0c0-3.5 6-11 6-11z" />
    </Svg>
  )
}

/** Kalkulator — pola gazu */
export function IconFlame(props) {
  return (
    <Svg {...props}>
      <path d="M12 3c2 3 5 5.5 5 9.5a5 5 0 11-10 0c0-2.5 1.5-4.5 3-6.5.5 2 2 3.5 2 5.5 0 1.5-1 2.5-2 3.5 1-1 2-2.5 2-4.5z" />
    </Svg>
  )
}

/** Kalkulator — energia / prąd */
export function IconZap(props) {
  return (
    <Svg {...props}>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </Svg>
  )
}

/** Działka / grunt */
export function IconLand(props) {
  return (
    <Svg {...props}>
      <path d="M3 20h18M6 16l3-5 4 3 5-8 4 6M3 20V10l4 3 3-4 4 5 3-3 5 9" />
    </Svg>
  )
}

/** Słup / linia */
export function IconPole(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v18M8 21h8M9 8h6M10 5h4" />
    </Svg>
  )
}

/** Ceny / sumy */
export function IconCoins(props) {
  return (
    <Svg {...props}>
      <ellipse cx="9" cy="7" rx="5" ry="2.5" />
      <path d="M4 7v4c0 1.5 2.5 2.5 5 2.5s5-1 5-2.5V7M4 11v4c0 1.5 2.5 2.5 5 2.5s5-1 5-2.5v-4" />
    </Svg>
  )
}

/** ID / dokument */
export function IconIdCard(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M14 9h4M14 13h4" />
    </Svg>
  )
}
