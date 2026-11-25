// Teaching a miss on the scene itself, never with a red X: the scene plays, slowly, and the voice says what happened.
//
// The first miss gets the brief's short lesson, then "Try again!" with the right choice lit:
// - Push or Pull: the hand pushes or pulls, an arrow grows from it, and the thing moves along the arrow.
// - Hills: both carts run side by side with a height bar beside each. "This one started higher, so it is going faster."
// - Heavy and Light: both carts get the same push, shown as the same arrow, and the full one barely moves.
// - Rough and Smooth: the cart slides on each ground in turn, and the rough one is shown close up, catching the wheels.
// - Bump: the meeting plays in slow motion with arrows before and after.
// - Magnets: the magnet moves in and the thing jumps to it, or does not.
// The second miss (or the first when he's been missing a lot, or 🔎) is hands-on: he taps each cart, ball or thing to make it go himself,
// and the voice says what he is seeing. At Level 3 the fuller lesson also gives the school word (force, friction).
import { signal, type Signal } from '@preact/signals';
import { sChime, sWhoosh } from '../../audio/sfx';
import type { Asking } from '../mix';
import type { Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import type { Marks } from '../art/scene';
import { laneDuration, lanesOf } from './scenes';
import { actIs } from './scenes';
import { thingOf } from './tables';
import type { Question } from './problems';

/** A scene's lanes, each with its own clock: started at a moment, running at a speed, stopping at its end. */
export interface Player {
  readonly marks: Signal<Marks>;
  /** The choice to light after a lesson. */
  readonly hint: Signal<string | null>;
  /** Lanes waiting for his tap (the hands-on lesson). */
  readonly waiting: Signal<readonly number[]>;
  /** Each lane's clock now. */
  clocks(now?: number): number[];
  play(lanes: readonly number[] | 'all', speed: number, signal: AbortSignal): Promise<void>;
  reset(): void;
  /** He tapped a lane (the view calls this). */
  tap(lane: number): void;
  readonly task: { start(): VoiceScope; cancel(): void };
}

interface Run { start: number; speed: number; end: number }
/** The longest any lane takes to play, in seconds. */
export const LONGEST_PLAY = 4.5;
const players = new WeakMap<AbortSignal, { p: Player; q: Question }>();
export function playerFor(lifetime: AbortSignal, q: Question): Player {
  const hit = players.get(lifetime);
  if (hit && hit.q === q) return hit.p;
  const n = lanesOf(q.scene), runs: (Run | null)[] = Array.from({ length: n }, () => null);
  const held: number[] = Array.from({ length: n }, () => 0);
  let tapped: ((lane: number) => void) | null = null, current: VoiceScope | null = null;
  const p: Player = {
    marks: signal({}), hint: signal(null), waiting: signal([]),
    clocks(now = performance.now()) {
      return runs.map((r, i) => (r ? Math.min(r.end, ((now - r.start) / 1000) * r.speed) : held[i]!));
    },
    play(lanes, speed, sig) {
      const which = lanes === 'all' ? runs.map((_, i) => i) : lanes, now = performance.now();
      let longest = 0;
      // no lane takes longer than LONGEST_PLAY seconds to watch: a cart coasting a long way on ice is sped up
      for (const i of which) { const end = laneDuration(q.scene, i), sp = Math.max(speed, end / LONGEST_PLAY); runs[i] = { start: now, speed: sp, end }; longest = Math.max(longest, end / sp); }
      sWhoosh(0.3);
      return new Promise(done => {
        const t = setTimeout(done, longest * 1000 + 150);
        sig.addEventListener('abort', () => { clearTimeout(t); done(); }, { once: true });
      });
    },
    reset() { for (let i = 0; i < n; i++) { runs[i] = null; held[i] = 0; } },
    tap(lane) { if (p.waiting.peek().includes(lane)) tapped?.(lane); },
    task: { cancel: () => current?.cancel(), start() { current?.cancel(); const v = createVoiceScope(lifetime); current = v; return v; } },
  };
  /** Waits for him to tap each of these lanes (playing each as he taps it), or plays the rest by itself after a while. */
  (p as Player & { handsOn(lanes: readonly number[], v: VoiceScope): Promise<void> }).handsOn = (lanes, v) => new Promise(done => {
    const left = new Set(lanes);
    p.waiting.value = [...left];
    let quiet = setTimeout(finish, 9000);
    function finish() { clearTimeout(quiet); tapped = null; p.waiting.value = []; for (const i of left) void p.play([i], 1, v.signal); left.clear(); done(); }
    tapped = lane => {
      if (!left.has(lane)) return;
      left.delete(lane); p.waiting.value = [...left]; sChime();
      void p.play([lane], 1, v.signal);
      clearTimeout(quiet);
      if (!left.size) { tapped = null; setTimeout(done, laneDuration(q.scene, lane) * 1000 + 200); } else quiet = setTimeout(finish, 9000);
    };
    v.signal.addEventListener('abort', () => { clearTimeout(quiet); tapped = null; p.waiting.value = []; done(); }, { once: true });
  });
  players.set(lifetime, { p, q });
  return p;
}
const handsOn = (p: Player, lanes: readonly number[], v: VoiceScope) => (p as Player & { handsOn(l: readonly number[], v: VoiceScope): Promise<void> }).handsOn(lanes, v);

const say = (x: string) => x as Phrase;
const all = (q: Question) => Array.from({ length: lanesOf(q.scene) }, (_, i) => i);
/** Lessons play slowly, but never longer than about five seconds. */
const slow = (q: Question) => Math.min(.6, Math.max(...all(q).map(i => laneDuration(q.scene, i))) / 5) || .6;
const slowFor = (q: Question) => Math.max(slow(q), Math.max(...all(q).map(i => laneDuration(q.scene, i))) / 6);

/** What to say for each kind, and what to show. */
async function lessonOf(p: Asking, teach: boolean, v: VoiceScope, pl: Player) {
  const q = p.q, sc = q.scene, l3 = q.level === 3;
  const replay = async (speed = slowFor(q)) => { pl.reset(); await v.wait(250); if (v.active) await pl.play('all', speed, v.signal); };
  const yourTurn = async (line: Phrase, lanes = all(q)) => { pl.reset(); await v.say(line); if (v.active) await handsOn(pl, lanes, v); };
  switch (sc.type) {
    case 'act': {
      const push = actIs(sc.act) === 'push';
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap it to make it move.'); else await replay(.5);
      if (v.active) await v.say(push ? 'A push moves a thing away from you.' : 'A pull moves a thing toward you.');
      if (v.active) await v.say(push ? 'So it is a push.' : 'So it is a pull.');
      return;
    }
    case 'way':
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap it to make it move.'); else await replay(.6);
      if (v.active) await v.say(sc.by === 'push' ? 'It moves the way it is pushed.' : 'It moves the way the rope pulls it.');
      return;
    case 'pushes':
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap a cart to push it.'); else await replay();
      if (v.active) await v.say('The big push makes it go faster, so it goes farther.');
      if (teach && l3 && v.active) await v.say('A push or a pull is called a force.');
      return;
    case 'hills': {
      pl.marks.value = { bars: true, arrows: true };
      if (teach) await yourTurn('Your turn! Tap a cart to let it go.'); else await replay();
      if (!v.active) return;
      const withHill = sc.lanes.some(l => l.hill !== undefined);
      if (!withHill) { await v.say('This one started higher, so it is going faster.'); if (teach && v.active) await v.say('The higher it starts, the faster it goes at the bottom.'); return; }
      await v.say('It can not go higher than where it started.');
      if (v.active) await v.say(sc.lanes.length === 1 ? (q.answer === 'yes' ? 'The next hill is lower than where it started, so it gets over.' : 'The next hill is higher than where it started, so it rolls back.') : 'Only the one that started higher than its hill gets over.');
      if (teach && v.active) await v.say('It does not matter how heavy it is. Only how high it starts.');
      return;
    }
    case 'loads': {
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap a cart to push it.'); else await replay(.7);
      if (!v.active) return;
      if (sc.mode === 'far') { await v.say('Both carts get the same push.'); if (v.active) await v.say('The full cart is heavy, so it hardly moves. The empty cart is light, so it goes farther.'); }
      if (sc.mode === 'start') await v.say('The same push gets the light cart going. The heavy cart needs a bigger push.');
      if (sc.mode === 'stop') await v.say('The heavy cart is harder to stop. It keeps going for longer.');
      if (teach && l3 && v.active) await v.say('A push or a pull is called a force.');
      return;
    }
    case 'grounds': {
      // the cart on each ground in turn, then the roughest close up
      const rough = sc.lanes.reduce((a, _l, i) => (laneDuration(sc, i) < laneDuration(sc, a) ? i : a), 0);
      if (teach) await yourTurn('Your turn! Tap a cart to push it.');
      else { pl.reset(); for (const i of all(q)) { if (!v.active) return; await pl.play([i], 1.2, v.signal); } }
      if (!v.active) return;
      pl.marks.value = { zoom: rough }; sChime();
      await v.say('Rough ground rubs the wheels and slows the cart down.');
      if (v.active) await v.say('Smooth ground lets it roll a long way.');
      if (teach && l3 && v.active) await v.say('The rubbing is called friction.');
      return;
    }
    case 'bump':
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap the ball to roll it.'); else await replay(.45);
      if (!v.active) return;
      if (sc.mode === 'ball') await v.say('The rolling ball stops, and the still ball rolls on the same way.');
      else if (sc.mode === 'wall') await v.say(sc.v.y === 0 ? 'It hits the wall and comes straight back.' : 'It bounces off the wall the other way, like in a mirror.');
      else await v.say('The push from the side adds to the way it was going, so it goes off in between.');
      return;
    case 'magnet': {
      if (teach) await yourTurn('Your turn! Tap to bring the magnet near.');
      else { pl.reset(); for (const i of all(q)) { if (!v.active) return; await pl.play([i], 1, v.signal); } }
      if (!v.active) return;
      await v.say('Magnets pull things made of iron or steel.');
      if (sc.mode === 'will' && v.active) { const t = thingOf(sc.things[0]!); await v.say(say(t.name), t.magnetic ? 'It is iron or steel, so the magnet pulls it.' : 'It is not iron or steel, so the magnet does not pull it.'); }
      else if (v.active) await v.say('They do not pull wood, plastic, paper, glass or rubber.');
      return;
    }
    case 'poles':
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap to let the magnets go.'); else await replay(.6);
      if (v.active) await v.say(q.answer === 'together' ? 'Different ends pull together.' : 'The same ends push apart.');
      if (teach && v.active) await v.say(q.answer === 'together' ? 'The same ends push apart.' : 'Different ends pull together.');
      return;
    case 'near':
      pl.marks.value = { arrows: true };
      if (teach) await yourTurn('Your turn! Tap to bring the magnet near.'); else await replay(.6);
      if (v.active) await v.say('A magnet pulls harder when it is near.');
      if (teach && v.active) await v.say('Too far away, and it can not pull at all.');
      return;
    case 'through':
      if (teach) await yourTurn('Your turn! Tap to bring the magnet near.'); else await replay(.6);
      if (v.active) await v.say('A magnet can pull through paper, card or cloth.');
      if (v.active) { const t = thingOf(sc.thing); await v.say(t.magnetic ? 'It is iron or steel, so the magnet pulls it.' : 'It is not iron or steel, so the magnet does not pull it.'); }
      return;
  }
}

export async function explain(p: Asking, _answer: string, teach: boolean, lifetime: AbortSignal) {
  const pl = playerFor(lifetime, p.q), v = pl.task.start();
  pl.marks.value = {}; pl.hint.value = null;
  await v.say(teach ? "Let's look together." : 'Not quite!');
  await lessonOf(p, teach, v, pl);
  if (v.active) await v.say('Try again!');
  // back to the start so he can answer again, with the answer lit and the lesson's marks still drawn
  pl.reset();
  pl.hint.value = p.q.answer;
}

/** 🔎 runs the whole lesson. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const pl = playerFor(lifetime, p.q), v = pl.task.start();
  pl.marks.value = {};
  await lessonOf(p, true, v, pl);
  pl.reset();
}
