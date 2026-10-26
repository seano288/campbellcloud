// The Home Screen icon (and the landing-page tile): two chunky green plastic army men cheering on a khaki mound under a sign
// that says "go", on a quiet olive sunburst. Two big figures rather than a crowd of thin ones, so they still read on a
// phone-sized tile. One 512×512 SVG made in code (the letters are drawn as strokes, so it needs no font); tools/icons.ts
// rasterises it at build time.
const BG = '#3f6324';
const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520, cx = 256, cy = 300;
  return `<path d="M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z" fill="#4a7230"/>`;
}).join('');
const O = 'stroke="#111" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
/** A plastic army man on his base, 100 units tall, drawn at (x, y) and `s` times that. */
const soldier = (x: number, y: number, s: number, c: string) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="50" cy="93" rx="24" ry="5" fill="${c}" ${O}/>
  <path d="M42 62 L39 90 H47 L50 70 L53 90 H61 L58 62 Z" fill="${c}" ${O}/>
  <path d="M38 36 Q50 31 62 36 L60 64 H40 Z" fill="${c}" ${O}/>
  <circle cx="50" cy="25" r="9" fill="${c}" ${O}/>
  <path d="M38 24 Q38 10 50 10 Q62 10 62 24 Q50 21 38 24 Z" fill="${c}" ${O}/>
  <path d="M40 40 L24 12 M60 40 L76 12" stroke="#111" stroke-width="15" stroke-linecap="round"/><path d="M40 40 L24 12 M60 40 L76 12" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
</g>`;
const art = () => {
  // the sign they cheer under
  const sign = `<rect x="118" y="56" width="276" height="176" rx="26" fill="#fffdf4" stroke="#111" stroke-width="12"/>
    <g fill="none" stroke="#111" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="210" cy="132" r="38"/><path d="M248 108 V168 Q248 214 206 214 Q186 214 174 204"/>
      <circle cx="318" cy="132" r="38"/>
    </g>`;
  const green = '#6fae38', mound = `<ellipse cx="256" cy="520" rx="330" ry="104" fill="#d8c48a" stroke="#111" stroke-width="12"/>`;
  return `${sign}${mound}${soldier(28, 262, 2.25, green)}${soldier(259, 262, 2.25, green)}`;
};

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
