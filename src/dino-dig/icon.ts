// The Home Screen icon: a big T. rex skull half out of the dirt (deep snout, the big hole in front of the eye, a row of teeth just above
// the ground), with a letter tile standing in the dirt beside it and a fern behind, on a warm sandstone sunburst like the sibling icons
// (one big hero, a burst of rays behind it, so it reads at Home Screen size). One 512×512 SVG made in code; tools/icons.ts rasterises it
// at build time. The letter is drawn as shapes, not text, so it is the game's single-storey a wherever it's rasterised.
const BG = '#e2a35a', RAY = '#efc07c', O = '#1b1410', BONE = '#f6efdc', BONE_SHADE = '#dccfae', DIRT = '#8a5a33', DIRT2 = '#6e4426', DIRT3 = '#a8743f', FERN = '#4f8a3c';
/** The rays start behind the skull. */
const C = { x: 220, y: 250 };
const GROUND = 334;

const pt = (x: number, y: number, r: number, deg: number) => { const a = (deg * Math.PI) / 180; return `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`; };
const rays = () => Array.from({ length: 16 }, (_, i) => `<path d="M${C.x} ${C.y} L${pt(C.x, C.y, 760, i * 22.5 - 5.6)} L${pt(C.x, C.y, 760, i * 22.5 + 5.6)} Z" fill="${RAY}"/>`).join('');

/** A fern frond growing out of the dirt behind the skull, curling over at the top. */
const fern = (x: number, flip = 1) => {
  const leaves = Array.from({ length: 6 }, (_, i) => {
    const y = GROUND - 40 - i * 34, len = 46 - i * 5, lean = i * 5 * flip;
    return `<path d="M${x + lean} ${y} q${-len * .6} ${-14} ${-len} ${-6}" /><path d="M${x + lean} ${y} q${len * .6} ${-14} ${len} ${-6}" />`;
  }).join('');
  return `<g fill="none" stroke="${O}" stroke-width="22" stroke-linecap="round">${leaves}<path d="M${x} ${GROUND} C${x} ${GROUND - 120} ${x + 10 * flip} ${GROUND - 190} ${x + 34 * flip} ${GROUND - 222}"/></g>` +
    `<g fill="none" stroke="${FERN}" stroke-width="11" stroke-linecap="round">${leaves}<path d="M${x} ${GROUND} C${x} ${GROUND - 120} ${x + 10 * flip} ${GROUND - 190} ${x + 34 * flip} ${GROUND - 222}"/></g>`;
};

/** The skull, pointing left: a deep snout, the big window in front of the eye, the eye socket high at the back, teeth along the bottom. */
const skull = () => {
  const teeth = [[64, 30], [100, 38], [138, 44], [178, 46], [220, 44], [260, 40], [298, 32]]
    .map(([x, h]) => `<path d="M${x! - 15} 298 L${x! + 1} ${298 + h!} L${x! + 17} 298 Z" fill="#fffaf0" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>`).join('');
  return `
  ${teeth}
  <path d="M40 262 C38 226 62 204 98 194 C160 176 226 146 300 128 C352 116 398 136 410 180 C420 222 404 266 368 300 L66 300 C50 296 41 282 40 262 Z" fill="${BONE}" stroke="${O}" stroke-width="12" stroke-linejoin="round"/>
  <path d="M96 286 C160 280 250 280 344 282" fill="none" stroke="${BONE_SHADE}" stroke-width="12" stroke-linecap="round"/>
  <path d="M168 252 C176 216 214 192 262 192 C274 218 266 246 248 266 C220 272 188 268 168 252 Z" fill="${O}"/>
  <path d="M304 150 C334 146 356 166 354 196 C352 224 334 244 318 262 C302 238 290 212 292 184 C292 166 296 154 304 150 Z" fill="${O}"/>
  <circle cx="318" cy="182" r="10" fill="#fff"/>
  <ellipse cx="78" cy="226" rx="16" ry="11" fill="${O}" transform="rotate(-18 78 226)"/>`;
};

/** The dirt the skull is half buried in, in layers, with pebbles. `a` and `b` are how far it runs past the left and right edges (and down
 *  past the bottom), so it still fills the icon when the art is shrunk for a maskable icon. */
const dirt = (a = 10) => {
  const L = -a, R = 512 + a, B = 512 + a;
  return `
  <path d="M${L} ${GROUND} C70 ${GROUND - 14} 160 ${GROUND + 8} 250 ${GROUND - 4} C340 ${GROUND - 14} 430 ${GROUND - 2} ${R} ${GROUND - 12} L${R} ${B} L${L} ${B} Z" fill="${DIRT3}" stroke="${O}" stroke-width="12" stroke-linejoin="round"/>
  <path d="M${L} 392 C110 378 220 404 330 390 C420 380 470 392 ${R} 384 L${R} ${B} L${L} ${B} Z" fill="${DIRT}"/>
  <path d="M${L} 452 C100 440 200 462 320 448 C410 440 470 452 ${R} 444 L${R} ${B} L${L} ${B} Z" fill="${DIRT2}"/>
  ${[[56, 366, 13], [176, 360, 10], [300, 418, 14], [120, 428, 11], [420, 474, 13], [236, 484, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9b98a" stroke="${O}" stroke-width="6"/>`).join('')}`;
};

/** The letter tile standing in the dirt, tilted a little. Its a is the school a: a round bowl and a straight stem. */
const tile = () => `
  <g transform="translate(386 214) rotate(9)">
    <rect width="118" height="128" rx="22" fill="#fff6dc" stroke="${O}" stroke-width="12"/>
    <rect x="12" y="102" width="94" height="12" rx="6" fill="#00000018"/>
    <circle cx="54" cy="62" r="26" fill="none" stroke="${O}" stroke-width="15"/>
    <path d="M82 30 L82 92" stroke="${O}" stroke-width="15" stroke-linecap="round"/>
  </g>`;

/** The skull alone, for the Play tile on Home (the same skull as the icon): an SVG cropped to it, teeth at the bottom edge. */
export const skullSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="26 112 396 240" aria-hidden="true">${skull()}</svg>`;

const art = (scale: number) => `${fern(450, -1)}${skull()}${dirt(10 + (256 * (1 - scale)) / scale)}${tile()}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art(scale)}</g></svg>`;
}
export const ICON_BG = BG;
