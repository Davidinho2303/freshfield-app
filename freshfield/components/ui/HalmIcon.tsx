export function HalmIcon({ variant = 'light', size = 16 }: { variant?: 'light' | 'dark', size?: number }) {
  const h = size * 1.75
  return (
    <svg width={size} height={h} viewBox="0 0 24 42" fill="none">
      <line x1="12" y1="41" x2="12" y2="7"
        stroke={variant === 'dark' ? '#5aad5a' : '#2d6a2d'}
        strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 28 C10 26 5 21 1 13 C5 18 10 22 12 23" fill="#3d8c3d" />
      <path d="M12 20 C14 17 19 11 23 3 C19 9 13 14 12 16"
        fill={variant === 'dark' ? '#5aad5a' : '#5aad5a'} />
      <path d="M12 7 C11.5 4 12 1 12 1 C12.5 3 12.5 6 12 7Z"
        fill={variant === 'dark' ? '#5aad5a' : '#2d6a2d'} />
    </svg>
  )
}
