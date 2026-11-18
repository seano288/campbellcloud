// Sky Writer's icon, drawn in code: a red biplane finishing a smoke letter "a" across sky blue, with the three writing lines drawn as
// contrails behind it. The Home Screen icons, the landing tile and Home's Play tile all come from here.
export const ICON_BG = '#3d93dc';

/** The red biplane, nose right, about 200 units long, centred on (0, 0). */
function biplane() {
  return `<g stroke="#14161c" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-80 -14 L-104 -62 L-84 -62 L-50 -16 Z" fill="#ffffff"/>
    <path d="M10 -58 L18 30 M58 -58 L60 30" fill="none"/>
    <rect x="-24" y="-74" width="120" height="18" rx="9" fill="#ffffff"/>
    <path d="M100 0 Q94 -32 40 -32 L-92 -14 L-96 14 L40 32 Q94 32 100 0 Z" fill="#e63946"/>
    <path d="M-10 -28 Q14 -66 44 -28" fill="none"/>
    <circle cx="14" cy="-42" r="13" fill="#ffd9a8"/>
    <rect x="-6" y="8" width="118" height="17" rx="8.5" fill="#ffffff"/>
    <ellipse cx="108" cy="0" rx="7" ry="44" fill="#ffffff" fill-opacity=".35" stroke-width="5"/>
    <circle cx="108" cy="0" r="11" fill="#f4f6f8"/>
  </g>`;
}

/** The smoke "a": a circle that circles back, then its line pulled down, puffy. */
const SMOKE_A = (cx: number, cy: number, r: number, w: number) =>
  `<g fill="none" stroke-linecap="round"><path d="M${cx + r * 0.87} ${cy - r * 0.5} A${r} ${r} 0 1 0 ${cx + r * 0.87} ${cy + r * 0.5}" stroke="#ffffff" stroke-opacity=".45" stroke-width="${w * 1.8}"/>
  <path d="M${cx + r} ${cy - r} L${cx + r} ${cy + r}" stroke="#ffffff" stroke-opacity=".45" stroke-width="${w * 1.8}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#ffffff" stroke-width="${w}"/><path d="M${cx + r} ${cy - r} L${cx + r} ${cy + r}" stroke="#ffffff" stroke-width="${w}"/></g>`;

const LINES = (x0: number, x1: number, top: number, unit: number) =>
  `<g stroke="#ffffff" stroke-linecap="round"><path d="M${x0} ${top}H${x1}" stroke-width="6" stroke-opacity=".8"/>
  <path d="M${x0} ${top + unit}H${x1}" stroke-width="5" stroke-opacity=".75" stroke-dasharray="22 16"/>
  <path d="M${x0} ${top + unit * 2}H${x1}" stroke-width="8"/></g>`;

export function iconSvg(scale = 1) {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="sw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7fd0"/><stop offset="1" stop-color="#9fd6fb"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#sw-sky)"/>
  <g fill="#ffffff" fill-opacity=".9"><ellipse cx="96" cy="430" rx="80" ry="30"/><ellipse cx="160" cy="412" rx="60" ry="34"/><ellipse cx="420" cy="452" rx="90" ry="30"/></g>
  <g transform="translate(${off} ${off}) scale(${scale})">
    ${LINES(40, 472, 120, 120)}
    ${SMOKE_A(200, 300, 60, 26)}
    <path d="M260 360 Q284 392 330 380" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round"/>
    <g transform="translate(386 358) rotate(-14) scale(.78)">${biplane()}</g>
  </g></svg>`;
}

/** Home's Play tile: the same scene, wider. */
export function playArt() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">
  <defs><linearGradient id="sw-play" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8ad8"/><stop offset="1" stop-color="#b6e2fd"/></linearGradient></defs>
  <rect width="800" height="400" fill="url(#sw-play)"/>
  <g fill="#ffffff" fill-opacity=".9"><ellipse cx="90" cy="360" rx="110" ry="34"/><ellipse cx="170" cy="342" rx="70" ry="36"/><ellipse cx="700" cy="370" rx="130" ry="34"/></g>
  ${LINES(20, 780, 70, 95)}
  ${SMOKE_A(170, 212, 48, 20)}
  <path d="M218 260 Q250 300 300 288" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round"/>
  <g transform="translate(372 270) rotate(-10) scale(.62)">${biplane()}</g></svg>`;
}
