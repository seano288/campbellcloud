// The Call can't be failed: a scripted child (aim at the nearest fire, tap anyone waiting) always finishes it, with the starter parts
// and with the best, and the drops never pass their cap.
import { describe, expect, it } from 'vitest';
import { LADDER_FLOORS, PUMP_FLOORS, TANK_SECONDS, TRUCKS, type TruckId } from '../station/parts';
import { SCENES } from './scenes';
import { aim, aimAt, MAX_DROPS, NOZZLE, reachAt, release, startCall, statsOf, step, tapRescue, takeEvents, type CallState, type Gear } from './sim';

const STARTER: Gear = { truck: 'pumper', pump: 0, hose: 0, ladder: 0, tank: 0, nozzle: 'straight' };
const BEST: Gear = { truck: 'pumper', pump: PUMP_FLOORS.length - 1, hose: 5, ladder: LADDER_FLOORS.length - 1, tank: TANK_SECONDS.length - 1, nozzle: 'straight' };

/** A child playing: holds a finger on the lowest fire still burning that the water reaches, and taps anyone waiting. */
function play(s: CallState, maxS = 240) {
  let peak = 0;
  const frame = 1 / 60;
  for (let t = 0; t < maxS && s.phase !== 'done'; t += frame) {
    const f = s.fires.filter(f => !f.out && f.reach).sort((a, b) => a.y - b.y)[0];
    if (f) aim(s, f.x, f.y); else release(s);
    // someone the ladder reaches first; now and then one it doesn't, as a child would
    const r = s.rescues.find(r => r.state === 'waiting' && r.reach) ?? (Math.floor(t * 60) % 400 === 0 ? s.rescues.find(r => r.state === 'waiting') : undefined);
    if (r && s.ladder.phase === 'rest') tapRescue(s, r.x, r.y);
    step(s, frame);
    peak = Math.max(peak, s.live);
    takeEvents(s);
  }
  return { done: s.phase === 'done', peak, t: s.t };
}

describe('the Call', () => {
  it('every Call finishes with the starter parts and with the best, and the drops stay under the cap', () => {
    for (const scene of SCENES) for (const gear of [STARTER, BEST]) {
      const result = play(startCall(scene, gear));
      expect(result.done, `${scene.id} with ${gear.pump}`).toBe(true);
      expect(result.peak).toBeLessThanOrEqual(MAX_DROPS);
    }
  });
  it('every truck finishes every Call', () => {
    for (const truck of TRUCKS.map(t => t.id as TruckId)) for (const scene of SCENES) expect(play(startCall(scene, { ...STARTER, truck })).done).toBe(true);
  });
  it('the first four Calls need nothing he has to buy, and the best parts reach every fire and everyone', () => {
    for (const scene of SCENES.slice(0, 4)) {
      const s = startCall(scene, STARTER);
      expect(s.fires.every(f => f.reach), scene.id).toBe(true);
      expect(s.rescues.every(r => r.reach), scene.id).toBe(true);
    }
    for (const scene of SCENES) {
      const s = startCall(scene, BEST);
      expect(s.fires.every(f => f.reach), scene.id).toBe(true);
      expect(s.rescues.every(r => r.reach), scene.id).toBe(true);
    }
  });
  it('a stronger Pump reaches higher, and every Rung reaches its floor at a building\'s middle', () => {
    for (let p = 0; p < PUMP_FLOORS.length; p++) {
      const speed = statsOf({ ...STARTER, pump: p }).speed;
      expect(reachAt(speed, NOZZLE.x + 8)).toBeGreaterThanOrEqual(PUMP_FLOORS[p]! - 0.25);
      if (p) expect(speed).toBeGreaterThan(statsOf({ ...STARTER, pump: p - 1 }).speed);
    }
  });
  it('aims through his finger when it can, and says when it can\'t', () => {
    const speed = statsOf(STARTER).speed;
    const ok = aimAt(speed, 10, 2);
    expect(ok.reaches).toBe(true);
    // follow the arc: it passes within a hair of (10, 2)
    const dx = 10 - NOZZLE.x, t = dx / (speed * Math.cos(ok.angle)), y = NOZZLE.y + speed * Math.sin(ok.angle) * t - 3 * t * t;
    expect(Math.abs(y - 2)).toBeLessThan(0.01);
    expect(aimAt(speed, 10, 20).reaches).toBe(false);
  });
  it('a bigger Tank sprays longer before it refills, and the Fireboat never runs dry', () => {
    const sprayFor = (gear: Gear) => {
      const s = startCall(SCENES[13]!, gear);
      aim(s, 20, 1);
      for (let t = 0; t < 60; t += 1 / 60) { step(s, 1 / 60); if (takeEvents(s).includes('empty')) return t; }
      return Infinity;
    };
    expect(sprayFor({ ...STARTER, tank: 3 })).toBeGreaterThan(sprayFor(STARTER));
    expect(sprayFor({ ...STARTER, truck: 'boat' })).toBe(Infinity);
  });
  it('a fire he can\'t reach tells him once, and the helpers still finish it', () => {
    const s = startCall(SCENES.find(x => x.id === 'tower')!, STARTER);
    const high = s.fires.find(f => !f.reach)!;
    let told = 0;
    for (let t = 0; t < 4; t += 1 / 60) { aim(s, high.x, high.y); step(s, 1 / 60); told += takeEvents(s).filter(e => e === 'tooHighFire').length; }
    expect(told).toBe(1);
    expect(play(s).done).toBe(true);
    expect(s.fires.every(f => f.out)).toBe(true);
    expect(s.rescues.every(r => r.state === 'safe')).toBe(true);
  });
});
