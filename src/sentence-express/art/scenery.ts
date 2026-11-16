// Scenery pieces that are drawn rather than emoji (the water tower, the windmill, the signal; the tunnel, bridge and level crossing
// that sit on track), and the picture of anything he can own, for the Shed's tiles. SVG strings, so the canvas can draw them as images.
import { SCENERY, SKY, STATIONS, TRACK, type Drawn } from '../shed/catalogue';
import { O } from './train';

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

export const DRAWN: Record<Drawn, string> = {
  tower: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M34 54 L26 96 M66 54 L74 96 M30 76 H70" fill="none"/><rect x="22" y="22" width="56" height="34" rx="8" fill="#c0392b"/><path d="M18 24 Q50 2 82 24 Z" fill="#7a2a20"/><path d="M78 40 h10 v20" fill="none"/></g>`),
  windmill: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M36 96 L42 44 H58 L64 96 Z" fill="#f4f6f8"/><rect x="44" y="70" width="12" height="26" fill="#9a6a3a"/><g transform="translate(50 42)"><path d="M0 0 L-6 -38 L6 -38 Z M0 0 L38 -6 L38 6 Z M0 0 L6 38 L-6 38 Z M0 0 L-38 6 L-38 -6 Z" fill="#ffd23f"/><circle r="6" fill="#e63946"/></g></g>`),
  signal: svg(`<g stroke="${O}" stroke-width="4"><rect x="46" y="40" width="8" height="56" fill="#3a3f47"/><rect x="34" y="8" width="32" height="44" rx="8" fill="#2a2d33"/><circle cx="50" cy="20" r="7" fill="#e63946"/><circle cx="50" cy="40" r="7" fill="#2bb673"/></g>`),
  tunnel: svg(`<g stroke="${O}" stroke-width="4"><path d="M8 96 V50 Q50 -4 92 50 V96 Z" fill="#8a8f98"/><path d="M28 96 V60 Q50 30 72 60 V96 Z" fill="#1d1d1f"/><path d="M8 96 V50 Q50 -4 92 50" fill="none" stroke="#5aa64a" stroke-width="10"/></g>`),
  bridge: svg(`<g stroke="${O}" stroke-width="4"><rect x="4" y="60" width="92" height="36" fill="#3d9be0"/><path d="M4 56 H96 V66 H4 Z" fill="#c9935a"/><path d="M14 56 V36 M38 56 V36 M62 56 V36 M86 56 V36 M10 36 H90" fill="none" stroke-width="5"/></g>`),
  crossing: svg(`<g stroke="${O}" stroke-width="4"><rect x="40" y="30" width="8" height="66" fill="#3a3f47"/><path d="M24 22 L64 50 M64 22 L24 50" stroke="#fff" stroke-width="10"/><path d="M24 22 L64 50 M64 22 L24 50" stroke="#e63946" stroke-width="5"/><circle cx="76" cy="60" r="9" fill="#e63946"/><rect x="58" y="84" width="40" height="12" fill="#2a2d33"/></g>`),
  // the working pieces (layout/fx.ts draws them moving on the table; these are their pictures in the Shed and the tray)
  gates: svg(`<g stroke="${O}" stroke-width="4"><rect x="4" y="74" width="92" height="22" fill="#5d6470"/><rect x="14" y="30" width="10" height="66" fill="#3a3f47"/><path d="M24 40 H94" stroke="#fff" stroke-width="12"/><path d="M30 40 H40 M54 40 H64 M78 40 H88" stroke="#e63946" stroke-width="10"/><circle cx="19" cy="20" r="9" fill="#e63946"/></g>`),
  drawbridge: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><rect x="4" y="66" width="92" height="30" fill="#3d9be0"/><path d="M6 64 L40 64 L40 56 L12 26 L6 30 Z" fill="#c9935a"/><path d="M94 64 L60 64 L60 56 L88 26 L94 30 Z" fill="#c9935a"/><path d="M38 84 H62 L58 92 H42 Z" fill="#f4f6f8" stroke-width="3"/><path d="M50 82 V62 L62 80 Z" fill="#ffd23f" stroke-width="3"/></g>`),
  wash: svg(`<g stroke="${O}" stroke-width="4"><rect x="8" y="30" width="84" height="66" rx="8" fill="#2f7fd8"/><rect x="22" y="48" width="56" height="48" fill="#1d1d1f"/><circle cx="30" cy="70" r="10" fill="#ff7ac0"/><circle cx="70" cy="70" r="10" fill="#ffd23f"/><circle cx="34" cy="20" r="8" fill="#e8f6ff"/><circle cx="52" cy="14" r="10" fill="#e8f6ff"/><circle cx="70" cy="22" r="7" fill="#e8f6ff"/></g>`),
  arch: svg(`<g fill="none" stroke-width="8"><path d="M14 96 V60 A36 36 0 0 1 86 60 V96" stroke="#e63946"/><path d="M22 96 V60 A28 28 0 0 1 78 60 V96" stroke="#ffd23f"/><path d="M30 96 V60 A20 20 0 0 1 70 60 V96" stroke="#2bb673"/><path d="M38 96 V60 A12 12 0 0 1 62 60 V96" stroke="#2f7fd8"/></g>`),
  blinker: svg(`<g stroke="${O}" stroke-width="4"><rect x="46" y="44" width="8" height="52" fill="#3a3f47"/><rect x="32" y="6" width="36" height="48" rx="10" fill="#2a2d33"/><circle cx="50" cy="20" r="8" fill="#e63946"/><circle cx="50" cy="40" r="8" fill="#2bb673"/><path d="M76 16 l10 -6 M78 30 h12 M76 44 l10 6" stroke="#ffd23f" stroke-width="4"/></g>`),
  spinmill: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M36 96 L42 44 H58 L64 96 Z" fill="#e63946"/><rect x="44" y="70" width="12" height="26" fill="#9a6a3a"/><g transform="translate(50 42) rotate(20)"><path d="M0 0 L-6 -38 L6 -38 Z M0 0 L38 -6 L38 6 Z M0 0 L6 38 L-6 38 Z M0 0 L-38 6 L-38 -6 Z" fill="#f4f6f8"/><circle r="6" fill="#ffd23f"/></g><path d="M84 20 a8 8 0 1 1 -6 -14" fill="none" stroke-width="3"/></g>`),
  turbine: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M46 96 L48 40 H52 L54 96 Z" fill="#f4f6f8"/><g transform="translate(50 36)"><path d="M0 0 L-4 -34 L4 -34 Z M0 0 L31 14 L27 21 Z M0 0 L-27 21 L-31 14 Z" fill="#f4f6f8"/><circle r="6" fill="#c9d1d9"/></g></g>`),
  wheel: svg(`<g stroke="${O}" stroke-width="4"><path d="M26 96 L50 50 L74 96" fill="none"/><circle cx="50" cy="46" r="38" fill="none" stroke-width="5"/><path d="M50 8 V84 M12 46 H88 M23 19 L77 73 M77 19 L23 73" stroke-width="3"/><circle cx="50" cy="8" r="7" fill="#e63946"/><circle cx="88" cy="46" r="7" fill="#ffd23f"/><circle cx="50" cy="84" r="7" fill="#2bb673"/><circle cx="12" cy="46" r="7" fill="#2f7fd8"/><circle cx="50" cy="46" r="6" fill="#f4f6f8"/></g>`),
};

/** The picture of a piece of scenery or a station's gift: an emoji, or a drawn SVG. */
export function sceneryArt(id: string): { emoji: string } | { svg: string } {
  const row = SCENERY.find(s => s.id === id);
  if (row && 'drawn' in row) return { svg: DRAWN[row.drawn] };
  if (row && 'icon' in row) return { emoji: row.icon };
  const gift = STATIONS.find(s => s.gift?.id === id)?.gift;
  return { emoji: gift?.icon ?? '🌳' };
}

/** A track box: a cardboard box of track in its colour; a table: a little table; a track colour: a curve of that track. */
export function trackArt(id: string): string {
  const t = TRACK.find(r => r.id === id)!;
  if ('rails' in t) {
    const r = t.rails, look = 'look' in r ? r.look : undefined;
    const strip = look === 'rainbow' ? ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#2f7fd8', '#7a4fd8'].map((c, i) => `<path d="M${10 + i * 2} 92 A${82 - i * 2} ${82 - i * 2} 0 0 1 92 ${10 + i * 2}" stroke="${c}" stroke-width="4" fill="none"/>`).join('')
      : `<path d="M10 92 A82 82 0 0 1 92 10" stroke="${r.strip}" stroke-width="30" fill="none"/>`;
    const candy = look === 'candy' ? `<path d="M10 92 A82 82 0 0 1 92 10" stroke="#e63946" stroke-width="30" stroke-dasharray="8 10" fill="none"/>` : '';
    const glow = look === 'glow' ? `<path d="M10 92 A82 82 0 0 1 92 10" stroke="${r.strip}" stroke-width="44" fill="none" opacity=".35"/>` : '';
    return svg(`${glow}<path d="M10 92 A82 82 0 0 1 92 10" stroke="${O}" stroke-width="36" fill="none"/>${strip}${candy}<path d="M10 82 A72 72 0 0 1 82 10 M10 102 A92 92 0 0 1 102 10" stroke="${r.groove}" stroke-width="3" fill="none"/>`);
  }
  if ('table' in t) return svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M10 40 L50 24 L90 40 L50 56 Z" fill="${t.color}"/><path d="M18 44 V80 M82 44 V80 M50 58 V92" /><path d="M30 38 Q50 30 70 38" fill="none" stroke="#7a5a3a" stroke-width="5"/></g><text x="50" y="98" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="${O}">${t.table.w}×${t.table.h}</text>`);
  if (!('squares' in t)) return svg('');
  return svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M14 36 L50 22 L86 36 V78 L50 92 L14 78 Z" fill="${t.color}"/><path d="M14 36 L50 50 L86 36 M50 50 V92" fill="none"/><path d="M24 58 L44 66 M24 68 L44 76" stroke="#5a3a1a" stroke-width="5"/></g><text x="66" y="72" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="20" fill="${O}" stroke="#fff" stroke-width="5" paint-order="stroke">+${t.squares}</text>`);
}

/** A Sky tab picture: a little window of sky in that time of day, with the weather's icon in it. */
export function skyArt(id: string): string {
  const row = SKY.find(r => r.id === id)!;
  const bg = id === 'night' ? ['#0b1640', '#2a3a7a'] : id === 'sunset' ? ['#ff9a5a', '#7a4fd8'] : row.kind === 'weather' && ['fireflies', 'shooting', 'fireworks', 'aurora'].includes(id) ? ['#0b1640', '#3a2a7a'] : ['#7fc8f8', '#d8efff'];
  return svg(`<defs><linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs><rect x="6" y="6" width="88" height="88" rx="16" fill="url(#sk${id})" stroke="${O}" stroke-width="4"/><text x="50" y="66" text-anchor="middle" font-size="46" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${row.icon}</text>`);
}
