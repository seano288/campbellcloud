// The pictures the questions are asked on, drawn in SVG. Every beam here is traced by science/optics.ts, the same code that decides the
// answer, and every shadow is the one shadowOf() finds, so a picture can't disagree with what is marked right.
import type { ComponentChildren } from 'preact';
import { AnimalPic } from '../art/Pics';
import { beamPast, BOUNCE_LAB, bounceLab, shadowOf, trace, wallLook, type Cell, type Lab, type Lamp, type Pass, type Turn } from './optics';
import { STAGE } from './problems';
import { material, SOUNDS, type MaterialId } from './things';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const INK = '#141414';
/** An emoji's size inside an SVG picture, in the picture's own units (a style, so no page rule for emoji can change it). */
const EMOJI_36 = { fontSize: '36px' };

/** A thing's picture: an emoji, or an animal drawn in code ("animal:anglerfish"), or a stretched string. */
export function ThingPic({ icon, class: c, label }: { icon: string; class?: string; label?: string }) {
  if (icon.startsWith('animal:')) return <AnimalPic id={icon.slice(7)} class={cls('thing-pic', c)} label={label} />;
  if (icon === 'string') return <StringPic shaking={false} />;
  return <span class={cls('thing-pic', 'emo', c)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>{icon}</span>;
}

// ---------- Light to See ----------

/** A sea cave. Lit, its lamp glows and the animal inside shows; dark, nothing inside can be seen at all. */
export function Cave({ animal, lit, label }: { animal: string; lit: boolean; label?: string }) {
  return (
    <svg class={cls('cave', lit ? 'lit' : 'dark')} viewBox="0 0 120 100" role="img" aria-label={label ?? (lit ? 'A cave with a lamp on' : 'A dark cave')}>
      <defs>
        <radialGradient id="cave-glow" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff2b0" /><stop offset=".45" stop-color="#ffd27a" stop-opacity=".7" /><stop offset="1" stop-color="#3a5a7a" stop-opacity=".2" /></radialGradient>
      </defs>
      <path d="M4 98 V40 Q4 4 60 4 Q116 4 116 40 V98 Z" fill="#5a4a3a" stroke={INK} stroke-width="4" />
      <path d="M16 98 V46 Q16 18 60 18 Q104 18 104 46 V98 Z" fill={lit ? 'url(#cave-glow)' : '#02040c'} stroke={INK} stroke-width="3" />
      {/* the lamp hangs at the top left: on, it glows; off, it's a dark bulb */}
      <path d="M34 18 V26" stroke={INK} stroke-width="2" />
      <circle cx="34" cy="31" r="6" fill={lit ? '#fff6c8' : '#2a2a30'} stroke={INK} stroke-width="2" />
      {/* the size is set as a style: a rule for emoji in a choice (.dl-choice .choice-pic .emo) would otherwise blow it up past the cave */}
      {lit && <text x="62" y="86" text-anchor="middle" class="cave-animal emo" style={EMOJI_36} aria-hidden="true">{animal}</text>}
    </svg>
  );
}

/** The sun shining on the moon: its light goes to the moon and bounces off to us. */
export function SunMoon({ step }: { step: number }) {
  return (
    <svg class="sunmoon" viewBox="0 0 200 100" role="img" aria-label="The sun shines on the moon">
      <rect width="200" height="100" rx="12" fill="#0a1430" />
      <circle cx="30" cy="30" r="18" fill="#ffd23f" stroke={INK} stroke-width="3" />
      {step >= 1 && <path d="M48 34 L150 50" stroke="#ffe95a" stroke-width="6" stroke-linecap="round" class="ray" />}
      {step >= 2 && <path d="M150 58 L104 92" stroke="#fff6c8" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 6" class="ray" />}
      <circle cx="160" cy="52" r="14" fill={step >= 1 ? '#f4f0e0' : '#4a4a58'} stroke={INK} stroke-width="3" />
      <text x="100" y="96" font-size="16" text-anchor="middle">👀</text>
    </svg>
  );
}

// ---------- Through or Not ----------

const LOOKS: Record<string, { fill: string; opacity: number; extra?: ComponentChildren }> = {
  glass: { fill: '#bfefff', opacity: 0.35, extra: <path d="M-6 -26 L2 -34 M-6 -14 L8 -28" stroke="#fff" stroke-width="3" stroke-linecap="round" /> },
  plastic: { fill: '#d8f8ff', opacity: 0.3, extra: <path d="M-6 -22 L6 -32" stroke="#fff" stroke-width="3" stroke-linecap="round" /> },
  wax: { fill: '#f8f0d0', opacity: 0.8 },
  frost: { fill: '#eef6fa', opacity: 0.82, extra: <g fill="#fff" opacity=".9">{[[-4, -24], [4, -8], [-6, 10], [5, 22]].map(([x, y]) => <circle cx={x} cy={y} r="2" />)}</g> },
  tissue: { fill: '#ffc8e0', opacity: 0.78 },
  wood: { fill: '#a8743f', opacity: 1, extra: <path d="M-6 -36 V36 M4 -36 V36" stroke="#7a4f28" stroke-width="2" /> },
  card: { fill: '#d8b27a', opacity: 1, extra: <path d="M-8 -20 H8 M-8 0 H8 M-8 20 H8" stroke="#b08850" stroke-width="2" /> },
  metal: { fill: '#9aa4ae', opacity: 1, extra: <circle cx="0" cy="-26" r="2.5" fill="#5d6670" /> },
  brick: { fill: '#b8483a', opacity: 1, extra: <path d="M-10 -12 H10 M-10 12 H10 M0 -36 V-12 M0 12 V36" stroke="#7a2a20" stroke-width="2" /> },
  rock: { fill: '#7a7a84', opacity: 1, extra: <circle cx="-3" cy="-8" r="4" fill="#5a5a64" /> },
};

/** A sheet of the material standing on its edge, centred at (0, 0), 24 wide and 76 tall. */
export function Sheet({ id }: { id: MaterialId }) {
  const m = material(id), look = LOOKS[m.look]!;
  return (
    <g>
      <rect x="-12" y="-38" width="24" height="76" rx="4" fill={look.fill} fill-opacity={look.opacity} stroke={INK} stroke-width="3" />
      {look.extra}
    </g>
  );
}

/** A material on its own, as a choice. */
export function MaterialPic({ id }: { id: MaterialId }) {
  return <svg class="material-pic" viewBox="-30 -44 60 88" aria-hidden="true"><Sheet id={id} /></svg>;
}

/** The lamp, a thing in its beam, and the wall behind. `beam` 0..1: how far the light has run (1 the whole way); the wall shows a
 *  bright spot, a dim glow or a shadow, from what the thing lets through. */
export function BeamScene({ item, beam, label }: { item: MaterialId | null; beam: number; label?: string }) {
  const pass: Pass = item ? material(item).pass : 'all', LAMP = 22, THING = 104, WALL = 184;
  const segs = beamPast(pass, LAMP, THING, WALL), total = WALL - LAMP, reach = LAMP + beam * total;
  const look = wallLook(pass), atWall = beam >= 1;
  return (
    <svg class="beam-scene" viewBox="0 0 200 100" role="img" aria-label={label ?? (item ? `The lamp shines at ${material(item).name}` : 'The lamp and the wall')}>
      <rect width="200" height="100" rx="12" fill="#0a1430" />
      <rect x="184" y="10" width="12" height="80" fill="#3a4a5a" stroke={INK} stroke-width="3" />
      {segs.map(s => s.from < reach && <rect x={s.from} y="44" width={Math.max(0, Math.min(s.to, reach) - s.from)} height="12" fill="#fff2b0" opacity={0.25 + 0.75 * s.light} class="beam" />)}
      {atWall && look !== 'shadow' && <ellipse cx="185" cy="50" rx="7" ry={look === 'bright' ? 16 : 13} fill="#fff6c8" opacity={look === 'bright' ? 1 : 0.4} class="wall-spot" />}
      {atWall && look === 'shadow' && <ellipse cx="185" cy="50" rx="7" ry="16" fill="#000" opacity=".7" class="wall-spot" />}
      {item ? <g transform={`translate(${THING} 50)`}><Sheet id={item} /></g> : <text x={THING} y="60" font-size="30" text-anchor="middle" fill="#ffd23f" font-weight="900">?</text>}
      <Torch x={LAMP} y={50} on={beam > 0} />
    </svg>
  );
}

/** A flashlight pointing right, its front at (x, y). */
function Torch({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-20" y="-7" width="16" height="14" rx="3" fill="#3a3f47" stroke={INK} stroke-width="2.5" />
      <path d="M-4 -11 L4 -11 L4 11 L-4 11 Z" fill="#5d6670" stroke={INK} stroke-width="2.5" />
      <rect x="3" y="-9" width="3" height="18" fill={on ? '#fff6c8' : '#9aa4ae'} />
    </g>
  );
}

/** What the wall looks like, as a choice: a bright spot, a dim glow, or a shadow. */
export function WallPic({ look }: { look: 'bright' | 'dim' | 'shadow' }) {
  return (
    <svg class="wall-pic" viewBox="0 0 60 60" aria-hidden="true">
      <rect x="4" y="4" width="52" height="52" rx="6" fill="#3a4a5a" stroke={INK} stroke-width="3" />
      {look === 'shadow' ? <circle cx="30" cy="30" r="15" fill="#000" opacity=".75" />
        : <circle cx="30" cy="30" r="15" fill="#fff6c8" opacity={look === 'bright' ? 1 : 0.38} />}
      {look === 'bright' && <circle cx="30" cy="30" r="21" fill="none" stroke="#fff6c8" stroke-width="2" opacity=".6" />}
    </svg>
  );
}

// ---------- Mirrors ----------

const MIRROR_PATH: Record<Turn, string> = { 0: 'M-0.42 0 H0.42', 1: 'M-0.3 -0.3 L0.3 0.3', 2: 'M0 -0.42 V0.42', 3: 'M-0.3 0.3 L0.3 -0.3' };
const LAMP_ROT: Record<number, number> = { 0: 0, 1: 45, 2: 90, 3: 135, 4: 180, 5: 225, 6: 270, 7: 315 };

/** The beam lab: the lamp, the gem, rocks, mirrors that can be tapped to turn, spots where a mirror can go. The beam (when shown) is
 *  traced by the ray code through the mirrors as they are now. */
export function LabView({ lab, beam, onMirror, spots, onSpot, picked, hint, label }: {
  lab: Lab; beam: boolean; onMirror?(i: number): void; spots?: readonly Cell[]; onSpot?(i: number): void; picked?: number | null; hint?: number | null; label?: string;
}) {
  const b = beam ? trace(lab) : null, pts = b?.points.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ');
  return (
    <svg class="lab" viewBox={`-0.1 -0.1 ${lab.w + 0.2} ${lab.h + 0.2}`} role="group" aria-label={label ?? 'The light lab'}>
      <rect x="-0.05" y="-0.05" width={lab.w + 0.1} height={lab.h + 0.1} rx="0.25" fill="#0a1430" stroke={INK} stroke-width="0.06" />
      {Array.from({ length: lab.w * lab.h }, (_, i) => <circle cx={(i % lab.w) + 0.5} cy={Math.floor(i / lab.w) + 0.5} r="0.05" fill="#2a3a5a" />)}
      {pts && <polyline points={pts} fill="none" stroke="#fff2b0" stroke-width="0.16" stroke-linecap="round" stroke-linejoin="round" class="lab-beam" />}
      {pts && <polyline points={pts} fill="none" stroke="#ffffff" stroke-width="0.05" stroke-linecap="round" stroke-linejoin="round" />}
      {/* the gem: it sparkles when the light reaches it */}
      <g transform={`translate(${lab.gem.x + 0.5} ${lab.gem.y + 0.5})`} class={cls('gem', b?.end === 'gem' && 'hit')}>
        {b?.end === 'gem' && <circle r="0.45" fill="#7ff7ff" opacity=".45" />}
        <path d="M0 -0.32 L0.3 -0.06 L0 0.34 L-0.3 -0.06 Z" fill="#5af0ff" stroke={INK} stroke-width="0.05" stroke-linejoin="round" />
        <path d="M-0.3 -0.06 H0.3" stroke="#fff" stroke-width="0.04" />
      </g>
      {lab.rocks.map(r => <circle cx={r.x + 0.5} cy={r.y + 0.5} r="0.35" fill="#7a7a84" stroke={INK} stroke-width="0.05" />)}
      {lab.mirrors.map((m, i) => (
        <g transform={`translate(${m.x + 0.5} ${m.y + 0.5})`} class={cls('mirror', hint === i && 'hint')} pointer-events={onMirror ? undefined : 'none'}>
          <circle r="0.46" fill="#ffffff10" />
          <path d={MIRROR_PATH[m.turn]} stroke={INK} stroke-width="0.2" stroke-linecap="round" />
          <path d={MIRROR_PATH[m.turn]} stroke="#cfefff" stroke-width="0.1" stroke-linecap="round" />
          {onMirror && <rect x="-0.5" y="-0.5" width="1" height="1" fill="transparent" class="tap" role="button" aria-label={`Turn mirror ${i + 1}`} data-key={`m${i}`} onClick={() => onMirror(i)} />}
        </g>
      ))}
      {spots?.map((s, i) => (
        <g class={cls('spot', picked === i && 'picked', hint === i && 'hint')}>
          <circle cx={s.x + 0.5} cy={s.y + 0.5} r="0.42" fill={picked === i ? '#3fd07f55' : '#ffffff18'} stroke="#ffd23f" stroke-width="0.05" stroke-dasharray="0.12 0.08" />
          <text x={s.x + 0.5} y={s.y + 0.62} font-size="0.36" text-anchor="middle" fill="#ffd23f" font-weight="900">{i + 1}</text>
          {onSpot && <rect x={s.x} y={s.y} width="1" height="1" fill="transparent" class="tap" role="button" aria-label={`Spot ${i + 1}`} data-key={`${i}`} onClick={() => onSpot(i)} />}
        </g>
      ))}
      <g transform={`translate(${lab.lamp.x + 0.5} ${lab.lamp.y + 0.5}) rotate(${LAMP_ROT[lab.lamp.dir]}) scale(0.022)`}><Torch x={0} y={0} on={beam} /></g>
    </svg>
  );
}

/** "Which one bounces the light?": the lamp shines at one thing; a mirror sends the beam up, anything else stops it. */
export function BounceScene({ item, beam }: { item: string; beam: boolean }) {
  const mirror = item === 'mirror';
  // the beam is traced by the ray code on a small lab (optics.ts bounceLab), its cells laid over this picture: the lamp's cell at
  // x 22, the thing's at x 100, the bottom row at y 70
  const ray = beam ? trace(bounceLab(mirror)) : null;
  const px = (x: number) => 22 + (x * (100 - 22)) / BOUNCE_LAB.at.x, py = (y: number) => 70 - (BOUNCE_LAB.at.y - y) * 20;
  return (
    <svg class="bounce-scene" viewBox="0 0 140 100" role="img" aria-label={mirror ? 'The lamp shines at a mirror' : `The lamp shines at ${material(item).name}`}>
      <rect width="140" height="100" rx="12" fill="#0a1430" />
      {ray && <polyline points={ray.points.map(p => `${px(p.x)},${py(p.y)}`).join(' ')} fill="none" stroke="#fff2b0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" class="beam" />}
      {mirror
        ? <g transform="translate(100 70) rotate(-45)"><rect x="-22" y="-4" width="44" height="8" rx="2" fill="#cfefff" stroke={INK} stroke-width="3" /></g>
        : <g transform="translate(100 70) scale(.5)"><Sheet id={item as MaterialId} /></g>}
      <Torch x={22} y={70} on={beam} />
    </svg>
  );
}
export function MirrorPic() {
  return <svg class="material-pic" viewBox="-30 -44 60 88" aria-hidden="true"><rect x="-16" y="-36" width="32" height="72" rx="6" fill="#cfefff" stroke={INK} stroke-width="3" /><path d="M-8 -20 L4 -30 M-8 -6 L10 -22" stroke="#fff" stroke-width="3" stroke-linecap="round" /></svg>;
}

// ---------- Shadows ----------

const FLOOR = 56;
const sy = (y: number) => FLOOR - y;

/** A lamp, a thing standing on the floor and its shadow, from shadowOf(). `cast`: the shadow from a lamp that isn't shown (Which lamp
 *  made this shadow?). Lamps that are only there to be picked are drawn too. */
export function ShadowScene({ icon, lamp, cast, shadow, lamps, onLamp, spots, onSpot, picked, hint, dragging }: {
  icon: string; lamp: Lamp | null; cast?: Lamp; shadow: boolean; lamps?: readonly { id: string; at: Lamp }[]; onLamp?(id: string): void;
  spots?: readonly ('left' | 'right')[]; onSpot?(side: string): void; picked?: string | null; hint?: string | null; dragging?: boolean;
}) {
  const t = STAGE.thing, from = lamp ?? cast, s = from && shadow ? shadowOf(from, t) : null;
  return (
    <svg class={cls('shadow-scene', dragging && 'dragging')} viewBox="0 0 100 64" role="group" aria-label="A lamp and a thing on the floor">
      <rect width="100" height="64" rx="5" fill="#16264a" />
      <rect x="0" y={FLOOR} width="100" height="8" fill="#c8b48a" />
      {lamp && <path d={`M${lamp.x} ${sy(lamp.y)} L${t.x - t.w / 2} ${sy(t.h)} M${lamp.x} ${sy(lamp.y)} L${t.x + t.w / 2} ${sy(t.h)}`} stroke="#fff2b066" stroke-width="0.6" stroke-dasharray="1.5 1" />}
      {s && <path d={`M${s.from} ${FLOOR} L${s.to} ${FLOOR} L${s.to - (s.to - s.from) * 0.08} ${FLOOR + 3} L${s.from + (s.to - s.from) * 0.08} ${FLOOR + 3} Z`} fill="#000" opacity=".72" class="shadow" />}
      {spots?.map(side => {
        const x = side === 'left' ? t.x - t.w / 2 - 16 : t.x + t.w / 2 + 16;
        return (
          <g class={cls('spot', picked === side && 'picked', hint === side && 'hint')}>
            <ellipse cx={x} cy={FLOOR + 1.5} rx="12" ry="3" fill={picked === side ? '#3fd07f88' : '#ffffff22'} stroke="#ffd23f" stroke-width="0.6" stroke-dasharray="1.6 1" />
            {onSpot && <rect x={x - 14} y={FLOOR - 10} width="28" height="18" fill="transparent" class="tap" role="button" aria-label={side === 'left' ? 'Here, on the left' : 'Here, on the right'} data-key={side} onClick={() => onSpot(side)} />}
          </g>
        );
      })}
      <text x={t.x} y={FLOOR - 1.5} text-anchor="middle" class="shadow-thing emo" style={{ fontSize: '17px' }} aria-hidden="true">{icon}</text>
      {lamp && <LampIcon at={lamp} on />}
      {lamps?.map(l => (
        <g class={cls('pick-lamp', picked === l.id && 'picked', hint === l.id && 'hint')}>
          <LampIcon at={l.at} on={false} />
          {onLamp && <rect x={l.at.x - 7} y={sy(l.at.y) - 7} width="14" height="14" fill="transparent" class="tap" role="button" aria-label={`The ${l.id} lamp`} data-key={l.id} onClick={() => onLamp(l.id)} />}
        </g>
      ))}
    </svg>
  );
}
function LampIcon({ at, on }: { at: Lamp; on: boolean }) {
  return (
    <g transform={`translate(${at.x} ${sy(at.y)})`}>
      {on && <circle r="6" fill="#fff2b0" opacity=".35" />}
      <circle r="3.4" fill={on ? '#fff6c8' : '#ffd23f'} stroke={INK} stroke-width="0.8" />
      <path d="M-1.6 -3.2 H1.6 V-5 H-1.6 Z" fill="#5d6670" stroke={INK} stroke-width="0.6" />
    </g>
  );
}

/** A thing's shadow, as a choice: its shape, all dark. */
export function ShadowPic({ icon }: { icon: string }) {
  return <span class="shadow-pic emo" aria-hidden="true">{icon}</span>;
}

// ---------- Shake and Sound ----------

/** A sound's picture with its rings: big rings for loud, small for quiet, so the picture says how loud with the sound off. */
export function SoundPic({ id, pulse }: { id: string; pulse?: boolean }) {
  const s = SOUNDS.find(x => x.id === id)!;
  return (
    <span class={cls('sound-pic', `loud${s.loud}`, pulse && 'pulse')}>
      <span class="rings" aria-hidden="true">{Array.from({ length: s.loud === 3 ? 3 : 1 }, (_, i) => <i style={{ animationDelay: `${i * 0.35}s` }} />)}</span>
      <span class={cls('emo', s.id === 'drumTap' && 'small')} aria-hidden="true">{s.icon}</span>
    </span>
  );
}

/** A plucked string between two pegs: shaking, it's drawn blurred and wide with rings; still, it's one straight line. */
export function StringPic({ shaking }: { shaking: boolean }) {
  return (
    <svg class={cls('string-pic', shaking && 'shaking')} viewBox="0 0 100 50" aria-hidden="true">
      <rect x="4" y="16" width="8" height="18" rx="2" fill="#a8743f" stroke={INK} stroke-width="2" />
      <rect x="88" y="16" width="8" height="18" rx="2" fill="#a8743f" stroke={INK} stroke-width="2" />
      {shaking ? <>
        <path d="M12 25 Q50 9 88 25" fill="none" stroke="#c8a040" stroke-width="2" opacity=".6" />
        <path d="M12 25 Q50 41 88 25" fill="none" stroke="#c8a040" stroke-width="2" opacity=".6" />
        <path d="M12 25 Q50 17 88 25" fill="none" stroke="#e8c060" stroke-width="2.5" />
        <path d="M12 25 Q50 33 88 25" fill="none" stroke="#e8c060" stroke-width="2.5" />
      </> : <path d="M12 25 H88" stroke="#e8c060" stroke-width="3" />}
    </svg>
  );
}

/** Something that can shake: drawn shaking (jiggling, blurred, with rings and, on a drum, the sand jumping), or still. */
export function ShakerPic({ id, shaking }: { id: string; shaking: boolean }) {
  const icon = { drum: '🥁', bell: '🔔', guitar: '🎸', string: 'string' }[id] ?? '🥁';
  return (
    <span class={cls('shaker', shaking ? 'shaking' : 'still')}>
      {shaking && <span class="rings" aria-hidden="true"><i /><i style={{ animationDelay: '.35s' }} /></span>}
      {icon === 'string' ? <StringPic shaking={shaking} /> : <span class="emo" aria-hidden="true">{icon}</span>}
      {id === 'drum' && <span class={cls('sand', shaking && 'jumping')} aria-hidden="true"><i /><i /><i /><i /></span>}
    </span>
  );
}

// ---------- Signals ----------

/** The lighthouse: its lamp lit or dark. */
export function Lighthouse({ on, label }: { on: boolean; label?: string }) {
  return (
    <svg class={cls('lighthouse', on && 'on')} viewBox="0 0 100 120" role="img" aria-label={label ?? 'A lighthouse'}>
      {on && <path d="M50 26 L-10 6 L-10 46 Z M50 26 L110 6 L110 46 Z" fill="#fff2b0" opacity=".7" />}
      <path d="M36 112 L42 40 H58 L64 112 Z" fill="#f4f4f0" stroke={INK} stroke-width="3" />
      <path d="M39 80 H61 L62 92 H38 Z M41 56 H59 L60 68 H40 Z" fill="#e8323a" />
      <rect x="40" y="18" width="20" height="22" rx="3" fill={on ? '#fff6c8' : '#3a4a5a'} stroke={INK} stroke-width="3" />
      <path d="M36 18 L50 6 L64 18 Z" fill="#e8323a" stroke={INK} stroke-width="3" stroke-linejoin="round" />
      <rect x="28" y="110" width="44" height="8" rx="2" fill="#7a7a84" stroke={INK} stroke-width="2" />
    </svg>
  );
}

/** A pattern of flashes written out: a dot for short, a dash for long. */
export function FlashMarks({ pattern, lit = -1, empty = 0 }: { pattern: string; lit?: number; empty?: number }) {
  return (
    <span class="flash-marks" aria-label={pattern ? [...pattern].map(f => (f === 's' ? 'short' : 'long')).join(', ') : 'nothing yet'}>
      {[...pattern].map((f, i) => <i class={cls(f === 's' ? 'short' : 'long', i === lit && 'lit')} />)}
      {Array.from({ length: empty }, () => <i class="blank" />)}
    </span>
  );
}
