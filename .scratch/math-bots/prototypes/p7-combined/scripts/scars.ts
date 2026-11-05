import { Fight, initPhysics } from '../src/sim.ts';
await initPhysics();
for (let s = +(process.argv[2] ?? 1); s < +(process.argv[3] ?? 40); s++) { const f = new Fight(s, 40); while (f.t < 34) f.step(); const near = (f as any).scars.filter((x: any) => x.kind === 'tear' || x.kind === 'axe' || x.kind === 'gouge').map((x: any) => `${x.t.toFixed(1)}:b${x.bot}:p${x.plate}:${x.kind}:${x.e.toFixed(2)}`); console.log(s, near.join(' ')); f.world.free(); }
