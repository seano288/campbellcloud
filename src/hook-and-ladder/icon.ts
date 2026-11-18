// The Home Screen icon: his red ladder truck, big and low across the front, with its ladder raised to rest against a big letter tile
// that glows like a lit window on a night-blue sunburst (the rays spin out from the tile, as the sibling icons' rays spin out from
// their hero). The letter is a single-storey "a" drawn as strokes (the school font's shape), so it needs no font file and rasterises
// the same everywhere (tools/icons.ts).

const BG = '#14213d', O = '#141414';
const TILE = { x: 370, y: 148 }; // the tile's centre: the rays and the glow start here

const rays = () => Array.from({ length: 16 }, (_, i) => {
  const step = 360 / 16, a0 = ((i * step - 5.5) * Math.PI) / 180, a1 = ((i * step + 5.5) * Math.PI) / 180, r = 760, { x, y } = TILE;
  return `<path d="M${x} ${y} L${(x + r * Math.cos(a0)).toFixed(1)} ${(y + r * Math.sin(a0)).toFixed(1)} L${(x + r * Math.cos(a1)).toFixed(1)} ${(y + r * Math.sin(a1)).toFixed(1)} Z" fill="#22376e"/>`;
}).join('');

/** The ladder from the turntable (x0, y0) to its tip, drawn along +x and turned into place. */
function ladder(x0: number, y0: number, len: number, deg: number) {
  const rungs = Array.from({ length: Math.floor((len - 30) / 34) }, (_, i) => 30 + i * 34)
    .map(x => `<path d="M${x} -20 V20" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M${x} -20 V20" stroke="#e9edf2" stroke-width="7" stroke-linecap="round"/>`).join('');
  return `<g transform="translate(${x0} ${y0}) rotate(${deg})">
    ${rungs}
    <rect x="0" y="-32" width="${len}" height="18" rx="9" fill="#ffd23f" stroke="${O}" stroke-width="8"/>
    <rect x="0" y="14" width="${len}" height="18" rx="9" fill="#ffd23f" stroke="${O}" stroke-width="8"/>
  </g>`;
}

const art = () => `
  <circle cx="${TILE.x}" cy="${TILE.y}" r="230" fill="url(#glow)"/>
  <!-- the street -->
  <path d="M-20 452 H540 V540 H-20 Z" fill="#2a2f3d" stroke="${O}" stroke-width="10"/>
  <path d="M10 488 H502" stroke="#ffd23f" stroke-width="10" stroke-dasharray="44 30"/>
  <!-- the letter tile, lit like a window -->
  <g transform="rotate(7 ${TILE.x} ${TILE.y})">
    <rect x="${TILE.x - 96}" y="${TILE.y - 96 + 10}" width="192" height="192" rx="34" fill="${O}"/>
    <rect x="${TILE.x - 96}" y="${TILE.y - 96}" width="192" height="192" rx="34" fill="#fff4d6" stroke="${O}" stroke-width="14"/>
    <circle cx="${TILE.x - 12}" cy="${TILE.y + 14}" r="44" fill="none" stroke="${O}" stroke-width="27"/>
    <path d="M${TILE.x + 32} ${TILE.y - 34} V${TILE.y + 58}" stroke="${O}" stroke-width="27" stroke-linecap="round"/>
  </g>
  <!-- the ladder, raised from the turntable to rest on the tile's left edge -->
  ${ladder(150, 318, 172, -44)}
  <!-- the truck -->
  <rect x="22" y="300" width="318" height="124" rx="16" fill="#d7262e" stroke="${O}" stroke-width="14"/>
  <rect x="30" y="356" width="302" height="16" fill="#fff"/>
  <path d="M110 312 V416 M230 312 V416" stroke="${O}" stroke-width="5" opacity=".35"/>
  <path d="M334 424 V282 Q334 270 346 270 H416 L486 344 V424 Z" fill="#d7262e" stroke="${O}" stroke-width="14" stroke-linejoin="round"/>
  <path d="M356 292 H408 L458 346 H356 Z" fill="#bfe6ff" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
  <rect x="352" y="240" width="46" height="26" rx="9" fill="#ff2a2a" stroke="${O}" stroke-width="8"/>
  <rect x="402" y="240" width="46" height="26" rx="9" fill="#4fb3ff" stroke="${O}" stroke-width="8"/>
  <rect x="470" y="392" width="34" height="26" rx="8" fill="#d9dee4" stroke="${O}" stroke-width="8"/>
  <circle cx="150" cy="318" r="30" fill="#5d6670" stroke="${O}" stroke-width="11"/>
  ${[96, 250, 412].map(x => `<circle cx="${x}" cy="432" r="48" fill="#1c1c1e" stroke="${O}" stroke-width="8"/><circle cx="${x}" cy="432" r="20" fill="#d9dee4" stroke="${O}" stroke-width="6"/>`).join('')}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="glow"><stop offset="0" stop-color="#ffd36b"/><stop offset=".42" stop-color="#ffb03a" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a1a" stop-opacity="0"/></radialGradient></defs><rect width="512" height="512" fill="${BG}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
