export function PylonIcon({ className = '', ...rest }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...rest}
    >
      <path
        d="M32 4 L14 84 M32 4 L50 84 M32 4 L32 84"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 36 L58 36 M10 52 L54 52 M16 68 L48 68"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="4" r="3" fill="currentColor" />
      <path
        d="M26 22 L38 22 M24 44 L40 44"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}
