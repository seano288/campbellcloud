// How much picture the device can carry. Nobody has measured the fight on an iPad, so it looks after itself: start from what the
// device says it is, watch real frame times in the first seconds, and step down the ladder until it runs. The first steps stay on
// WebGPU, then the WebGL2 path. If even the last step can't move, the fight gives way to the plain outcome screen. The rung it
// settles on is remembered, a clean fight earns one back, and a fight that never came back (iPad Safari kills a page that uses too
// much memory) starts lower next time.
// No three.js here, so this file costs a question screen nothing.

export type Tier = 'full' | 'lite' | 'basic' | 'gl' | 'gl-basic';
export interface Rung { tier: Tier; /** Pixels on the long side of the picture. */ px: number }

/** Top to bottom. A step that keeps its tier only changes the resolution, in place; any other rebuilds the stage. */
export const LADDER: readonly Rung[] = [
  { tier: 'full', px: 1280 }, { tier: 'full', px: 1040 }, { tier: 'lite', px: 1040 }, { tier: 'lite', px: 860 }, { tier: 'basic', px: 860 },
  { tier: 'gl', px: 1040 }, { tier: 'gl', px: 860 }, { tier: 'gl-basic', px: 860 }, { tier: 'gl-basic', px: 640 },
];
export const isGL = (r: Rung) => r.tier === 'gl' || r.tier === 'gl-basic';
export const FIRST_GL = LADDER.findIndex(isGL);

export interface Device {
  webgpu: boolean;
  /** navigator.deviceMemory where it exists; Safari doesn't say. */
  memoryGB: number | undefined;
  /** The short side of the screen in CSS pixels. */
  shortSide: number;
}

/** Where a device starts. Phones and small-memory devices skip the top; only frame times can tell an iPad's chip from another's. */
export function startingRung(d: Device): number {
  if (!d.webgpu) return d.memoryGB !== undefined && d.memoryGB <= 2 ? LADDER.length - 2 : FIRST_GL;
  if (d.memoryGB !== undefined && d.memoryGB <= 2) return FIRST_GL;
  return d.shortSide < 600 || (d.memoryGB !== undefined && d.memoryGB <= 4) ? 2 : 0;
}

export const readDevice = (): Device => ({
  webgpu: 'gpu' in navigator && (window.isSecureContext ?? true), // WebGPU exists only in a secure context
  memoryGB: (navigator as { deviceMemory?: number }).deviceMemory,
  shortSide: Math.min(screen.width, screen.height),
});

// ---------- remembering ----------
const KEY = 'math-bots-fight-detail';
interface Memory { rung: number; open: boolean }
function recall(): Memory | null {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Memory | null;
    return m && Number.isInteger(m.rung) && LADDER[m.rung] ? m : null;
  } catch { return null; }
}
function remember(m: Memory) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* it just measures again next time */ } }

/** The rung to open a fight on. A fight still marked open means the last one took the page down with it: one step lower. */
export function openingRung(device = readDevice()): number {
  const m = recall(), start = startingRung(device);
  const rung = m ? Math.max(start, m.open ? m.rung + 1 : m.rung) : start;
  return Math.min(rung, LADDER.length - 1);
}
export const fightOpened = (rung: number) => remember({ rung, open: true });
/** `clean`: it ran to the knockout without stepping down, so the next fight tries one rung higher. */
export const fightClosed = (rung: number, clean = false) => remember({ rung: clean ? Math.max(0, rung - 1) : rung, open: false });
/** It couldn't run at all. That may have been a bad moment, so the next fight starts over rather than from the bottom. */
export function fightForgotten() { try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ } }

// ---------- judging ----------
/** Frames ignored after a (re)build: the first ones carry shader compiles. */
const SETTLE_FRAMES = 12;
/** A window is this many frames, or as many as fit in this long on a very slow device. */
const WINDOW_FRAMES = 40, WINDOW_MS = 2500, MIN_FRAMES = 5;
/** Below about 26 fps it steps down. */
const SLOW_MS = 38;
/** Slower than this it doesn't dawdle down the ladder a rung at a time, because each window would take seconds. */
const CRAWL_MS = 180;

export type Verdict = 'wait' | 'keep' | 'step' | 'jump' | 'give-up';
export interface Watch { frames: number; samples: number[]; spent: number }
export const newWatch = (): Watch => ({ frames: 0, samples: [], spent: 0 });

function median(xs: readonly number[]) { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1] ?? 0; }

/** Feed one frame. `last` says this is the bottom of the ladder. */
export function watchFrame(w: Watch, ms: number, last: boolean): Verdict {
  w.frames++;
  if (w.frames <= SETTLE_FRAMES) return 'wait';
  w.samples.push(ms);
  w.spent += ms;
  if (w.samples.length < WINDOW_FRAMES && (w.spent < WINDOW_MS || w.samples.length < MIN_FRAMES)) return 'wait';
  const m = median(w.samples);
  w.samples = []; w.spent = 0;
  if (m <= SLOW_MS) return 'keep';
  if (last) return m > CRAWL_MS ? 'give-up' : 'keep';
  return m > CRAWL_MS ? 'jump' : 'step';
}
