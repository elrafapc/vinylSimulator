// Ícones do player em SVG (T50): seguem `currentColor`, então podem ser "gravados" em latão/creme pelo CSS.
// Os caracteres ⏮/⏭ viravam emoji colorido em alguns sistemas.
interface IconProps {
  className?: string;
}

const svgProps = { viewBox: '0 0 24 24', width: '1em', height: '1em', 'aria-hidden': true, focusable: false } as const;

export function PrevIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} data-icon="prev">
      <path fill="currentColor" d="M5 5h2.5v14H5zM19 5v14L8.5 12z" />
    </svg>
  );
}

export function NextIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} data-icon="next">
      <path fill="currentColor" d="M16.5 5H19v14h-2.5zM5 5v14l10.5-7z" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} data-icon="play">
      <path fill="currentColor" d="M7 4.5v15L20 12z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} data-icon="pause">
      <path fill="currentColor" d="M6 5h4.5v14H6zM13.5 5H18v14h-4.5z" />
    </svg>
  );
}

const STAR = 'M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z';

export function StarIcon({ filled, className }: IconProps & { filled: boolean }) {
  return (
    <svg {...svgProps} className={className} data-icon={filled ? 'star-filled' : 'star-empty'}>
      <path d={STAR} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
