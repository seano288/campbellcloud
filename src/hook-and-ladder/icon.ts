// The Home Screen icon: a red ladder truck, big in front, with its ladder raised against a big letter tile (a cream tile with a
// lowercase "a" in the school font), on a night-blue sky with a warm glow behind the tile. Plain SVG, so it rasterises the same
// everywhere (tools/icons.ts). The letter is text in a plain font so it needs no font file.

const BG = '#14213d';
const O = '#141414';

const art = () => `
  <circle cx="356" cy="168" r="150" fill="#ffb03a" opacity=".22"/>
  <circle cx="356" cy="168" r="104" fill="#ffd23f" opacity=".22"/>
  <rect x="-20" y="432" width="560" height="100" fill="#3a3f52"/>
  <path d="M-20 446 H540" stroke="#ffd23f" stroke-width="8" stroke-dasharray="40 30"/>
  <!-- the letter tile -->
  <g transform="rotate(6 356 168)">
    <rect x="262" y="72" width="188" height="188" rx="30" fill="#fff4d6" stroke="${O}" stroke-width="12"/>
    <text x="356" y="222" text-anchor="middle" font-family="Andika, Nunito, Arial, Helvetica, sans-serif" font-weight="700" font-size="170" fill="${O}">a</text>
  </g>
  <!-- the ladder, from the truck's turntable up to the tile -->
  <g transform="rotate(-38 170 346)">
    <rect x="170" y="324" width="250" height="16" rx="6" fill="#d9dee4" stroke="${O}" stroke-width="7"/>
    <rect x="170" y="364" width="250" height="16" rx="6" fill="#d9dee4" stroke="${O}" stroke-width="7"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${196 + i * 34} 338 V366" stroke="#d9dee4" stroke-width="9"/><path d="M${196 + i * 34} 338 V366" stroke="${O}" stroke-width="2" opacity=".35"/>`).join('')}
    <rect x="408" y="316" width="44" height="72" rx="8" fill="#ffd23f" stroke="${O}" stroke-width="7"/>
  </g>
  <!-- the truck -->
  <rect x="36" y="330" width="290" height="100" rx="12" fill="#d7262e" stroke="${O}" stroke-width="12"/>
  <rect x="46" y="372" width="270" height="12" fill="#fff"/>
  <path d="M322 430 V316 H412 L470 372 V430 Z" fill="#d7262e" stroke="${O}" stroke-width="12" stroke-linejoin="round"/>
  <path d="M342 334 H404 L446 374 H342 Z" fill="#bfe6ff" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>
  <rect x="350" y="296" width="44" height="22" rx="8" fill="#ff2a2a" stroke="${O}" stroke-width="7"/>
  <rect x="398" y="296" width="44" height="22" rx="8" fill="#ffffff" stroke="${O}" stroke-width="7"/>
  <circle cx="170" cy="352" r="26" fill="#5d6670" stroke="${O}" stroke-width="9"/>
  ${[110, 250, 410].map(x => `<circle cx="${x}" cy="436" r="40" fill="#1c1c1e" stroke="${O}" stroke-width="8"/><circle cx="${x}" cy="436" r="17" fill="#b9c2cc"/>`).join('')}`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
