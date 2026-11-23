// The Home Screen icon: three chunky towers of different heights (warm brick, glass blue, park green), their windows lit in rows (the
// arrays he counts), against a bright golden-hour sky with the sun's rays behind them and a street with yellow lane lines along the
// bottom. Daytime and warm on purpose: Hook and Ladder's town is at night, and no sibling uses a sunlit sky with a warm horizon. The
// windows are few and big so the rows still read at tile size. One 512×512 SVG made in code; tools/icons.ts rasterises it at build
// time, and the landing tile and the Start screen use it.
const BG = '#3aa6ea';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round"`;
const GROUND = 418;

/** A tower standing on the street: `rows` floors of `cols` windows, a lighter edge down its left side and a cap on its roof. */
function tower(x: number, w: number, top: number, rows: number, cols: number, wall: string, edge: string, cap: string, dark: (r: number, c: number) => boolean) {
  const win = 30, gapX = (w - cols * win) / (cols + 1), pitch = 44, h = GROUND - top;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>`;
  s += `<rect x="${x}" y="${top}" width="14" height="${h}" fill="${edge}"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="none" ${line(10)}/>`;
  s += `<rect x="${x - 8}" y="${top - 20}" width="${w + 16}" height="24" rx="4" fill="${cap}" ${line(9)}/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lit = !dark(r, c);
    s += `<rect x="${x + gapX + c * (win + gapX)}" y="${top + 26 + r * pitch}" width="${win}" height="${win}" rx="4" fill="${lit ? '#ffe27a' : '#2b3550'}" ${line(5)}/>`;
  }
  return s;
}

const art = () => {
  // sun rays from behind the tall tower, then the sun itself
  const sx = 300, sy = 150;
  let rays = '';
  for (let i = 0; i < 16; i += 2) {
    const a = (i / 16) * Math.PI * 2, b = ((i + 1) / 16) * Math.PI * 2, R = 520;
    rays += `<path d="M${sx} ${sy} L${sx + Math.cos(a) * R} ${sy + Math.sin(a) * R} L${sx + Math.cos(b) * R} ${sy + Math.sin(b) * R} Z" fill="#ffffff" opacity=".16"/>`;
  }
  const sun = `<circle cx="${sx + 118}" cy="${sy - 64}" r="58" fill="#ffd23f" ${line(9)}/>`;
  const mid = tower(176, 168, 84, 7, 3, '#7fc8f8', '#b5e2ff', '#4f9fd6', (r, c) => (r === 2 && c === 0) || (r === 5 && c === 2));
  const left = tower(44, 140, 250, 3, 2, '#d0583e', '#ea8a6e', '#8a3a2a', (r, c) => r === 1 && c === 1);
  const right = tower(334, 134, 176, 5, 2, '#5cb85c', '#8fd68a', '#2f7d3a', (r, c) => r === 3 && c === 0);
  const flag = `<path d="M260 64 V8" ${line(9)} fill="none"/><path d="M260 8 L312 22 L260 38 Z" fill="#e63946" ${line(7)}/>`;
  const street = `<rect x="-200" y="${GROUND}" width="912" height="300" fill="#5b6170" ${line(10)}/><rect x="-200" y="${GROUND + 5}" width="912" height="12" fill="#8a909c"/>`
    + `<path d="M-200 470 H712" stroke="#ffd23f" stroke-width="14" stroke-dasharray="44 30" stroke-dashoffset="-8"/>`;
  return rays + sun + flag + mid + right + left + street;
};

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="sl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset=".55" stop-color="#8fd6ff"/><stop offset="1" stop-color="#ffd59a"/></linearGradient></defs><rect width="512" height="512" fill="url(#sl-sky)"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
