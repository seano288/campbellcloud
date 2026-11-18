// The six kinds of question, each at three Levels, made fresh from the tables in things.ts. Every generator makes a question with
// exactly one right answer (problems.test.ts checks thousands): the mirror puzzles are built and then tried every way with the same
// ray code that draws the beam (optics.ts), and kept only if one way, and only one, lights the gem.
//
// | Kind              | Level 1                              | Level 2                               | Level 3                                   |
// | Light to See      | which cave can you see the crab in   | tap everything that makes its own light | why can't you see it / sun or moon / own light with the moon |
// | Through or Not    | which lets the light through (blocks) | sort three: all, some, none            | what will the wall look like              |
// | Shadows           | which shadow is this thing's (2)     | where will the shadow be               | which lamp made this shadow (3)           |
// | Mirrors           | which one bounces the light          | turn the mirror to light the gem       | two mirrors, or which spot for the mirror |
// | Shake and Sound   | which is loud / quiet                | tap the one that is shaking            | the string stops / hit harder / the paper |
// | Signals           | how to say hello far away            | copy the lighthouse's flashes          | count the flashes, what did it say        |
import { int, pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { hitsGem, shadowOf, TURNS, withMirrors, type Cell, type Dir, type Lab, type Lamp, type ShadowSide, type Stand, type Turn, STEP, bounce } from './optics';
import {
  BOUNCE_OTHERS, CAVE_ANIMALS, HELLO, KEY, LIGHT_THINGS, LOUD_PAIRS, MATERIALS, MOON, SHADOW_THINGS, SHAKERS, SOUND_Q3, WHY_CHOICES,
  type CaveAnimalId, type HelloScene, type MaterialId, type ShadowId, type ShakerId, type SoundForm3, type SoundId,
} from './things';

export type Kind = 'see' | 'through' | 'shadow' | 'mirror' | 'sound' | 'signal';
export type Level = 1 | 2 | 3;

export type SeeQ =
  | { kind: 'see'; form: 'cave'; animal: CaveAnimalId; choices: string[]; answer: string }
  | { kind: 'see'; form: 'own'; items: string[]; moon: boolean; answer: string }
  | { kind: 'see'; form: 'why'; animal: CaveAnimalId; choices: string[]; answer: string }
  | { kind: 'see'; form: 'sunmoon'; choices: string[]; answer: string };
export type ThroughQ =
  | { kind: 'through'; form: 'pick'; ask: 'all' | 'none'; choices: MaterialId[]; answer: string }
  | { kind: 'through'; form: 'sort'; items: MaterialId[]; answer: string }
  | { kind: 'through'; form: 'wall'; item: MaterialId; choices: string[]; answer: string };
export type ShadowQ =
  | { kind: 'shadow'; form: 'match'; thing: ShadowId; choices: ShadowId[]; answer: string }
  | { kind: 'shadow'; form: 'where'; thing: ShadowId; lamp: 'left' | 'right'; choices: string[]; answer: string }
  | { kind: 'shadow'; form: 'lamp'; thing: ShadowId; shown: ShadowSide; choices: string[]; answer: string };
export type MirrorQ =
  | { kind: 'mirror'; form: 'which'; choices: string[]; answer: string }
  | { kind: 'mirror'; form: 'turn'; lab: Lab; answer: string }
  | { kind: 'mirror'; form: 'two'; lab: Lab; answer: string }
  | { kind: 'mirror'; form: 'spot'; lab: Lab; turn: Turn; spots: Cell[]; choices: string[]; answer: string };
export type SoundQ =
  | { kind: 'sound'; form: 'loud'; ask: 'loud' | 'quiet'; choices: SoundId[]; answer: string }
  | { kind: 'sound'; form: 'shake'; choices: ShakerId[]; answer: string }
  | { kind: 'sound'; form: 'why'; which: SoundForm3; choices: string[]; answer: string };
export type SignalQ =
  | { kind: 'signal'; form: 'hello'; scene: HelloScene; choices: string[]; answer: string }
  | { kind: 'signal'; form: 'copy'; pattern: string; answer: string }
  | { kind: 'signal'; form: 'key'; n: number; choices: string[]; answer: string };
export type Question = SeeQ | ThroughQ | ShadowQ | MirrorQ | SoundQ | SignalQ;

/** Joins the picks of a tap-them-all answer: sorted, so the order he tapped them in doesn't matter. */
export const SEP = '+';
export const setAnswer = (ids: readonly string[]) => [...ids].sort().join(SEP);

// ---------- Light to See ----------

export function makeSee(level: Level, stretch: Stretch, rng: Rng): SeeQ {
  const animal = pick(rng, CAVE_ANIMALS).id;
  if (level === 1) return { kind: 'see', form: 'cave', animal, choices: shuffle(rng, ['lit', 'dark']), answer: 'lit' };
  const form = level === 2 ? 'own' : pick(rng, ['why', 'sunmoon', 'own', 'own'] as const);
  if (form === 'why') {
    const others = shuffle(rng, WHY_CHOICES.filter(c => !c.right)).slice(0, 2).map(c => c.id);
    return { kind: 'see', form: 'why', animal, choices: shuffle(rng, ['dark', ...others]), answer: 'dark' };
  }
  if (form === 'sunmoon') return { kind: 'see', form: 'sunmoon', choices: shuffle(rng, ['sun', 'moon']), answer: 'sun' };
  // tap everything that makes its own light: some that do, the rest that don't; the moon only at Level 3
  const moon = level === 3;
  const n = 4 + stretch, own = int(rng, 1, Math.min(3, n - 2));
  const sources = shuffle(rng, LIGHT_THINGS.filter(t => t.own)).slice(0, own).map(t => t.id as string);
  const not = shuffle(rng, LIGHT_THINGS.filter(t => !t.own)).slice(0, n - own - (moon ? 1 : 0)).map(t => t.id as string);
  const items = shuffle(rng, [...sources, ...not, ...(moon ? [MOON.id] : [])]);
  return { kind: 'see', form: 'own', items, moon, answer: setAnswer(sources) };
}

// ---------- Through or Not ----------

const ofPass = (p: string) => MATERIALS.filter(m => m.pass === p).map(m => m.id);
export function makeThrough(level: Level, rng: Rng): ThroughQ {
  if (level === 1) {
    const ask = pick(rng, ['all', 'none'] as const), clear = pick(rng, ofPass('all')), solid = pick(rng, ofPass('none'));
    return { kind: 'through', form: 'pick', ask, choices: shuffle(rng, [clear, solid]), answer: ask === 'all' ? clear : solid };
  }
  if (level === 2) {
    const items = shuffle(rng, [pick(rng, ofPass('all')), pick(rng, ofPass('some')), pick(rng, ofPass('none'))]);
    return { kind: 'through', form: 'sort', items, answer: sortAnswer(items, items.map(i => MATERIALS.find(m => m.id === i)!.pass)) };
  }
  // the wall: any material, most often the "some" ones, the hardest to picture
  const item = pick(rng, [...ofPass('all'), ...ofPass('some'), ...ofPass('some'), ...ofPass('none')]);
  const pass = MATERIALS.find(m => m.id === item)!.pass;
  return { kind: 'through', form: 'wall', item, choices: ['bright', 'dim', 'shadow'], answer: pass === 'all' ? 'bright' : pass === 'some' ? 'dim' : 'shadow' };
}
/** A sort's answer: each thing and its bin, in the order the things are shown. */
export const sortAnswer = (items: readonly string[], bins: readonly string[]) => items.map((it, i) => `${it}:${bins[i] ?? ''}`).join(',');

// ---------- Shadows ----------

/** The scene every shadow question is drawn and answered in: the floor is y = 0, the thing stands in the middle. */
export const STAGE = { thing: { x: 50, w: 16, h: 18 } as Stand, lamps: { left: { x: 14, y: 40 }, top: { x: 50, y: 52 }, right: { x: 86, y: 40 } } satisfies Record<string, Lamp> };
export type LampSpot = keyof typeof STAGE.lamps;
export const shadowFrom = (lamp: LampSpot) => shadowOf(STAGE.lamps[lamp], STAGE.thing);

export function makeShadow(level: Level, rng: Rng): ShadowQ {
  const thing = pick(rng, SHADOW_THINGS);
  if (level === 1) {
    // never two things whose shadows could look alike
    const other = pick(rng, SHADOW_THINGS.filter(t => t.shape !== thing.shape));
    return { kind: 'shadow', form: 'match', thing: thing.id, choices: shuffle(rng, [thing.id, other.id]), answer: thing.id };
  }
  if (level === 2) {
    const lamp = pick(rng, ['left', 'right'] as const);
    return { kind: 'shadow', form: 'where', thing: thing.id, lamp, choices: ['left', 'right'], answer: shadowFrom(lamp).side };
  }
  const lamp = pick(rng, ['left', 'top', 'right'] as const);
  return { kind: 'shadow', form: 'lamp', thing: thing.id, shown: shadowFrom(lamp).side, choices: ['left', 'top', 'right'], answer: lamp };
}

// ---------- Mirrors ----------

/** The lab's size: small enough to tap a mirror on a sideways phone. */
export const LAB = { w: 6, h: 4 } as const;
const inLab = (c: Cell) => c.x >= 0 && c.y >= 0 && c.x < LAB.w && c.y < LAB.h;
const at = (c: Cell, d: Dir, n: number): Cell => ({ x: c.x + STEP[d][0] * n, y: c.y + STEP[d][1] * n });
const key = (c: Cell) => `${c.x},${c.y}`;

/** The mirror turns that light the gem in a lab with these mirror cells (every combination tried). */
export function solutions(lab: Lab): Turn[][] {
  const out: Turn[][] = [];
  const go = (i: number, turns: Turn[]) => {
    if (i === lab.mirrors.length) { if (hitsGem(withMirrors(lab, lab.mirrors.map((m, j) => ({ ...m, turn: turns[j]! }))))) out.push(turns); return; }
    for (const t of TURNS) go(i + 1, [...turns, t]);
  };
  go(0, []);
  return out;
}

/** A lamp on the lab's left or right edge, shining straight across. */
function lampOnEdge(rng: Rng): Lab['lamp'] {
  const left = rng() < 0.5;
  return { x: left ? 0 : LAB.w - 1, y: int(rng, 0, LAB.h - 1), dir: left ? 0 : 4 };
}

function makeTurn(rng: Rng): MirrorQ {
  for (;;) {
    const lamp = lampOnEdge(rng), m = at(lamp, lamp.dir, int(rng, 2, LAB.w - 2));
    if (!inLab(m)) continue;
    const turn = pick(rng, TURNS), out = bounce(lamp.dir, turn);
    if (out === null || out === ((lamp.dir + 4) % 8)) continue; // the gem sits where the beam turns to: not straight back at the lamp
    const gem = at(m, out, int(rng, 1, 3));
    if (!inLab(gem)) continue;
    const start = pick(rng, TURNS.filter(t => t !== turn));
    const lab: Lab = { ...LAB, lamp, gem, mirrors: [{ ...m, turn: start }], rocks: [] };
    const ways = solutions(lab);
    if (ways.length === 1 && ways[0]![0] === turn) return { kind: 'mirror', form: 'turn', lab, answer: `${turn}` };
  }
}

function makeTwo(rng: Rng): MirrorQ {
  for (;;) {
    const lamp = lampOnEdge(rng), a = at(lamp, lamp.dir, int(rng, 1, LAB.w - 2));
    const ta = pick(rng, TURNS), da = bounce(lamp.dir, ta);
    if (!inLab(a) || da === null || da % 2 === 1 || da === ((lamp.dir + 4) % 8)) continue; // straight turns only: up or down
    const b = at(a, da, int(rng, 1, 3)), tb = pick(rng, TURNS), db = bounce(da, tb);
    if (!inLab(b) || db === null || db % 2 === 1 || db === ((da + 4) % 8)) continue;
    const gem = at(b, db, int(rng, 1, 3));
    if (!inLab(gem) || key(gem) === key(lamp)) continue;
    const lab: Lab = { ...LAB, lamp, gem, mirrors: [{ ...a, turn: pick(rng, TURNS) }, { ...b, turn: pick(rng, TURNS) }], rocks: [] };
    if (hitsGem(lab)) continue; // it starts out missing
    const ways = solutions(lab);
    if (ways.length === 1 && ways[0]![0] === ta && ways[0]![1] === tb) return { kind: 'mirror', form: 'two', lab, answer: `${ta},${tb}` };
  }
}

function makeSpot(rng: Rng): MirrorQ {
  for (;;) {
    const lamp = lampOnEdge(rng), turn = pick(rng, [1, 3] as const), out = bounce(lamp.dir, turn)!;
    // three spots along the beam's straight path; the mirror only lights the gem from one of them
    const cols = shuffle(rng, Array.from({ length: LAB.w - 2 }, (_, i) => i + 1)).slice(0, 3).sort((p, q) => p - q);
    const spots = cols.map(n => at(lamp, lamp.dir, n)).filter(inLab);
    if (spots.length < 3) continue;
    const right = int(rng, 0, 2), gem = at(spots[right]!, out, int(rng, 1, 3));
    if (!inLab(gem)) continue;
    const base: Lab = { ...LAB, lamp, gem, mirrors: [], rocks: [] };
    const lit = spots.map(s => hitsGem({ ...base, mirrors: [{ ...s, turn }] }));
    if (lit.filter(Boolean).length !== 1 || !lit[right]) continue;
    return { kind: 'mirror', form: 'spot', lab: base, turn, spots, choices: ['0', '1', '2'], answer: `${right}` };
  }
}

export function makeMirror(level: Level, rng: Rng): MirrorQ {
  if (level === 1) return { kind: 'mirror', form: 'which', choices: shuffle(rng, ['mirror', pick(rng, BOUNCE_OTHERS)]), answer: 'mirror' };
  if (level === 2) return makeTurn(rng);
  return rng() < 0.5 ? makeTwo(rng) : makeSpot(rng);
}

// ---------- Shake and Sound ----------

export function makeSound(level: Level, rng: Rng): SoundQ {
  if (level === 1) {
    const pair = pick(rng, LOUD_PAIRS), ask = pick(rng, ['loud', 'quiet'] as const);
    return { kind: 'sound', form: 'loud', ask, choices: shuffle(rng, [...pair]), answer: ask === 'loud' ? pair[0] : pair[1] };
  }
  if (level === 2) {
    const choices = shuffle(rng, SHAKERS.map(s => s.id)).slice(0, 3);
    return { kind: 'sound', form: 'shake', choices, answer: pick(rng, choices) };
  }
  const which = pick(rng, Object.keys(SOUND_Q3) as SoundForm3[]), f = SOUND_Q3[which];
  return { kind: 'sound', form: 'why', which, choices: shuffle(rng, [f.right, ...f.wrong]), answer: f.right };
}

// ---------- Signals ----------

export function makeSignal(level: Level, stretch: Stretch, rng: Rng): SignalQ {
  if (level === 1) {
    const scene = pick(rng, Object.keys(HELLO) as HelloScene[]), h = HELLO[scene];
    return { kind: 'signal', form: 'hello', scene, choices: shuffle(rng, [h.right, ...h.wrong]), answer: h.right };
  }
  if (level === 2) {
    const n = stretch === 2 ? 4 : 3;
    let pattern = '';
    while (!pattern || !pattern.includes('s') || !pattern.includes('l')) pattern = Array.from({ length: n }, () => (rng() < 0.5 ? 's' : 'l')).join('');
    return { kind: 'signal', form: 'copy', pattern, answer: pattern };
  }
  const n = pick(rng, KEY).n;
  return { kind: 'signal', form: 'key', n, choices: KEY.map(k => `${k.n}`), answer: `${n}` };
}

// ---------- every kind ----------

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, rng: Rng): Question {
  if (kind === 'see') return makeSee(level, stretch, rng);
  if (kind === 'through') return makeThrough(level, rng);
  if (kind === 'shadow') return makeShadow(level, rng);
  if (kind === 'mirror') return makeMirror(level, rng);
  if (kind === 'sound') return makeSound(level, rng);
  return makeSignal(level, stretch, rng);
}

export const rightAnswer = (q: Question) => q.answer;

/** Is this something he could have answered at all (a choice on screen, a setting of the mirrors, a pattern of flashes)? */
export function isAnswer(q: Question, a: string): boolean {
  if ('choices' in q) return (q.choices as readonly string[]).includes(a);
  if (q.kind === 'see' && q.form === 'own') return a === '' || a.split(SEP).every(x => q.items.includes(x));
  if (q.kind === 'through' && q.form === 'sort') {
    const parts = a.split(',');
    return parts.length === q.items.length && parts.every((p, i) => { const [it, bin] = p.split(':'); return it === q.items[i] && ['all', 'some', 'none'].includes(bin ?? ''); });
  }
  if (q.kind === 'mirror' && (q.form === 'turn' || q.form === 'two')) {
    const turns = a.split(',');
    return turns.length === q.lab.mirrors.length && turns.every(t => ['0', '1', '2', '3'].includes(t));
  }
  if (q.kind === 'signal' && q.form === 'copy') return /^[sl]{1,8}$/.test(a);
  return false;
}

/** Every thing a question might show, for the tests: the one right, every other tappable choice wrong. */
export function everyAnswer(q: Question): string[] {
  if (q.kind === 'see' && q.form === 'own') {
    const all: string[] = [];
    for (let mask = 0; mask < 1 << q.items.length; mask++) all.push(setAnswer(q.items.filter((_, i) => mask & (1 << i))));
    return all;
  }
  if (q.kind === 'through' && q.form === 'sort') {
    const bins = ['all', 'some', 'none'], all: string[] = [];
    for (let k = 0; k < 27; k++) all.push(sortAnswer(q.items, [bins[k % 3]!, bins[Math.floor(k / 3) % 3]!, bins[Math.floor(k / 9)]!]));
    return all;
  }
  if (q.kind === 'mirror' && q.form === 'turn') return TURNS.map(t => `${t}`);
  if (q.kind === 'mirror' && q.form === 'two') return TURNS.flatMap(a => TURNS.map(b => `${a},${b}`));
  if (q.kind === 'signal' && q.form === 'copy') {
    const n = q.pattern.length, all: string[] = [];
    for (let mask = 0; mask < 1 << n; mask++) all.push(Array.from({ length: n }, (_, i) => (mask & (1 << i) ? 'l' : 's')).join(''));
    return all;
  }
  return [...(q as { choices: string[] }).choices];
}

/** Whether a setting of the mirrors lights the gem, by the ray code (the answer check for the mirror puzzles uses the same). */
export function mirrorsLight(q: Extract<MirrorQ, { form: 'turn' | 'two' }>, a: string): boolean {
  const turns = a.split(',').map(Number) as Turn[];
  return hitsGem(withMirrors(q.lab, q.lab.mirrors.map((m, i) => ({ ...m, turn: turns[i]! }))));
}
export function spotLights(q: Extract<MirrorQ, { form: 'spot' }>, a: string): boolean {
  const s = q.spots[Number(a)];
  return !!s && hitsGem({ ...q.lab, mirrors: [{ ...s, turn: q.turn }] });
}

/** Is this the right answer? The mirror puzzles ask the ray code (the same that draws the beam); the rest are their marked answer. */
export function isRightAnswer(q: Question, a: string): boolean {
  if (q.kind === 'mirror' && (q.form === 'turn' || q.form === 'two')) return mirrorsLight(q, a);
  if (q.kind === 'mirror' && q.form === 'spot') return spotLights(q, a);
  if (q.kind === 'see' && q.form === 'own') return setAnswer(a ? a.split(SEP) : []) === q.answer;
  return a === q.answer;
}

/** What a question is about, so a Round doesn't ask about the same thing twice. */
export function topicOf(q: Question): string {
  // "which bounces": the thing offered against the mirror (the answer is always the mirror, so it can't tell two apart)
  if (q.kind === 'mirror' && q.form === 'which') return `mirror:which:${q.choices.find(c => c !== 'mirror')}`;
  if (q.kind === 'mirror') return `mirror:${q.form}:${q.answer}:${'lab' in q ? JSON.stringify(q.lab.gem) : ''}`;
  if (q.kind === 'see') return `see:${q.form}:${'animal' in q ? q.animal : q.answer}`;
  if (q.kind === 'through') return `through:${q.form}:${'item' in q ? q.item : 'items' in q ? q.items.join() : q.choices.join()}`;
  if (q.kind === 'shadow') return `shadow:${q.form}:${q.thing}`;
  if (q.kind === 'sound') return `sound:${q.form}:${q.form === 'why' ? q.which : q.answer}`;
  return `signal:${q.form}:${q.answer}`;
}
