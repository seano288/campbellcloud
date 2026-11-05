import { Fight, initPhysics } from '../src/sim.ts';
await initPhysics();
for (let s = 1; s <= 60; s++) { const f = new Fight(s, 40); while (f.t < 30 && f.koT < 0) f.step();
  const a = f.scars.filter(x => x.kind === 'axe'); const c = a.filter(x => x.plate < 2 && Math.abs(x.u) < .22 && Math.abs(x.v) < .16);
  if (c.length && f.koT > 18 && f.koT < 24) console.log(s, 'ko', f.koT.toFixed(1), c.map(x => `${x.t.toFixed(1)} p${x.plate} ${x.u.toFixed(2)},${x.v.toFixed(2)}`).join(' | ')); f.world.free(); }
