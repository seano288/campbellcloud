// The Home Screen icon: a cream envelope from the Moon, its stamp a yellow crescent moon on night blue, held up in front of the base's
// dome with its window lit, on grey moon ground under the blue Earth. The sunburst every sibling icon has spins out from the lit window
// in night blues, with a warm glow round the window. The envelope has the same orange-and-navy airmail edge as the letters in the game.
// Kept apart from Rover Code (a rocket on a planet, no rays) and Globe Hopper (a rocket base on Earth): here the mail is the hero.
// One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.
const BG = '#0b1030', RAY = '#1e2a62', O = '#14161b', PAPER = '#fff6e0', FLAP = '#efdfba', LAMP = '#ffd23f', SUIT = '#ff8c1a', NAVY = '#1d2b6e';
/** The lit window: the rays and the glow meet here. */
const WIN = { x: 164, y: 262 };

const rad = (d: number) => (d * Math.PI) / 180;
const f1 = (n: number) => n.toFixed(1);
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const rays = () => Array.from({ length: 14 }, (_, i) => {
  const step = 360 / 14, a0 = rad(i * step - 6), a1 = rad(i * step + 6), r = 760, { x, y } = WIN;
  return `<path d="M${x} ${y} L${f1(x + r * Math.cos(a0))} ${f1(y + r * Math.sin(a0))} L${f1(x + r * Math.cos(a1))} ${f1(y + r * Math.sin(a1))} Z" fill="${RAY}"/>`;
}).join('');

const stars = () => [[60, 64, 6], [132, 120, 4], [300, 60, 5], [258, 140, 3.5], [462, 250, 5], [36, 228, 4], [470, 40, 4]]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('');

const earth = `
  <g transform="translate(408 104)">
    <circle r="78" fill="#3a86ff" opacity=".22"/>
    <clipPath id="mbm-earth"><circle r="60"/></clipPath>
    <g clip-path="url(#mbm-earth)">
      <rect x="-60" y="-60" width="120" height="120" fill="#3a86ff"/>
      <path d="M-46 -26 Q-24 -52 2 -38 Q-2 -10 -26 -8 Q-38 6 -52 -2 Z M6 14 Q34 4 44 26 Q30 50 10 44 Q0 30 6 14 Z" fill="#2ec45a"/>
      <path d="M-56 -6 Q-20 -20 18 -10 M-30 30 Q-6 22 8 32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".85"/>
      <circle cx="34" cy="30" r="66" fill="${BG}" opacity=".38"/>
    </g>
    <circle r="60" fill="none" ${line(10)}/>
  </g>`;

const ground = `<path d="M-20 400 Q120 352 256 366 T540 352 V540 H-20 Z" fill="#9aa0ab" ${line(12)}/>
  <ellipse cx="96" cy="452" rx="44" ry="12" fill="#80868f"/><ellipse cx="440" cy="470" rx="30" ry="9" fill="#80868f"/>`;

const dome = `
  <circle cx="${WIN.x}" cy="${WIN.y}" r="150" fill="url(#mbm-glow)"/>
  <path d="M164 176 V112" ${line(10)}/><path d="M166 114 L212 128 L166 142 Z" fill="#e63946" ${line(8)}/>
  <path d="M28 384 Q28 176 164 176 Q300 176 300 384 Z" fill="#f4ecd8" ${line(13)}/>
  <path d="M30 346 H298" stroke="${SUIT}" stroke-width="16"/>
  <path d="M28 384 Q28 176 164 176 Q300 176 300 384 Z" fill="none" ${line(13)}/>
  <path d="M66 300 Q70 236 118 206" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>
  <circle cx="${WIN.x}" cy="${WIN.y}" r="40" fill="${LAMP}" ${line(11)}/>
  <circle cx="${WIN.x - 12}" cy="${WIN.y - 12}" r="10" fill="#fff" opacity=".8"/>`;

/** The stamp: white with bitten edges, a yellow crescent on night blue, a strip of moon at its foot. */
const stamp = (x: number, y: number, w: number, h: number) => {
  const bites: string[] = [];
  for (let i = 0; i <= 6; i++) bites.push(`<circle cx="${f1(x + (w * i) / 6)}" cy="${y}" r="6"/>`, `<circle cx="${f1(x + (w * i) / 6)}" cy="${y + h}" r="6"/>`);
  for (let i = 0; i <= 7; i++) bites.push(`<circle cx="${x}" cy="${f1(y + (h * i) / 7)}" r="6"/>`, `<circle cx="${x + w}" cy="${f1(y + (h * i) / 7)}" r="6"/>`);
  const cx = x + w * 0.46, cy = y + h * 0.42;
  return `<mask id="mbm-bites"><rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" fill="#fff"/><g fill="#000">${bites.join('')}</g></mask>
    <g filter="url(#mbm-drop)"><g mask="url(#mbm-bites)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>
      <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" rx="4" fill="${NAVY}"/>
      <circle cx="${cx}" cy="${cy}" r="${w * 0.25}" fill="${LAMP}"/><circle cx="${cx + w * 0.11}" cy="${cy - w * 0.08}" r="${w * 0.22}" fill="${NAVY}"/>
      <circle cx="${x + w * 0.74}" cy="${y + h * 0.66}" r="4" fill="#fff"/><circle cx="${x + w * 0.3}" cy="${y + h * 0.22}" r="3" fill="#fff"/>
      <path d="M${x + 12} ${y + h - 30} Q${x + w / 2} ${y + h - 44} ${x + w - 12} ${y + h - 30} V${y + h - 12} H${x + 12} Z" fill="#9aa0ab"/>
    </g></g>`;
};

const envelope = `
  <g transform="translate(326 388) rotate(-8) scale(.9)">
    <rect x="-152" y="-102" width="304" height="204" rx="18" fill="url(#mbm-airmail)" ${line(12)}/>
    <rect x="-138" y="-88" width="276" height="176" rx="7" fill="${PAPER}"/>
    <path d="M-138 -88 L0 14 L138 -88 Z" fill="${FLAP}"/>
    <path d="M-147 -96 L0 18 L147 -96" fill="none" ${line(11)}/>
    <path d="M-112 52 H-30 M-112 72 H-56" stroke="#c9b48c" stroke-width="9" stroke-linecap="round"/>
    ${stamp(60, -78, 66, 82)}
    <rect x="-152" y="-102" width="304" height="204" rx="18" fill="none" ${line(12)}/>
  </g>`;

const defs = `<defs>
  <radialGradient id="mbm-glow"><stop offset="0" stop-color="${LAMP}" stop-opacity=".9"/><stop offset=".45" stop-color="${SUIT}" stop-opacity=".4"/><stop offset="1" stop-color="${SUIT}" stop-opacity="0"/></radialGradient>
  <pattern id="mbm-airmail" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="44" height="44" fill="${PAPER}"/><rect width="13" height="44" fill="${SUIT}"/><rect x="22" width="13" height="44" fill="${NAVY}"/>
  </pattern>
  <filter id="mbm-drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="0" flood-color="#000" flood-opacity=".35"/></filter>
</defs>`;

const scene = () => `${defs}<rect width="512" height="512" fill="${BG}"/>${rays()}${stars()}${earth}${ground}`;
const art = () => `${dome}${envelope}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
