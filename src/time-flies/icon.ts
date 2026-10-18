// The Home Screen icon: a cockpit-style clock on a sky-blue sunburst with a jet swooping past. One 512×512 SVG made in
// code; tools/icons.ts rasterises it at build time.
const SKY = '#2f8fe0';
const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520;
  return `<path d="M256 256 L${256 + r * Math.cos(a0)} ${256 + r * Math.sin(a0)} L${256 + r * Math.cos(a1)} ${256 + r * Math.sin(a1)} Z" fill="#5fb0f0"/>`;
}).join('');
const ticks = () => Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180, x1 = 236 + Math.sin(a) * 128, y1 = 270 - Math.cos(a) * 128, x2 = 236 + Math.sin(a) * 108, y2 = 270 - Math.cos(a) * 108;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1d1d1f" stroke-width="${i % 3 ? 8 : 14}" stroke-linecap="round"/>`;
}).join('');
const art = () => `
  <circle cx="236" cy="270" r="170" fill="#3b424c" stroke="#111" stroke-width="12"/>
  <circle cx="236" cy="270" r="146" fill="#fbfaf4" stroke="#111" stroke-width="8"/>
  ${ticks()}
  <line x1="236" y1="270" x2="236" y2="168" stroke="#1f5fd1" stroke-width="16" stroke-linecap="round"/>
  <line x1="236" y1="270" x2="300" y2="300" stroke="#e2352b" stroke-width="22" stroke-linecap="round"/>
  <circle cx="236" cy="270" r="16" fill="#2a2f36"/>
  <g transform="translate(372 132) rotate(35)" stroke="#111" stroke-width="8" stroke-linejoin="round">
    <path d="M0 -92 C14 -70 16 -40 16 -10 L92 34 L92 52 L16 34 L14 70 L40 90 L40 102 L0 92 L-40 102 L-40 90 L-14 70 L-16 34 L-92 52 L-92 34 L-16 -10 C-16 -40 -14 -70 0 -92 Z" fill="#d6dde4"/>
    <path d="M0 -62 C8 -50 8 -36 6 -26 L-6 -26 C-8 -36 -8 -50 0 -62 Z" fill="#7cc8ff" stroke-width="5"/>
  </g>
  <path d="M190 470 Q300 430 380 260" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-dasharray="4 30" opacity=".85"/>`;

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${SKY}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_SKY = SKY;
