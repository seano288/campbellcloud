// The Home Screen icon: a wrecking ball swinging into a wall of letter tiles, tiles flying, on hi-vis yellow with a hazard-striped
// band along the bottom. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time. The letters are drawn as text in
// a plain bold font, so they look the same wherever it's rasterised.
const BG = '#ffc61a', O = '#1d1d1f';

const tile = (x: number, y: number, t: string, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot} 40 40)"><rect width="80" height="80" rx="14" fill="#fff6dc" stroke="${O}" stroke-width="8"/><text x="40" y="60" font-size="58" font-weight="700" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" fill="${O}">${t}</text></g>`;

const art = () => {
  const wall = [['s', 'h', 'i'], ['c', 'a', 't'], ['b', 'u', 'g']].flatMap((row, r) => row.map((t, c) => (r === 0 && c === 0 ? '' : tile(262 + c * 84, 132 + r * 84, t)))).join('');
  const flying = tile(176, 60, 's', -24) + tile(150, 168, 'p', 18);
  const chain = `<path d="M-20 -20 L176 300" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M-20 -20 L176 300" stroke="#8a929b" stroke-width="8" stroke-dasharray="14 8" stroke-linecap="round"/>`;
  const ball = `<circle cx="196" cy="330" r="74" fill="#2a2d33" stroke="${O}" stroke-width="10"/><circle cx="168" cy="300" r="18" fill="#fff" opacity=".5"/>`;
  const sparks = [[262, 300, 300, 280], [264, 340, 310, 350], [254, 380, 292, 412]].map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}" stroke="${O}" stroke-width="14" stroke-linecap="round"/><path d="M${a} ${b} L${c} ${d}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`).join('');
  return `${wall}${flying}${chain}${ball}${sparks}`;
};

const band = () => `<rect y="438" width="512" height="74" fill="${O}"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 64 - 40} 512 L${i * 64 + 14} 438 H${i * 64 + 46} L${i * 64 - 8} 512 Z" fill="${BG}"/>`).join('')}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/>${band()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
