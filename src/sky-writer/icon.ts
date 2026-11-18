// Sky Writer's icon, drawn in code: a big smoke letter "a" (single-storey, as he writes it) sitting on the three writing lines, drawn as
// contrails across a deep sky, and a red stunt biplane climbing away from the end of its stroke. Smoke and plane carry the family's
// thick dark outline, so the letter reads at Home Screen size. No sunburst (Time Flies is the blue sunburst with a clock and a grey jet):
// this one is ruled sky. The Home Screen icons, the landing tile and Home's Play tile all come from here.
export const ICON_BG = '#1f6fd0';
const INK = '#14161c', RED = '#e63946', RED_DARK = '#a8222c';

/** The red biplane, nose right, about 230 units long, centred on (0, 0). */
function biplane() {
  return `<g stroke="${INK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-78 -10 L-100 -66 L-74 -66 L-46 -14 Z" fill="${RED}"/>
    <path d="M-104 -2 L-60 -6 L-60 10 L-104 8 Z" fill="${RED_DARK}"/>
    <path d="M6 -60 L16 22 M54 -60 L58 22" fill="none" stroke-width="8"/>
    <rect x="-26" y="-80" width="124" height="24" rx="12" fill="${RED}"/>
    <path d="M104 0 Q98 -34 42 -34 L-92 -12 L-96 14 L42 34 Q98 34 104 0 Z" fill="${RED}"/>
    <path d="M-60 2 L60 2" stroke="#ffffff" stroke-width="9" fill="none"/>
    <circle cx="10" cy="-40" r="16" fill="#ffd9a8"/>
    <path d="M-6 -46 Q10 -60 26 -46" fill="#6b3a1e" stroke-width="7"/>
    <rect x="-10" y="12" width="128" height="22" rx="11" fill="${RED}"/>
    <ellipse cx="114" cy="0" rx="9" ry="52" fill="#ffffff" fill-opacity=".5" stroke-width="6"/>
    <circle cx="114" cy="0" r="13" fill="#ffd23f"/>
  </g>`;
}

/** The smoke "a" on its lines, and the trail running on from the foot of its stroke up to the plane. `cx, cy`: the middle of the round
 *  part, which fills the space between the middle line and the bottom line (radius `r`); `w`: the smoke's width; `o`: its outline. */
function smokeA(cx: number, cy: number, r: number, w: number, o: number) {
  const sx = cx + r;
  const paths = [
    `M${cx + r * 0.9} ${cy - r * 0.44} A${r} ${r} 0 1 0 ${cx + r * 0.9} ${cy + r * 0.44}`,
    `M${sx} ${cy - r} L${sx} ${cy + r}`,
    `M${sx} ${cy + r} C${sx + r * 0.09} ${cy + r * 1.94} ${sx + r * 1.56} ${cy + r * 1.62} ${sx + r * 1.75} ${cy - r * 0.47}`,
  ];
  const stroke = (color: string, width: number) => paths.map(d => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return stroke(INK, w + o * 2) + stroke('#ffffff', w) + `<g transform="translate(${sx + r * 2.28} ${cy - r * 1.5}) rotate(-38) scale(${(r / 64) * 0.94})">${biplane()}</g>`;
}

/** The three writing lines as contrails: top, middle (dashed) and bottom, `unit` apart. */
const LINES = (x0: number, x1: number, top: number, unit: number, k = 1) =>
  `<g stroke="#ffffff" stroke-linecap="round" fill="none"><path d="M${x0} ${top}H${x1}" stroke-width="${10 * k}" stroke-opacity=".85"/>
  <path d="M${x0} ${top + unit}H${x1}" stroke-width="${8 * k}" stroke-opacity=".75" stroke-dasharray="${26 * k} ${18 * k}"/>
  <path d="M${x0} ${top + unit * 2}H${x1}" stroke-width="${12 * k}" stroke-opacity=".95"/></g>`;

export function iconSvg(scale = 1) {
  const off = 256 * (1 - scale), cy = 300, r = 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1765c4"/><stop offset=".62" stop-color="#3f9be6"/><stop offset="1" stop-color="#8fd0fa"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#sw-sky)"/>
  <g fill="#ffffff" fill-opacity=".9"><ellipse cx="96" cy="54" rx="56" ry="20"/><ellipse cx="130" cy="44" rx="34" ry="22"/></g>
  <g fill="#ffffff"><ellipse cx="70" cy="470" rx="110" ry="46"/><ellipse cx="170" cy="488" rx="80" ry="40"/><ellipse cx="460" cy="476" rx="110" ry="44"/><ellipse cx="380" cy="500" rx="80" ry="30"/></g>
  <g transform="translate(${off} ${off}) scale(${scale})">${LINES(24, 488, cy - r * 3, r * 2)}${smokeA(168, cy, r, 40, 12)}</g></svg>`;
}

/** Home's Play tile: the same smoke "a" and plane, drawn to sit in the left of the tile with the ▶ beside it. The lines run on far past
 *  the drawing (the tile clips them), so they always cross the whole tile at the letter's own scale. */
export function playArt() {
  const cy = 250, r = 62;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet" overflow="visible" style="overflow:visible">
  ${LINES(-3000, 3000, cy - r * 3, r * 2, 0.8)}${smokeA(100, cy, r, 34, 7)}</svg>`;
}
