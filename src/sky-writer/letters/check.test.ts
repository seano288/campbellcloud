// The stroke checker, tuned with scripted fingers: it must never be unfair (a clean or wobbly finger always finishes, and only a real
// wrong start or wrong way is a miss) and never meaningless (a backwards letter, a circle going the wrong way, or a scribble doesn't pass).
import { describe, expect, it } from 'vitest';
import { seeded, type Rng } from '../../game/rng';
import { feed, forPad, MISS_LEN, startProgress, TUNING, type Progress, type Result, type Tuning } from './check';
import { endOf, FAMILIES, FAMILY_IDS, LETTERS, letter, resample, STROKE_WORDS, startOf, type Letter, type Pt, type Stroke } from './strokes';

const LEVELS = [TUNING[1], TUNING[2], TUNING[3], TUNING.write] as const;
const NAMES = ['L1', 'L2', 'L3', 'write'];

interface Finger { step?: number; wobble?: number; wave?: number; jitter?: number; dx?: number; rng?: Rng; reverse?: boolean }

/** A stroke as a finger draws it: points `step` apart along it, pushed sideways by a wave and jitter. */
function drawStroke(s: Stroke, f: Finger = {}): Pt[] {
  const { step = 0.05, wobble = 0, wave = 0.9, jitter = 0, dx = 0, rng = Math.random } = f;
  if (s.dot) return [[s.pts[0]![0] + dx, s.pts[0]![1]]];
  const base = resample(f.reverse ? [...s.pts].reverse() : s.pts, step), phase = rng() * 6;
  return base.map((p, i) => {
    const a = base[Math.max(0, i - 1)]!, b = base[Math.min(base.length - 1, i + 1)]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, k = wobble * Math.sin((i * step * Math.PI * 2) / wave + phase) + jitter * (rng() * 2 - 1);
    // the ends stay put: a wobble is in the middle of a stroke, not at its start
    const ease = Math.min(1, i / 3, (base.length - 1 - i) / 3);
    return [p[0] + nx * k * ease + dx, p[1] + ny * k * ease] as Pt;
  });
}
function write(L: Letter, t: Tuning, paths: readonly Pt[][], prog: Progress = startProgress(t)) {
  const out: Result[] = [];
  for (const p of paths) { const r = feed(L, t, prog, p); out.push(r); prog = r.progress; }
  return { results: out, prog, finished: prog.done >= L.strokes.length, misses: out.filter(r => r.outcome.kind === 'miss') };
}
const clean = (L: Letter, f: Finger = {}) => L.strokes.map(s => drawStroke(s, f));

describe('the letters', { timeout: 30000 }, () => {
  it('has every lowercase letter, capital and number, each in one Family', () => {
    const chars = LETTERS.map(l => l.ch).sort().join('');
    expect(chars).toBe([...'0123456789', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'abcdefghijklmnopqrstuvwxyz'].sort().join(''));
    const inFamilies = FAMILY_IDS.flatMap(f => FAMILIES[f]);
    expect(inFamilies.slice().sort()).toEqual(LETTERS.map(l => l.ch).sort());
  });
  it('says every stroke with the shared stroke words, starting the first with where to start', () => {
    for (const L of LETTERS) {
      expect(L.strokes.length).toBeGreaterThan(0);
      expect(L.strokes[0]!.say[0]).toMatch(/^Start /);
      for (const s of L.strokes) { expect(s.say.length).toBeGreaterThan(0); for (const w of s.say) expect(STROKE_WORDS).toContain(w); }
      for (const [k, s] of L.strokes.entries()) if (k > 0 && s.say.includes('Lift.')) expect(s.say[0]).toBe('Lift.');
    }
  });
  it('keeps every letter on the lines: tall ones from the top, small ones from the middle, tails to the tail line', () => {
    for (const L of LETTERS) {
      const ys = L.strokes.flatMap(s => s.pts.map(p => p[1])), top = Math.min(...ys), bottom = Math.max(...ys);
      expect(top).toBeGreaterThanOrEqual(-0.01);
      expect(bottom).toBeLessThanOrEqual(3.01);
      if (L.size === 'small') { expect(top).toBeGreaterThan(0.3); expect(bottom).toBeLessThanOrEqual(2.01); }
      if (L.size === "tall") { expect(top).toBeLessThan(0.1); expect(bottom).toBeLessThanOrEqual(2.01); }
      if (L.size === 'tail') expect(bottom).toBeGreaterThan(2.5);
      if (L.kind !== 'lower') { expect(top).toBeLessThan(0.1); expect(bottom).toBeGreaterThan(1.95); expect(bottom).toBeLessThan(2.2); }
    }
  });
  it('circles back for the c family, and humps forward for the bumps', () => {
    const turn = (s: Stroke) => { let a = 0; for (let i = 2; i < s.pts.length; i++) { const [p, q, r] = [s.pts[i - 2]!, s.pts[i - 1]!, s.pts[i]!]; a += (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]); } return a; };
    // on the screen (y down) a counterclockwise turn has a negative cross product
    for (const ch of 'cadgoq') expect(turn(letter(ch).strokes[0]!)).toBeLessThan(0);
    for (const ch of 'rnmhbp') expect(turn(letter(ch).strokes.at(-1)!)).toBeGreaterThan(0);
  });
});

describe('a clean finger', { timeout: 30000 }, () => {
  it('writes every letter at every Level, lifting between strokes, fast or slow', { timeout: 30000 }, () => {
    for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) for (const step of [0.02, 0.05, 0.12]) {
      const w = write(L, t, clean(L, { step }));
      expect(w.misses, `${L.ch} ${NAMES[n]} step ${step}`).toEqual([]);
      expect(w.finished, `${L.ch} ${NAMES[n]} step ${step}: ${JSON.stringify(w.results.map(r => r.outcome))}`).toBe(true);
    }
  });
  it('writes without lifting where one stroke runs into the next along the letter (push up, back up and over)', () => {
    let joined = 0;
    for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) {
      // a path through every stroke, going back along what's drawn to the next start when that's on the letter, else lifting
      const paths: Pt[][] = [];
      let cur: Pt[] = [];
      for (const [k, s] of L.strokes.entries()) {
        const pts = drawStroke(s);
        if (k && !s.dot && cur.length && retraceable(L, k)) {
          const back = resample([endOf(L.strokes[k - 1]!), startOf(s)], 0.05);
          cur.push(...back, ...pts); joined++;
        } else { if (cur.length) paths.push(cur); cur = [...pts]; }
      }
      paths.push(cur);
      const w = write(L, t, paths);
      expect(w.misses, `${L.ch} ${NAMES[n]}`).toEqual([]);
      expect(w.finished, `${L.ch} ${NAMES[n]} ${JSON.stringify(w.results.map(r => r.outcome))}`).toBe(true);
    }
    expect(joined).toBeGreaterThan(40);
  });
  it('writes a letter anywhere along the lines in Write It', () => {
    for (const L of LETTERS) for (const dx of [0, 0.6, 1.7, 3.1]) {
      const w = write(L, TUNING.write, clean(L, { dx }));
      expect(w.finished, `${L.ch} at ${dx}`).toBe(true);
      expect(w.prog.dx).toBeCloseTo(dx, 5);
    }
  });
  it('picks up where he lifted partway along a stroke', () => {
    for (const ch of ['l', 'c', 'o', 'S', '2', 'b']) {
      const L = letter(ch), s = L.strokes[0]!, pts = drawStroke(s), half = Math.floor(pts.length / 2);
      const t = TUNING[2], first = feed(L, t, startProgress(t), pts.slice(0, half));
      expect(first.outcome).toEqual({ kind: 'rubout', why: 'lift' });
      const second = feed(L, t, first.progress, pts.slice(half - 1));
      expect(second.finished, ch).toEqual([0]);
    }
  });
});

describe('a wobbly finger', { timeout: 30000 }, () => {
  it('still writes every letter when it wobbles inside the lane', () => {
    const rng = seeded(7);
    for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) for (let k = 0; k < 4; k++) {
      const w = write(L, t, clean(L, { wobble: t.lane * 0.5, jitter: t.lane * 0.15, rng, step: 0.03 + rng() * 0.07 }));
      expect(w.misses, `${L.ch} ${NAMES[n]}`).toEqual([]);
      expect(w.finished, `${L.ch} ${NAMES[n]} ${JSON.stringify(w.results.map(r => r.outcome))}`).toBe(true);
    }
  });
  it('is never told it missed when it wobbles out of the lane: the stroke just rubs out', () => {
    const rng = seeded(11);
    let rubbed = 0;
    for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) for (let k = 0; k < 3; k++) {
      const w = write(L, t, clean(L, { wobble: t.lane * (1.4 + rng()), wave: 0.5 + rng(), jitter: t.lane * 0.3, rng }));
      expect(w.misses, `${L.ch} ${NAMES[n]}`).toEqual([]);
      rubbed += w.results.filter(r => r.outcome.kind === 'rubout').length;
    }
    expect(rubbed).toBeGreaterThan(200);
  });
  it('is never told it missed in thousands of wobbly tries: shaky, misplaced a little, fast and slow, at every Level', () => {
    // a finger that starts up to 0.6 of the start radius off, wobbles up to 1.2 lanes either side (well outside it), jitters, and moves
    // 0.02 to 0.14 a sample; it carries on with the next stroke even when the last rubbed out, as a child who didn't notice would
    const bad: string[] = [];
    let tries = 0, finished = 0;
    for (let seed = 1; seed < 12; seed++) {
      const rng = seeded(seed);
      for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) for (const amp of [0.5, 0.8, 1.2]) {
        let prog = startProgress(t);
        const dx = t.free ? rng() * 2 : 0;
        for (const s of L.strokes) {
          const a = rng() * 6.28, r = rng() * t.startR * 0.6, f = { step: 0.02 + rng() * 0.12, wobble: t.lane * amp, wave: 0.4 + rng() * 1.2, jitter: t.lane * 0.3, rng };
          const path = drawStroke(s, f).map(([x, y]) => [x + dx + Math.cos(a) * r, y + Math.sin(a) * r] as Pt);
          const res = feed(L, t, prog, path);
          prog = res.progress;
          if (res.outcome.kind === 'miss') bad.push(`${L.ch} ${NAMES[n]} wobble ${amp}: ${res.outcome.why}`);
        }
        tries++;
        if (prog.done >= L.strokes.length) finished++;
      }
    }
    expect(bad).toEqual([]);
    expect(tries).toBeGreaterThan(8000);
    expect(finished / tries).toBeGreaterThan(0.25);
  }, 60000);
  it('treats a tap, or a scribble away from the letter, as nothing', () => {
    const rng = seeded(3);
    for (const t of LEVELS) for (const L of LETTERS) {
      const tap = feed(L, t, startProgress(t), [[startOf(L.strokes[0]!)[0] + 2.5, 1.5]]);
      expect(tap.outcome.kind).toBe('rubout');
      // a little scribble out past the right edge of the letter
      const x0 = L.width + 1.2, scrib: Pt[] = Array.from({ length: 30 }, (_, i) => [x0 + rng() * 0.6, 0.5 + (i / 30) * 1.5]);
      expect(feed(L, { ...t, free: false }, { done: 0, dx: 0, partial: null }, scrib).outcome.kind, L.ch).toBe('rubout');
    }
  });
});

describe('a wrong try', { timeout: 30000 }, () => {
  it('is a miss when a stroke goes the wrong way (from its end back to its start)', () => {
    for (const [n, t] of LEVELS.entries()) for (const L of LETTERS) {
      const s = L.strokes[0]!;
      if (s.dot || s.len < MISS_LEN + 0.1) continue;
      // in Write It a stroke that ends at the height it starts (v, w, c, z...) drawn backwards looks like the letter sitting further
      // along the line, drawn the right way from a wrong place: it can only rub out
      if (t.free && Math.abs(endOf(s)[1] - startOf(s)[1]) <= t.startR) continue;
      const r = feed(L, t, startProgress(t), drawStroke(s, { reverse: true }));
      expect(r.outcome.kind, `${L.ch} ${NAMES[n]}`).toBe('miss');
      expect(r.finished).toEqual([]);
    }
  });
  it('is a wrong-way miss when a circle goes forward instead of back', () => {
    const around = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) =>
      resample(Array.from({ length: 61 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / 60) * Math.PI) / 180; return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)] as Pt; }), 0.05);
    for (const t of LEVELS) {
      // a closed circle from its start, around the other way
      for (const ch of ['a', 'd', 'g', 'o', 'q', 'O', '0']) {
        const r = feed(letter(ch), t, startProgress(t), [...letter(ch).strokes[0]!.pts].reverse());
        expect(r.outcome, ch).toMatchObject({ kind: 'miss', why: 'way' });
      }
      // c from its start, clockwise all the way round
      expect(feed(letter('c'), t, startProgress(t), around(0.5, 1.5, 0.5, 0.5, 45, -270)).outcome).toMatchObject({ kind: 'miss', why: 'way' });
    }
  });
  it('is a miss when b is written like d, or p like q, and the other way round (never a pass)', () => {
    for (const [want, wrote] of [['b', 'd'], ['d', 'b'], ['p', 'q'], ['q', 'p']] as const) for (const [n, t] of LEVELS.entries()) {
      const W = letter(wrote), w = write(letter(want), t, clean(W, { dx: t.free ? 0.3 : 0 }));
      expect(w.finished).toBe(false);
      // in Write It, q and p start at the same height a little apart, so a q written like p (or p like q) only rubs out (and the plane shows it
      // after a few rub-outs); everywhere else it is a miss, and taught
      if (!(t.free && (want === 'q' || want === 'p'))) expect(w.misses.length, `${want} written as ${wrote} at ${NAMES[n]}`).toBeGreaterThan(0);
    }
  });
  it('is a wrong-start miss when the letter starts in the wrong place: low on a tall line, the cross of t first, the bar of H first', () => {
    const t = TUNING[2];
    const low = feed(letter('l'), t, startProgress(t), resample([[0, 1], [0, 2]], 0.05));
    expect(low.outcome).toMatchObject({ kind: 'miss', why: 'start' });
    for (const [ch, k] of [['t', 1], ['H', 2], ['T', 1], ['E', 3], ['x', 1]] as const) {
      const r = feed(letter(ch), t, startProgress(t), drawStroke(letter(ch).strokes[k]!));
      expect(r.outcome, ch).toMatchObject({ kind: 'miss' });
    }
    // the dot of i first is only a tap, not a miss
    expect(feed(letter('i'), t, startProgress(t), drawStroke(letter('i').strokes[1]!)).outcome.kind).toBe('rubout');
  });
  it('is a wrong-start miss in Write It when a tall letter starts low, wherever it sits along the line', () => {
    for (const dx of [0, 1.3, 2.6]) {
      const r = feed(letter('h'), TUNING.write, startProgress(TUNING.write), resample([[dx, 1], [dx, 2]], 0.05));
      expect(r.outcome, `${dx}`).toMatchObject({ kind: 'miss', why: 'start' });
    }
  });
  it('almost never reads mashing (a random scribble right over the letter) as a try at it: it rubs out', () => {
    // a real try starts on the letter and is mostly stretches along it one way; a scribble zigzags across it. (The first build read
    // three in four of these as a wrong start at Level 1.)
    const rng = seeded(3);
    for (const t of LEVELS) {
      let misses = 0, tries = 0;
      for (const L of LETTERS) for (let k = 0; k < 20; k++) {
        const W = Math.max(2.1, L.width + 1.3), place = (W - L.width) / 2;
        const pts: Pt[] = Array.from({ length: 6 + Math.floor(rng() * 10) }, () => [-place + rng() * W, -0.2 + rng() * 3.4]);
        if (feed(L, t, startProgress(t), pts).outcome.kind === 'miss') misses++;
        tries++;
      }
      expect(misses, `${misses} of ${tries} at lane ${t.lane}`).toBeLessThanOrEqual(tries * 0.003);
    }
  });
  it('never lets a scribble across the lines write a letter', () => {
    const rng = seeded(5);
    for (const t of [TUNING[2], TUNING[3]]) for (const L of LETTERS) {
      if (L.strokes.length < 2 && L.strokes[0]!.len < 2) continue;
      let pts: Pt[] = [], x = rng() * L.width, y = rng() * 2;
      for (let i = 0; i < 160; i++) { x += (rng() - 0.5) * 0.5; y = Math.max(0, Math.min(2.5, y + (rng() - 0.5) * 0.5)); pts.push([x, y]); }
      expect(write(L, t, [pts]).finished, L.ch).toBe(false);
      pts = [];
    }
  });
});

describe('a real finger', { timeout: 60000 }, () => {
  const seg = (...pts: Pt[]) => resample(pts, 0.04);
  const S = (ch: string, k: number): Pt[] => [...letter(ch).strokes[k]!.pts];
  const ALL_TUNINGS = [...LEVELS, ...LEVELS.map(t => forPad(t, 38))];
  it('writes the ways children really write: a k or K leg from where the arm met the stem, an R leg from the stem, a dot drawn with a wiggle', () => {
    const ways: [string, Pt[][]][] = [
      ['k', [S('k', 0), [...S('k', 1), ...seg([0.05, 1.55], [0.9, 2])]]],
      ['K', [S('K', 0), [...S('K', 1), ...seg([0.05, 1.05], [1.25, 2])]]],
      ['K', [S('K', 0), S('K', 1), seg([0, 1.1], [1.25, 2])]],
      ['R', [S('R', 0), [...S('R', 1), ...seg([0, 1], [1.3, 2])]]],
      ['R', [S('R', 0), S('R', 1), seg([0, 1], [1.3, 2])]],
      ['a', [S('a', 0), seg([0.97, 1.2], [1, 2])]], // no push up: straight down from where the circle closed
      ['d', [[...S('d', 0), ...seg([0.93, 1.25], [1, 0]), ...seg([1, 0], [1, 2])]]], // circle, push up to the top, pull down, all in one
      ['i', [S('i', 0), seg([0, 0.4], [0.06, 0.47], [0.02, 0.5])]],
      ['i', [S('i', 0), seg([-0.05, 0.45], [0.12, 0.45])]],
      ['j', [S('j', 0), seg([0.55, 0.4], [0.68, 0.48], [0.6, 0.5])]],
      ['b', [S('b', 0), seg([0, 1.5]).concat(resample(Array.from({ length: 61 }, (_, i) => { const a = ((180 - 360 * i / 60) * Math.PI) / 180; return [0.5 + 0.5 * Math.cos(a), 1.5 - 0.5 * Math.sin(a)] as Pt; }), 0.04))]],
    ];
    for (const t of ALL_TUNINGS) for (const [ch, paths] of ways) {
      const w = write(letter(ch), t, paths.map(p => p.map(([x, y]) => [x + (t.free ? 0.8 : 0), y] as Pt)));
      expect(w.misses, `${ch} lane ${t.lane.toFixed(2)}`).toEqual([]);
      expect(w.finished, `${ch} lane ${t.lane.toFixed(2)} ${JSON.stringify(w.results.map(r => r.outcome))}`).toBe(true);
    }
  });
  it('is not told to keep going when it lifts just after finishing a stroke', () => {
    for (const t of LEVELS) for (const ch of ['a', 'd', 'b', 'n', 'm', 'h']) {
      const L = letter(ch), r = feed(L, t, startProgress(t), drawStroke(L.strokes[0]!, { dx: t.free ? 0.5 : 0 }));
      expect(r.finished, ch).toEqual([0]);
      expect(r.outcome.kind, ch).toBe('ok');
    }
  });
  it('is never told it missed when it writes the letter bigger or smaller, slanted or tipped (Write It has no guide)', () => {
    const rng = seeded(42), bad: string[] = [];
    for (const [name, t, big] of [['L1', TUNING[1], 0.15], ['L2', TUNING[2], 0.15], ['L3', TUNING[3], 0.15], ['write', TUNING.write, 0.35], ['small pad', forPad(TUNING.write, 40), 0.35]] as const) {
      for (const L of LETTERS) for (let k = 0; k < 16; k++) {
        const sc = 1 - big + rng() * big * 2, shear = (rng() - 0.5) * (big * 1.4), rot = (rng() - 0.5) * 0.15, dx = t.free ? rng() * 2 : 0;
        const ys = L.strokes.flatMap(s => s.pts.map(p => p[1])), cy = (Math.min(...ys) + Math.max(...ys)) / 2, cx = L.width / 2;
        const tf = ([x, y]: Pt): Pt => { let X = (x - cx) * sc; const Y = (y - cy) * sc; X -= shear * Y; return [cx + X * Math.cos(rot) - Y * Math.sin(rot) + dx, cy + X * Math.sin(rot) + Y * Math.cos(rot)]; };
        let p = startProgress(t);
        for (const s of L.strokes) {
          const path = s.dot ? [tf(s.pts[0]!)] : resample(s.pts.map(tf), 0.02 + rng() * 0.1).map(([x, y]) => [x + (rng() - 0.5) * 0.04, y + (rng() - 0.5) * 0.04] as Pt);
          const r = feed(L, t, p, path);
          p = r.progress;
          if (r.outcome.kind === 'miss') bad.push(`${L.ch} ${name} ×${sc.toFixed(2)} slant ${shear.toFixed(2)}: ${r.outcome.why}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
  it('is never told it missed when it sets off the right way and then slides back over what it drew (and off the pad)', () => {
    for (const t of [...LEVELS, forPad(TUNING[3], 50)]) for (const L of LETTERS) for (const [k, s] of L.strokes.entries()) {
      if (s.dot || s.len < 0.6) continue;
      const half = drawStroke(s).slice(0, Math.ceil(s.pts.length / 2)), back = [...half].reverse().slice(1), a = half.at(-1)!, b = s.pts[0]!;
      const off: Pt = [b[0] + (b[0] - a[0]) * 2, b[1] + (b[1] - a[1]) * 2];
      const prog: Progress = { done: k, dx: 0, partial: null };
      for (const path of [[...half, ...back], [...half, ...back, off], [...half, off]]) {
        const r = feed(L, { ...t, free: false }, prog, path.map(([x, y]) => [x, y] as Pt));
        expect(r.outcome.kind, `${L.ch} stroke ${k + 1}`).not.toBe('miss');
      }
    }
  });
  it('is never told it missed when it starts a little beside the start and goes the right way', () => {
    for (const t of LEVELS) for (const L of LETTERS) for (const [ox, oy] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3], [0.25, 0.25]] as const) {
      let p = startProgress(t);
      for (const s of L.strokes) {
        const path = drawStroke(s, { dx: t.free ? 1 : 0 });
        if (path[0]) path.unshift([path[0][0] + ox, path[0][1] + oy]);
        const r = feed(L, t, p, path);
        p = r.progress;
        expect(r.outcome.kind, `${L.ch} from ${ox},${oy}`).not.toBe('miss');
      }
    }
  });
  it('is fair on a small pad (a sideways phone draws a line unit about 40 px): lanes and starts never narrower than a fingertip', () => {
    const t = forPad(TUNING[3], 40);
    expect(t.lane * 40).toBeGreaterThanOrEqual(22);
    expect(t.startR * 40).toBeGreaterThanOrEqual(28);
    expect((t.missStart ?? 0) * 40).toBeGreaterThanOrEqual(44);
    // on a big pad the Level's own numbers stand
    expect(forPad(TUNING[3], 200)).toMatchObject({ lane: TUNING[3].lane, startR: TUNING[3].startR, endR: TUNING[3].endR });
    const rng = seeded(9);
    for (const base of LEVELS) {
      const small = forPad(base, 40);
      for (const L of LETTERS) {
        // a clean or wobbly finger finishes with no miss
        const w = write(L, small, clean(L, { wobble: small.lane * 0.5, jitter: small.lane * 0.15, rng, step: 0.05, dx: small.free ? 0.6 : 0 }));
        expect(w.misses, L.ch).toEqual([]);
        expect(w.finished, `${L.ch} ${JSON.stringify(w.results.map(r => r.outcome))}`).toBe(true);
      }
      // and the wrong way and b written as d are still taught
      for (const ch of ['l', 'o', 'c', 'h', 'b', 'd', '2', '5', 'S']) {
        const s = letter(ch).strokes[0]!;
        if (small.free && Math.abs(endOf(s)[1] - startOf(s)[1]) <= small.startR) continue;
        expect(feed(letter(ch), small, startProgress(small), drawStroke(s, { reverse: true })).outcome.kind, `${ch} backwards`).toBe('miss');
      }
      for (const [want, wrote] of [['b', 'd'], ['d', 'b']] as const) expect(write(letter(want), small, clean(letter(wrote), { dx: small.free ? 0.3 : 0 })).misses.length, `${want} as ${wrote}`).toBeGreaterThan(0);
    }
  });
});

/** Can the finger go from the end of stroke k-1 to the start of stroke k along the letter? */
function retraceable(L: Letter, k: number) {
  const a = endOf(L.strokes[k - 1]!), b = startOf(L.strokes[k]!);
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05) return true;
  const way = resample([a, b], 0.05);
  return way.every(p => L.strokes.slice(0, k + 1).some(s => !s.dot && s.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.2)));
}
