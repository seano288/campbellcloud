// The Home Screen icon: three towers of different heights against an evening sky, their windows lit in rows (the arrays he counts),
// with a yellow-lined street along the bottom. On a dusk blue no sibling icon uses. One 512×512 SVG made in code; tools/icons.ts
// rasterises it at build time, and the landing tile uses it.
const BG = '#1f3a5f';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round"`;

function tower(x: number, w: number, rows: number, cols: number, wall: string, lit: (r: number, c: number) => boolean) {
  const win = 22, gap = (w - cols * win) / (cols + 1), top = 420 - rows * 38 - 24;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${420 - top}" fill="${wall}" ${line(10)}/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    s += `<rect x="${x + gap + c * (win + gap)}" y="${top + 20 + r * 38}" width="${win}" height="24" rx="3" fill="${lit(r, c) ? '#ffe27a' : '#2b3550'}" ${line(4)}/>`;
  }
  return { s, top };
}

const art = () => {
  const a = tower(70, 110, 4, 3, '#c8553d', (r, c) => (r + c) % 3 !== 1);
  const b = tower(196, 130, 8, 3, '#7fc8f8', (r, c) => (r * 2 + c) % 4 !== 0);
  const c = tower(342, 100, 6, 2, '#f2b84b', (r, c2) => (r + c2) % 2 === 0);
  const flag = `<path d="M261 ${b.top} V${b.top - 56}" ${line(8)} fill="none"/><path d="M261 ${b.top - 56} L305 ${b.top - 44} L261 ${b.top - 30} Z" fill="#e63946" ${line(6)}/>`;
  const street = `<rect x="-20" y="420" width="552" height="110" fill="#5b6170" ${line(10)}/><path d="M10 470 H502" stroke="#ffd23f" stroke-width="12" stroke-dasharray="40 30"/>`;
  const stars = [[60, 80], [150, 130], [420, 70], [470, 170], [330, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff6c8"/>`).join('');
  const moon = `<circle cx="420" cy="140" r="34" fill="#fff6c8" ${line(6)}/><circle cx="436" cy="128" r="30" fill="${BG}"/>`;
  return stars + moon + a.s + b.s + c.s + flag + street;
};

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
