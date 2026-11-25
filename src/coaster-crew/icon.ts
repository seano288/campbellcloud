// The Home Screen icon: a red coaster car with two riders, hands up, cresting the top of a lift hill on chunky white supports, with a big
// red and white ride Token for a sun behind it, on a summer-evening sky (teal going pink). The thick dark outlines make it a sibling of the
// other games' icons; the teal-to-pink keeps it apart from Rover Code (navy), Globe Hopper (violet) and Sentence Express (wooden toy track).
// One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
const BG = '#1d6f7a';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const scene = () => `<defs><linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d6f7a"/><stop offset=".62" stop-color="#e07a9a"/><stop offset="1" stop-color="#ffc46b"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#cc-sky)"/>`;

/** The Token sun: a ridged white rim, a red face, a white star stamped in it. */
function token(cx: number, cy: number, r: number) {
  const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .22 : r * .5; return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r + 18}" fill="#fff3c0" opacity=".35"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" ${line(10)}/>
    <circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="none" stroke="#e63946" stroke-width="12" stroke-dasharray="9 10"/>
    <circle cx="${cx}" cy="${cy}" r="${r * .74}" fill="#e63946" ${line(7)}/>
    <polygon points="${star}" fill="#fff" ${line(5)}/>`;
}

const art = () => {
  // the hill: up from the left, a rounded crest, down to the right
  const rail = 'M-20 470 C 80 470, 150 300, 230 210 C 260 178, 300 178, 330 210 C 400 290, 430 420, 540 470';
  const posts = [70, 120, 170, 210, 350, 395, 440, 485].map(x => {
    const t = x < 270 ? 1 - Math.min(1, Math.max(0, (x + 20) / 270)) : (x - 270) / 270;
    const y = x < 270 ? 470 - (470 - 200) * Math.pow(1 - t, 1.6) : 200 + (470 - 200) * Math.pow(t, 1.3);
    return `<path d="M${x} ${y.toFixed(0)} V520" ${line(22)}/><path d="M${x} ${y.toFixed(0)} V520" stroke="#f6f8fb" stroke-width="11"/>`;
  }).join('');
  return `${token(380, 150, 92)}
  ${posts}
  <path d="${rail}" fill="none" ${line(34)}/>
  <path d="${rail}" fill="none" stroke="#e63946" stroke-width="18"/>
  <path d="${rail}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 16" opacity=".8"/>
  <g transform="translate(280 168) rotate(4)">
    <path d="M-34 -52 L-44 -98 M-22 -52 L-16 -100 M30 -52 L22 -100 M42 -52 L52 -96" ${line(12)}/>
    <circle cx="-28" cy="-50" r="20" fill="#ffcf9e" ${line(8)}/><circle cx="36" cy="-50" r="20" fill="#8a5a3a" ${line(8)}/>
    <rect x="-78" y="-44" width="156" height="58" rx="16" fill="#e63946" ${line(10)}/>
    <rect x="-66" y="-34" width="132" height="12" rx="6" fill="#fff"/>
    <circle cx="-44" cy="20" r="16" fill="#3a3f48" ${line(8)}/><circle cx="44" cy="20" r="16" fill="#3a3f48" ${line(8)}/>
    <circle cx="70" cy="-10" r="8" fill="#fff6a0" ${line(4)}/>
  </g>`;
};

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
