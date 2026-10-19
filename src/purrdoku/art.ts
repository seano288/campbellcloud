// Drawn in code: a sleeping cat curled up in a ball. Used on the board, the title and the Home Screen icon.
export const catSvg = (fur = '#f59a3c', stripe = '#c8641c') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M14 70 Q8 50 22 38 L20 20 L36 31 Q50 26 64 31 L80 20 L78 38 Q92 50 86 70 Q80 90 50 90 Q20 90 14 70 Z" fill="${fur}" stroke="#2a1a10" stroke-width="5" stroke-linejoin="round"/>
  <path d="M24 26 L26 36 L33 32 Z M76 26 L74 36 L67 32 Z" fill="#ffb3c1"/>
  <path d="M44 32 L46 42 M50 31 L50 42 M56 32 L54 42" stroke="${stripe}" stroke-width="4" stroke-linecap="round"/>
  <path d="M28 56 Q35 62 42 56 M58 56 Q65 62 72 56" fill="none" stroke="#2a1a10" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M46 66 L54 66 L50 71 Z" fill="#ff7b93" stroke="#2a1a10" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 71 Q46 77 41 75 M50 71 Q54 77 59 75" fill="none" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/>
  <path d="M8 62 L30 66 M8 72 L30 70 M92 62 L70 66 M92 72 L70 70" stroke="#2a1a10" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const ICON_BG = '#7b5cd6';
export const ICON_BACKGROUND = ICON_BG;

/** The Home Screen icon: the cat asleep on a patchwork quilt, with a "z" drifting up. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  const quilt = ['#ffd6e0', '#c7f0d8', '#ffe8a3', '#cfe3ff'];
  const squares = [0, 1, 2, 3].map(i => `<rect x="${(i % 2) * 256}" y="${Math.floor(i / 2) * 256}" width="256" height="256" fill="${quilt[i]}"/>`).join('');
  const cat = catSvg().replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">', '').replace('</svg>', '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${ICON_BG}"/>${squares}
  <path d="M256 0 V512 M0 256 H512" stroke="${ICON_BG}" stroke-width="14"/>
  <g transform="translate(${off} ${off}) scale(${scale})">
    <g transform="translate(76 120) scale(3.6)">${cat}</g>
    <text x="370" y="130" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="900" font-size="96" fill="#fff" stroke="#2a1a10" stroke-width="8" paint-order="stroke">z</text>
    <text x="430" y="70" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="900" font-size="60" fill="#fff" stroke="#2a1a10" stroke-width="6" paint-order="stroke">z</text>
  </g></svg>`;
}
