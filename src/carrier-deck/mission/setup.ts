// A Mission on his ship: what the sim needs from the Mission (the job, how much, the wind) and from his Carrier (the deck, the wires and
// the parts that change how it plays).
import { AIRCRAFT, type Model } from '../ship/catalog';
import type { Mission } from '../ship/missions';
import { deckLen, has, wires, type ShipState } from '../ship/ship';
import type { MissionSetup } from './sim';

export function setupFor(m: Mission, model: Model, a: Pick<ShipState, 'owned' | 'more'>): MissionSetup {
  const spec = AIRCRAFT[model];
  return {
    job: m.job, subject: m.subject, count: m.count, wind: m.wind, seed: m.seed, speed: spec.speed, hover: spec.hover,
    deckLen: deckLen(a), wires: wires(a), angled: has(a, 'part:angled'), skiJump: has(a, 'part:skijump'), calm: has(a, 'part:weather'),
  };
}
