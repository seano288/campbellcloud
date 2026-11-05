// Plays whole fights with a simulated six-year-old at the wheel, so the League's difficulty is measured rather than guessed. `kid` steers
// toward the rival a beat late and a little off line, and taps the big button now and then. It's clumsier than he'll be after a week.
import { describe, expect, it } from 'vitest';
import { powerOf, starterBuild, statsOf, type Build } from '../bot/build';
import { seeded } from '../../game/rng';
import { RIVALS, type Rival } from '../league/rivals';
import { createBrain, think } from './ai';
import { createFight, finished, FIGHT_SECONDS, IDLE, starsFor, stepFight, STEP, type Fight, type Input } from './sim';

function kid(s: Fight, rng: () => number) {
  let plan: Input = { ...IDLE }, wait = 0, wobble = 0;
  return () => {
    const me = s.bots[0], foe = s.bots[1];
    plan = { ...plan, hit: false, boost: false };
    if ((wait -= STEP) > 0) return plan;
    wait = .2 + rng() * .25;
    wobble = (rng() - .5) * 1.1;
    const to = Math.atan2(foe.y - me.y, foe.x - me.x) + wobble, gap = Math.hypot(foe.x - me.x, foe.y - me.y);
    return (plan = { x: Math.cos(to), y: Math.sin(to), hit: gap < 220 && rng() < .55, boost: gap > 300 && rng() < .12 });
  };
}
export function playOut(build: Build, r: Rival, seed: number, losses = 0) {
  const rng = seeded(seed), mercy = 1 - Math.min(.5, losses * .12);
  const s = createFight({ build }, { build: r.build, hp: r.hp * mercy, speed: r.speed * (1 - losses * .03), hit: r.hit }, r.arena, rng);
  const brain = createBrain(r.style, r.skill), you = kid(s, rng);
  let n = 0;
  while (!finished(s) && n++ < (FIGHT_SECONDS + 5) * 60) {
    stepFight(s, [you(), think(s, s.bots[1], s.bots[0], brain, STEP)]);
    s.events.length = 0;
  }
  return { won: s.over?.winner === 0, ko: !!s.over?.ko, t: s.t, stars: starsFor(s), bolts: s.bolts, left: s.bots[0].hp / s.bots[0].maxHp };
}
const rate = (build: Build, r: Rival, n = 40) => {
  const runs = Array.from({ length: n }, (_, i) => playOut(build, r, i * 7 + 1));
  return { wins: runs.filter(x => x.won).length / n, ko: runs.filter(x => x.ko).length / n, t: Math.round(runs.reduce((a, x) => a + x.t, 0) / n) };
};
/** What he might plausibly have built by the time he reaches each rival: a part or two better than the last. */
const plausible: Build[] = [
  starterBuild(),
  { ...starterBuild(), adds: { front: 'rusty' } },
  { ...starterBuild(), wheels: 'big', adds: { front: 'anvil', back: 'magnet' } },
  { ...starterBuild(), body: 'wedge', wheels: 'big', adds: { front: 'anvil', left: 'shield', right: 'spike' } },
  { ...starterBuild(), body: 'wedge', wheels: 'grip', adds: { front: 'saw', left: 'shield', right: 'launch' } },
  { ...starterBuild(), body: 'shell', wheels: 'grip', adds: { front: 'whirly', left: 'shield', right: 'shield', back: 'spike' } },
  { ...starterBuild(), body: 'shell', wheels: 'tread', adds: { front: 'blade', left: 'brick', right: 'anvil', back: 'shield' } },
  { ...starterBuild(), body: 'shell', wheels: 'zip', adds: { front: 'whirly', left: 'brick', right: 'claw', back: 'repair' } },
  { ...starterBuild(), body: 'tank', wheels: 'zip', adds: { front: 'drum', left: 'prickle', right: 'prickle', back: 'repair' } },
  { ...starterBuild(), body: 'boulder', wheels: 'race', adds: { front: 'drum', left: 'gold', right: 'gold', back: 'repair' } },
  { ...starterBuild(), body: 'titan', wheels: 'zip', adds: { front: 'mega', left: 'gold', right: 'gold', back: 'repair' } },
  { ...starterBuild(), body: 'titan', wheels: 'hover', adds: { front: 'mega', left: 'gianth', right: 'gold', back: 'gold' } },
];

describe('the League, played by a clumsy six-year-old', () => {
  it('prints the table', () => {
    for (const [i, r] of RIVALS.entries()) {
      const b = plausible[i]!, got = rate(b, r), starter = rate(starterBuild(), r, 16);
      console.log(`${String(i + 1).padStart(2)} ${r.name.padEnd(10)} power ${String(powerOf(b)).padStart(2)} v ${String(powerOf(r.build)).padStart(2)}  speed ${statsOf(b).speed}  wins ${got.wins.toFixed(2)} ko ${got.ko.toFixed(2)} ${got.t}s   (starter wins ${starter.wins.toFixed(2)})`);
    }
  }, 120_000);
  it('the first rival is a sure thing with the robot he starts with', () => expect(rate(starterBuild(), RIVALS[0]!).wins).toBeGreaterThan(.85));
  it('every rival can be beaten with what he has by then, more often than not', () => {
    for (const [i, r] of RIVALS.entries()) expect(rate(plausible[i]!, r).wins, r.name).toBeGreaterThan(.5);
  }, 120_000);
  it('late rivals cannot be beaten by the starter, so building matters', () => {
    for (const r of RIVALS.slice(6)) expect(rate(starterBuild(), r, 16).wins, r.name).toBeLessThan(.2);
  }, 120_000);
  it('fights end, usually by a knockout, and they are short enough for him', () => {
    for (const [i, r] of RIVALS.entries()) { const got = rate(plausible[i]!, r, 20); expect(got.t, r.name).toBeLessThan(75); }
  }, 120_000);
  it('losing makes the same rival easier', () => {
    const r = RIVALS[6]!, weak = plausible[2]!;
    const wins = (losses: number) => Array.from({ length: 30 }, (_, i) => playOut(weak, r, i + 1, losses)).filter(x => x.won).length;
    expect(wins(4)).toBeGreaterThan(wins(0));
  }, 60_000);
});
