// The pictures a question shows: an emoji, or one drawn here in code for the Moon Base's own things (a dome, the rover, the lander ...).
// A crew member's picture carries their name underneath, which he can read.
import type { JSX } from 'preact';
import { picOf } from '../mail/pictures';
import { BASE_WORDS } from '../mail/words';

const S = { stroke: '#111', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const;
const grey = '#9aa0ab', ground = '#7d828c';

const ART: Record<string, () => JSX.Element> = {
  dome: () => <g {...S}><path d="M10 52 Q10 14 32 14 Q54 14 54 52 Z" fill="#f4ecd8" /><rect x="26" y="34" width="12" height="18" fill="#ffd23f" /><line x1="4" y1="52" x2="60" y2="52" /></g>,
  greendome: () => <g {...S}><path d="M10 52 Q10 14 32 14 Q54 14 54 52 Z" fill="#7fd38a" /><path d="M20 52 V40 M28 52 V34 M36 52 V38 M44 52 V42" stroke="#1d6b2b" /><line x1="4" y1="52" x2="60" y2="52" /></g>,
  base: () => <g {...S}><rect x="2" y="50" width="60" height="8" fill={ground} /><path d="M6 50 Q6 30 20 30 Q34 30 34 50 Z" fill="#f4ecd8" /><path d="M36 50 Q36 36 46 36 Q56 36 56 50 Z" fill="#7fd38a" /><line x1="20" y1="30" x2="20" y2="14" /><path d="M20 14 L30 18 L20 22 Z" fill="#e63946" /></g>,
  hatch: () => <g {...S}><rect x="8" y="8" width="48" height="48" rx="6" fill="#c0c7d0" /><circle cx="32" cy="32" r="16" fill="#5b6270" /><circle cx="32" cy="32" r="10" fill="#9fd3ff" /><rect x="44" y="28" width="8" height="8" fill="#ffd23f" /></g>,
  rover: () => <g {...S}><rect x="8" y="26" width="48" height="14" rx="4" fill="#e63946" /><rect x="18" y="16" width="20" height="10" fill="#9fd3ff" /><circle cx="16" cy="44" r="7" fill="#333" /><circle cx="32" cy="44" r="7" fill="#333" /><circle cx="48" cy="44" r="7" fill="#333" /><line x1="50" y1="26" x2="54" y2="12" /><circle cx="54" cy="10" r="3" fill="#ffd23f" /></g>,
  lander: () => <g {...S}><path d="M20 14 H44 L48 34 H16 Z" fill="#f2f2f2" /><circle cx="32" cy="24" r="5" fill="#9fd3ff" /><path d="M18 34 L8 54 M46 34 L56 54 M26 34 L22 54 M38 34 L42 54" /><path d="M24 34 H40 L36 42 H28 Z" fill="#5b6270" /></g>,
  suit: () => <g {...S}><circle cx="32" cy="14" r="10" fill="#f2f2f2" /><rect x="26" y="10" width="12" height="7" rx="3" fill="#ffd23f" /><rect x="20" y="24" width="24" height="22" rx="6" fill="#ff8c1a" /><path d="M20 28 L10 40 M44 28 L54 40" /><path d="M26 46 V58 M38 46 V58" /></g>,
  helmet: () => <g {...S}><circle cx="32" cy="32" r="22" fill="#f2f2f2" /><path d="M16 30 Q32 18 48 30 Q48 44 32 44 Q16 44 16 30 Z" fill="#e8b923" /><line x1="32" y1="10" x2="32" y2="4" /><circle cx="32" cy="4" r="3" fill="#e63946" /></g>,
  crater: () => <g {...S}><rect x="2" y="30" width="60" height="28" fill={ground} /><ellipse cx="32" cy="38" rx="22" ry="8" fill="#4b4f57" /><path d="M10 36 Q32 26 54 36" fill="none" /></g>,
  dust: () => <g {...S}><path d="M4 52 Q32 34 60 52 Z" fill={grey} /><circle cx="18" cy="30" r="3" fill={grey} /><circle cx="30" cy="22" r="2" fill={grey} /><circle cx="44" cy="28" r="3" fill={grey} /></g>,
  dustman: () => <g {...S}><circle cx="32" cy="42" r="14" fill={grey} /><circle cx="32" cy="22" r="9" fill={grey} /><rect x="25" y="6" width="14" height="8" fill="#e63946" /><circle cx="29" cy="21" r="1.5" fill="#111" /><circle cx="35" cy="21" r="1.5" fill="#111" /></g>,
  outside: () => <g {...S}><rect x="2" y="2" width="60" height="60" fill="#151a2e" /><path d="M2 46 Q18 36 32 44 Q46 52 62 40 V62 H2 Z" fill={ground} /><circle cx="46" cy="16" r="7" fill="#3a86ff" /><circle cx="14" cy="12" r="1.5" fill="#fff" stroke="none" /><circle cx="26" cy="20" r="1.5" fill="#fff" stroke="none" /></g>,
  storm: () => <g {...S}><path d="M8 26 Q20 14 32 24 Q44 14 56 26" fill="none" stroke={grey} stroke-width="6" /><path d="M6 38 Q20 28 34 38 Q46 28 58 38" fill="none" stroke={grey} stroke-width="6" /><path d="M10 50 Q24 42 36 50 Q48 42 58 50" fill="none" stroke={grey} stroke-width="6" /></g>,
  seeds: () => <g {...S}><ellipse cx="22" cy="30" rx="6" ry="4" fill="#a0522d" /><ellipse cx="38" cy="24" rx="6" ry="4" fill="#a0522d" /><ellipse cx="34" cy="40" rx="6" ry="4" fill="#a0522d" /></g>,
  pot: () => <g {...S}><path d="M14 26 H50 L44 56 H20 Z" fill="#c8553d" /><rect x="12" y="20" width="40" height="8" fill="#5b3a29" /></g>,
  dirt: () => <g {...S}><path d="M8 48 Q32 18 56 48 Z" fill="#6b4226" /><circle cx="24" cy="40" r="2" fill="#3e2716" /><circle cx="38" cy="36" r="2" fill="#3e2716" /></g>,
  catfood: () => <g {...S}><path d="M10 40 H54 L48 54 H16 Z" fill="#3a86ff" /><path d="M20 40 Q26 30 32 36 Q38 28 44 40" fill="#ff8c1a" /></g>,
  crew: () => <g {...S}><circle cx="20" cy="22" r="8" fill="#f2f2f2" /><circle cx="44" cy="22" r="8" fill="#f2f2f2" /><rect x="12" y="32" width="16" height="20" rx="4" fill="#ff8c1a" /><rect x="36" y="32" width="16" height="20" rx="4" fill="#ff8c1a" /></g>,
};

/** A drawn picture by its art key ("art:dome" or "dome"). */
export function Art({ k, size = 64 }: { k: string; size?: number }) {
  const draw = ART[k.replace(/^art:/, '')];
  return <svg class="mb-art" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">{draw ? draw() : null}</svg>;
}
/** An emoji or a drawn picture. */
export function Shown({ show, size = 64 }: { show: string; size?: number }) {
  return show.startsWith('art:') ? <Art k={show} size={size} /> : <span class="mb-emoji" style={{ fontSize: `${Math.round(size * 0.8)}px` }} aria-hidden="true">{show}</span>;
}
/** A question's picture by its key, with a crew member's name. */
export function Pic({ k, size = 64 }: { k: string; size?: number }) {
  const p = picOf(k);
  return <span class="mb-pic"><Shown show={p.show} size={size} />{p.name && <span class="mb-pic-name" lang="en">{p.name}</span>}</span>;
}
/** A base word's picture (for its Meeting). */
export const baseWordPic = (word: string) => BASE_WORDS.find(b => b.word === word)?.pic ?? '❓';
