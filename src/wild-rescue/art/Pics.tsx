// Pictures used across the game: an animal (Apple emoji, or drawn), the truck, a habitat's little scene, and the sky, weather,
// season and needs scenes the questions are asked about. Emoji are shown as text, drawn ones as SVG (art/drawn.ts).
import { animal, type AnimalId } from '../facts/animals';
import { habitat, type HabitatId } from '../facts/habitats';
import type { SCENES } from '../facts/living';
import type { SeasonId, SunSpot, WeatherId, WearDay } from '../facts/sky';
import type { Truck } from '../park/shop';
import { DRAWN } from './drawn';
import { truckSvg } from './truck';

type SceneId = (typeof SCENES)[number]['id'];
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** A picture: an emoji (text) or a drawn id. */
export function Pic({ art, class: c, label }: { art: { emoji: string } | { drawn: string }; class?: string; label?: string }) {
  const aria = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true };
  if ('emoji' in art) return <span class={cls('pic', 'emo', c)} {...aria}>{art.emoji}</span>;
  return <svg class={cls('pic', 'drawn', c)} viewBox="-4 -4 108 108" {...aria} dangerouslySetInnerHTML={{ __html: DRAWN[art.drawn] ?? '' }} />;
}

export const AnimalPic = ({ id, class: c, label }: { id: AnimalId; class?: string; label?: string }) => <Pic art={animal(id).art} class={c} label={label} />;
/** A baby stage or a picture that is just an emoji or a drawing id. */
export const artOf = (x: string): { emoji: string } | { drawn: string } => (DRAWN[x] ? { drawn: x } : { emoji: x });

export function TruckView({ truck, class: c, label = 'Your rescue truck' }: { truck: Truck; class?: string; label?: string | null }) {
  const svg = truckSvg(truck);
  return <span class={cls('truck-view', c)} role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ---------- habitats ----------

const HABITAT_ART: Record<HabitatId, string> = {
  ocean: `<path d="M0 46 Q20 40 40 46 T80 46 T120 46 T160 46 V100 H0 Z" fill="#2f8fd8"/><path d="M0 62 Q20 56 40 62 T80 62 T120 62 T160 62" fill="none" stroke="#9fd8f5" stroke-width="3"/><path d="M0 86 Q40 78 80 86 T160 86 V100 H0 Z" fill="#f2d38a"/>`,
  pond: `<path d="M0 50 H160 V100 H0 Z" fill="#8cc152"/><ellipse cx="80" cy="74" rx="62" ry="20" fill="#5aa9d6" stroke="#3a7fa8" stroke-width="3"/><path d="M20 56 V36 M26 58 V30 M140 58 V34 M134 56 V40" stroke="#4f8a3a" stroke-width="3"/><ellipse cx="20" cy="34" rx="2.5" ry="6" fill="#7a4f2a"/><ellipse cx="140" cy="32" rx="2.5" ry="6" fill="#7a4f2a"/>`,
  forest: `<path d="M0 64 H160 V100 H0 Z" fill="#3f8a3a"/>${[[20, 58], [52, 64], [86, 56], [118, 62], [148, 58]].map(([x, y]) => `<path d="M${x} ${y! - 46} L${x! - 16} ${y} H${x! + 16} Z" fill="#2f6a2a" stroke="#1d3a18" stroke-width="2"/><rect x="${x! - 3}" y="${y}" width="6" height="10" fill="#7a4f2a"/>`).join('')}`,
  grassland: `<path d="M0 58 H160 V100 H0 Z" fill="#d8c25a"/><path d="M108 58 V36" stroke="#7a4f2a" stroke-width="5"/><ellipse cx="108" cy="32" rx="28" ry="8" fill="#6f8f3a"/>${[14, 34, 54, 74, 130, 150].map(x => `<path d="M${x} 80 l-4 -12 M${x} 80 l0 -14 M${x} 80 l4 -12" stroke="#8a9a3a" stroke-width="2.5"/>`).join('')}`,
  desert: `<circle cx="130" cy="22" r="12" fill="#ffd23f"/><path d="M0 70 Q40 50 80 66 T160 60 V100 H0 Z" fill="#f0c97a"/><path d="M0 84 Q50 72 100 84 T160 80 V100 H0 Z" fill="#e2b25e"/>`,
  polar: `<path d="M0 60 H160 V100 H0 Z" fill="#eef6fb"/><path d="M14 60 L34 30 L56 60 Z M100 60 L124 24 L150 60 Z" fill="#cfe8f6" stroke="#7fb8dc" stroke-width="3"/>${[20, 60, 90, 130].map(x => `<circle cx="${x}" cy="${12 + (x % 3) * 8}" r="2" fill="#fff"/>`).join('')}`,
  rainforest: `<path d="M0 62 H160 V100 H0 Z" fill="#2e7d4f"/>${[[18, 64, 30], [60, 60, 38], [104, 64, 32], [146, 62, 36]].map(([x, y, h]) => `<path d="M${x} ${y} Q${x! - 2} ${y! - h! / 2} ${x} ${y! - h!}" stroke="#7a4f2a" stroke-width="5" fill="none"/><ellipse cx="${x! - 10}" cy="${y! - h!}" rx="14" ry="6" fill="#3fae5a" transform="rotate(-20 ${x! - 10} ${y! - h!})"/><ellipse cx="${x! + 10}" cy="${y! - h!}" rx="14" ry="6" fill="#2f9a4a" transform="rotate(20 ${x! + 10} ${y! - h!})"/><ellipse cx="${x}" cy="${y! - h! - 4}" rx="6" ry="12" fill="#4fbf6a"/>`).join('')}<path d="M36 0 Q32 20 38 40 M120 0 Q126 16 118 30" stroke="#3f8a3a" stroke-width="3" fill="none"/>${[[40, 78], [90, 84], [130, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#e85d3a"/>`).join('')}`,
  farm: `<path d="M0 60 H160 V100 H0 Z" fill="#8cc152"/><path d="M96 60 V34 L116 20 L136 34 V60 Z" fill="#c0392b" stroke="#6a1a12" stroke-width="3"/><rect x="110" y="42" width="12" height="18" fill="#fff"/><path d="M6 70 H80 M6 80 H80 M14 64 V86 M40 64 V86 M66 64 V86" stroke="#f4f6f8" stroke-width="3"/>`,
};

export function HabitatArt({ id, class: c }: { id: HabitatId; class?: string }) {
  const h = habitat(id);
  return <svg class={cls('habitat-art', c)} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<rect width="160" height="100" fill="${h.sky}"/>${HABITAT_ART[id]}` }} />;
}

// ---------- the sky, the weather and the seasons ----------

const sky = (top: string, ground = '#7cc46a') => `<rect width="160" height="100" fill="${top}"/><path d="M0 78 Q40 70 80 76 T160 74 V100 H0 Z" fill="${ground}"/>`;
const sunAt = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="13" fill="#ffd23f" stroke="#e8a000" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${x + Math.cos(a) * 18} ${y + Math.sin(a) * 18} L${x + Math.cos(a) * 24} ${y + Math.sin(a) * 24}" stroke="#ffb000" stroke-width="3" stroke-linecap="round"/>`; }).join('')}`;
const stars = () => [[20, 16], [44, 34], [70, 12], [96, 28], [122, 14], [146, 36], [30, 50], [134, 54]].map(([x, y]) => `<path d="M${x} ${y! - 4} l1.2 3 l3 .2 l-2.4 2 l.8 3 l-2.6 -1.6 l-2.6 1.6 l.8 -3 l-2.4 -2 l3 -.2 Z" fill="#fff6b0"/>`).join('');
const cloud = (x: number, y: number, c = '#f4f6f8') => `<path d="M${x - 24} ${y + 8} Q${x - 30} ${y - 6} ${x - 14} ${y - 8} Q${x - 8} ${y - 22} ${x + 8} ${y - 14} Q${x + 26} ${y - 16} ${x + 26} ${y} Q${x + 32} ${y + 10} ${x + 20} ${y + 10} H${x - 18} Z" fill="${c}" stroke="#8a96a3" stroke-width="2.5"/>`;

export const svgScene = (inner: string, c?: string, label?: string) =>
  <svg class={cls('scene', c)} viewBox="0 0 160 100" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: inner }} />;

export function DayNight({ time }: { time: 'day' | 'night' }) {
  return svgScene(time === 'day' ? sky('#7cc6f2') + sunAt(116, 30) + cloud(46, 34) : sky('#13254a', '#2f4a2a') + stars(), 'daynight', time === 'day' ? 'A picture of the sky' : 'A picture of the sky');
}

export function WeatherPic({ w }: { w: WeatherId }) {
  const inner = w === 'sunny' ? sky('#7cc6f2') + sunAt(80, 36)
    : w === 'cloudy' ? sky('#b9c4cf') + cloud(56, 34) + cloud(108, 28)
      : w === 'rainy' ? sky('#8a96a3') + cloud(60, 26, '#d6dde5') + cloud(110, 22, '#d6dde5') + Array.from({ length: 14 }, (_, i) => `<path d="M${18 + i * 10} ${46 + (i % 3) * 8} l-4 10" stroke="#3d9be0" stroke-width="3" stroke-linecap="round"/>`).join('')
        : sky('#c9d4de', '#f4f8fb') + cloud(60, 26, '#e6ebf0') + cloud(110, 22, '#e6ebf0') + Array.from({ length: 16 }, (_, i) => `<circle cx="${12 + i * 9.5}" cy="${48 + (i % 4) * 7}" r="3" fill="#fff" stroke="#9fb2c4" stroke-width="1"/>`).join('');
  return svgScene(inner, 'weather');
}

/** A tree through the year: blossom, full green, orange leaves falling, bare in the snow. */
export function SeasonTree({ season }: { season: SeasonId }) {
  const ground = season === 'winter' ? '#f4f8fb' : season === 'fall' ? '#b8a04a' : '#7cc46a';
  const top = season === 'winter' ? '#c9d4de' : season === 'summer' ? '#6cc0f5' : '#9fd8f5';
  const trunk = `<path d="M76 84 V50 M76 62 L60 46 M76 56 L94 40" stroke="#7a4f2a" stroke-width="7" stroke-linecap="round"/>`;
  const crown = (fill: string) => `<circle cx="76" cy="36" r="26" fill="${fill}" stroke="#2f5a22" stroke-width="3"/><circle cx="56" cy="44" r="16" fill="${fill}" stroke="#2f5a22" stroke-width="3"/><circle cx="96" cy="44" r="16" fill="${fill}" stroke="#2f5a22" stroke-width="3"/>`;
  const dots = (c: string, n = 14) => Array.from({ length: n }, (_, i) => `<circle cx="${50 + ((i * 37) % 52)}" cy="${18 + ((i * 23) % 36)}" r="3.5" fill="${c}"/>`).join('');
  let inner = sky(top, ground);
  if (season === 'spring') inner += trunk + crown('#a6e07a') + dots('#ff9ac8') + `<text x="20" y="92" font-size="14">🌷</text><text x="124" y="94" font-size="14">🌷</text>`;
  if (season === 'summer') inner += sunAt(136, 20) + trunk + crown('#3f9a3a');
  if (season === 'fall') inner += trunk + crown('#f0902a') + dots('#d8462a', 10) + [[30, 70], [118, 66], [104, 84], [44, 88]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#e8611a" transform="rotate(30 ${x} ${y})"/>`).join('');
  if (season === 'winter') inner += trunk + `<path d="M76 50 L64 36 M76 50 L88 34 M60 46 L52 38 M94 40 L100 30" stroke="#7a4f2a" stroke-width="4" stroke-linecap="round"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${10 + i * 13}" cy="${10 + (i % 4) * 14}" r="2.5" fill="#fff" stroke="#9fb2c4" stroke-width=".8"/>`).join('');
  return svgScene(inner, 'season-tree');
}

/** Where the sun is: coming up or going down (low), at noon (high), or gone (night). */
export function SunSky({ spot }: { spot: SunSpot | 'up' | 'down' }) {
  if (spot === 'gone') return svgScene(sky('#13254a', '#2f4a2a') + stars(), 'sun-sky');
  const [x, y, top] = spot === 'high' ? [80, 24, '#6cc0f5'] : spot === 'up' ? [22, 70, '#f6c9a0'] : spot === 'down' ? [138, 70, '#f2a46a'] : [138, 70, '#f6b88a'];
  return svgScene(sky(top as string) + sunAt(x as number, y as number) + `<path d="M0 78 Q40 70 80 76 T160 74 V100 H0 Z" fill="#7cc46a"/>`, 'sun-sky');
}

export function WearScene({ day }: { day: WearDay }) {
  const inner = day === 'snowy' ? sky('#c9d4de', '#f4f8fb') + Array.from({ length: 14 }, (_, i) => `<circle cx="${8 + i * 11}" cy="${12 + (i % 4) * 12}" r="3" fill="#fff" stroke="#9fb2c4" stroke-width="1"/>`).join('') + `<text x="56" y="90" font-size="40">⛄</text>`
    : day === 'hot' ? sky('#6cc0f5', '#f2d38a') + sunAt(124, 24) + `<path d="M0 74 Q40 68 80 74 T160 72 V82 H0 Z" fill="#3d9be0"/><text x="40" y="96" font-size="30">🏖️</text>`
      : sky('#8a96a3') + cloud(54, 24, '#d6dde5') + cloud(112, 20, '#d6dde5') + Array.from({ length: 14 }, (_, i) => `<path d="M${10 + i * 11} ${44 + (i % 3) * 9} l-4 10" stroke="#3d9be0" stroke-width="3" stroke-linecap="round"/>`).join('') + `<ellipse cx="80" cy="88" rx="30" ry="5" fill="#5a8fb8"/>`;
  return svgScene(inner, 'wear');
}

/** Alive or Not, Level 3: the living thing with one need missing; the others are plainly there. `fixed`: the lesson puts it back. */
export function NeedScene({ scene, fixed }: { scene: SceneId; fixed: boolean }) {
  const em = (e: string, x: number, y: number, s = 30) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle">${e}</text>`;
  let inner = '';
  if (scene === 'fishbowl') inner = sky('#fff4e0', '#e2c98c') + `<path d="M40 30 Q30 60 44 86 H116 Q130 60 120 30 Z" fill="${fixed ? '#7cc4f5' : '#f4fbff'}" stroke="#5a9cc2" stroke-width="4"/>` + em('🐟', 80, fixed ? 66 : 82, 28) + em('🥫', 140, 90, 20);
  if (scene === 'darkplant') inner = sky('#fff4e0', '#e2c98c') + (fixed ? sunAt(130, 22) : '') + `<rect x="34" y="20" width="76" height="70" fill="${fixed ? 'none' : '#2a2d33'}" stroke="#7a4f2a" stroke-width="4"/>` + em('🪴', 72, 82, 34) + em('🚿', 128, 74, 22);
  if (scene === 'hungrydog') inner = sky('#fff4e0', '#e2c98c') + em('🐕', 56, 76, 40) + `<ellipse cx="112" cy="86" rx="16" ry="6" fill="#e63946" stroke="#7a1a1a" stroke-width="3"/>` + (fixed ? em('🦴', 112, 84, 18) : '') + `<ellipse cx="142" cy="86" rx="12" ry="5" fill="#3d9be0" stroke="#1f64a8" stroke-width="3"/>`;
  if (scene === 'dryplant') inner = sky('#ffe3b0', fixed ? '#7a5a3a' : '#d8b878') + sunAt(126, 22) + em(fixed ? '🪴' : '🥀', 66, 84, 40) + (fixed ? em('💧', 100, 54, 18) : `<path d="M44 92 l10 -6 l8 6 M80 94 l8 -6 l8 4" stroke="#8a6a3a" stroke-width="2" fill="none"/>`);
  if (scene === 'stormbird') inner = sky('#6a7684') + cloud(50, 20, '#b9c4cf') + cloud(110, 16, '#b9c4cf') + Array.from({ length: 12 }, (_, i) => `<path d="M${10 + i * 13} ${40 + (i % 3) * 8} l-4 10" stroke="#3d9be0" stroke-width="3"/>`).join('') + (fixed ? `<path d="M50 78 Q80 92 110 78 Q104 70 80 70 Q56 70 50 78 Z" fill="#a07a4a" stroke="#5a3a18" stroke-width="3"/>` : '') + em('🐦', 80, 74, 30) + em('🪱', 132, 92, 16);
  if (scene === 'snowrabbit') inner = sky('#c9d4de', '#f4f8fb') + Array.from({ length: 12 }, (_, i) => `<circle cx="${10 + i * 13}" cy="${12 + (i % 4) * 11}" r="2.5" fill="#fff" stroke="#9fb2c4" stroke-width="1"/>`).join('') + (fixed ? `<path d="M50 90 Q50 56 80 56 Q110 56 110 90 Z" fill="#7a5a3a" stroke="#3a2a18" stroke-width="3"/>` : '') + em('🐇', 80, 86, 30) + em('🥕', 134, 92, 18);
  return svgScene(inner, 'need-scene');
}
