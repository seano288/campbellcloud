// Teaching a miss on the Earth itself, never with a red X. A miss teaches the place, not just the answer.
//
// The first miss gets the brief's short lesson, and "Try again!":
// - Land and Water: the land lights up (or the water is named), the poles are marked or the equator is drawn as a belt round the middle.
// - Continents: the globe turns to the continent, it glows, its name is said and its line is spoken ("This is Africa. The equator goes
//   across the middle of Africa.").
// - Oceans: the ocean fills with colour, it is named and its line is said.
// - Shape of the Land: the landform is drawn from the side and from above, with one plain sentence ("An island is land with water all
//   round it.").
// - Hot and Cold: the sun's light is drawn landing straight on the equator and slanting at the poles.
// - Famous Places: the map turns to the place and its picture pops up with its line and its continent.
// The second miss (or the first when he's been missing a lot, or 🔎) gets the fuller lesson: the same place found from a place he
// already knows ("Start at Africa. Go north. This is Europe."), the continents an ocean touches named one by one, the landform he
// picked explained beside the right one. His own answer is left to fix.
import { signal, type Signal } from '@preact/signals';
import { sChime } from '../../audio/sfx';
import type { LonLat } from '../map/geo';
import type { Asking } from '../mix';
import type { Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { continent, type ContinentId, type Way } from '../world/continents';
import { landform, type LandformId } from '../world/land';
import { ocean, type OceanId } from '../world/oceans';
import { FAMOUS } from '../world/places';
import type { Question } from './problems';

export interface Lesson {
  /** Turn the globe (or a globe beside the map) to this place. */
  readonly face: Signal<LonLat | null>;
  readonly glow: Signal<ContinentId | null>;
  readonly ocean: Signal<OceanId | null>;
  /** All the land outlined (Land and Water). */
  readonly land: Signal<boolean>;
  readonly belt: Signal<boolean>;
  readonly poles: Signal<boolean>;
  /** The sun's light drawn on the map (Hot and Cold). */
  readonly rays: Signal<boolean>;
  /** A landform drawn from the side and from above. */
  readonly card: Signal<LandformId | null>;
  /** A famous place's picture and name popping up. */
  readonly popup: Signal<{ readonly emoji: string; readonly name: string } | null>;
  /** The answer to look at, as the view names its answers. */
  readonly hint: Signal<string | null>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null;
    lesson = {
      face: signal(null), glow: signal(null), ocean: signal(null), land: signal(false), belt: signal(false), poles: signal(false), rays: signal(false),
      card: signal(null), popup: signal(null), hint: signal(null),
      task: { cancel: () => current?.cancel(), start() { current?.cancel(); const v = createVoiceScope(lifetime); current = v; return v; } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}
function reset(l: Lesson) {
  l.face.value = null; l.glow.value = null; l.ocean.value = null; l.land.value = false; l.belt.value = false; l.poles.value = false; l.rays.value = false;
  l.card.value = null; l.popup.value = null; l.hint.value = null;
}

const GO: Record<Way, Phrase> = { north: 'Go north.', south: 'Go south.', east: 'Go east.', west: 'Go west.' };
const say = (x: string) => x as Phrase;

/** "Start at Africa. Go north." with Africa glowing, then the place he's looking for. */
async function route(v: VoiceScope, l: Lesson, from: { start: ContinentId; go: Way }) {
  const s = continent(from.start);
  l.glow.value = s.id; l.face.value = s.face;
  await v.say('Start at', say(s.name));
  await v.wait(300);
  await v.say(GO[from.go]);
}

async function continentLesson(q: Question, v: VoiceScope, l: Lesson, teach: boolean, id: ContinentId) {
  const c = continent(id);
  if (teach) await route(v, l, c.from);
  l.face.value = c.face; l.glow.value = id; sChime();
  await v.say('This is', say(c.name));
  if (v.active) await v.say(say(c.line));
  l.hint.value = q.answer;
}

async function oceanLesson(q: Question, v: VoiceScope, l: Lesson, teach: boolean, id: OceanId) {
  const o = ocean(id);
  if (teach) { await route(v, l, o.from); l.glow.value = null; }
  l.ocean.value = id; l.face.value = o.face; sChime();
  await v.say('This is the', say(o.name));
  if (teach) for (const t of o.touches) { if (!v.active) return; l.glow.value = t; await v.say(say(continent(t).name)); }
  l.glow.value = null;
  if (v.active) await v.say(say(o.line));
  l.hint.value = q.answer;
}

async function lessonOf(p: Asking, answer: string, teach: boolean, v: VoiceScope, l: Lesson) {
  const q = p.q;
  switch (q.kind) {
    case 'globe': {
      if (q.about === 'land' || q.about === 'water') {
        if (q.choices) { await v.say('Most of the Earth is covered in water.'); l.hint.value = 'water'; return; }
        l.land.value = true;
        await v.say('The land is in colours. The water is blue.');
        if (teach && v.active) await v.say(q.answer === 'land' ? 'Tap right in the middle of a coloured part.' : 'Tap right in the middle of the blue.');
        return;
      }
      l.poles.value = true; l.belt.value = true;
      if (q.about === 'npole' || teach) await v.say('The North Pole is at the very top of the Earth.');
      if ((q.about === 'spole' || teach) && v.active) await v.say('The South Pole is at the very bottom of the Earth.');
      if ((q.about === 'equator' || teach) && v.active) await v.say('The equator goes round the middle of the Earth.', 'It is halfway between the North Pole and the South Pole.');
      if (q.about === 'north' || q.about === 'south') {
        if (v.active) await v.say('Above the equator is north. Below the equator is south.');
        if (teach && v.active) await v.say(q.answer === 'north' ? 'This place is above the equator, so it is north.' : 'This place is below the equator, so it is south.');
        l.hint.value = q.answer;
      }
      return;
    }
    case 'continent': return continentLesson(q, v, l, teach, q.answer as ContinentId);
    case 'ocean': return oceanLesson(q, v, l, teach, q.answer as OceanId);
    case 'land': {
      const right = landform(q.answer as LandformId);
      if (teach && answer && answer !== q.answer) {
        const picked = landform(answer as LandformId);
        l.card.value = picked.id;
        await v.say('You tapped the', say(picked.name));
        if (v.active) await v.say(say(picked.means));
        await v.wait(300);
      }
      l.card.value = right.id; sChime();
      if (v.active) await v.say(say(right.means));
      l.hint.value = q.answer;
      return;
    }
    case 'climate': {
      l.rays.value = true; l.belt.value = true;
      await v.say('Near the equator, the sun shines straight down, so it is hot.');
      if (v.active) await v.say('Near the poles, the sunlight comes in at a slant, so it is cold.');
      if (teach && v.active) await v.say('The further from the equator, the colder it gets.');
      l.hint.value = q.answer;
      return;
    }
    case 'place': {
      const place = FAMOUS.find(f => f.id === q.about)!, home = (place.where as { c: ContinentId }).c;
      if (teach) await route(v, l, continent(home).from);
      l.face.value = { lon: place.lon, lat: place.lat }; l.glow.value = home;
      l.popup.value = { emoji: place.emoji, name: place.name }; sChime();
      await v.say(say(place.line));
      if (v.active) await v.say('It is in', say(continent(home).name));
      l.hint.value = q.answer;
      return;
    }
  }
}

export async function explain(p: Asking, answer: string, teach: boolean, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await v.say(teach ? "Let's look together." : 'Not quite!');
  await lessonOf(p, answer, teach, v, lesson);
  if (v.active) await v.say('Try again!');
  // the pictures and the small globe go away so he can see (and tap) everything again; the hint, the glow and the tint stay
  lesson.card.value = null; lesson.popup.value = null; lesson.rays.value = false;
  if (p.q.stage.type !== 'earth' || p.q.stage.surface.s === 'map') lesson.face.value = null;
}

/** 🔎 runs the whole lesson. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const lesson = lessonFor(lifetime), v = lesson.task.start();
  reset(lesson);
  await lessonOf(p, '', true, v, lesson);
}
