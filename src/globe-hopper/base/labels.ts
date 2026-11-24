// How a photo target is named on screen and said aloud, and where it is ("It is in Africa.").
import type { Phrase } from '../phrases';
import { CONTINENTS } from '../world/continents';
import { OCEANS } from '../world/oceans';
import { PLACES, type Place } from '../world/places';
import type { TargetId } from './missions';

const say = (x: string) => x as Phrase;
export function targetLabel(id: TargetId): string {
  const v = id.slice(2);
  if (id.startsWith('c:')) return CONTINENTS.find(c => c.id === v)!.name;
  if (id.startsWith('o:')) return `the ${OCEANS.find(o => o.id === v)!.name}`;
  const p = PLACES.find(x => x.id === v)!;
  return p.name.replace(/^the /, 'The ').replace(/^The /, 'the ');
}
export function targetEmoji(id: TargetId): string {
  if (id.startsWith('c:')) return '🗺️';
  if (id.startsWith('o:')) return '🌊';
  return PLACES.find(x => x.id === id.slice(2))!.emoji;
}
/** The name as the voice says it: a continent or place name, or "the" and an ocean. */
export function targetSaid(id: TargetId): Phrase[] {
  const v = id.slice(2);
  if (id.startsWith('c:')) return [say(CONTINENTS.find(c => c.id === v)!.name)];
  if (id.startsWith('o:')) return [say(`the ${OCEANS.find(o => o.id === v)!.name}`)];
  return [say(PLACES.find(x => x.id === v)!.name)];
}
/** Where it is, in one plain line. */
export function whereSaid(id: TargetId): Phrase[] {
  if (!id.startsWith('p:')) return [];
  const p = PLACES.find(x => x.id === id.slice(2)) as Place;
  const w = p.where;
  if ('c' in w) return ['It is in', say(CONTINENTS.find(c => c.id === w.c)!.name)];
  if ('o' in w) return ['It is in the', say(OCEANS.find(o => o.id === w.o)!.name)];
  if ('between' in w) return ['It is between', say(CONTINENTS.find(c => c.id === w.between[0])!.name), 'and', say(CONTINENTS.find(c => c.id === w.between[1])!.name)];
  return ['Greenland is the biggest island in the world.'];
}
