// The Home Screen icon: a crane's wrecking ball smashing into a wall of big letter tiles, two tiles flying off, on a hi-vis yellow
// sunburst that spins out from the hit, with a hazard-striped band along the bottom. Like the sibling icons it has one big hero (the
// ball) and a burst of rays behind it, so it reads at Home Screen size. One 512×512 SVG made in code; tools/icons.ts rasterises it at
// build time. The letters are drawn as text in a plain bold font, so they look the same wherever it's rasterised; like the game's
// tiles they are lowercase and never turned, so a b is never a d.
const BG = '#ffc61a', O = '#1d1d1f';
/** Where the ball hits the wall: the rays and the burst start here. */
const HIT = { x: 244, y: 262 };
const BALL = { x: 150, y: 250, r: 90 };
const TIP = { x: 82, y: 22 };

const pt = (x: number, y: number, r: number, deg: number) => { const a = (deg * Math.PI) / 180; return `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`; };

const rays = () => Array.from({ length: 16 }, (_, i) => {
  const step = 360 / 16;
  return `<path d="M${HIT.x} ${HIT.y} L${pt(HIT.x, HIT.y, 760, i * step - 5.6)} L${pt(HIT.x, HIT.y, 760, i * step + 5.6)} Z" fill="#ffe17a"/>`;
}).join('');

/** The bang where the ball meets the wall: a white star behind the tiles. */
const burst = () => {
  const pts = Array.from({ length: 24 }, (_, i) => pt(HIT.x + 6, HIT.y - 4, i % 2 ? 62 : 118, i * 15 - 8)).join(' L');
  return `<path d="M${pts} Z" fill="#fff" stroke="${O}" stroke-width="8" stroke-linejoin="round"/>`;
};

const tile = (x: number, y: number, t: string, s = 96) =>
  `<g transform="translate(${x} ${y})"><rect width="${s}" height="${s}" rx="${s * .17}" fill="#fff6dc" stroke="${O}" stroke-width="8"/><rect x="8" y="${s - 18}" width="${s - 16}" height="9" rx="4.5" fill="#00000014"/>` +
  `<text x="${s / 2}" y="${s * .72}" font-size="${s * .68}" font-weight="700" text-anchor="middle" font-family="Andika, Arial, Helvetica, sans-serif" fill="${O}">${t}</text></g>`;

/** The swing: white arcs round the boom tip, behind the ball. */
const swing = () => {
  const r = Math.hypot(BALL.x - TIP.x, BALL.y - TIP.y), at = (Math.atan2(BALL.y - TIP.y, BALL.x - TIP.x) * 180) / Math.PI;
  return [-58, 0, 58].map((dr, i) => {
    const rr = r + dr, a0 = at + 30 - i * 2, a1 = at + 56 - i * 4, d = `M${pt(TIP.x, TIP.y, rr, a1)} A${rr} ${rr} 0 0 0 ${pt(TIP.x, TIP.y, rr, a0)}`;
    return `<path d="${d}" fill="none" stroke="${O}" stroke-width="17" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
  }).join('');
};

/** The crane's lattice boom poking in from the top left, as the game draws it. */
const boom = () => {
  const x1 = -80, y1 = 150, x2 = TIP.x, y2 = TIP.y, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), w = 34, nx = (-dy / len) * w / 2, ny = (dx / len) * w / 2, n = 6;
  const zig = Array.from({ length: n }, (_, i) => { const t0 = i / n, t1 = (i + 1) / n, s = i % 2 ? 1 : -1; return `M${x1 + dx * t0 + nx * s} ${y1 + dy * t0 + ny * s} L${x1 + dx * t1 - nx * s} ${y1 + dy * t1 - ny * s}`; }).join(' ');
  return `<path d="M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} L${x2 - nx} ${y2 - ny} L${x1 - nx} ${y1 - ny} Z" fill="none" stroke="${O}" stroke-width="20" stroke-linejoin="round"/>` +
    `<path d="M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} M${x1 - nx} ${y1 - ny} L${x2 - nx} ${y2 - ny} ${zig}" fill="none" stroke="#ffe27a" stroke-width="8" stroke-linecap="round"/>` +
    `<circle cx="${x2}" cy="${y2}" r="15" fill="#8a929b" stroke="${O}" stroke-width="7"/>`;
};

const ball = () => {
  const { x, y, r } = BALL, ang = Math.atan2(y - TIP.y, x - TIP.x), top = { x: x - Math.cos(ang) * (r - 4), y: y - Math.sin(ang) * (r - 4) };
  return `<path d="M${TIP.x} ${TIP.y} L${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${O}" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M${TIP.x} ${TIP.y} L${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="#8a929b" stroke-width="7" stroke-dasharray="13 7" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2d33" stroke="${O}" stroke-width="10"/>` +
    `<path d="M${x - r * .62} ${y - r * .1} A${r * .66} ${r * .66} 0 0 1 ${x - r * .05} ${y - r * .64}" fill="none" stroke="#ffffff70" stroke-width="16" stroke-linecap="round"/>` +
    `<circle cx="${top.x.toFixed(1)}" cy="${top.y.toFixed(1)}" r="13" fill="#8a929b" stroke="${O}" stroke-width="7"/>`;
};

const art = () => {
  // the wall: c a t along the bottom, u p above, the top-left tile knocked out by the ball
  const wall = tile(196, 344, 'c') + tile(298, 344, 'a') + tile(400, 344, 't') + tile(298, 242, 'u') + tile(400, 242, 'p');
  const flying = tile(232, 96, 's', 84) + tile(366, 50, 'o', 84);
  const chips = [[286, 206, 16], [338, 168, 12], [204, 196, 12], [330, 222, 10]].map(([x, y, s]) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="#fff6dc" stroke="${O}" stroke-width="5"/>`).join('');
  return `${burst()}${wall}${chips}${flying}${boom()}${swing()}${ball()}`;
};

const band = () => `<rect y="444" width="512" height="68" fill="${O}"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 64 - 40} 512 L${i * 64 + 22} 450 H${i * 64 + 54} L${i * 64 - 8} 512 Z" fill="${BG}"/>`).join('')}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${rays()}${band()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
