// Clock time, as the player meets it: an hour 1-12 and a minute that is a multiple of five. Each Level sets how far
// the long hand moves between times: Level 1 only o'clock, Level 2 the quarters, Level 3 every five minutes.
import { int, pick, shuffle, type Rng } from '../../game/rng';

export type Level = 1 | 2 | 3;
export const LEVELS: readonly Level[] = [1, 2, 3];

export interface ClockTime { readonly hour: number; readonly minute: number }

/** Minutes between the times a Level uses. */
export const STEP: Record<Level, number> = { 1: 60, 2: 15, 3: 5 };
export const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Minutes past 12 o'clock, 0-719. */
export const minutesOf = (t: ClockTime) => (t.hour % 12) * 60 + t.minute;
export function fromMinutes(m: number): ClockTime {
  const total = ((Math.round(m) % 720) + 720) % 720, h = Math.floor(total / 60);
  return { hour: h === 0 ? 12 : h, minute: total % 60 };
}
export const sameTime = (a: ClockTime, b: ClockTime) => minutesOf(a) === minutesOf(b);
/** "3:05", as on a digital clock. */
export const digital = (t: ClockTime) => `${t.hour}:${String(t.minute).padStart(2, '0')}`;
/** Answers are passed around as their digital form. */
export const parseDigital = (s: string): ClockTime | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]), minute = Number(m[2]);
  return hour >= 1 && hour <= 12 && minute >= 0 && minute < 60 ? { hour, minute } : null;
};

/** Hand angles in degrees clockwise from 12. The short hand moves along between the numbers, like a real clock. */
export const handAngles = (t: ClockTime) => ({ hour: (minutesOf(t) / 720) * 360, minute: t.minute * 6 });

/** Is this a time the Level uses? */
export const fitsLevel = (t: ClockTime, level: Level) => t.minute % STEP[level] === 0;
export const timesAt = (level: Level): ClockTime[] =>
  Array.from({ length: 720 / STEP[level] }, (_, i) => fromMinutes(i * STEP[level])).sort((a, b) => a.hour - b.hour || a.minute - b.minute);

/** A time for the Level. At Levels 2 and 3, most times use the new minutes, so o'clock doesn't take over. */
export function randomTime(level: Level, rng: Rng, avoid?: ClockTime): ClockTime {
  for (;;) {
    const hour = pick(rng, HOURS);
    const minutes = level === 1 ? [0] : level === 2 ? [0, 15, 30, 45, 15, 30, 45] : Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m !== 0 || rng() < 0.3);
    const t = { hour, minute: pick(rng, minutes) };
    if (!avoid || !sameTime(t, avoid)) return t;
  }
}

const shiftHour = (t: ClockTime, d: number): ClockTime => ({ hour: ((t.hour - 1 + d + 12) % 12) + 1, minute: t.minute });
const shiftMinutes = (t: ClockTime, d: number) => fromMinutes(minutesOf(t) + d);

/**
 * The time he'd read if he mixed up the hands: the long hand's number as the hour and the short hand's number,
 * counted by fives, as the minutes. Only when the short hand sits near a number, so the mix-up reads cleanly.
 */
export function swappedHands(t: ClockTime): ClockTime | null {
  if (t.minute === 0 || t.minute > 20) return null;
  const hour = t.minute / 5;
  return Number.isInteger(hour) && hour >= 1 ? { hour, minute: (t.hour % 12) * 5 } : null;
}

/** Wrong answers worth telling apart from the right one, most telling first: the classic mix-ups for each Level. */
export function confusions(t: ClockTime, level: Level): ClockTime[] {
  const out: ClockTime[] = [];
  if (level === 1) out.push(shiftHour(t, 1), shiftHour(t, -1), shiftHour(t, 6));
  else {
    // past the half, the short hand is close to the next number: reading that one is the commonest slip
    out.push(t.minute >= 30 ? shiftHour(t, 1) : shiftHour(t, -1));
    if (level === 2) out.push(shiftMinutes(t, 15), shiftMinutes(t, -15), { hour: t.hour, minute: (t.minute + 30) % 60 });
    else {
      const swap = swappedHands(t);
      if (swap) out.push(swap);
      out.push(shiftMinutes(t, 5), shiftMinutes(t, -5), { hour: t.hour, minute: (t.minute + 30) % 60 });
    }
  }
  return out.filter(c => fitsLevel(c, level) && !sameTime(c, t));
}

/** Three different times, the right one among them, in a random order. */
export function choicesFor(t: ClockTime, level: Level, rng: Rng, n = 3): ClockTime[] {
  const picked: ClockTime[] = [t];
  const take = (c: ClockTime) => { if (picked.length < n && !picked.some(p => sameTime(p, c))) picked.push(c); };
  const pool = confusions(t, level);
  take(pool[0]!);
  for (const c of shuffle(rng, pool.slice(1))) take(c);
  while (picked.length < n) take(randomTime(level, rng));
  return shuffle(rng, picked);
}

/** Snaps minutes to the Level's step (the long hand clicks between the marks it uses). */
export const snap = (minutes: number, level: Level) => Math.round(minutes / STEP[level]) * STEP[level];

/** A time to start a Set the Clock problem from: never the answer, and at Level 1 always o'clock (but never 12). */
export const startingTime = (target: ClockTime, level: Level, rng: Rng): ClockTime => {
  // never 12 o'clock at Level 1: there both hands point up, one hidden under the other
  const start = level === 1 ? { hour: int(rng, 1, 11), minute: 0 } : fromMinutes(snap(int(rng, 0, 719), level));
  if (!sameTime(start, target)) return start;
  const moved = shiftHour(start, 3);
  return level === 1 && moved.hour === 12 ? shiftHour(start, 4) : moved;
};
