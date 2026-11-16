// What a sentence means, as a picture: who (or what) it is about, how many, big or little, its colour, what it is doing, where it is
// (on, under, in or by something) and what it has. What Happened shows pictures made from these, and Who, What, Where asks about them.
//
// A sentence's meaning only says what the sentence says. A picture matches it when everything the sentence says is true of the
// picture; the wrong pictures each change something the sentence says, so no wrong picture can also be true of it (the test checks
// every sentence and every wrong picture).
import { pick, type Rng } from '../../game/rng';

export const ANIMALS = ['dog', 'cat', 'pig', 'hen', 'fox', 'frog', 'duck', 'fish', 'bug', 'bird'] as const;
export const PEOPLE = ['Sam', 'Pam', 'Mom', 'Dad'] as const;
export const THINGS = ['ball', 'hat', 'car', 'cake', 'cup', 'box', 'bus'] as const;
export type Animal = (typeof ANIMALS)[number];
export type Person = (typeof PEOPLE)[number];
export type Thing = (typeof THINGS)[number];
export type Who = Animal | Person | Thing;
export const PROPS = ['bed', 'box', 'log', 'rug', 'tree', 'pond', 'mud', 'nest', 'car'] as const;
export type Prop = (typeof PROPS)[number];
export const RELS = ['on', 'under', 'in', 'by'] as const;
export type Rel = (typeof RELS)[number];
export const ACTS = ['run', 'jump', 'sleep', 'swim', 'eat', 'fly', 'dig'] as const;
export type Act = (typeof ACTS)[number];
export const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type Color = (typeof COLORS)[number];
export type Size = 'big' | 'little';

export interface Meaning {
  readonly who: Who;
  readonly n?: 2 | 3;
  readonly size?: Size;
  readonly color?: Color;
  readonly act?: Act;
  readonly rel?: Rel;
  readonly at?: Prop;
  readonly has?: Thing;
  readonly hasColor?: Color;
}
/** A picture is drawn from the same fields. */
export type Scene = Meaning;
export type Attr = keyof Meaning;

/** Emoji for the living things (they read clearly on the iPad); things that need a colour are drawn (art/Scene.tsx). */
export const EMOJI: Record<Animal | Person | 'bus' | 'cake', string> = {
  dog: '🐕', cat: '🐈', pig: '🐖', hen: '🐔', fox: '🦊', frog: '🐸', duck: '🦆', fish: '🐟', bug: '🐛', bird: '🐦',
  Sam: '👦', Pam: '👧', Mom: '👩', Dad: '👨', bus: '🚌', cake: '🎂',
};
/** Drawn things that take a colour. */
export const COLOURED: readonly Thing[] = ['ball', 'hat', 'car', 'cup', 'box'];
export const groupOf = (w: Who): 'animal' | 'person' | 'thing' =>
  (ANIMALS as readonly string[]).includes(w) ? 'animal' : (PEOPLE as readonly string[]).includes(w) ? 'person' : 'thing';

/** What each living thing can be shown doing. */
export const CAN_DO: Record<Animal | Person, readonly Act[]> = {
  dog: ['run', 'jump', 'sleep', 'swim', 'eat', 'dig'], cat: ['run', 'jump', 'sleep', 'eat'], pig: ['run', 'sleep', 'eat', 'dig'],
  hen: ['run', 'sleep', 'eat'], fox: ['run', 'jump', 'sleep', 'dig'], frog: ['jump', 'swim', 'sleep'], duck: ['swim', 'fly', 'sleep'],
  fish: ['swim', 'eat'], bug: ['fly', 'eat', 'sleep'], bird: ['fly', 'eat', 'sleep'],
  Sam: ['run', 'jump', 'sleep', 'swim', 'eat', 'dig'], Pam: ['run', 'jump', 'sleep', 'swim', 'eat', 'dig'], Mom: ['run', 'jump', 'sleep', 'swim', 'eat'], Dad: ['run', 'jump', 'sleep', 'swim', 'eat', 'dig'],
};
/** Where each prop can show something: a bed has a top and room under it; a pond only has an inside and a bank. */
export const PROP_RELS: Record<Prop, readonly Rel[]> = {
  bed: ['on', 'under', 'by'], box: ['in', 'on', 'by'], log: ['on', 'under', 'by'], rug: ['on', 'under', 'by'], tree: ['in', 'under', 'by'],
  pond: ['in', 'by'], mud: ['in', 'by'], nest: ['in', 'by'], car: ['in', 'on', 'by'],
};

/** The words in a sentence that say each thing, so a lesson can light the ones that decide it. */
export const WORDS_FOR: Record<string, readonly string[]> = {
  ...Object.fromEntries([...ANIMALS, ...PEOPLE, ...THINGS].map(w => [`who:${w}`, [w, `${w}s`]])),
  'n:2': ['two'], 'n:3': ['three'], 'size:big': ['big'], 'size:little': ['little'],
  ...Object.fromEntries(COLORS.map(c => [`color:${c}`, [c]])), ...Object.fromEntries(COLORS.map(c => [`hasColor:${c}`, [c]])),
  'act:run': ['run', 'runs', 'ran'], 'act:jump': ['jump', 'jumps', 'jumped', 'hop', 'hops'], 'act:sleep': ['nap', 'naps'],
  'act:swim': ['swim', 'swims'], 'act:eat': ['eat', 'eats', 'ate'], 'act:fly': ['fly', 'flies'], 'act:dig': ['dig', 'digs'],
  'rel:on': ['on'], 'rel:under': ['under'], 'rel:in': ['in'], 'rel:by': ['by'],
  ...Object.fromEntries(PROPS.map(p => [`at:${p}`, [p]])), ...Object.fromEntries(THINGS.map(t => [`has:${t}`, [t, `${t}s`]])),
};
const keyOf = (a: Attr, v: unknown) => `${a}:${String(v)}`;

/** Which word of the sentence says this. -1 if none (the tests make sure there always is one). */
export function wordFor(words: readonly string[], a: Attr, v: unknown): number {
  const said = WORDS_FOR[keyOf(a, v)] ?? [];
  return words.findIndex(w => said.includes(w.toLowerCase()) || said.includes(w));
}

const defaults = (s: Scene) => ({ n: s.n ?? 1, size: s.size ?? null, color: s.color ?? null, act: s.act ?? null, rel: s.rel ?? null, at: s.at ?? null, has: s.has ?? null, hasColor: s.hasColor ?? null });
/** Is everything the sentence says true of the picture? */
export function matches(m: Meaning, s: Scene): boolean {
  if (m.who !== s.who) return false;
  const a = defaults(m), b = defaults(s);
  if (a.n !== b.n) return false; // a picture of two dogs isn't "a dog", and one dog isn't "two dogs"
  for (const k of ['size', 'color', 'act', 'rel', 'at', 'has', 'hasColor'] as const) if (a[k] !== null && a[k] !== b[k]) return false;
  return true;
}
export const sameScene = (a: Scene, b: Scene) => JSON.stringify(defaults(a)) + a.who === JSON.stringify(defaults(b)) + b.who;

/** Things this picture could change into, each differing in one thing the sentence says, and which thing that is. */
export function oneWordChanges(m: Meaning): { scene: Scene; attr: Attr }[] {
  const out: { scene: Scene; attr: Attr }[] = [];
  const add = (attr: Attr, scene: Scene) => { if (!matches(m, scene)) out.push({ scene, attr }); };
  const g = groupOf(m.who);
  // another animal, person or thing, that can do and be the same
  for (const w of [...ANIMALS, ...PEOPLE, ...THINGS]) {
    if (w === m.who || groupOf(w) !== g) continue;
    if (m.act && !(CAN_DO[w as Animal] ?? []).includes(m.act)) continue;
    if (m.color && !COLOURED.includes(w as Thing)) continue;
    if (m.rel && m.at && !fitsAt(w, m.rel, m.at)) continue;
    add('who', { ...m, who: w });
  }
  if (m.n) for (const n of [1, 2, 3] as const) if (n !== m.n) add('n', { ...m, n: n === 1 ? undefined : n });
  if (m.size) add('size', { ...m, size: m.size === 'big' ? 'little' : 'big' });
  if (m.color) for (const c of COLORS) if (c !== m.color) add('color', { ...m, color: c });
  if (m.hasColor) for (const c of COLORS) if (c !== m.hasColor) add('hasColor', { ...m, hasColor: c });
  if (m.act) for (const a of CAN_DO[m.who as Animal] ?? []) if (a !== m.act && (!m.rel || a !== 'swim' || m.at === 'pond')) add('act', { ...m, act: a });
  if (m.rel && m.at) {
    for (const r of PROP_RELS[m.at]) if (r !== m.rel && fitsAt(m.who, r, m.at)) add('rel', { ...m, rel: r });
    for (const p of PROPS) if (p !== m.at && PROP_RELS[p].includes(m.rel) && fitsAt(m.who, m.rel, p)) add('at', { ...m, at: p });
  }
  if (m.has) for (const t of THINGS) if (t !== m.has && (!m.hasColor || COLOURED.includes(t))) add('has', { ...m, has: t });
  return out;
}

/** Can this one be shown there: a pig fits in the mud but not in a nest, and only a bird or a hen sits in a nest. */
export function fitsAt(w: Who, r: Rel, p: Prop): boolean {
  if (p === 'nest') return r === 'by' || w === 'bird' || w === 'hen';
  if (p === 'tree' && r === 'in') return w === 'bird' || w === 'bug' || w === 'cat';
  if (p === 'pond' && r === 'in') return w === 'duck' || w === 'fish' || w === 'frog' || w === 'dog' || groupOf(w) === 'person';
  if (p === 'log' && r === 'under') return w === 'bug' || w === 'frog';
  if (p === 'rug' && r === 'under') return w === 'bug';
  if (p === 'box' && r === 'in') return groupOf(w) !== 'person' && w !== 'pig' && w !== 'bus' && w !== 'car';
  if (p === 'car') return r === 'by' || groupOf(w) === 'person' || w === 'dog' || w === 'cat' || (r === 'on' && w === 'bird');
  return groupOf(w) !== 'thing' || w === 'ball' || w === 'hat' || w === 'cup' || w === 'box';
}

/**
 * What Happened's wrong pictures. Level 1: another animal or person (one wrong picture). Level 2: two wrong pictures, at least one
 * of them another animal or person. Level 3: pictures that differ from it by one word, preferring a change of place, size, number,
 * colour or doing over a change of who.
 */
export function wrongPictures(m: Meaning, level: 1 | 2 | 3, rng: Rng): { scene: Scene; attr: Attr }[] {
  const all = oneWordChanges(m), whos = all.filter(c => c.attr === 'who'), rest = all.filter(c => c.attr !== 'who');
  const take = (from: { scene: Scene; attr: Attr }[], n: number, avoid: Scene[] = []) => {
    const pool = from.filter(c => !avoid.some(a => sameScene(a, c.scene))), out: typeof from = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
    return out;
  };
  if (level === 1) return take(whos.length ? whos : rest, 1);
  if (level === 2) {
    const first = take(whos.length ? whos : rest, 1);
    return [...first, ...take(rest.length ? rest : whos, 1, first.map(f => f.scene))];
  }
  // one word: prefer the same thing changed twice (on / under / in), so the deciding word is plain
  const byAttr = new Map<Attr, typeof rest>();
  for (const c of rest) byAttr.set(c.attr, [...(byAttr.get(c.attr) ?? []), c]);
  const attrs = [...byAttr.keys()];
  if (!attrs.length) return take(whos, 2);
  const main = pick(rng, attrs), first = take(byAttr.get(main)!, 1);
  const second = take(byAttr.get(main)!.length > 1 ? byAttr.get(main)! : rest.length > 1 ? rest : whos, 1, first.map(f => f.scene));
  return [...first, ...(second.length ? second : take(whos, 1))];
}
