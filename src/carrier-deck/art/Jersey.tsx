// A deck crew jersey, drawn in SVG: the shirt in its colour with a thick outline, a collar, and (for his own jersey in the logbook)
// a stripe on the sleeve for each rank. The Crew tab's shirts and the logbook both use it.
const O = '#14161b';
const SHIRT = 'M30 10 L44 4 Q50 12 56 4 L70 10 L92 26 L80 44 L72 38 L72 92 L28 92 L28 38 L20 44 L8 26 Z';

/** `stripes`: how many rank stripes on the left sleeve (up to six are drawn, then a number). `name`: printed across the back. */
export function Jersey({ hex, stripes = 0, label, class: c = '' }: { hex: string; stripes?: number; label?: string; class?: string }) {
  const shown = Math.min(6, stripes), dark = hex === '#f4f6fa' || hex === '#ffd23f';
  return (
    <svg class={c} viewBox="0 0 100 100" aria-hidden="true">
      <path d={SHIRT} fill={hex} stroke={O} stroke-width="6" stroke-linejoin="round" />
      <path d="M44 4 Q50 16 56 4" fill="none" stroke={O} stroke-width="5" stroke-linecap="round" />
      <path d="M28 66 H72" stroke={dark ? '#00000022' : '#ffffff33'} stroke-width="8" />
      {Array.from({ length: shown }, (_, i) => <path key={i} d={`M${11 + i * 2.4} ${28 - i * 1.8} L${19 + i * 2.4} ${40 - i * 1.8}`} stroke="#ffd23f" stroke-width="3.4" stroke-linecap="round" />)}
      {stripes > 6 && <text x="50" y="58" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="26" fill={dark ? O : '#fff'} stroke={dark ? 'none' : O} stroke-width="1.5">{stripes}</text>}
      {label && stripes <= 6 && <text x="50" y="60" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="24" fill={dark ? O : '#fff'}>{label}</text>}
    </svg>
  );
}
