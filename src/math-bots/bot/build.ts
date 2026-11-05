// A robot as he builds it: one Body, one set of Wheels, a part on each Mount the Body has, a paint and a face. statsOf turns that into
// the numbers the fight runs on, and powerOf into the one number he watches go up.
import { add, body, face, MOUNTS, paint, wheels, type AddId, type AddPart, type BodyId, type FaceId, type Mount, type PaintId, type WheelId } from './parts';

export interface Build { body: BodyId; wheels: WheelId; adds: Partial<Record<Mount, AddId>>; paint: PaintId; face: FaceId }
export const starterBuild = (): Build => ({ body: 'box', wheels: 'small', adds: { front: 'bumper' }, paint: 'blue', face: 'happy' });

/** Only Mounts the Body has: changing Body can leave a part with nowhere to go, and it comes off. */
export const fittedAdds = (b: Build) => MOUNTS.flatMap(m => { const id = b.adds[m]; return id && (body(b.body).mounts as readonly Mount[]).includes(m) ? [{ mount: m, part: add(id) as AddPart }] : []; });
export const weightOf = (b: Build) => body(b.body).weight + wheels(b.wheels).weight + fittedAdds(b).reduce((sum, a) => sum + a.part.weight, 0);

export interface Stats {
  hp: number; weight: number; radius: number;
  /** Top speed in arena units a second. */
  speed: number; turn: number; grip: number;
  /** Hard hits a second, for the Hit bar. */
  hit: number;
}
const RATE = { saw: 4, spin: 1.1, lance: 1.5, hammer: .7, flip: .4, claw: .4, prod: .6, bumper: 1, thorns: .5 } as Partial<Record<AddPart['kind'], number>>;
export function statsOf(b: Build): Stats {
  const shell = body(b.body), drive = wheels(b.wheels), weight = weightOf(b);
  const boosters = fittedAdds(b).filter(a => a.part.kind === 'boost').length;
  return {
    hp: shell.hp, weight, radius: shell.radius, turn: drive.turn, grip: drive.grip,
    speed: Math.round(Math.max(90, Math.min(350, drive.drive * 2.15 * Math.sqrt(14 / weight) * (1 + boosters * .12)))),
    hit: Math.round(fittedAdds(b).reduce((sum, a) => sum + a.part.dmg * (RATE[a.part.kind] ?? 0), 0)),
  };
}
export const powerOf = (b: Build) => body(b.body).power + wheels(b.wheels).power + fittedAdds(b).reduce((sum, a) => sum + a.part.power, 0);
/** Bars out of 10, for the stat meters. */
export const barsOf = (s: Stats) => ({ speed: Math.min(10, Math.round(s.speed / 32)), armour: Math.min(10, Math.round(s.hp / 38)), hit: Math.min(10, Math.max(1, Math.round(Math.sqrt(s.hit) * 1.45))) });
export const paintOf = (b: Build) => paint(b.paint);
export const faceOf = (b: Build) => face(b.face);
