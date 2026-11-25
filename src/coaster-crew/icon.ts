// The Home Screen icon: a red coaster car with two riders, hands up, tipping over the top of a tall lift hill, side on, with a big red and
// white ride Token for a sun behind it, on a summer-evening sky (teal going through violet to pink and peach) with soft rays from the
// Token. The track is two rails with ties on chunky white supports, the family's thick dark outlines on everything. The rays and the
// outlines make it a sibling of the other games' icons; the evening sky and the tall side-on hill keep it apart from Sentence Express (a
// wooden toy train on a table, under a blue sky) and Turbo Tally (a racing car on red rays).
// One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
const BG = '#1d6f7a';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f = (n: number) => n.toFixed(1);

/** The summer evening sky (the same ramp as the game's), with rays fanning out from the Token sun. */
const scene = () => {
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a0 = (i / 14) * Math.PI * 2, a1 = a0 + Math.PI / 14, R = 760, cx = 162, cy = 150;
    return `M${cx} ${cy}L${f(cx + Math.cos(a0) * R)} ${f(cy + Math.sin(a0) * R)}L${f(cx + Math.cos(a1) * R)} ${f(cy + Math.sin(a1) * R)}Z`;
  }).join('');
  return `<defs><linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d6f7a"/><stop offset=".3" stop-color="#2f7d96"/><stop offset=".52" stop-color="#7a72b4"/><stop offset=".74" stop-color="#e07a9a"/><stop offset="1" stop-color="#ffc46b"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#cc-sky)"/>
  <path d="${rays}" fill="#fff" opacity=".1"/>`;
};

/** The Token sun: a white rim with a ridged (notched) edge, a red face, a white star stamped in it. Same design as the currency icon. */
function token(cx: number, cy: number, r: number) {
  const ridges = 32, rim = Array.from({ length: ridges * 2 }, (_, i) => {
    const a = (i / (ridges * 2)) * Math.PI * 2, rr = i % 2 ? r * .92 : r;
    return `${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`;
  }).join(' ');
  const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .25 : r * .54; return `${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`; }).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r + 26}" fill="#fff3c0" opacity=".28"/>
    <polygon points="${rim}" fill="#fff" ${line(10)}/>
    <circle cx="${cx}" cy="${cy}" r="${r * .72}" fill="#e63946" ${line(8)}/>
    <polygon points="${star}" fill="#fff" ${line(7)}/>`;
}

/** The track's top rail: up from the bottom left, a short rounded crest, then a steep drop off the right edge. */
const smooth = (u: number) => { const t = Math.max(0, Math.min(1, u)); return t * t * (3 - 2 * t); };
const railY = (x: number) => (x < 300 ? 470 - 178 * smooth((x + 40) / 330) : 292 + 200 * smooth((x - 316) / 210));
const at = (x: number) => { const y = railY(x), d = (railY(x + 1) - railY(x - 1)) / 2, n = Math.hypot(1, d); return { x, y, nx: -d / n, ny: 1 / n, angle: Math.atan(d) }; };

const art = () => {
  const xs = Array.from({ length: 101 }, (_, i) => -40 + i * 5.9);
  const top = xs.map(x => at(x)), GAP = 26;
  const poly = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
  const upper = poly(top), lower = poly(top.map(p => ({ x: p.x + p.nx * GAP, y: p.y + p.ny * GAP })));
  const ties = top.filter((_, i) => i % 3 === 0).map(p => `M${f(p.x)} ${f(p.y)}L${f(p.x + p.nx * GAP)} ${f(p.y + p.ny * GAP)}`).join('');
  // chunky supports from the lower rail to the ground, with a cross brace between each pair
  const postX = [92, 172, 252, 400, 470];
  const posts = postX.map(x => { const p = at(x), y = p.y + p.ny * GAP; return { x: p.x + p.nx * GAP, y }; });
  const GROUND = 468;
  const postPaths = posts.map(p => `M${f(p.x)} ${f(p.y)}V${GROUND + 4}`).join('');
  const car = at(314), deg = (car.angle * 180) / Math.PI + 7;
  return `${token(162, 150, 104)}
  <rect x="-10" y="${GROUND}" width="532" height="60" fill="#5fb84a" ${line(8)}/>
  <path d="${postPaths}" fill="none" ${line(26)}/><path d="${postPaths}" fill="none" stroke="#f6f8fb" stroke-width="13"/>
  <path d="${upper}" fill="none" ${line(26)}/><path d="${lower}" fill="none" ${line(22)}/><path d="${ties}" fill="none" ${line(10)}/>
  <path d="${lower}" fill="none" stroke="#e63946" stroke-width="10" stroke-linecap="round"/>
  <path d="${upper}" fill="none" stroke="#e63946" stroke-width="14" stroke-linecap="round"/>
  <path d="${upper}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="12 18" opacity=".7"/>
  <g transform="translate(${f(car.x)} ${f(car.y - 8)}) rotate(${f(deg)})">
    <path d="M-54 -62 L-70 -116 M-28 -62 L-16 -118 M30 -62 L20 -118 M56 -62 L72 -114" ${line(13)}/>
    <circle cx="-70" cy="-120" r="11" fill="#ffcf9e" ${line(6)}/><circle cx="-15" cy="-122" r="11" fill="#ffcf9e" ${line(6)}/>
    <circle cx="19" cy="-122" r="11" fill="#8a5a3a" ${line(6)}/><circle cx="73" cy="-118" r="11" fill="#8a5a3a" ${line(6)}/>
    <circle cx="-41" cy="-62" r="23" fill="#ffcf9e" ${line(8)}/><circle cx="43" cy="-62" r="23" fill="#8a5a3a" ${line(8)}/>
    <rect x="-94" y="-56" width="188" height="64" rx="18" fill="#e63946" ${line(10)}/>
    <rect x="-80" y="-44" width="160" height="13" rx="6.5" fill="#fff"/>
    <circle cx="-52" cy="14" r="17" fill="#3a3f48" ${line(8)}/><circle cx="52" cy="14" r="17" fill="#3a3f48" ${line(8)}/>
    <circle cx="82" cy="-14" r="9" fill="#ffd23f" ${line(5)}/>
  </g>`;
};

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
