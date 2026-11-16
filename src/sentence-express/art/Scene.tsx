// The pictures: small SVG scenes drawn in code from a sentence's meaning (sentences/scenes.ts). Living things are emoji, which read
// clearly on the iPad; things that need a colour (a ball, a hat, a car, a cup, a box) and the places (a bed, a box, a log, a rug, a
// tree, a pond, mud, a nest) are drawn. A lesson can light a part of the picture: who it's about, the place, or what it has.
import type { JSX } from 'preact';
import { CAN_DO, COLOURED, EMOJI, type Act, type Color, type Prop, type Scene, type Thing, type Who } from '../sentences/scenes';

const O = '#1d1d1f';
const COLOR: Record<Color, string> = { red: '#e63946', blue: '#2f7fd8', green: '#2bb673', yellow: '#ffd23f' };
const EMO = 'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif';

export type Lit = 'who' | 'at' | 'has' | 'all' | null;

/** A drawn thing that takes a colour, centred on (x, y), `s` tall. */
function thingArt(t: Thing, color: Color | undefined, x: number, y: number, s: number): JSX.Element {
  const c = color ? COLOR[color] : t === 'cup' ? '#f4f6f8' : t === 'box' ? '#c9935a' : t === 'car' ? '#e63946' : t === 'hat' ? '#2a2d33' : '#ff7a1a';
  const k = s / 60;
  if (t === 'cake') return <text x={x} y={y + s * .38} font-size={s} text-anchor="middle" font-family={EMO}>{EMOJI.cake}</text>;
  if (t === 'bus') return <text x={x} y={y + s * .38} font-size={s} text-anchor="middle" font-family={EMO}>{EMOJI.bus}</text>;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} stroke={O} stroke-width={4} stroke-linejoin="round">
      {t === 'ball' && <><circle r="24" fill={c} /><path d="M-24 0 Q0 -12 24 0 M-8 -23 Q4 0 -8 23" fill="none" stroke="#fff" stroke-width="4" /><circle r="24" fill="none" /></>}
      {t === 'hat' && <><ellipse cx="0" cy="16" rx="32" ry="8" fill={c} /><path d="M-18 16 L-16 -18 Q0 -26 16 -18 L18 16 Z" fill={c} /><rect x="-17" y="4" width="34" height="7" fill="#fff" stroke-width="3" /></>}
      {t === 'cup' && <><path d="M-18 -18 H18 L14 22 H-14 Z" fill={c} /><path d="M18 -8 q 14 0 12 12 q -2 10 -14 8" fill="none" /></>}
      {t === 'box' && <><rect x="-24" y="-20" width="48" height="42" fill={c} /><path d="M-24 -20 L-14 -30 H34 L24 -20 M24 22 L34 12 V-30" fill={c} /></>}
      {t === 'car' && <><path d="M-30 6 V-6 Q-28 -12 -18 -12 L-12 -24 H12 L20 -12 Q30 -12 30 -2 V6 Z" fill={c} /><rect x="-8" y="-21" width="16" height="9" fill="#bfe3ff" stroke-width="3" /><circle cx="-16" cy="8" r="8" fill="#3a3f47" /><circle cx="16" cy="8" r="8" fill="#3a3f47" /></>}
    </g>
  );
}

/** Just who (or what) it is, for a "who" or "what" answer. */
export function WhoArt({ who, color, x = 50, y = 50, s = 60 }: { who: Who; color?: Color; x?: number; y?: number; s?: number }) {
  if ((COLOURED as readonly string[]).includes(who) || who === 'cake' || who === 'bus') return thingArt(who as Thing, color, x, y, s);
  return <text x={x} y={y + s * .36} font-size={s} text-anchor="middle" font-family={EMO}>{EMOJI[who as keyof typeof EMOJI]}</text>;
}

const propBox: Record<Prop, { y: number; h: number }> = {
  bed: { y: 82, h: 40 }, box: { y: 86, h: 42 }, log: { y: 100, h: 22 }, rug: { y: 112, h: 10 }, tree: { y: 20, h: 100 }, pond: { y: 100, h: 28 },
  mud: { y: 102, h: 24 }, nest: { y: 96, h: 22 }, car: { y: 70, h: 52 },
};

/** The place, the back part (behind who). */
function propBack(p: Prop, lit: boolean): JSX.Element {
  const glow = lit ? { filter: 'url(#se-glow)' } : {};
  switch (p) {
    case 'bed': return <g {...glow} stroke={O} stroke-width={4} stroke-linejoin="round"><rect x="46" y="62" width="10" height="64" fill="#9a6a3a" /><rect x="146" y="78" width="8" height="48" fill="#9a6a3a" /><rect x="50" y="82" width="102" height="18" rx="4" fill="#7fb0e8" /><rect x="56" y="74" width="26" height="12" rx="6" fill="#fff" /></g>;
    case 'box': return <g {...glow} stroke={O} stroke-width={4}><path d="M58 86 L72 74 H152 L138 86 Z" fill="#a8743f" /></g>;
    case 'log': return <g {...glow} stroke={O} stroke-width={4}><rect x="54" y="98" width="96" height="24" rx="12" fill="#8a5a2b" /><ellipse cx="150" cy="110" rx="8" ry="12" fill="#d9a066" /><rect x="60" y="120" width="8" height="8" fill="#5a3a1a" /><rect x="134" y="120" width="8" height="8" fill="#5a3a1a" /></g>;
    case 'rug': return <g {...glow} stroke={O} stroke-width={3}><ellipse cx="100" cy="118" rx="62" ry="10" fill="#e63946" /><ellipse cx="100" cy="118" rx="44" ry="6" fill="#ffd23f" /></g>;
    case 'tree': return <g {...glow} stroke={O} stroke-width={4}><rect x="92" y="62" width="18" height="64" fill="#8a5a2b" /><circle cx="100" cy="46" r="38" fill="#3f9a3f" /><circle cx="76" cy="58" r="20" fill="#4fae4f" /><circle cx="126" cy="56" r="22" fill="#4fae4f" /></g>;
    case 'pond': return <g {...glow} stroke={O} stroke-width={4}><ellipse cx="100" cy="114" rx="76" ry="18" fill="#3d9be0" /></g>;
    case 'mud': return <g {...glow} stroke={O} stroke-width={4}><ellipse cx="100" cy="114" rx="72" ry="16" fill="#7a5230" /></g>;
    case 'nest': return <g {...glow} stroke={O} stroke-width={3}><ellipse cx="100" cy="102" rx="34" ry="8" fill="#6a4a2a" /></g>;
    case 'car': return <g {...glow} stroke={O} stroke-width={4} stroke-linejoin="round"><path d="M34 112 V92 Q36 82 52 82 L66 62 H128 L144 82 Q166 82 166 98 V112 Z" fill="#2f7fd8" /><rect x="74" y="66" width="48" height="18" rx="3" fill="#bfe3ff" /></g>;
  }
}
/** The place, the front part (over who's lower half when who is in it). */
function propFront(p: Prop, rel: string | undefined, lit: boolean): JSX.Element | null {
  const glow = lit ? { filter: 'url(#se-glow)' } : {};
  if (p === 'box') return <g {...glow} stroke={O} stroke-width={4}><rect x="58" y="86" width="80" height="40" fill="#c9935a" /><path d="M138 86 L152 74 V114 L138 126 Z" fill="#a8743f" /></g>;
  if (p === 'pond' && rel === 'in') return <g {...glow}><path d="M30 112 Q100 140 170 112 L170 132 H30 Z" fill="#3d9be0" stroke={O} stroke-width={4} /><path d="M60 116 q8 -5 16 0 M110 120 q8 -5 16 0" stroke="#bfe3ff" stroke-width="3" fill="none" /></g>;
  if (p === 'mud' && rel === 'in') return <g {...glow}><path d="M34 112 Q100 136 166 112 L166 130 H34 Z" fill="#7a5230" stroke={O} stroke-width={4} /></g>;
  if (p === 'nest') return <g {...glow} stroke={O} stroke-width={3}><path d="M66 100 Q100 128 134 100 Z" fill="#8a5a2b" /><path d="M72 104 L128 106 M76 112 L124 110" stroke="#5a3a1a" stroke-width="3" /></g>;
  if (p === 'car' && rel === 'in') return <g {...glow} stroke={O} stroke-width={4}><path d="M34 112 V92 Q36 84 52 84 H144 Q166 84 166 98 V112 Z" fill="#2f7fd8" /><circle cx="62" cy="114" r="12" fill="#3a3f47" /><circle cx="140" cy="114" r="12" fill="#3a3f47" /></g>;
  if (p === 'car') return <g {...glow} stroke={O} stroke-width={4}><circle cx="62" cy="114" r="12" fill="#3a3f47" /><circle cx="140" cy="114" r="12" fill="#3a3f47" /></g>;
  if (p === 'rug' && rel === 'under') return <g {...glow} stroke={O} stroke-width={3}><path d="M38 118 Q100 92 162 118 Q100 130 38 118 Z" fill="#e63946" /></g>;
  return null;
}

/** Where who goes for each place and way: its feet's x and y, and how big. */
function spot(rel: string | undefined, at: Prop | undefined): { x: number; y: number; k: number } {
  if (!at || !rel) return { x: 100, y: 118, k: 1 };
  if (rel === 'by') return { x: at === 'tree' ? 150 : 176, y: 124, k: .8 };
  const top = propBox[at].y;
  if (rel === 'on') return { x: at === 'bed' ? 112 : 100, y: at === 'rug' ? 120 : at === 'car' ? 62 : top + (at === 'box' ? -12 : 0), k: .85 };
  if (rel === 'under') return at === 'tree' ? { x: 136, y: 126, k: .8 } : at === 'rug' ? { x: 100, y: 124, k: .5 } : { x: 100, y: 126, k: at === 'log' ? .45 : .62 };
  // in
  if (at === 'tree') return { x: 100, y: 52, k: .55 };
  if (at === 'pond' || at === 'mud') return { x: 100, y: 128, k: .9 };
  if (at === 'nest') return { x: 100, y: 102, k: .7 };
  if (at === 'car') return { x: 98, y: 92, k: .55 };
  return { x: 98, y: 108, k: .75 };
}

const FOOD: Partial<Record<Who, string>> = { dog: '🦴', cat: '🐟', pig: '🌽', hen: '🌽', fish: '🪱', bug: '🍃', bird: '🪱' };

/** What it's doing, drawn around it. */
function actArt(a: Act | undefined, who: Who, x: number, y: number, s: number): JSX.Element | null {
  if (!a) return null;
  if (a === 'run') return <g stroke={O} stroke-width="4" stroke-linecap="round">{[0, 1, 2].map(i => <path key={i} d={`M${x + s * .55} ${y - s * (.25 + i * .2)} h ${s * (.35 - i * .06)}`} />)}</g>;
  if (a === 'jump') return <path d={`M${x - s * .5} ${y + s * .7} Q${x} ${y + s * .1} ${x + s * .5} ${y + s * .7}`} fill="none" stroke={O} stroke-width="4" stroke-dasharray="6 6" />;
  if (a === 'sleep') return <text x={x + s * .45} y={y - s * .7} font-size={s * .38} font-family="Nunito,sans-serif" font-weight="900" fill="#2f4f98">z Z</text>;
  if (a === 'swim') return <path d={`M${x - s * .8} ${y - s * .18} q ${s * .2} -${s * .12} ${s * .4} 0 t ${s * .4} 0 t ${s * .4} 0 t ${s * .4} 0 V ${y + 6} H ${x - s * .8} Z`} fill="#3d9be0" stroke={O} stroke-width="4" opacity=".92" />;
  if (a === 'eat') return <text x={x - s * .62} y={y - s * .05} font-size={s * .45} font-family={EMO}>{FOOD[who] ?? '🍎'}</text>;
  if (a === 'fly') return <g stroke={O} stroke-width="3" stroke-linecap="round"><path d={`M${x + s * .5} ${y - s * .5} q 8 -8 16 0`} fill="none" /><path d={`M${x - s * .7} ${y - s * .3} q 8 -8 16 0`} fill="none" /></g>;
  if (a === 'dig') return <g stroke={O} stroke-width="3"><ellipse cx={x - s * .6} cy={y - 4} rx={s * .32} ry={s * .14} fill="#7a5230" />{[0, 1, 2].map(i => <circle key={i} cx={x - s * (.5 + i * .14)} cy={y - s * (.45 + i * .1)} r="4" fill="#7a5230" />)}</g>;
  return null;
}

/** One living thing (or thing), with its feet at (x, y). */
function Figure({ sc, x, y, s, lit }: { sc: Scene; x: number; y: number; s: number; lit: boolean }) {
  const a = sc.act, lift = a === 'jump' ? s * .5 : a === 'fly' ? s * .9 : 0;
  const glow = lit ? { filter: 'url(#se-glow)' } : {};
  const art = <WhoArt who={sc.who} color={sc.color} x={x} y={y - lift - s * .45} s={s} />;
  return (
    <g>
      {a !== 'swim' && actArt(a, sc.who, x, y - lift, s)}
      <g {...glow}>{a === 'sleep' ? <g transform={`rotate(-8 ${x} ${y})`}>{art}</g> : art}</g>
      {a === 'swim' && actArt(a, sc.who, x, y, s)}
    </g>
  );
}

/** A picture of a scene. `lit`: what a lesson lights up. */
export function ScenePic({ scene, lit = null, label }: { scene: Scene; lit?: Lit; label?: string }) {
  const n = scene.n ?? 1, size = scene.size === 'big' ? 1.45 : scene.size === 'little' ? .6 : 1;
  const where = spot(scene.rel, scene.at), base = 64 * where.k * size;
  const s = Math.min(base, scene.rel === 'in' && scene.at === 'tree' ? 40 : 120);
  const xs = Array.from({ length: n }, (_, i) => where.x + (i - (n - 1) / 2) * Math.min(62, s * .95));
  const litWho = lit === 'who' || lit === 'all', litAt = lit === 'at' || lit === 'all', litHas = lit === 'has' || lit === 'all';
  return (
    <svg class="scene" viewBox="0 0 200 140" role="img" aria-label={label}>
      <defs><filter id="se-glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffd23f" flood-opacity="1" /><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#ffb000" flood-opacity="1" /></filter></defs>
      <rect width="200" height="140" fill="#dff1ff" />
      <rect y="104" width="200" height="36" fill="#bfe39a" />
      {scene.at && propBack(scene.at, litAt)}
      {xs.map((x, i) => <Figure key={i} sc={scene} x={x} y={where.y} s={s} lit={litWho} />)}
      {scene.has && <g filter={litHas ? 'url(#se-glow)' : undefined}><WhoArt who={scene.has} color={scene.hasColor} x={where.x + s * .78} y={where.y - s * .28} s={s * .55} /></g>}
      {scene.at && propFront(scene.at, scene.rel, litAt)}
    </svg>
  );
}

/** Just one who or thing on its own, for a who or what answer. */
export function WhoPic({ who, color, label }: { who: Who; color?: Color; label?: string }) {
  return <svg class="scene who-pic" viewBox="0 0 100 100" role="img" aria-label={label}><WhoArt who={who} color={color} x={50} y={50} s={70} /></svg>;
}
export { CAN_DO };
