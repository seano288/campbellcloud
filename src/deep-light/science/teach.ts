// Teaching a miss, never with a red X: the lesson shows it happen on the question's own picture, and says it in one short line.
//
// - Light to See: the lamp in the dark cave switches on and the animal appears. The things that make their own light glow. The sun
//   shines on the moon and its light bounces off.
// - Through or Not: the beam runs to the thing and stops at it, carries on dim, or carries on bright, and the wall shows it.
// - Shadows: the shadow lines up with its thing; the lamp moves and the shadow swings to the other side.
// - Mirrors: the beam bounces off the mirror and not off the rock; the mirror turns step by step and the beam swings with it.
// - Shake and Sound: the rings grow for a loud sound; the string is plucked, shakes and hums, then stops and the sound stops.
// - Signals: the light reaches the friend in the dark; the lighthouse flashes again, slowly, counted.
//
// A second miss (or the first when he's been missing a lot, or 🔎, which counts as help) slows the same thing down and then hands it to
// him: he switches on the lamp, runs the beam, drags the lamp, turns the mirror, plucks the string, flashes the light. The lesson waits
// for him (or a few seconds), and then he answers.
import { signal, type Signal } from '@preact/signals';
import { sChime, sClink } from '../../audio/sfx';
import { beep, hum } from '../sounds';
import type { Asking } from '../mix';
import type { Phrase } from '../phrases';
import { createVoiceScope, type VoiceScope } from '../voice';
import { hitsGem, TURNS, type Turn } from './optics';
import { STAGE, type Question } from './problems';
import {
  FLASH_SAID, HELLO, KEY, KEY_LINE, MATERIALS, MIRROR_LINES, PASS_SAID, SCHOOL_WORD, SEE_LINES, SHADOW_LINES, SIGNAL_LINES, SOUND_LINES, THROUGH_LINES,
} from './things';

export type Show =
  /** Light to See: the dark cave's lamp switched on. */
  | { kind: 'cave'; on: boolean }
  /** The things that make their own light, glowing. */
  | { kind: 'glow'; ids: readonly string[] }
  /** The sun shining on the moon (0 nothing yet, 1 its light reaches the moon, 2 bounces to us). */
  | { kind: 'moon'; step: number }
  /** Through or Not: the beam run this far (0..1) at this thing. */
  | { kind: 'beam'; item: string; run: number }
  /** Mirrors: the lamp shining at one thing. */
  | { kind: 'bounce'; item: string }
  /** Mirrors: the lab's mirrors turned like this, the beam shown; or a mirror standing in spot `spot`. */
  | { kind: 'lab'; turns: readonly Turn[]; spot?: number }
  /** Shadows: the lamp here, the shadow shown. */
  | { kind: 'lamp'; x: number; y: number }
  /** Shadows Level 1: the thing's own shadow beside it. */
  | { kind: 'match' }
  /** Sound: this one's rings pulsing; or the string shaking or stopped. */
  | { kind: 'rings'; id: string }
  | { kind: 'string'; shaking: boolean }
  /** Signals: the lighthouse lit or dark, `n` flashes counted so far; or the flashlight reaching the friend. */
  | { kind: 'flash'; on: boolean; n: number; i?: number }
  | { kind: 'hello' };

/** What he can do himself in a second lesson. The stage shows it as a button or a handle; doing it calls `did()`. */
export type TryIt = 'lamp' | 'beam' | 'drag' | 'turn' | 'pluck' | 'flash';

export interface Lesson {
  readonly show: Signal<Show | null>;
  /** The answer, left glowing after a fuller lesson. */
  readonly glow: Signal<string | null>;
  /** A choice being read out. */
  readonly lit: Signal<string | null>;
  /** What he can try himself now, if anything. */
  readonly tryIt: Signal<TryIt | null>;
  did(): void;
  /** Waits until he has done what tryIt asks (did()), or `ms`. */
  waitTry(ms: number, v: VoiceScope): Promise<void>;
  readonly task: { start(): VoiceScope; cancel(): void };
}

const lessons = new WeakMap<AbortSignal, Lesson>();
export function lessonFor(lifetime: AbortSignal): Lesson {
  let lesson = lessons.get(lifetime);
  if (!lesson) {
    let current: VoiceScope | null = null, done = () => {};
    const tryIt = signal<TryIt | null>(null);
    lesson = {
      show: signal(null), glow: signal(null), lit: signal(null), tryIt,
      did: () => done(),
      waitTry: (ms, v) => new Promise<void>(resolve => {
        const end = () => { done = () => {}; tryIt.value = null; clearTimeout(timer); resolve(); };
        const timer = setTimeout(end, ms);
        done = end;
        v.signal.addEventListener('abort', end, { once: true });
      }),
      task: { cancel: () => current?.cancel(), start() { current?.cancel(); return (current = createVoiceScope(lifetime)); } },
    };
    lessons.set(lifetime, lesson);
  }
  return lesson;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
const beat = (v: VoiceScope, ms: number) => v.wait(reduced() ? ms / 3 : ms);
/** Hands the stage to him: `kind` says what he can do; waits until he's done it (or a while). */
async function letHimTry(l: Lesson, v: VoiceScope, kind: TryIt, line: Phrase, ms = 9000) {
  if (!v.active) return;
  l.tryIt.value = kind;
  await v.say(line);
  await l.waitTry(ms, v);
  l.tryIt.value = null;
  await beat(v, 600);
}

/** Runs the beam from the lamp to the wall, at a child's pace (slow: half that pace). */
async function runBeam(l: Lesson, v: VoiceScope, item: string, slow: boolean) {
  for (let i = 0; i <= 20 && v.active; i++) { l.show.value = { kind: 'beam', item, run: i / 20 }; await v.wait((slow ? 80 : 40) * (reduced() ? 0.3 : 1)); }
}
const passOf = (id: string) => MATERIALS.find(m => m.id === id)!.pass;
const throughLine = (id: string): Phrase => (passOf(id) === 'all' ? THROUGH_LINES.goes : passOf(id) === 'some' ? THROUGH_LINES.some : THROUGH_LINES.stops);

/** Moves the shadow scene's lamp from one side to the other, the shadow following. */
async function swingLamp(l: Lesson, v: VoiceScope, from: number, to: number, slow: boolean) {
  const steps = slow ? 30 : 16;
  for (let i = 0; i <= steps && v.active; i++) {
    const x = from + ((to - from) * i) / steps;
    l.show.value = { kind: 'lamp', x, y: 40 + Math.sin((i / steps) * Math.PI) * 10 };
    await v.wait(reduced() ? 20 : 60);
  }
}

/** Turns the lab's mirrors to the answer one step at a time, the beam swinging with each step. */
async function turnToAnswer(l: Lesson, v: VoiceScope, q: Extract<Question, { kind: 'mirror'; form: 'turn' | 'two' }>, slow: boolean) {
  const target = q.answer.split(',').map(Number) as Turn[], turns = q.lab.mirrors.map(m => m.turn);
  for (let i = 0; i < turns.length && v.active; i++) {
    while (turns[i] !== target[i] && v.active) {
      turns[i] = ((turns[i]! + 1) % 4) as Turn;
      sClink();
      l.show.value = { kind: 'lab', turns: [...turns] };
      await beat(v, slow ? 900 : 500);
    }
  }
}

async function flashes(l: Lesson, v: VoiceScope, pattern: string, slow: boolean, say: boolean) {
  for (let i = 0; i < pattern.length && v.active; i++) {
    const long = pattern[i] === 'l';
    l.show.value = { kind: 'flash', on: true, n: i + 1, i };
    beep(long ? 0.6 : 0.18);
    if (say) await v.say(FLASH_SAID[long ? 'l' : 's']);
    else await v.wait((long ? 700 : 220) * (slow ? 1.4 : 1));
    l.show.value = { kind: 'flash', on: false, n: i + 1, i };
    await v.wait(slow ? 500 : 320);
  }
}

async function teach(q: Question, answer: string, full: boolean, l: Lesson, v: VoiceScope) {
  if (q.kind === 'see') {
    if (q.form === 'cave' || q.form === 'why') {
      l.show.value = { kind: 'cave', on: false };
      await beat(v, full ? 900 : 400);
      sChime();
      l.show.value = { kind: 'cave', on: true };
      await v.say(q.form === 'why' ? SEE_LINES.dark : SEE_LINES.lamp);
      if (full) { l.show.value = { kind: 'cave', on: false }; await letHimTry(l, v, 'lamp', 'Tap the lamp!'); if (q.form === 'why') await v.say(SEE_LINES.lamp); }
      l.show.value = q.form === 'cave' ? null : l.show.value;
      return;
    }
    if (q.form === 'sunmoon' || (q.form === 'own' && q.moon && answer.split('+').includes('moon'))) {
      for (let step = 0; step <= 2 && v.active; step++) { l.show.value = { kind: 'moon', step }; await beat(v, full ? 1000 : 500); }
      await v.say(SEE_LINES.moon);
      if (q.form === 'sunmoon') await v.say(SEE_LINES.sun);
      if (full) { l.show.value = { kind: 'moon', step: 0 }; await letHimTry(l, v, 'lamp', 'Now you try!'); }
      if (q.form === 'sunmoon') return;
    }
    if (q.form === 'own') {
      const ids = q.answer.split('+');
      l.show.value = { kind: 'glow', ids };
      sChime();
      await v.say(SEE_LINES.own);
      return;
    }
    return;
  }
  if (q.kind === 'through') {
    const items = q.form === 'pick' ? q.choices : q.form === 'sort' ? q.items : [q.item];
    // the one he picked first (it's the miss), then the rest
    const order = q.form === 'pick' && answer ? [answer, ...items.filter(i => i !== answer)] : items;
    for (const it of order) {
      if (!v.active) return;
      await runBeam(l, v, it, full);
      if (q.form === 'sort') await v.say(PASS_SAID[passOf(it)]);
      else await v.say(full && q.form === 'wall' ? SCHOOL_WORD[passOf(it)] : throughLine(it));
      await beat(v, 300);
    }
    if (full) { l.show.value = { kind: 'beam', item: items[0]!, run: 0 }; await letHimTry(l, v, 'beam', 'Tap the light!'); }
    return;
  }
  if (q.kind === 'shadow') {
    if (q.form === 'match') {
      l.show.value = { kind: 'match' };
      sChime();
      await v.say(SHADOW_LINES.match);
      return;
    }
    const L = STAGE.lamps, start = q.form === 'where' ? L[q.lamp] : L.left;
    l.show.value = { kind: 'lamp', x: start.x, y: start.y };
    await v.say(SHADOW_LINES.away);
    await swingLamp(l, v, start.x, start.x < 50 ? L.right.x : L.left.x, full);
    await v.say(SHADOW_LINES.swing);
    await swingLamp(l, v, start.x < 50 ? L.right.x : L.left.x, start.x, full);
    if (full) await letHimTry(l, v, 'drag', SHADOW_LINES.yourTurn, 12000);
    l.show.value = null; // the scene goes back for him to answer
    return;
  }
  if (q.kind === 'mirror') {
    if (q.form === 'which') {
      const order = [answer && answer !== 'mirror' ? answer : q.choices.find(c => c !== 'mirror')!, 'mirror'];
      for (const it of order) { if (!v.active) return; l.show.value = { kind: 'bounce', item: it }; sClink(); await beat(v, full ? 1400 : 800); }
      await v.say(MIRROR_LINES.bounces);
      if (full) await letHimTry(l, v, 'beam', 'Tap the light!');
      return;
    }
    if (q.form === 'spot') {
      for (let i = 0; i < q.spots.length && v.active; i++) {
        l.show.value = { kind: 'lab', turns: [q.turn], spot: i };
        sClink();
        await beat(v, full ? 1300 : 800);
        if (hitsGem({ ...q.lab, mirrors: [{ ...q.spots[i]!, turn: q.turn }] })) break;
      }
      await v.say(MIRROR_LINES.bounces);
      await beat(v, 500);
      l.show.value = null; // the mirror comes out again for him to place
      return;
    }
    l.show.value = { kind: 'lab', turns: q.lab.mirrors.map(m => m.turn) };
    await v.say(MIRROR_LINES.turn);
    if (full) {
      // every step of the first mirror, slowly, the beam swinging with it, then back to where it was for him to turn
      const turns = q.lab.mirrors.map(m => m.turn);
      for (const t of TURNS) { if (!v.active) return; turns[0] = t; sClink(); l.show.value = { kind: 'lab', turns: [...turns] }; await beat(v, 800); }
      l.show.value = null;
      await v.say(MIRROR_LINES.yourTurn);
      return;
    }
    await turnToAnswer(l, v, q, false);
    await beat(v, 600);
    l.show.value = null; // the mirrors go back for him to turn
    return;
  }
  if (q.kind === 'sound') {
    if (q.form === 'loud') {
      for (const id of q.choices) { if (!v.active) return; l.show.value = { kind: 'rings', id }; await beat(v, full ? 1200 : 700); }
      await v.say(q.ask === 'loud' ? SOUND_LINES.loud : SOUND_LINES.quiet);
      return;
    }
    if (q.form === 'shake') {
      l.show.value = { kind: 'rings', id: q.answer };
      await v.say(SOUND_LINES.shake);
      if (full) { l.show.value = { kind: 'string', shaking: false }; await letHimTry(l, v, 'pluck', 'Tap the string!'); }
      return;
    }
    // the string plucked, shaking and humming; then a finger stops it and the sound stops
    l.show.value = { kind: 'string', shaking: true };
    const stop = hum(full ? 2.2 : 1.4, q.which === 'harder' ? 0.25 : 0.12);
    await v.say(SOUND_LINES.pluck);
    await beat(v, full ? 1600 : 900);
    stop();
    l.show.value = { kind: 'string', shaking: false };
    await v.say(q.which === 'stop' ? SOUND_LINES.stop : q.which === 'harder' ? SOUND_LINES.harder : SOUND_LINES.paper);
    if (full) await letHimTry(l, v, 'pluck', SOUND_LINES.yourTurn);
    return;
  }
  // Signals
  if (q.form === 'hello') {
    l.show.value = { kind: 'hello' };
    sChime();
    await v.say(HELLO[q.scene].lesson);
    if (full && q.scene === 'dark') await letHimTry(l, v, 'flash', 'Tap the light!');
    return;
  }
  if (q.form === 'copy') {
    await v.say(SIGNAL_LINES.watch);
    await flashes(l, v, q.pattern, full, full);
    l.show.value = null;
    return;
  }
  await v.say(SIGNAL_LINES.count);
  for (let i = 0; i < q.n && v.active; i++) {
    l.show.value = { kind: 'flash', on: true, n: i + 1 };
    beep(0.25);
    await v.say(`${i + 1}` as Phrase);
    l.show.value = { kind: 'flash', on: false, n: i + 1 };
    await beat(v, full ? 500 : 250);
  }
  await v.say(KEY.find(k => k.n === q.n)!.said);
  if (full) await v.say(KEY_LINE);
}

/** What the round engine runs after a miss, before he can try again. */
export async function explain(p: Asking, answer: string, full: boolean, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null; l.glow.value = null;
  await v.say(full ? "Let's look together." : 'Not quite!');
  if (!v.active) return;
  await teach(p.q, answer, full, l, v);
  if (!v.active) return;
  await beat(v, 300);
  if (full && p.q.kind !== 'mirror' && p.q.kind !== 'signal') l.glow.value = p.q.answer;
  if (v.active) await v.say('Try again!');
}

/** 🔎: the fuller lesson without a miss, which counts as help. */
export async function help(p: Asking, lifetime: AbortSignal) {
  const l = lessonFor(lifetime), v = l.task.start();
  l.show.value = null;
  await teach(p.q, '', true, l, v);
}
