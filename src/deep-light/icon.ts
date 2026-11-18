// The Home Screen icon: his yellow submarine climbing in from the lower left of a near-black sea, its headlight beam a warm wedge
// up to a glowing fish. The sunburst every sibling icon has spins out from the fish here, in deep-sea blues, because in the dark the
// fish's own light is the middle of the picture. Cyan fish, magenta fins, lime lights, headlight yellow: the game's colour world.
// One 512×512 SVG made in code; tools/icons.ts rasterises it at build time.
const BG = '#04102a', RAY = '#0b2552', O = '#141414', SUB = '#ffd23f', SUB2 = '#e8a800', FISH = '#5af0ff', FIN = '#ff5ad8', LIME = '#9aff5a';
/** The fish's middle: the rays and the beam meet here. */
const FISH_AT = { x: 346, y: 186 };
/** The submarine: where it sits and how far it's tipped up toward the fish. */
const SUB_AT = { x: 196, y: 380, tilt: -13, k: 1.02 };

const rad = (d: number) => (d * Math.PI) / 180;
const f1 = (n: number) => n.toFixed(1);
/** A point on the submarine's drawing, in the icon's coordinates. */
function onSub(x: number, y: number) {
  const a = rad(SUB_AT.tilt), k = SUB_AT.k;
  return { x: SUB_AT.x + k * (x * Math.cos(a) - y * Math.sin(a)), y: SUB_AT.y + k * (x * Math.sin(a) + y * Math.cos(a)) };
}
const LAMP = onSub(134, -24);

const rays = () => Array.from({ length: 16 }, (_, i) => {
  const step = 360 / 16, a0 = rad(i * step - 5.5), a1 = rad(i * step + 5.5), r = 760, { x, y } = FISH_AT;
  return `<path d="M${x} ${y} L${f1(x + r * Math.cos(a0))} ${f1(y + r * Math.sin(a0))} L${f1(x + r * Math.cos(a1))} ${f1(y + r * Math.sin(a1))} Z" fill="${RAY}"/>`;
}).join('');

/** The beam: from the headlight, widening to take in the whole fish. */
function beam() {
  const dx = FISH_AT.x - LAMP.x, dy = FISH_AT.y - LAMP.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, far = 1.2, half = 128;
  const ex = LAMP.x + dx * far, ey = LAMP.y + dy * far;
  return `<path d="M${f1(LAMP.x + nx * 14)} ${f1(LAMP.y + ny * 14)} L${f1(ex + nx * half)} ${f1(ey + ny * half)} L${f1(ex - nx * half)} ${f1(ey - ny * half)} L${f1(LAMP.x - nx * 14)} ${f1(LAMP.y - ny * 14)} Z" fill="url(#dl-beam)"/>`;
}

const fish = `
  <g transform="translate(${FISH_AT.x} ${FISH_AT.y}) rotate(12) scale(1.42)">
    <path d="M-42 0 L-90 -38 Q-74 0 -90 38 Z" fill="${FIN}" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>
    <path d="M-22 -34 Q2 -68 30 -36" fill="${FIN}" stroke="${O}" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="0" cy="0" rx="60" ry="42" fill="${FISH}" stroke="${O}" stroke-width="10"/>
    <ellipse cx="-6" cy="18" rx="44" ry="17" fill="#fff" opacity=".28"/>
    ${[[-30, 20], [-12, 26], [6, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${LIME}" stroke="${O}" stroke-width="3.5"/>`).join('')}
    <circle cx="26" cy="-8" r="15" fill="#fff" stroke="${O}" stroke-width="6"/>
    <circle cx="30" cy="-7" r="8.5" fill="#1b1530"/>
    <circle cx="26" cy="-11" r="3.2" fill="#fff"/>
    <path d="M32 15 Q42 23 52 13" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>
  </g>`;

const sub = `
  <g transform="translate(${SUB_AT.x} ${SUB_AT.y}) rotate(${SUB_AT.tilt}) scale(${SUB_AT.k})">
    <path d="M-150 0 L-180 -38 L-180 38 Z" fill="${SUB2}" stroke="${O}" stroke-width="11" stroke-linejoin="round"/>
    <rect x="-56" y="-110" width="98" height="64" rx="18" fill="${SUB}" stroke="${O}" stroke-width="12"/>
    <path d="M-4 -110 V-142 H32" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="154" ry="76" fill="${SUB}" stroke="${O}" stroke-width="13"/>
    <path d="M-122 32 Q0 68 122 32" fill="none" stroke="${SUB2}" stroke-width="13" stroke-linecap="round"/>
    ${[-76, -10, 56].map(x => `<circle cx="${x}" cy="-8" r="26" fill="#9fe6ff" stroke="${O}" stroke-width="10"/><circle cx="${x - 8}" cy="-16" r="7" fill="#fff"/>`).join('')}
    <circle cx="134" cy="-24" r="25" fill="#fffbe0" stroke="${O}" stroke-width="10"/>
  </g>`;

const bubbles = () => [[52, 300, 14], [80, 252, 10], [48, 210, 11], [86, 172, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${FISH}" stroke-width="6"/>`).join('');

const art = () => `<circle cx="${FISH_AT.x}" cy="${FISH_AT.y}" r="175" fill="url(#dl-glow)"/>${beam()}${fish}${bubbles()}${sub}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>`
    + `<linearGradient id="dl-beam" x1="${f1(LAMP.x)}" y1="${f1(LAMP.y)}" x2="${FISH_AT.x}" y2="${FISH_AT.y}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="${SUB}" stop-opacity=".85"/></linearGradient>`
    + `<radialGradient id="dl-glow"><stop offset="0" stop-color="${FISH}" stop-opacity=".85"/><stop offset=".5" stop-color="${FISH}" stop-opacity=".3"/><stop offset="1" stop-color="${FISH}" stop-opacity="0"/></radialGradient>`
    + `</defs><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
