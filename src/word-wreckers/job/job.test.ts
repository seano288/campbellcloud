// The Job is the treat, so a clumsy six-year-old must always be able to finish it: these play it with simple scripted children, with
// every machine on every material and every old building's shape, and every road machine on its road.
import { describe, expect, it } from 'vitest';
import { seeded, type Rng } from '../../game/rng';
import { piecesOf } from '../art/buildings';
import { magnetOf } from '../art/machines';
import { actionOf, BUILDINGS, PAVERS, WRECKERS, type MachineId, type Tier } from '../yard/shop';
import { B_GROUND, createBuild, pieceH, stepBuild } from './build';
import { createRoad, SPOTS, stepRoad } from './road';
import { ballPos, BOLTS_HIDDEN, createWreck, GROUND_Y, MAX_BRICKS, OLD_SHAPES, standing, stepWreck, tipOf, type Input, type Wreck } from './wreck';

const DT = 1 / 60;
const TIERS: Tier[] = [1, 2, 3, 4];
type Style = 'good' | 'taps' | 'random';

/** One child's go: holds, drags, taps and drives as that child would. Returns how long it took (seconds of play). */
function play(w: Wreck, style: Style, rng: Rng, limit = 240) {
  let t = 0, holding = 0, dragAt: { x: number; y: number } | null = null, pulse = 0;
  while (!w.done && t < limit) {
    const input: Input = {};
    if (w.action === 'push') {
      // hold to push: the good child holds; another lets go now and then; a random one also backs up sometimes
      input.drive = style === 'good' ? 1 : style === 'taps' ? (Math.floor(t * 2) % 3 !== 0 ? 1 : 0) : rng() < .7 ? 1 : rng() < .5 ? -1 : 0;
    } else if (w.action === 'hammer') {
      // the good child taps fast; another taps now and then; a random one holds the 🔨 sometimes and taps anywhere
      if ((pulse -= DT) <= 0) { pulse = style === 'good' ? .12 : style === 'taps' ? .8 + rng() * .6 : .3 + rng(); input.tap = { x: rng() * 1200, y: rng() * 600 }; }
      if (style === 'random') input.hammering = Math.floor(t) % 4 === 0;
    } else if (w.action === 'blast') {
      // the good child sticks three on, then presses the plunger; another only ever presses the plunger; a random one taps anywhere,
      // too many times, and presses the plunger whenever
      if ((pulse -= DT) <= 0) {
        pulse = style === 'good' ? .4 : 1.2 + rng();
        if (style === 'taps') input.fire = true;
        else if (style === 'good') { if (w.blast.sticks.length < 3 && w.blast.fuse <= 0) { const left = standing(w); const b = left[Math.floor(rng() * left.length)]; if (b) input.tap = { x: b.x, y: b.y }; } else input.fire = true; }
        else { input.tap = { x: 300 + rng() * 900, y: 100 + rng() * 500 }; if (rng() < .3) input.fire = true; }
      }
    } else if (w.action === 'magnet') {
      // the good child taps a column when the magnet's free; another taps now and then anywhere; a random one taps all the time
      if ((pulse -= DT) <= 0) {
        pulse = style === 'good' ? (w.magnet.state === 'rest' ? .1 : .3) : style === 'taps' ? 1.5 + rng() : .2 + rng() * .4;
        const left = standing(w), b = left[Math.floor(rng() * left.length)];
        if (style === 'good' ? w.magnet.state === 'rest' && b : true) input.tap = style === 'good' && b ? { x: b.x, y: b.y } : { x: rng() * 1300, y: rng() * 640 };
      }
    } else if (w.action === 'bite') {
      if ((pulse -= DT) <= 0) {
        pulse = style === 'good' ? .5 : .9 + rng();
        const left = standing(w), b = left[Math.floor(rng() * left.length)];
        input.tap = style === 'random' || !b ? { x: 300 + rng() * 900, y: 200 + rng() * 340 } : { x: b.x, y: b.y };
      }
      if (style === 'random' && rng() < .02) input.drive = rng() < .5 ? -1 : 1;
    } else {
      // swing: the good child drags the ball back and lets go when it's still; another just taps; a random one drags anywhere
      const still = Math.abs(w.ball.omega) < .5;
      if (style === 'taps') { if ((pulse -= DT) <= 0 && still) { pulse = 1.6; input.tap = { x: 600, y: 300 }; } }
      else if (holding > 0) { holding -= DT; input.hold = dragAt; }
      else if (still && (pulse -= DT) <= 0) {
        const tip = tipOf(w);
        dragAt = style === 'good' ? { x: tip.x - 140, y: tip.y + 90 } : { x: tip.x - rng() * 200, y: tip.y + rng() * 200 };
        holding = .3 + rng() * .4; pulse = .8 + rng();
      }
    }
    stepWreck(w, DT, input);
    t += DT;
  }
  return t;
}

const opts = (m: MachineId, power: number, treasure = false) => ({
  power, size: 1, speed: 1, treasure,
  ...(m === 'crane' || m === 'mega' ? { ball: m === 'mega' ? { len: 120, r: 23 } : { len: 116, r: 17 } } : {}),
  ...(m === 'magnet' || m === 'supermag' ? { magnet: magnetOf(m, { paint: 'yellow', driver: '', ups: [] }).w } : {}),
});

describe('knocking it down', () => {
  it('never has more bricks than the iPad 9 can push around', () => {
    for (const tier of TIERS) for (let s = 0; s < OLD_SHAPES[tier].length; s++) expect(createWreck(tier, s, 'crane', opts('crane', 4)).bricks.length).toBeLessThanOrEqual(MAX_BRICKS);
  });
  it('has six old buildings for each material', () => { for (const tier of TIERS) expect(OLD_SHAPES[tier]).toHaveLength(6); });
  it('always comes down, whoever plays, with every machine on every material and shape, and finds all three Bolts and the treasure', () => {
    // all six ways to knock down are played: swing, push, bite, hammer, blast, magnet
    expect(new Set(WRECKERS.map(actionOf))).toEqual(new Set(['swing', 'push', 'bite', 'hammer', 'blast', 'magnet']));
    for (const m of WRECKERS) for (const tier of TIERS) for (const style of ['good', 'taps', 'random'] as const) for (let shape = 0; shape < OLD_SHAPES[tier].length; shape++) {
      const treasure = shape % 2 === 1;
      const w = createWreck(tier, shape, m, opts(m, 4, treasure)), rng = seeded(tier * 31 + shape * 7 + m.length);
      const t = play(w, style, rng);
      expect(w.done, `${m} tier ${tier} shape ${shape} ${style} (${standing(w).length} left after ${t.toFixed(0)}s)`).toBe(true);
      expect(standing(w)).toHaveLength(0);
      expect(w.bricks.filter(b => b.state === 'lift'), `${m} left bricks on the magnet`).toHaveLength(0);
      expect(w.bolts).toBe(BOLTS_HIDDEN);
      expect(w.chestFound, `${m} tier ${tier} shape ${shape}: the treasure`).toBe(treasure);
      if (style === 'good') expect(t, `${m} tier ${tier} ${style}`).toBeLessThan(90);
    }
  });
  it('lets a weak machine knock down what it can, the slow way', () => {
    // a machine at its own power (no spare power for bigger hits) still finishes, with a child who only taps
    for (const m of WRECKERS) {
      const w = createWreck(1, 2, m, opts(m, 1)), t = play(w, 'taps', seeded(m.length));
      expect(w.done, `${m} after ${t.toFixed(0)}s`).toBe(true);
    }
  });
  it('sets dynamite off with the plunger even when he has stuck none on, and never takes a fourth stick', () => {
    const w = createWreck(2, 0, 'dynamite', opts('dynamite', 2));
    stepWreck(w, DT, { fire: true });
    expect(w.blast.sticks.length).toBeGreaterThan(0);
    for (let i = 0; i < 90; i++) stepWreck(w, DT);
    expect(standing(w).length).toBeLessThan(w.total);
    const v = createWreck(2, 0, 'dynamite', opts('dynamite', 2));
    for (const b of standing(v).slice(0, 5)) stepWreck(v, DT, { tap: { x: b.x, y: b.y } });
    expect(v.blast.sticks).toHaveLength(3);
  });
  it('lifts the top of a column off with the magnet and drops it beside the building', () => {
    const w = createWreck(4, 0, 'magnet', opts('magnet', 4)), b = standing(w)[0]!;
    stepWreck(w, DT, { tap: { x: b.x, y: b.y } });
    let lifted = 0;
    for (let i = 0; i < 400 && !w.events.includes('drop'); i++) { stepWreck(w, DT); lifted = Math.max(lifted, w.magnet.carried.length); }
    expect(lifted).toBeGreaterThanOrEqual(2);
    expect(w.magnet.carried).toHaveLength(0);
  });
  it('lets the ball be held and swung, and a still ball never touches the building', () => {
    const w = createWreck(2, 0, 'crane', opts('crane', 2));
    for (let i = 0; i < 300; i++) stepWreck(w, DT);
    expect(standing(w)).toHaveLength(w.total);
    const tip = tipOf(w);
    stepWreck(w, DT, { hold: { x: tip.x - 120, y: tip.y + 80 } });
    expect(w.ball.held).toBe(true);
    expect(ballPos(w).x).toBeLessThan(tip.x);
    for (let i = 0; i < 120; i++) stepWreck(w, DT);
    expect(standing(w).length).toBeLessThan(w.total);
  });
  it('keeps every brick above the ground and inside the world', () => {
    const w = createWreck(4, 1, 'giant', opts('giant', 4));
    play(w, 'random', seeded(9));
    for (const b of w.bricks) expect(b.y).toBeLessThanOrEqual(GROUND_Y);
  });
});

describe('paving a road', () => {
  it('is always finished, whoever drives, with every road machine', () => {
    for (const m of PAVERS) for (const style of ['good', 'taps', 'random'] as const) {
      const r = createRoad(m, { speed: 1, size: 1 }), rng = seeded(m.length + style.length);
      let t = 0, fixes = 0;
      while (!r.done && t < 240) {
        const drive: -1 | 0 | 1 = style === 'good' ? 1 : style === 'taps' ? (Math.floor(t * 3) % 4 === 0 ? 1 : 0) : rng() < .55 ? 1 : rng() < .5 ? -1 : 0;
        stepRoad(r, DT, { drive });
        fixes += r.events.filter(e => e === 'fix').length;
        t += DT;
      }
      expect(r.done, `${m} ${style} after ${t.toFixed(0)}s`).toBe(true);
      expect(fixes).toBe(SPOTS);
      if (style === 'good') expect(t).toBeLessThan(30);
    }
  });
  it('fixes a bump or a hole whichever way he drives past it', () => {
    const r = createRoad('roller', { speed: 1, size: 1 });
    for (let i = 0; i < 120; i++) stepRoad(r, DT, { drive: 1 });
    const fixed = r.spots.filter(s => s.fixed).length;
    expect(fixed).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) stepRoad(r, DT, { drive: -1 });
    expect(r.spots.filter(s => s.fixed).length).toBeGreaterThanOrEqual(fixed);
  });
});

describe('putting it up', () => {
  it('lands every piece square on the last, however sloppy the drop, for every building', () => {
    for (const [i, b] of BUILDINGS.entries()) for (const gold of [false, true]) {
      const pieces = piecesOf(b.id, gold), build = createBuild(pieces), rng = seeded(i + (gold ? 100 : 0));
      let t = 0, aim = 0, wait = 0, lands = 0;
      while (!build.done && t < 60) {
        aim += (rng() - .5) * 80;
        const release = (wait -= DT) <= 0 && rng() < .05;
        if (release) wait = .3;
        stepBuild(build, DT, { aim, release });
        if (build.events.includes('land')) { lands++; expect(build.drop).toBeNull(); }
        t += DT;
      }
      expect(build.done, b.id).toBe(true);
      expect(lands).toBe(pieces.length);
      expect(build.stack).toBeCloseTo(pieces.reduce((s, p) => s + pieceH(p), 0));
      expect(B_GROUND - build.stack).toBeGreaterThan(60); // even the tallest stays on screen
    }
  });
  it('drops only when a piece is on the hook, and slides it to the middle as it falls', () => {
    const build = createBuild(piecesOf('house'));
    stepBuild(build, DT, { release: true }); // the first piece isn't on the hook yet
    expect(build.drop).toBeNull();
    for (let i = 0; i < 40; i++) stepBuild(build, DT, { aim: 300 });
    stepBuild(build, DT, { release: true });
    expect(build.drop).not.toBeNull();
    while (build.drop) stepBuild(build, DT);
    expect(build.k).toBe(1);
  });
});
