// The Race is the treat, so a clumsy six-year-old must always be able to finish it, and win a Rival's part in the end. These drive it
// with scripted children: one who leads the car with a wobbly finger and lifts it now and then, and one who takes his hands off.
import { describe, expect, it, vi } from 'vitest';
import { seeded, type Rng } from '../../game/rng';
import { fit, starterCar, statsOf, type Car, type PartKey } from '../garage/parts';
import { featuredOn, gridFor, isFinal, MERCY, RIVALS, rivalsIn } from './rivals';
import { COUNT_S, createRace, MAX_S, placeOf, progressOf, stepRace, type Race } from './sim';
import { CUPS, laid, nearest, pointAhead, TRACKS, type TrackDef } from './tracks';

// Hundreds of whole Races, simulated at 120 steps a second: slow on a busy machine, so these get longer than the usual 5 seconds.
vi.setConfig({ testTimeout: 120_000 });

/** A child's finger: ahead of the car, wobbling side to side, sometimes lifted, sometimes late. Boosts on the first long straight-ish bit. */
function child(rng: Rng, wobble = 70) {
  let lift = 0, phase = rng() * 6;
  return (r: Race) => {
    const c = r.cars[0]!;
    if (lift > 0) { lift -= 1 / 120; return { target: null, boost: false }; }
    if (rng() < 1 / 400) lift = .4 + rng(); // looks away
    const t = pointAhead(r.track, c.i, 220 + rng() * 80, Math.sin(r.t * 1.4 + phase) * wobble);
    return { target: t, boost: rng() < 1 / 240 };
  };
}
const handsOff = () => ({ target: null, boost: false });

function run(track: TrackDef, car: Car, losses: number, drive: (r: Race) => { target: ReturnType<typeof pointAhead> | null; boost: boolean }) {
  const grid = gridFor(track, losses);
  const r = createRace(track, { stats: statsOf(car) }, grid.map(g => ({ stats: g.stats, pace: g.pace })));
  while (!r.over) stepRace(r, drive(r));
  return { r, beat: placeOf(r, 0) < placeOf(r, 1) };
}
const build = (...keys: string[]) => keys.reduce((car, k) => fit(car, k as PartKey), starterCar());

describe('the tracks', () => {
  it('are 24, four to a Cup, each a smooth closed loop that never comes near crossing itself', () => {
    expect(TRACKS).toHaveLength(24);
    for (const cup of CUPS) expect(TRACKS.filter(t => t.cup === cup.id)).toHaveLength(4);
    for (const t of TRACKS) {
      const l = laid(t), n = l.pts.length;
      expect(l.length).toBeGreaterThan(4500);
      // any two points far apart along the track are at least a track and a half apart on the ground, so walls never overlap
      for (let i = 0; i < n; i += 3) for (let j = i + 1; j < n; j += 3) {
        const along = Math.min(j - i, n - (j - i)) * 18;
        if (along < t.width * 3) continue;
        expect(Math.hypot(l.pts[i]!.x - l.pts[j]!.x, l.pts[i]!.y - l.pts[j]!.y)).toBeGreaterThan(t.width * 1.5);
      }
      // nearest() finds the right point
      const p = l.pts[Math.floor(n / 3)]!;
      expect(nearest(l, p.x, p.y).i).toBe(Math.floor(n / 3));
    }
  });
});

describe('a Race', () => {
  it('always finishes, about a minute, with hands off or a wobbly finger, in the starter car or the best', () => {
    for (const car of [starterCar(), build('engine:rocket', 'body:rocket', 'tyres:gold', 'wing:mega', 'booster:mega')]) {
      for (const [k, track] of TRACKS.entries()) {
        for (const drive of [handsOff, child(seeded(k + 1))]) {
          const { r } = run(track, car, 0, drive);
          expect(r.cars[0]!.finished).not.toBeNull();
          expect(r.t).toBeLessThan(MAX_S - 30);
          expect(r.t).toBeGreaterThan(30);
          expect(r.order).toHaveLength(4);
          expect(new Set(r.order).size).toBe(4);
        }
      }
    }
  });
  it('takes about a minute in the starter car', () => {
    const times = TRACKS.slice(0, 4).map((t, k) => run(t, starterCar(), 0, child(seeded(k + 9))).r.t);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    expect(mean).toBeGreaterThan(45);
    expect(mean).toBeLessThan(80);
  });
  it('waits for the countdown', () => {
    const r = createRace(TRACKS[0]!, { stats: statsOf(starterCar()) }, []);
    const x = r.cars[0]!.x;
    while (r.t < COUNT_S - .1) stepRace(r, { target: { x: x + 500, y: 0 }, boost: true });
    expect(r.cars[0]!.x).toBe(x);
    expect(r.cars[0]!.boosts).toBe(1);
  });
  it('gives him as many boosts as his Booster says, and no more', () => {
    for (const [k, n] of [['booster:puffer', 1], ['booster:turbo', 3], ['booster:mega', 5]] as const) {
      const r = createRace(TRACKS[0]!, { stats: statsOf(build(k)) }, []);
      let used = 0;
      while (!r.over) { stepRace(r, { target: null, boost: true }); for (const e of r.events) if (e.t === 'boost') used++; r.events = []; }
      expect(used).toBe(n);
    }
  });
});

describe('parts are real', () => {
  const mean = (car: Car, tracks = TRACKS.slice(0, 8)) => tracks.reduce((sum, t, k) => sum + run(t, car, 0, child(seeded(k + 3))).r.t, 0) / tracks.length;
  it('a bigger Engine is faster', () => {
    expect(mean(build('engine:turbo'))).toBeLessThan(mean(starterCar()) * .9);
  });
  it('a fast car with more Grip slides into the walls less and goes round quicker', () => {
    const walls = (car: Car) => {
      let n = 0;
      for (const [k, t] of TRACKS.slice(0, 8).entries()) {
        const grid = gridFor(t, 0), r = createRace(t, { stats: statsOf(car) }, grid.map(g => ({ stats: g.stats, pace: g.pace }))), drive = child(seeded(k + 3));
        while (!r.over) { stepRace(r, drive(r)); for (const e of r.events) if (e.t === 'wall' && e.car === 0) n++; r.events = []; }
      }
      return n;
    };
    const fast = build('engine:rocket'), grippy = build('engine:rocket', 'tyres:gold', 'wing:mega');
    expect(walls(grippy)).toBeLessThan(walls(fast));
    expect(mean(grippy)).toBeLessThan(mean(fast));
  });
  it('the right Tyres for the surface beat the wrong ones', () => {
    const snow = TRACKS.filter(t => t.surface === 'snow');
    const steady = (car: Car) => snow.reduce((s, t, k) => s + run(t, car, 0, child(seeded(k + 5), 20)).r.t, 0);
    expect(steady(build("engine:twin", "tyres:studded"))).toBeLessThan(steady(build("engine:twin", "tyres:slick")));
  });
});

describe('the Rivals', () => {
  it('are 18, three to a Cup, each with its own prize, and every track features one', () => {
    expect(RIVALS).toHaveLength(18);
    for (const cup of CUPS) expect(rivalsIn(cup.id)).toHaveLength(3);
    expect(new Set(RIVALS.map(r => r.prize)).size).toBe(18);
    for (const t of TRACKS) expect(featuredOn(t).cup).toBe(t.cup);
    expect(TRACKS.filter(isFinal)).toHaveLength(6);
  });
  it('the first Rival is a sure thing in the starter car, hands on or off', () => {
    for (let seed = 1; seed <= 12; seed++) expect(run(TRACKS[0]!, starterCar(), 0, child(seeded(seed))).beat).toBe(true);
    expect(run(TRACKS[0]!, starterCar(), 0, handsOff).beat).toBe(true);
  });

  // What he plausibly has when he gets to each Cup: what Rounds buy by then (about 9 Bolts a Round, half on go-faster parts) and the
  // Rival parts already won.
  const PLAUSIBLE: Record<string, Car> = {
    tarmac: build('wing:zippy'),
    dirt: build('engine:zoom', 'body:ace', 'tyres:knobbly', 'wing:zippy', 'booster:fizz'),
    sand: build('engine:crusher', 'body:ace', 'tyres:paddle', 'wing:zippy', 'booster:fizz'),
    snow: build('engine:crusher', 'body:jumper', 'tyres:studded', 'wing:spoiler', 'booster:nitro'),
    night: build('engine:turbo', 'body:sports', 'tyres:race', 'wing:big', 'booster:turbo'),
    volcano: build('engine:twin', 'body:shadow', 'tyres:knobbly', 'wing:icicle', 'booster:pack'),
  };
  it('a plausible car for that point beats each featured Rival within three tries', () => {
    const tries: string[] = [];
    for (const [k, t] of TRACKS.entries()) {
      let n = 0;
      while (n < 6 && !run(t, PLAUSIBLE[t.cup]!, n, child(seeded(k * 7 + n + 1))).beat) n++;
      tries.push(`${t.name} ${n + 1}`);
      expect(n, `${t.name}: ${n + 1} tries`).toBeLessThan(3);
    }
  });
  it('every Rival falls to the starter car in the end, because it slows after each win', () => {
    expect(MERCY).toBeGreaterThan(0);
    for (const [k, t] of TRACKS.entries()) {
      let n = 0;
      while (n < 14 && !run(t, starterCar(), n, child(seeded(k * 13 + n))).beat) n++;
      expect(n, t.name).toBeLessThan(14);
    }
  });
  it('ease off when far ahead of him, so he is never left alone on the track', () => {
    const t = TRACKS[20]!, grid = gridFor(t, 0);
    const r = createRace(t, { stats: statsOf(starterCar()) }, grid.map(g => ({ stats: g.stats, pace: g.pace })));
    let most = 0;
    while (!r.over) { stepRace(r, { target: null, boost: false }); most = Math.max(most, progressOf(r, r.cars[1]!) - progressOf(r, r.cars[0]!)); }
    expect(most).toBeLessThan(laid(t).length * 1.2);
  });
});
