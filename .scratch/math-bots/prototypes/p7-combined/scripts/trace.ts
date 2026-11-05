import { Fight, initPhysics, DT } from '../src/sim.ts';
import { Vector3 as V, Quaternion as Q } from 'three';
await initPhysics();
const seed = +(process.argv[2] ?? 19), end = +(process.argv[3] ?? 26);
const f = new Fight(seed, 40); let lastArm = 'stow', n = 0, minAng = 9, wv = 0, ev = 0;
while (f.t < end) {
  const before = f.arm_; f.step();
  while (ev < f.events.length) { const e = f.events[ev++]; if (!['skim','spinup','go'].includes(e.type)) console.log(f.t.toFixed(2), 'EV', e.type, e.J.toFixed(0), e.note ?? ''); }
  if (f.arm_ === 'fire') { const a = f.armAngle(); minAng = Math.min(minAng, a); const w = new V(f.arm.angvel().x, f.arm.angvel().y, f.arm.angvel().z).length(); wv = Math.max(wv, w); }
  if (before === 'fire' && f.arm_ !== 'fire') {
    const d = new V().subVectors(f.T.pos, f.A.pos); console.log(f.t.toFixed(2), 'swing end minAng', minAng.toFixed(2), 'maxw', wv.toFixed(1), 'dist', d.length().toFixed(2), 'aUp', f.A.up.y.toFixed(2), 'hit', f.armHitThisSwing); minAng = 9; wv = 0;
  }
  if (f.arm_ === 'fire' && before === 'stow') { const d = new V().subVectors(f.T.pos, f.A.pos); console.log(f.t.toFixed(2), 'FIRE dist', d.length().toFixed(2), 'ahead', d.dot(f.A.fwd).toFixed(2), 'side', d.dot(f.A.left).toFixed(2), 'Tv', f.T.vel.length().toFixed(2), 'pilot', f.pilot); }
  if (++n % 120 === 0) console.log(f.t.toFixed(1), f.pilot, 'A', f.A.pos.toArray().map((x) => x.toFixed(2)).join(','), 'up', f.A.up.y.toFixed(2), 'T', f.T.pos.x.toFixed(2), f.T.pos.z.toFixed(2), 'omega', f.drumOmega.toFixed(0), 'hp', f.aHp.toFixed(0), 'aInv', f.aInv.toFixed(2));
}
