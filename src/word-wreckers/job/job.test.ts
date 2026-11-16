// The Job is the treat, so a clumsy six-year-old must always be able to finish it: these play it with simple scripted children, with
// every machine on every material.
import { describe, expect, it } from 'vitest';
import { seeded, type Rng } from '../../game/rng';
import { piecesOf } from '../art/buildings';
import { BUILDINGS, WRECKERS, type MachineId, type Tier } from '../yard/shop';
import { B_GROUND, createBuild, pieceH, stepBuild } from './build';
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

const opts = (m: MachineId, power: number) => ({ power, size: 1, speed: 1, ...(m === 'crane' || m === 'mega' ? { ball: m === 'mega' ? { len: 120, r: 23 } : { len: 116, r: 17 } } : {}) });

describe('knocking it down', () => {
  it('never has more bricks than the iPad 9 can push around', () => {
    for (const tier of TIERS) for (let s = 0; s < OLD_SHAPES[tier].length; s++) expect(createWreck(tier, s, 'crane', opts('crane', 4)).bricks.length).toBeLessThanOrEqual(MAX_BRICKS);
  });
  it('always comes down, whoever plays, with every machine on every material it is strong enough for, and finds all three Bolts', () => {
    for (const m of WRECKERS) for (const tier of TIERS) for (const style of ['good', 'taps', 'random'] as const) for (let shape = 0; shape < 3; shape++) {
      const w = createWreck(tier, shape, m, opts(m, 4)), rng = seeded(tier * 31 + shape * 7 + m.length);
      const t = play(w, style, rng);
      expect(w.done, `${m} tier ${tier} shape ${shape} ${style} (${standing(w).length} left after ${t.toFixed(0)}s)`).toBe(true);
      expect(standing(w)).toHaveLength(0);
      expect(w.bolts).toBe(BOLTS_HIDDEN);
      if (style === 'good') expect(t, `${m} tier ${tier} ${style}`).toBeLessThan(90);
    }
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
