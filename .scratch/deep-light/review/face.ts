import { startDive, step, hold, release } from '../../../src/deep-light/dive/sim';
import { gearOf } from '../../../src/deep-light/dock/dock';
for (const motor of ['r0', 'r5']) {
  const gear = gearOf({ fitted: { hull: 'r6', lights: 'r5', sonar: 'r5', motor, claw: 'r5', flash: 'r4', paint: 'yellow', stripes: 'none', beam: 'warm', horn: 'toot', buddy: 'fish', trail: 'bubbles' } } as any);
  const s = startDive('midnight', gear, [], 7);
  hold(s, s.sub.x + 250, s.sub.y + 75);
  const log: string[] = [];
  for (let i = 0; i < 360; i++) { if (i === 150) release(s); step(s, 1 / 60); if (i % 15 === 0) log.push(`${i}:x${s.sub.x.toFixed(0)} vx${s.sub.vx.toFixed(0)} f${s.sub.face} aim${s.sub.aim.toFixed(2)}`); }
  console.log(motor, log.join(' | '));
}
