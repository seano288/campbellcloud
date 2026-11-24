// What Globe Hopper asks: six kinds, three Levels each. Every question has exactly one right answer, given either by a button or by a
// tap on the Earth (the flat map or the globe), on a landform card or on a pin. A tap on the Earth is judged by where it lands (map/geo.ts):
// on the continent, ocean or mark asked about, on another lit one (a miss), or somewhere nobody could argue about (ignored: it neither
// counts nor misses). problems.test.ts makes thousands and checks each one.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { arc, continentAt, landAt, oceanAt, surfaceAt, type LonLat, type MapView } from '../map/geo';
import { CONTINENT_IDS, CONTINENTS, NEIGHBOURS, type ContinentId, type Way } from '../world/continents';
import { BETWEEN, OCEAN_IDS, type OceanId } from '../world/oceans';
import { COLD, HOT, landform, LANDFORM_IDS, LANDFORMS, LOOK_ALIKE, MILD, type LandformId, type Spot } from '../world/land';
import { FAMOUS, PLACES } from '../world/places';

export const KINDS = ['globe', 'continent', 'ocean', 'land', 'climate', 'place'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

/** Where the Earth is drawn: the globe facing a point, or the flat map. */
export type Surface = { readonly s: 'globe'; readonly lon: number; readonly lat: number } | { readonly s: 'map'; readonly view?: MapView };
/** A mark on the Earth he can tap: a pin, a ring, a snowflake or a sun. */
export interface Pin { readonly id: string; readonly at: LonLat; readonly look: 'pin' | 'ring' | 'snow' | 'sun'; readonly label?: string }
/** How a tap on the Earth is judged. */
export type TapRule =
  | { readonly by: 'surface' }
  | { readonly by: 'continent'; readonly among: readonly ContinentId[] }
  | { readonly by: 'ocean'; readonly among: readonly OceanId[] }
  | { readonly by: 'poles' }
  | { readonly by: 'pins' };

export type Stage =
  | { readonly type: 'earth'; readonly surface: Surface; readonly lit?: readonly ContinentId[]; readonly pins?: readonly Pin[]; readonly belt?: boolean; readonly tap?: TapRule }
  | { readonly type: 'shape'; readonly continent: ContinentId }
  | { readonly type: 'cards'; readonly cards: readonly LandformId[]; readonly style: 'side' | 'above' }
  | { readonly type: 'scene'; readonly scene: 'snow' | 'steam'; readonly surface: Surface; readonly pins: readonly Pin[] };

/** What the question says, as pieces chained from clips (phrases.ts). */
export type Said = readonly string[];
export interface Question {
  readonly kind: Kind;
  readonly level: Level;
  /** What is said, and what is written. */
  readonly ask: Said;
  readonly text: string;
  readonly stage: Stage;
  /** Answer buttons (ids), when it isn't a tap on the stage; their names are said as they light. */
  readonly choices?: readonly string[];
  readonly answer: string;
  /** The continents he must have met first. */
  readonly needs: readonly ContinentId[];
  /** What the lesson is about: a continent, an ocean, a landform, a place, the poles. */
  readonly about: string;
}

export const nameOf = (id: string): string =>
  CONTINENTS.find(c => c.id === id)?.name ?? OCEAN_NAMES[id as OceanId] ?? LANDFORMS.find(l => l.id === id)?.name ?? PLACES.find(p => p.id === id)?.name ?? CHOICE_WORDS[id] ?? id;
const OCEAN_NAMES: Record<OceanId, string> = { pacific: 'Pacific Ocean', atlantic: 'Atlantic Ocean', indian: 'Indian Ocean', arctic: 'Arctic Ocean', southern: 'Southern Ocean' };
export const CHOICE_WORDS: Record<string, string> = { land: 'Land', water: 'Water', north: 'North', south: 'South' };
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

// ---------- judging a tap on the Earth ----------

/** How close (degrees round the globe) a tap must be to a pin to count as tapping it. Pins are always at least PIN_APART from each other. */
export const PIN_R = 9, PIN_APART = 24;

/** The answer a tap at `at` gives, or null when it doesn't count either way. */
export function judgeTap(stage: Stage, at: LonLat | null): string | null {
  if (!at) return null;
  if (stage.type === 'scene' || (stage.type === 'earth' && stage.pins?.length && (!stage.tap || stage.tap.by === 'pins'))) {
    const pins = stage.pins ?? [];
    const near = pins.map(p => ({ p, d: arc(p.at, at) })).filter(x => x.d <= PIN_R).sort((a, b) => a.d - b.d)[0];
    return near?.p.id ?? null;
  }
  if (stage.type !== 'earth' || !stage.tap) return null;
  const t = stage.tap;
  if (t.by === 'surface') return surfaceAt(at.lon, at.lat);
  if (t.by === 'continent') { const c = continentAt(at.lon, at.lat); return c && t.among.includes(c) ? c : null; }
  if (t.by === 'ocean') { const o = oceanAt(at.lon, at.lat); return o && t.among.includes(o) ? o : null; }
  if (t.by === 'poles') return at.lat >= 62 ? 'npole' : at.lat <= -62 ? 'spole' : Math.abs(at.lat) <= 9 ? 'equator' : null;
  return null;
}

// ---------- making questions ----------

const otherContinents = (not: readonly ContinentId[]) => CONTINENT_IDS.filter(c => !not.includes(c));
/** Somewhere to look at the globe from: near a point, turned a little either way so it isn't always dead centre. */
const faceNear = (r: Rng, at: LonLat, wobble = 14): Surface => ({ s: 'globe', lon: at.lon + (r() - .5) * 2 * wobble, lat: Math.max(-60, Math.min(60, at.lat + (r() - .5) * wobble)) });
const tapVerb = (name: string): Said => ['Tap', name];

function globeQ(level: Level, r: Rng): Question {
  if (level === 1) {
    if (r() < .25) return { kind: 'globe', level, ask: ['Is there more land or more water on the Earth?'], text: 'More land or more water?', stage: { type: 'earth', surface: { s: 'globe', lon: int(r, -180, 179), lat: 10 } }, choices: ['land', 'water'], answer: 'water', needs: [], about: 'water' };
    const want = r() < .5 ? 'land' : 'water';
    return { kind: 'globe', level, ask: [want === 'land' ? 'Tap the land.' : 'Tap the water.'], text: want === 'land' ? 'Tap the land' : 'Tap the water', stage: { type: 'earth', surface: { s: 'globe', lon: int(r, -180, 179), lat: int(r, -20, 30) }, tap: { by: 'surface' } }, answer: want, needs: [], about: want };
  }
  if (level === 2) {
    const want = pick(r, ['npole', 'spole', 'equator'] as const);
    const said = { npole: 'Tap the North Pole.', spole: 'Tap the South Pole.', equator: 'Tap the equator.' } as const, shown = { npole: 'Tap the North Pole', spole: 'Tap the South Pole', equator: 'Tap the equator' } as const;
    return { kind: 'globe', level, ask: [said[want]], text: shown[want], stage: { type: 'earth', surface: { s: 'globe', lon: int(r, -180, 179), lat: 0 }, tap: { by: 'poles' } }, answer: want, needs: [], about: want };
  }
  // north or south of the equator: a place well away from it, ringed, with the equator drawn
  const pool = PLACES.filter(p => Math.abs(p.lat) >= 20 && Math.abs(p.lat) <= 70), place = pick(r, pool);
  const onMap = r() < .5;
  return {
    kind: 'globe', level, ask: ['Is this place north or south of the equator?'], text: 'North or south of the equator?',
    stage: { type: 'earth', surface: onMap ? { s: 'map' } : faceNear(r, { lon: place.lon, lat: place.lat * .4 }, 10), belt: true, pins: [{ id: 'place', at: place, look: 'ring' }] },
    choices: ['north', 'south'], answer: place.lat > 0 ? 'north' : 'south', needs: [], about: place.lat > 0 ? 'north' : 'south',
  };
}

function continentQ(level: Level, r: Rng): Question {
  const target = pick(r, CONTINENT_IDS), name = CONTINENTS.find(c => c.id === target)!.name;
  if (level === 1) {
    const lit = shuffle(r, [target, ...shuffle(r, otherContinents([target])).slice(0, 2)]);
    return { kind: 'continent', level, ask: tapVerb(name), text: `Tap ${name}`, stage: { type: 'earth', surface: { s: 'map' }, lit, tap: { by: 'continent', among: lit } }, answer: target, needs: [target], about: target };
  }
  if (level === 2) {
    const c = CONTINENTS.find(x => x.id === target)!, globe = r() < .45;
    return { kind: 'continent', level, ask: tapVerb(name), text: `Tap ${name}`, stage: { type: 'earth', surface: globe ? faceNear(r, c.face, 18) : { s: 'map' }, tap: { by: 'continent', among: CONTINENT_IDS } }, answer: target, needs: [target], about: target };
  }
  if (r() < .55) {
    const choices = shuffle(r, [target, ...shuffle(r, otherContinents([target])).slice(0, 2)]);
    return { kind: 'continent', level, ask: ['Which continent is this?'], text: 'Which continent is this?', stage: { type: 'shape', continent: target }, choices, answer: target, needs: [target], about: target };
  }
  const n = pick(r, NEIGHBOURS), from = CONTINENTS.find(c => c.id === n.from)!.name;
  const choices = shuffle(r, [n.answer, ...shuffle(r, n.wrong).slice(0, 2)]);
  return {
    kind: 'continent', level, ask: [`Which continent is ${n.way} of`, from], text: `Which continent is ${n.way} of ${from}?`,
    stage: { type: 'earth', surface: { s: 'map' }, lit: [n.from] }, choices, answer: n.answer, needs: [n.from, n.answer], about: n.answer,
  };
}
export const WAY_ASKS = (['north', 'south', 'east', 'west'] as const satisfies readonly Way[]).map(w => `Which continent is ${w} of` as const);

function oceanQ(level: Level, r: Rng): Question {
  if (level === 3) {
    const b = pick(r, BETWEEN), choices = shuffle(r, [b.answer, ...shuffle(r, b.wrong).slice(0, 2)]);
    const A = CONTINENTS.find(c => c.id === b.a)!.name;
    if (b.b === 'pole') return { kind: 'ocean', level, ask: ['Which ocean goes all the way round Antarctica?'], text: 'Which ocean goes all the way round Antarctica?', stage: { type: 'earth', surface: { s: 'globe', lon: 20, lat: -55 }, lit: ['antarctica'] }, choices, answer: b.answer, needs: ['antarctica'], about: b.answer };
    const B = CONTINENTS.find(c => c.id === b.b)!.name;
    return { kind: 'ocean', level, ask: ['Which ocean is between', A, 'and', B], text: `Which ocean is between ${A} and ${B}?`, stage: { type: 'earth', surface: { s: 'map' }, lit: [b.a, b.b as ContinentId] }, choices, answer: b.answer, needs: [b.a, b.b as ContinentId], about: b.answer };
  }
  const among = level === 1 ? (['pacific', 'atlantic'] as OceanId[]) : [...OCEAN_IDS];
  const target = pick(r, among), name = OCEAN_NAMES[target];
  const polar = target === 'arctic' || target === 'southern';
  const surface: Surface = polar ? { s: 'globe', lon: int(r, -60, 60), lat: target === 'arctic' ? 62 : -62 } : r() < .3 ? faceNear(r, { lon: target === 'pacific' ? -150 : target === 'atlantic' ? -30 : 75, lat: 0 }, 12) : { s: 'map' };
  return { kind: 'ocean', level, ask: tapVerb(`the ${name}`), text: `Tap the ${name}`, stage: { type: 'earth', surface, tap: { by: 'ocean', among } }, answer: target, needs: [], about: target };
}

/** Landform choices that may sit together: none of the pairs that look alike from the side, and (Level 3) none that clash in meaning. */
export function landChoices(target: LandformId, level: Level, r: Rng): LandformId[] {
  const fine = (a: LandformId, b: LandformId) => !LOOK_ALIKE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
    && (level < 3 || (!landform(target).clash.includes(a === target ? b : a) && !landform(a === target ? b : a).clash.includes(target)));
  const pool = LANDFORM_IDS.filter(l => l !== target && (level !== 2 || LANDFORMS.find(x => x.id === l)!.symbol));
  const picked: LandformId[] = [target];
  for (const l of shuffle(r, pool)) { if (picked.length === 3) break; if (picked.every(p => fine(p, l))) picked.push(l); }
  return shuffle(r, picked);
}
function landQ(level: Level, r: Rng): Question {
  const pool = level === 2 ? LANDFORM_IDS.filter(l => LANDFORMS.find(x => x.id === l)!.symbol) : [...LANDFORM_IDS];
  const target = pick(r, pool), lf = LANDFORMS.find(l => l.id === target)!, cards = landChoices(target, level, r);
  if (level === 3) return { kind: 'land', level, ask: [lf.ask], text: lf.ask, stage: { type: 'cards', cards, style: 'side' }, answer: target, needs: [], about: target };
  return {
    kind: 'land', level, ask: level === 1 ? ['Tap the', lf.name] : ['Find the map sign for', signOf(target)], text: level === 1 ? `Tap the ${lf.name}` : `Find the map sign for ${signOf(target)}`,
    stage: { type: 'cards', cards, style: level === 1 ? 'side' : 'above' }, answer: target, needs: [], about: target,
  };
}
/** "Find the map sign for" each landform with a sign, with its a or an. */
export const LAND_SIGNS = ['a mountain', 'a hill', 'a river', 'a lake', 'an island', 'a desert', 'a plain', 'a volcano', 'a coast'] as const;
const signOf = (id: LandformId) => LAND_SIGNS.find(x => x.endsWith(` ${id}`))!;

/** Two spots far enough apart to tap. */
function twoSpots(r: Rng, a: readonly Spot[], b: readonly Spot[]): [Spot, Spot] {
  for (;;) { const x = pick(r, a), y = pick(r, b); if (arc(x, y) >= PIN_APART * 1.5) return [x, y]; }
}
function climateQ(level: Level, r: Rng): Question {
  if (level === 1) {
    const [hot, cold] = twoSpots(r, HOT, COLD), want = r() < .5 ? 'cold' : 'hot';
    return {
      kind: 'climate', level, ask: [want === 'cold' ? 'Tap the cold place.' : 'Tap the hot place.'], text: want === 'cold' ? 'Tap the cold place' : 'Tap the hot place',
      stage: { type: 'earth', surface: { s: 'map' }, belt: true, pins: shuffle(r, [{ id: 'hot', at: hot, look: 'pin', label: '?' }, { id: 'cold', at: cold, look: 'pin', label: '?' }] as Pin[]) },
      answer: want, needs: [], about: 'sun',
    };
  }
  if (level === 2) {
    const [hot, cold] = twoSpots(r, HOT, COLD), scene = r() < .5 ? 'snow' : 'steam';
    return {
      kind: 'climate', level, ask: [scene === 'snow' ? 'It is snowy and icy here.' : 'It is hot and steamy here.', 'Where on the Earth could it be? Tap it.'], text: 'Where could it be?',
      stage: { type: 'scene', scene, surface: { s: 'map' }, pins: shuffle(r, [{ id: 'hot', at: hot, look: 'pin', label: '?' }, { id: 'cold', at: cold, look: 'pin', label: '?' }] as Pin[]) },
      answer: scene === 'snow' ? 'cold' : 'hot', needs: [], about: 'sun',
    };
  }
  const pair = pick(r, ['hot-cold', 'mild-cold', 'hot-mild'] as const);
  const [warm, cool] = pair === 'hot-cold' ? twoSpots(r, HOT, COLD) : pair === 'mild-cold' ? twoSpots(r, MILD, COLD) : twoSpots(r, HOT, MILD);
  const colder = r() < .5, first = r() < .5;
  const pins: Pin[] = [{ id: 'warm', at: warm, look: 'pin', label: first ? '1' : '2' }, { id: 'cool', at: cool, look: 'pin', label: first ? '2' : '1' }];
  return {
    kind: 'climate', level, ask: [colder ? 'Which place is colder? Tap it.' : 'Which place is warmer? Tap it.'], text: colder ? 'Which is colder?' : 'Which is warmer?',
    stage: { type: 'earth', surface: { s: 'map' }, belt: true, pins }, answer: colder ? 'cool' : 'warm', needs: [], about: 'sun',
  };
}

function placeQ(level: Level, r: Rng): Question {
  const place = pick(r, FAMOUS), home = (place.where as { c: ContinentId }).c;
  if (level < 3) {
    const lit = level === 1 ? shuffle(r, [home, pick(r, otherContinents([home]))]) : [...CONTINENT_IDS];
    return { kind: 'place', level, ask: [place.ask], text: place.ask, stage: { type: 'earth', surface: { s: 'map' }, lit, tap: { by: 'continent', among: lit } }, answer: home, needs: [home], about: place.id };
  }
  // three pins on three continents, far apart: tap the place itself
  const others: typeof FAMOUS[number][] = [];
  for (const o of shuffle(r, FAMOUS)) {
    if (others.length === 2) break;
    const oc = (o.where as { c: ContinentId }).c;
    if (oc !== home && !others.some(x => (x.where as { c: ContinentId }).c === oc) && [place, ...others].every(x => arc(x, o) >= PIN_APART)) others.push(o);
  }
  const pins = shuffle(r, [place, ...others].map(p => ({ id: p.id, at: { lon: p.lon, lat: p.lat }, look: 'pin', label: p.emoji }) as Pin));
  return { kind: 'place', level, ask: [place.ask, 'Tap its pin.'], text: place.ask, stage: { type: 'earth', surface: { s: 'map' }, pins }, answer: place.id, needs: [home], about: place.id };
}

export function makeQuestion(kind: Kind, level: Level, r: Rng): Question {
  switch (kind) {
    case 'globe': return globeQ(level, r);
    case 'continent': return continentQ(level, r);
    case 'ocean': return oceanQ(level, r);
    case 'land': return landQ(level, r);
    case 'climate': return climateQ(level, r);
    case 'place': return placeQ(level, r);
  }
}

/** The answers a question can be given: its buttons, or its cards, or every answer a tap on its stage can give. */
export function possibleAnswers(q: Question): string[] {
  if (q.choices) return [...q.choices];
  const st = q.stage;
  if (st.type === 'cards') return [...st.cards];
  if (st.type === 'scene') return st.pins.map(p => p.id);
  if (st.type !== 'earth') return [];
  if (st.pins?.length && !st.tap) return st.pins.map(p => p.id);
  const t = st.tap!;
  if (t.by === 'continent' || t.by === 'ocean') return [...t.among];
  return t.by === 'surface' ? ['land', 'water'] : t.by === 'poles' ? ['npole', 'spole', 'equator'] : [];
}
export const isRightAnswer = (q: Question, a: string): boolean | null => (possibleAnswers(q).includes(a) ? a === q.answer : null);
export { cap, landAt };
