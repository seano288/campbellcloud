// The "one right order" checker. Build the Train asks him to put a sentence's word cars in order, so a sentence may only be asked if
// no other order of the same cars is a sentence a child could fairly call right. This file is a small grammar for the kinds of
// sentence the game uses (statements, commands and questions of up to seven words), with just enough meaning to throw out orders
// that are grammatical but silly ("The box is in the dog."). orders() tries every order with the engine first (it carries the
// capital, an honest clue) and the caboose last (it carries the mark), and returns the ones that make sense.
//
// What it does not know about is kept out of Build the Train instead (sentences.test.ts): floating words like "now", "too" and
// "then", which can sit in more than one place; "and" between two things that could swap; and commas.
import { entriesOf, VERBS, type Cls, type Entry, type NounInfo, type VerbInfo } from './words';

export type Mark = '.' | '?' | '!';

/** A noun phrase, as much as the meaning check needs. `cls: 'any'`: a pronoun that could be anything ("it", "them"). */
interface NP {
  cls: Cls | 'any';
  size: number;
  num: 'sg' | 'pl' | 'any';
  p: 1 | 2 | 3;
  kase: 'subj' | 'obj' | 'both';
  info?: NounInfo;
}
type Out<T> = [T, number][];

const ALIVE = (c: Cls | 'any') => c === 'any' || c === 'person' || c === 'animal';
const PHYSICAL = (c: Cls | 'any') => c !== 'event';
const ANY: NP = { cls: 'any', size: 0, num: 'any', p: 3, kase: 'both' };

/** Can `x` be `p` `y`: "the cat" "in" "the box". Pronouns that could be anything always can. */
export function locate(x: NP, p: string, y: NP): boolean {
  if (y.cls === 'any' || x.cls === 'any') return true;
  const yi = y.info, small = x.size || 1;
  if (!PHYSICAL(y.cls) || !PHYSICAL(x.cls)) return false;
  switch (p) {
    case 'in': case 'into': return !!yi?.holds && y.size >= small;
    case 'on': return (!!yi?.top && y.size >= small) || (ALIVE(y.cls) && small < y.size);
    case 'under': return !!yi?.over && y.size > small;
    case 'by': return y.size + 1 >= small && y.cls !== 'sky';
    case 'to': return y.cls === 'person' || y.cls === 'animal' || y.cls === 'place' || y.cls === 'vehicle';
    case 'at': return y.cls !== 'sky' || yi?.head === 'sun';
    case 'up': case 'down': return yi?.head === 'hill' || yi?.head === 'tree';
    case 'with': return true;
    case 'for': return true;
    case 'over': return y.size >= small && y.cls !== 'sky';
    default: return false;
  }
}

/** Does this adjective fit: "a hot cake" yes, "a hot dog" (the animal) no, "a red fun" no. */
function fits(kind: Extract<Entry, { c: 'A' }>['kind'], np: NP): boolean {
  const c = np.cls;
  if (c === 'any') return true;
  switch (kind) {
    case 'size': return PHYSICAL(c) && c !== 'sky';
    case 'color': return PHYSICAL(c) && c !== 'place';
    case 'feel': return c !== 'sky' && c !== 'place';
    case 'temp': return c === 'food' || c === 'sky' || c === 'place' || c === 'thing' || c === 'vehicle';
    case 'wet': return PHYSICAL(c) && c !== 'sky';
    case 'new': return c === 'thing' || c === 'vehicle' || c === 'food' || c === 'person' || c === 'animal';
  }
}

const ORDER_OF = { size: 0, feel: 1, temp: 1, wet: 1, new: 1, color: 2 } as const;

/** A small parser over the words' possible entries. Every function returns each way it can read words from `i`. */
function parser(words: readonly string[]) {
  const E = words.map(entriesOf);
  const at = <C extends Entry['c']>(i: number, c: C): Extract<Entry, { c: C }>[] => (E[i] ?? []).filter((e): e is Extract<Entry, { c: C }> => e.c === c);
  const word = (i: number) => words[i]?.toLowerCase();

  /** A noun phrase: "I", "me", "Sam", "the big red ball", "two dogs", "cats", "this". */
  function np(i: number): Out<NP> {
    const out: Out<NP> = [];
    for (const e of at(i, 'PRS')) out.push([{ cls: e.cls, size: 0, num: e.num, p: e.p, kase: e.cls === 'any' || word(i) === 'you' ? 'both' : 'subj' }, i + 1]);
    for (const e of at(i, 'PRO')) if (!at(i, 'PRS').length) out.push([{ cls: e.cls, size: 0, num: 'any', p: 3, kase: 'obj' }, i + 1]);
    if (at(i, 'THIS').length) out.push([{ ...ANY, num: 'sg' }, i + 1]);
    // determiner, number, adjectives, noun
    let j = i;
    const det = at(j, 'D')[0];
    if (det) j++;
    const num = at(j, 'NUM')[0];
    if (num) j++;
    const adjs: Extract<Entry, { c: 'A' }>['kind'][] = [];
    while (adjs.length < 2 && at(j, 'A').length) { adjs.push(at(j, 'A')[0]!.kind); j++; }
    for (const e of at(j, 'N')) {
      const n = e.n, isName = /^[A-Z]/.test(n.head) && n.head !== 'I';
      if (isName && (det || num || adjs.length)) continue;
      const number = num ? num.num : n.num;
      if (num && n.num !== 'any' && n.num !== num.num) continue;
      if (det?.num && n.num !== 'any' && det.num !== n.num) continue;
      // a single thing needs "the", "a" or "my" in front ("dog can run" isn't a sentence); a name, a plural or "fun" doesn't
      if (!isName && !det && !num && n.num === 'sg' && n.cls !== 'event' && !n.mass) continue;
      if (n.cls === 'event' && (num || adjs.length || det?.num === 'sg' && n.head === 'fun')) continue;
      if (adjs.length === 2 && (adjs[0] === adjs[1] || ORDER_OF[adjs[0]!] > ORDER_OF[adjs[1]!])) continue;
      const it: NP = { cls: n.cls, size: n.size, num: number, p: 3, kase: 'both', info: n };
      if (!adjs.every(k => fits(k, it))) continue;
      out.push([it, j + 1]);
    }
    return out;
  }
  const npSubj = (i: number) => np(i).filter(([n]) => n.kase !== 'obj');
  const npObj = (i: number) => np(i).filter(([n]) => n.kase !== 'subj');

  const pp = (i: number): Out<{ p: string; np: NP }> => at(i, 'P').flatMap(e => npObj(i + 1).map(([n, k]) => [{ p: e.w, np: n }, k] as [{ p: string; np: NP }, number]));

  const canDo = (v: VerbInfo, s: NP) => (s.cls === 'any' || v.subj.includes(s.cls as Cls))
    && (!v.needs || s.cls === 'any' || (v.needs === 'flies' ? !!s.info?.flies : !!s.info?.swims || s.cls === 'person'));

  /** The rest of a verb phrase after the verb: an object, "to" and another verb, a little word, a place, "here". */
  function rest(lemma: string, subj: NP, i: number, gap: 'none' | 'obj' | 'where'): Out<true> {
    const v = VERBS[lemma]!, out: Out<true> = [];
    const tails = (k: number, obj: NP | null, gapUsed: boolean) => {
      // a little word, then a place, then "here"/"there"
      const ends: [number, boolean][] = [[k, gapUsed]];
      for (const p of at(k, 'PRT')) if (v.prts?.includes(p.w)) ends.push([k + 1, gapUsed]);
      const withPlace: [number, boolean][] = [];
      for (const [k2, g] of ends) {
        withPlace.push([k2, g]);
        for (const [{ p, np: y }, k3] of pp(k2)) {
          if (!v.preps?.includes(p)) continue;
          const who = p === 'with' || p === 'to' || p === 'at' || p === 'for' ? subj : obj ?? subj;
          if (locate(who, p, y) || (obj && locate(subj, p, y))) withPlace.push([k3, g]);
        }
        if (gap === 'where' && !g && v.preps?.some(p => ['to', 'in', 'on', 'under', 'into', 'by', 'at'].includes(p))) withPlace.push([k2, true]);
      }
      for (const [k4, g] of withPlace) {
        if (gap !== 'none' && !g) continue;
        out.push([true, k4]);
        for (const a of at(k4, 'ADV')) if (a.w === 'here' || a.w === 'there') { if (lemma === 'come' || lemma === 'go' || lemma === 'run' || lemma === 'sit' || lemma === 'look' || lemma === 'walk' || lemma === 'hop' || lemma === 'jump' || lemma === 'play') out.push([true, k4 + 1]); }
      }
    };
    if (v.obj !== 'yes') tails(i, null, false);
    if (v.obj !== 'no') {
      if (gap === 'obj') tails(i, ANY, true);
      for (const [o, k] of npObj(i)) if (o.cls === 'any' || v.objs?.includes(o.cls as Cls)) tails(k, o, false);
    }
    if (v.toV && at(i, 'TO').length) for (const e of at(i + 1, 'V')) if (e.form === 'base' && canDo(VERBS[e.lemma]!, subj)) out.push(...rest(e.lemma, subj, i + 2, gap));
    return out;
  }

  /** A verb (in the form given) and the rest of its phrase. */
  function vp(i: number, subj: NP, form: (f: 'base' | 's' | 'past') => boolean, gap: 'none' | 'obj' | 'where' = 'none'): Out<true> {
    return at(i, 'V').filter(e => form(e.form) && canDo(VERBS[e.lemma]!, subj)).flatMap(e => rest(e.lemma, subj, i + 1, gap));
  }

  /** What follows "is": "big", "on the bed", "here", "up", "a dog" (only after "it" or "this"). */
  function pred(i: number, subj: NP): Out<true> {
    const out: Out<true> = [];
    for (const a of at(i, 'A')) if (fits(a.kind, subj)) out.push([true, i + 1]);
    for (const [{ p, np: y }, k] of pp(i)) if (p !== 'to' && p !== 'for' && p !== 'up' && p !== 'down' && locate(subj, p, y)) out.push([true, k]);
    for (const a of at(i, 'ADV')) if (a.w === 'here' || a.w === 'there') out.push([true, i + 1]);
    for (const a of at(i, 'PRT')) if ((a.w === 'up' || a.w === 'out') && subj.cls !== 'place') out.push([true, i + 1]);
    if (subj.cls === 'any' && subj.num === 'sg') for (const [, k] of np(i).filter(([n]) => n.kase === 'both' && n.info && n.num !== 'pl')) out.push([true, k]);
    return out;
  }

  const agrees = (s: NP, f: 'base' | 's' | 'past') => f === 'past' || s.num === 'any' || (f === 's' ? s.num === 'sg' && s.p === 3 : !(s.num === 'sg' && s.p === 3));
  const copAgrees = (s: NP, c: Extract<Entry, { c: 'COP' }>) => s.num === 'any' || (c.num === 'pl' ? s.num === 'pl' || s.p === 2 : s.num === 'sg' && s.p !== 2 && (s.p === 3 || !!c.p1));
  const auxAgrees = (s: NP, a: Extract<Entry, { c: 'AUX' }>) => a.w !== 'do' || s.num === 'any' || !(s.num === 'sg' && s.p === 3);
  const not = (i: number) => (at(i, 'NOT').length ? [i, i + 1] : [i]);

  /** A finite verb phrase after a subject: "can run", "runs to Mom", "is on the bed", "is not big". */
  function vpFinite(i: number, s: NP): Out<true> {
    const out: Out<true> = [];
    for (const a of at(i, 'AUX')) if (auxAgrees(s, a)) for (const k of not(i + 1)) out.push(...vp(k, s, f => f === 'base'));
    out.push(...vp(i, s, f => agrees(s, f)));
    for (const c of at(i, 'COP')) if (copAgrees(s, c)) for (const k of not(i + 1)) out.push(...pred(k, s));
    return out;
  }

  /** Every way the whole sentence reads, with this end mark. */
  function sentence(mark: Mark): boolean {
    const n = words.length, whole = (outs: Out<true>) => outs.some(([, k]) => k === n);
    if (mark !== '?') {
      // a statement: "The dog can run."
      for (const [s, k] of npSubj(0)) if (whole(vpFinite(k, s))) return true;
      // a command: "Look at the dog!", "Stop the bus!"
      if (whole(vp(0, { cls: 'person', size: 4, num: 'pl', p: 2, kase: 'subj' }, f => f === 'base'))) return true;
      return false;
    }
    // "Can the dog run?", "Did you see it?"
    for (const a of at(0, 'AUX')) for (const [s, k] of npSubj(1)) if (auxAgrees(s, a) && whole(vp(k, s, f => f === 'base'))) return true;
    // "Is the cat on the bed?"
    for (const c of at(0, 'COP')) for (const [s, k] of npSubj(1)) if (copAgrees(s, c) && whole(pred(k, s))) return true;
    for (const w of at(0, 'WH')) {
      // "who" is someone alive, a person or an animal, of any size
      const who: NP = { ...ANY, num: 'sg' };
      // the question word is who it's about: "Who can run?", "Who ran?", "What is in the box?"
      if (w.w !== 'where') {
        if (at(1, 'AUX').length && whole(vp(2, who, f => f === 'base'))) return true;
        if (whole(vp(1, who, f => f !== 'base'))) return true;
        for (const c of at(1, 'COP')) if (c.num === 'sg' && whole(pred(2, who))) return true;
      }
      // the question word is what's done or where: "What can you see?", "Where did the dog go?", "Where is the cat?", "What is this?"
      for (const a of at(1, 'AUX')) for (const [s, k] of npSubj(2)) if (auxAgrees(s, a) && whole(vp(k, s, f => f === 'base', w.w === 'where' ? 'where' : 'obj'))) return true;
      for (const c of at(1, 'COP')) for (const [s, k] of npSubj(2)) {
        if (!copAgrees(s, c)) continue;
        if (k === n && (w.w === 'where' || s.cls === 'any' || w.w === 'who')) return true;
        // "What is the cat in?"
        if (w.w !== 'where' && k === n - 1 && at(k, 'P').some(p => locate(s, p.w, w.w === 'who' ? who : ANY))) return true;
      }
    }
    return false;
  }
  return { sentence };
}

/** Is this a sentence that makes sense? `words` without the end mark. */
export const makesSense = (words: readonly string[], mark: Mark) => parser(words).sentence(mark);

/** Every different order of these cars, the engine first. */
function* orderings(words: readonly string[]): Generator<string[]> {
  const [engine, ...rest] = words;
  const key = (w: string) => w.toLowerCase();
  const sorted = [...rest].sort((a, b) => key(a).localeCompare(key(b)));
  // the next permutation of a multiset, in order, so a repeated word ("the ... the") isn't tried twice
  const a = sorted.slice();
  for (;;) {
    yield [engine!, ...a];
    let i = a.length - 2;
    while (i >= 0 && key(a[i]!) >= key(a[i + 1]!)) i--;
    if (i < 0) return;
    let j = a.length - 1;
    while (key(a[j]!) <= key(a[i]!)) j--;
    [a[i], a[j]] = [a[j]!, a[i]!];
    a.splice(i + 1, a.length - i - 1, ...a.slice(i + 1).reverse());
  }
}

/** Every order of the sentence's cars that makes a sentence, with the engine first and the caboose last. */
export function orders(words: readonly string[], mark: Mark): string[] {
  const out: string[] = [];
  for (const o of orderings(words)) if (makesSense(o, mark)) out.push(o.join(' '));
  return out;
}
