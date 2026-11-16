// Scenery pieces that are drawn rather than emoji (the water tower, the windmill, the signal; the tunnel, bridge and level crossing
// that sit on track), and the picture of anything he can own, for the Shed's tiles. SVG strings, so the canvas can draw them as images.
import { SCENERY, STATIONS, TRACK, type Drawn } from '../shed/catalogue';
import { O } from './train';

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

export const DRAWN: Record<Drawn, string> = {
  tower: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M34 54 L26 96 M66 54 L74 96 M30 76 H70" fill="none"/><rect x="22" y="22" width="56" height="34" rx="8" fill="#c0392b"/><path d="M18 24 Q50 2 82 24 Z" fill="#7a2a20"/><path d="M78 40 h10 v20" fill="none"/></g>`),
  windmill: svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M36 96 L42 44 H58 L64 96 Z" fill="#f4f6f8"/><rect x="44" y="70" width="12" height="26" fill="#9a6a3a"/><g transform="translate(50 42)"><path d="M0 0 L-6 -38 L6 -38 Z M0 0 L38 -6 L38 6 Z M0 0 L6 38 L-6 38 Z M0 0 L-38 6 L-38 -6 Z" fill="#ffd23f"/><circle r="6" fill="#e63946"/></g></g>`),
  signal: svg(`<g stroke="${O}" stroke-width="4"><rect x="46" y="40" width="8" height="56" fill="#3a3f47"/><rect x="34" y="8" width="32" height="44" rx="8" fill="#2a2d33"/><circle cx="50" cy="20" r="7" fill="#e63946"/><circle cx="50" cy="40" r="7" fill="#2bb673"/></g>`),
  tunnel: svg(`<g stroke="${O}" stroke-width="4"><path d="M8 96 V50 Q50 -4 92 50 V96 Z" fill="#8a8f98"/><path d="M28 96 V60 Q50 30 72 60 V96 Z" fill="#1d1d1f"/><path d="M8 96 V50 Q50 -4 92 50" fill="none" stroke="#5aa64a" stroke-width="10"/></g>`),
  bridge: svg(`<g stroke="${O}" stroke-width="4"><rect x="4" y="60" width="92" height="36" fill="#3d9be0"/><path d="M4 56 H96 V66 H4 Z" fill="#c9935a"/><path d="M14 56 V36 M38 56 V36 M62 56 V36 M86 56 V36 M10 36 H90" fill="none" stroke-width="5"/></g>`),
  crossing: svg(`<g stroke="${O}" stroke-width="4"><rect x="40" y="30" width="8" height="66" fill="#3a3f47"/><path d="M24 22 L64 50 M64 22 L24 50" stroke="#fff" stroke-width="10"/><path d="M24 22 L64 50 M64 22 L24 50" stroke="#e63946" stroke-width="5"/><circle cx="76" cy="60" r="9" fill="#e63946"/><rect x="58" y="84" width="40" height="12" fill="#2a2d33"/></g>`),
};

/** The picture of a piece of scenery or a station's gift: an emoji, or a drawn SVG. */
export function sceneryArt(id: string): { emoji: string } | { svg: string } {
  const row = SCENERY.find(s => s.id === id);
  if (row && 'drawn' in row) return { svg: DRAWN[row.drawn] };
  if (row && 'icon' in row) return { emoji: row.icon };
  const gift = STATIONS.find(s => s.gift?.id === id)?.gift;
  return { emoji: gift?.icon ?? '🌳' };
}

/** A track box: a cardboard box of track in its colour; a table: a little table. */
export function trackArt(id: string): string {
  const t = TRACK.find(r => r.id === id)!;
  if ('table' in t) return svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M10 40 L50 24 L90 40 L50 56 Z" fill="${t.color}"/><path d="M18 44 V80 M82 44 V80 M50 58 V92" /><path d="M30 38 Q50 30 70 38" fill="none" stroke="#7a5a3a" stroke-width="5"/></g><text x="50" y="98" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="${O}">${t.table.w}×${t.table.h}</text>`);
  return svg(`<g stroke="${O}" stroke-width="4" stroke-linejoin="round"><path d="M14 36 L50 22 L86 36 V78 L50 92 L14 78 Z" fill="${t.color}"/><path d="M14 36 L50 50 L86 36 M50 50 V92" fill="none"/><path d="M24 58 L44 66 M24 68 L44 76" stroke="#5a3a1a" stroke-width="5"/></g><text x="66" y="72" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="20" fill="${O}" stroke="#fff" stroke-width="5" paint-order="stroke">+${t.squares}</text>`);
}
