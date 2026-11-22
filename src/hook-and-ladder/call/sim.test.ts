// The Call can't be failed: a scripted child (aim at the nearest fire, tap anyone waiting) always finishes it, with the starter parts
// and with the best, and the drops never pass their cap.
import { describe, expect, it } from 'vitest';
import { AIRCRAFT, ENGINES, GADGETS, HOSES, LADDER_FLOORS, NOZZLES, PUMP_FLOORS, TANK_SECONDS, TRUCKS, type TruckId } from '../station/parts';
import { heated, MAX_HEAT, mysteryCall, SCENES } from './scenes';
import { aim, aimAt, dropWater, MAX_DROPS, NOZZLE, reachAt, release, startCall, statsOf, step, tapRescue, takeEvents, type CallState, type Gear } from './sim';

const STARTER: Gear = { truck: 'pumper', engine: 0, pump: 0, hose: 0, ladder: 0, tank: 0, nozzle: 'straight', gadgets: [] };
const BEST: Gear = { truck: 'pumper', engine: ENGINES.length - 1, pump: PUMP_FLOORS.length - 1, hose: HOSES.length - 1, ladder: LADDER_FLOORS.length - 1, tank: TANK_SECONDS.length - 1, nozzle: 'straight', gadgets: [] };
const VEHICLES = [...TRUCKS, ...AIRCRAFT].map(t => t.id as TruckId);

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
  it('every vehicle finishes every Call, with the starter parts and with the best and every gadget', () => {
    const all = { ...BEST, gadgets: GADGETS.map(g => g.id) };
    for (const truck of VEHICLES) for (const scene of SCENES) for (const gear of [STARTER, all]) {
      const s = startCall(scene, { ...gear, truck });
      const r = play(s);
      expect(r.done, `${truck} at ${scene.id}`).toBe(true);
      expect(r.peak).toBeLessThanOrEqual(MAX_DROPS);
    }
  });
  it('every nozzle finishes a Call', () => {
    for (const n of NOZZLES) expect(play(startCall(SCENES[9]!, { ...STARTER, nozzle: n.id })).done, n.id).toBe(true);
  });
  it('every Star Call finishes, hotter each time: more fires, someone more to save, and at three stars fires that come back', () => {
    for (const base of SCENES) {
      let fires = base.fires.length;
      for (let heat = 1; heat <= MAX_HEAT; heat++) {
        const scene = heated(base, heat);
        expect(scene.id).toBe(base.id);
        expect(scene.fires.length, `${base.id} heat ${heat}`).toBeGreaterThan(fires);
        fires = scene.fires.length;
        expect(heated(base, heat)).toEqual(scene); // the same every time
        for (const gear of [STARTER, BEST, { ...STARTER, truck: 'scooper' as const }, { ...STARTER, truck: 'heli' as const }]) {
          const s = startCall(scene, gear);
          expect(play(s).done, `${base.id} heat ${heat} with ${gear.truck}`).toBe(true);
          expect(s.fires.every(f => f.out)).toBe(true);
        }
      }
      expect(heated(base, MAX_HEAT).fires.some(f => f.flare), base.id).toBe(true);
    }
  });
  it('a fire that flares comes back once, and still goes out', () => {
    const scene = heated(SCENES.find(x => x.id === 'school')!, MAX_HEAT), s = startCall(scene, BEST);
    let flares = 0;
    for (let t = 0; t < 240 && s.phase !== 'done'; t += 1 / 60) {
      const f = s.fires.filter(f => !f.out && f.reach).sort((a, b) => a.y - b.y)[0];
      if (f) aim(s, f.x, f.y); else release(s);
      const r = s.rescues.find(r => r.state === 'waiting');
      if (r && s.ladder.phase === 'rest') tapRescue(s, r.x, r.y);
      step(s, 1 / 60);
      flares += takeEvents(s).filter(e => e === 'flare').length;
    }
    expect(flares).toBe(scene.fires.filter(f => f.flare).length);
    expect(s.phase).toBe('done');
  });
  it('the Mystery Call is made up from its Level, the same each time, bigger as it goes, and always finishes', () => {
    expect(mysteryCall(7)).toEqual(mysteryCall(7));
    const fires = (lo: number, hi: number) => { let n = 0; for (let l = lo; l < hi; l++) n += mysteryCall(l).fires.length; return n / (hi - lo); };
    expect(fires(20, 30)).toBeGreaterThan(fires(1, 6));
    for (let level = 1; level <= 60; level++) {
      const scene = mysteryCall(level);
      expect(scene.fires.length, `level ${level}`).toBeGreaterThan(0);
      expect(scene.right, `level ${level}`).toBeLessThanOrEqual(20);
      expect(scene.top, `level ${level}`).toBeLessThanOrEqual(12);
      for (const gear of [STARTER, BEST, { ...STARTER, truck: 'airtanker' as const }, { ...STARTER, truck: 'drone' as const }]) expect(play(startCall(scene, gear)).done, `level ${level} with ${gear.truck}`).toBe(true);
    }
  });
  it('a plane drops water wherever he points, on any floor, and sends parachutes', () => {
    for (const truck of ['scooper', 'airtanker', 'superjet'] as const) {
      const s = startCall(SCENES.find(x => x.id === 'tower')!, { ...STARTER, truck });
      expect(s.fires.every(f => f.reach) && s.rescues.every(r => r.reach)).toBe(true);
      expect(play(s).done).toBe(true);
      expect(s.phase).toBe('done');
    }
    const s = startCall(SCENES.find(x => x.id === 'school')!, { ...STARTER, truck: 'scooper' });
    const r = s.rescues[0]!;
    expect(tapRescue(s, r.x, r.y)).toBe(true);
    expect(r.state).toBe('chute');
  });
  it('a helicopter hovers high enough to reach higher than the same Pump on a truck, and its rope reaches any floor', () => {
    const tower = SCENES.find(x => x.id === 'tower')!;
    const truck = startCall(tower, STARTER), heli = startCall(tower, { ...STARTER, truck: 'heli' });
    expect(heli.place.origin.y).toBeGreaterThan(truck.place.origin.y);
    expect(heli.fires.filter(f => f.reach).length).toBeGreaterThan(truck.fires.filter(f => f.reach).length);
    expect(heli.rescues.every(r => r.reach)).toBe(true);
    // the Tower Truck sprays from the top of its boom
    expect(startCall(tower, { ...STARTER, truck: 'tower' }).fires.filter(f => f.reach).length).toBeGreaterThan(truck.fires.filter(f => f.reach).length);
  });
  it('the 🪣 Drop puts out the highest fires, as many as the helicopter carries', () => {
    for (const [truck, n] of [['heli', 1], ['twin', 2], ['skycrane', 3]] as const) {
      const s = startCall(SCENES.find(x => x.id === 'hotel')!, { ...STARTER, truck });
      expect(dropWater(s)).toBe(true);
      expect(s.fires.filter(f => f.out).length).toBe(n);
      expect(dropWater(s)).toBe(false); // it has to fill up again first
    }
    expect(dropWater(startCall(SCENES[5]!, STARTER))).toBe(false);
  });
  it('a Call never finishes with a fire still to come back', () => {
    // a Drop on a high flaring fire he can't reach, then the low one he can: the Call ends with every fire out for good
    const scene = { ...SCENES.find(x => x.id === 'tower')!, fires: [{ x: 9, y: 0.5, kind: 'window' as const }, { x: 13.5, y: 9.5, kind: 'window' as const, flare: true as const }], top: 11 };
    const s = startCall(scene, { ...STARTER, truck: 'heli' });
    expect(s.fires[1]!.reach).toBe(false);
    expect(dropWater(s)).toBe(true);
    let flaresAfterDone = 0;
    for (let t = 0; t < 120; t += 1 / 60) {
      if (s.phase === 'work') aim(s, 9, 0.5); else release(s);
      const r = s.rescues.find(r => r.state === 'waiting');
      if (r && s.ladder.phase === 'rest') tapRescue(s, r.x, r.y);
      const wasDone = s.phase === 'done';
      step(s, 1 / 60);
      if (wasDone) flaresAfterDone += takeEvents(s).filter(e => e === 'flare').length; else takeEvents(s);
    }
    expect(s.phase).toBe('done');
    expect(flaresAfterDone).toBe(0);
    expect(s.fires.every(f => f.out && f.back <= 0)).toBe(true);
  });
  it('a plane stays on the screen at both ends of the street, unless a fire is right at the edge', () => {
    for (const scene of [SCENES[1]!, SCENES.find(x => x.id === 'wildfire')!]) {
      // past the last fire it stops; it never goes further off the right than over the last fire
      const s = startCall(scene, { ...STARTER, truck: 'superjet' }), worldW = Math.max(scene.right + 0.4, 13), last = Math.max(...scene.fires.map(f => f.x));
      for (const x of [40, -40]) { for (let t = 0; t < 6; t += 1 / 60) { aim(s, x, 1); step(s, 1 / 60); } expect(s.plane!.x - 2.6).toBeGreaterThanOrEqual(0); expect(s.plane!.x + 2.4).toBeLessThanOrEqual(Math.max(worldW, last + 2.7)); }
    }
  });
  it('the Rescue Drone flies down someone the ladder can\'t reach', () => {
    const s = startCall(SCENES.find(x => x.id === 'tower')!, { ...STARTER, gadgets: ['drone'] });
    const r = s.rescues.find(r => r.floor > statsOf(STARTER).ladderFloors)!;
    expect(r.reach).toBe(true);
    expect(tapRescue(s, r.x, r.y)).toBe(true);
    let saved = false;
    for (let t = 0; t < 30 && !saved; t += 1 / 60) { step(s, 1 / 60); saved = takeEvents(s).includes('saved'); }
    expect(r.state).toBe('safe');
  });
  it('the Robot Truck sprays by itself and finishes a Call with no finger on it', () => {
    const s = startCall(SCENES[2]!, { ...STARTER, truck: 'robot' });
    for (let t = 0; t < 120 && s.fires.some(f => !f.out); t += 1 / 60) { step(s, 1 / 60); takeEvents(s); }
    expect(s.fires.every(f => f.out)).toBe(true);
  });
  it('more streams, a Hydrant, a Turbo Ladder and a faster Engine do what they say', () => {
    expect(statsOf({ ...STARTER, nozzle: 'triple', truck: 'monster', gadgets: ['cannon'] }).streams).toBe(5);
    expect(statsOf({ ...STARTER, gadgets: ['hydrant'] }).tank).toBe(Infinity);
    expect(statsOf({ ...STARTER, gadgets: ['turbo'] }).ladderSpeed).toBeCloseTo(statsOf(STARTER).ladderSpeed * 2);
    expect(statsOf({ ...STARTER, engine: 3 }).ladderSpeed).toBeGreaterThan(statsOf(STARTER).ladderSpeed);
    expect(statsOf({ ...STARTER, gadgets: ['cape'] }).ladderFloors).toBeGreaterThan(20);
  });
  it('the first four Calls need nothing he has to buy, and the best parts reach every fire and everyone in all thirty-two', () => {
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
