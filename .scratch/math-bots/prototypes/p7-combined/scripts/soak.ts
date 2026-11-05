import { Fight, initPhysics } from '../src/sim.ts';
await initPhysics();
const N = +(process.argv[2] ?? 60), S0 = +(process.argv[3] ?? 1), verbose = process.argv[4] === 'v', quiet = process.argv[4] === 'q';
let wins = 0, ms = 0, steps = 0; const koT: number[] = []; const why: Record<string, number> = {}, miss: Record<string, number> = {};
let ham = 0, swings = 0, scars = 0, tears = 0;
for (let s = S0; s < S0 + N; s++) {
  const f = new Fight(s, 40), t0 = performance.now(); let n = 0;
  while (f.t < 34) { f.step(); n++; }
  ms += performance.now() - t0; steps += n;
  const c = (t: string) => f.events.filter((e) => e.type === t).length, first = (t: string) => f.events.find((e) => e.type === t)?.t.toFixed(1) ?? '-';
  if (f.winner === 'TORQUE') wins++;
  koT.push(f.koT);
  const k = f.events.find((e) => e.type === 'ko'); why[k?.note ?? 'none'] = (why[k?.note ?? 'none'] ?? 0) + 1;
  for (const need of ['drum', 'hammer', 'panel-off', 'ko']) if (!c(need)) miss[need] = (miss[need] ?? 0) + 1;
  ham += c('hammer'); swings += (f as any).swings ?? 0; scars += (f as any).scars?.length ?? 0; tears += c('panel-off');
  if (!quiet) console.log(`seed ${s}: ${f.winner} ko=${f.koT.toFixed(1)} (${k?.note}) drum=${c('drum')}@${first('drum')} hammer=${c('hammer')}/${(f as any).swings ?? '?'}@${first('hammer')} off=${c('panel-off')}@${first('panel-off')} wheel=${c('wheel-off')} scars=${(f as any).scars?.length ?? '-'} tUp=${f.T.up.y.toFixed(2)} aUp=${f.A.up.y.toFixed(2)}`);
  if (verbose) console.log(f.events.filter((e) => !['skim', 'spinup', 'go'].includes(e.type)).map((e) => `  ${e.t.toFixed(2)} ${e.type} ${e.J.toFixed(0)} ${e.note ?? ''}`).join('\n'));
  f.world.free();
}
console.log({ wins, N, why, miss, hammerHits: ham, swings, tears, scars, msPerStep: +(ms / steps).toFixed(3), koMin: Math.min(...koT), koMax: Math.max(...koT) });
