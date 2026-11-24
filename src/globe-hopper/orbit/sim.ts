// The orbit, as numbers only. The Earth turns slowly below; the camera looks straight down at the middle of the globe.
//
// 1. He lets the payload go (a tap, or it goes by itself).
// 2. The photo mission: one place, or two or three in order. The orbit swings so each place comes round under the camera. He taps when it
//    is underneath. After a moment it glows faintly; a tap too early just has the camera say "Not yet!" and wait. If it slips past, the
//    orbit comes round again, and the third time the camera takes the picture itself. It can't be failed.
// 3. Free time, as long as his dishes allow: whatever continent or ocean is under the camera when he taps becomes a photo, and each new
//    one in this orbit counts toward his best ("most places caught in one orbit").
import { seeded, type Rng } from '../../game/rng';
import { arc, continentAt, oceanAt, wrapLon, type LonLat } from '../map/geo';

export const STEP = 1 / 60;

export const TUNING = {
  /** Degrees a second the Earth turns under him, and how fast it swings round after a missed pass. */
  spin: 9, fast: 70,
  /** How far before a place each approach starts, in degrees of turn. */
  approach: 75,
  /** A place is "under the camera" within this many degrees of the middle; it starts to glow within `hint`. */
  window: 11, hint: 30,
  /** Seconds before the payload lets itself go. */
  autoDeploy: 5,
  /** After this many passes the camera takes it by itself. */
  autoAfter: 2,
  /** Free time with no dishes; each dish adds `perDish`, to a ceiling. */
  free: 12, perDish: 6, maxFree: 60,
  /** How fast the orbit swings north or south to the next place (degrees a second). */
  swing: 30,
} as const;
const T = TUNING;

export interface Target extends LonLat { readonly id: string }
export interface OrbitSetup {
  readonly targets: readonly Target[];
  /** Seconds of free time after the mission (dishes and the radio relay). */
  readonly free: number;
  readonly seed: number;
}
export type Phase = 'deploy' | 'photo' | 'free' | 'done';
export type OrbitEvent =
  | { t: 'deployed'; auto: boolean } | { t: 'next'; i: number } | { t: 'under'; i: number } | { t: 'notyet' } | { t: 'missed'; i: number }
  | { t: 'photo'; i: number; id: string; auto: boolean } | { t: 'free' } | { t: 'snap'; id: string; isNew: boolean } | { t: 'done' };

export interface Sim {
  readonly setup: OrbitSetup;
  phase: Phase; t: number; pt: number;
  /** Where the camera looks (the middle of the globe). */
  lon: number; lat: number;
  /** The target being looked for, and how many times it slipped past. */
  i: number; passes: number; fast: boolean; wasUnder: boolean;
  /** The ids photographed this orbit, mission and free time together. */
  caught: string[];
  readonly rng: Rng;
  events: OrbitEvent[];
}

export function createSim(setup: OrbitSetup): Sim {
  const first = setup.targets[0]!;
  return {
    setup, phase: 'deploy', t: 0, pt: 0, lon: wrapLon(first.lon - T.approach - 20), lat: Math.max(-60, Math.min(60, first.lat)), i: 0, passes: 0, fast: false, wasUnder: false,
    caught: [], rng: seeded(setup.seed), events: [],
  };
}

const to = (s: Sim, p: Phase) => { s.phase = p; s.pt = 0; };
export const centre = (s: Pick<Sim, 'lon' | 'lat'>): LonLat => ({ lon: s.lon, lat: s.lat });
export const target = (s: Sim): Target | null => (s.phase === 'photo' ? s.setup.targets[s.i] ?? null : null);
/** How far the current place is from the middle of the view, in degrees. */
export const offBy = (s: Sim) => { const g = target(s); return g ? arc(centre(s), g) : Infinity; };
export const isUnder = (s: Sim) => offBy(s) <= T.window;
/** The place glows faintly once it is close, or after he has missed it once. */
export const glows = (s: Sim) => s.phase === 'photo' && (offBy(s) <= T.hint || s.passes > 0);
/** The camera's latitude follows the place. */
const viewLat = (lat: number) => Math.max(-88, Math.min(88, lat));

/** What is under the camera in free time: a continent, else an ocean, else nothing he can name. */
export const underCamera = (s: Pick<Sim, 'lon' | 'lat'>): string | null => {
  const c = continentAt(s.lon, s.lat);
  if (c) return `c:${c}`;
  const o = oceanAt(s.lon, s.lat);
  return o ? `o:${o}` : null;
};

function startTarget(s: Sim, i: number) {
  s.i = i; s.passes = 0; s.wasUnder = false;
  const g = s.setup.targets[i]!, ahead = wrapLon(g.lon - s.lon);
  if (ahead < T.approach * .6) s.lon = wrapLon(g.lon - T.approach); // too close to see it come: back off a little
  s.fast = wrapLon(g.lon - s.lon) > T.approach; // far round the world: swing round quickly
  s.events.push({ t: 'next', i });
}

export interface Input { readonly tap?: boolean; readonly deploy?: boolean }

export function stepSim(s: Sim, input: Input = {}) {
  const dt = STEP;
  s.t += dt; s.pt += dt;
  switch (s.phase) {
    case 'deploy': {
      s.lon = wrapLon(s.lon + T.spin * dt * .5);
      if (input.deploy || s.pt >= T.autoDeploy) { s.events.push({ t: 'deployed', auto: !input.deploy }); to(s, 'photo'); startTarget(s, 0); }
      break;
    }
    case 'photo': {
      const g = s.setup.targets[s.i]!;
      // swing north or south toward the place
      const want = viewLat(g.lat), d = want - s.lat;
      s.lat += Math.sign(d) * Math.min(Math.abs(d), T.swing * dt);
      const speed = s.fast ? T.fast : T.spin;
      s.lon = wrapLon(s.lon + speed * dt);
      const ahead = wrapLon(g.lon - s.lon); // still to come when positive
      if (s.fast && ahead > 0 && ahead <= T.approach) s.fast = false;
      const under = isUnder(s);
      if (under && !s.wasUnder) s.events.push({ t: 'under', i: s.i });
      s.wasUnder = under;
      // it slipped past: the orbit swings round quickly to bring it back
      if (!s.fast && ahead < -T.window * 1.5) { s.passes++; s.fast = true; s.events.push({ t: 'missed', i: s.i }); }
      const auto = s.passes >= T.autoAfter && under && (offBy(s) <= T.window * .4 || s.passes > T.autoAfter);
      if (input.tap && !under) s.events.push({ t: 'notyet' });
      if ((input.tap && under) || auto) {
        if (!s.caught.includes(g.id)) s.caught.push(g.id);
        s.events.push({ t: 'photo', i: s.i, id: g.id, auto: !input.tap });
        if (s.i + 1 < s.setup.targets.length) startTarget(s, s.i + 1);
        else { to(s, s.setup.free > 0 ? 'free' : 'done'); s.events.push({ t: s.setup.free > 0 ? 'free' : 'done' }); }
      }
      break;
    }
    case 'free': {
      s.lon = wrapLon(s.lon + T.spin * 1.4 * dt);
      s.lat += (38 * Math.sin(s.pt * .12 + s.setup.seed) - s.lat) * Math.min(1, dt * 1.5);
      if (input.tap) {
        const id = underCamera(s);
        if (id) { const isNew = !s.caught.includes(id); if (isNew) s.caught.push(id); s.events.push({ t: 'snap', id, isNew }); }
        else s.events.push({ t: 'notyet' });
      }
      if (s.pt >= s.setup.free) { to(s, 'done'); s.events.push({ t: 'done' }); }
      break;
    }
    case 'done': break;
  }
}

export function takeEvents(s: Sim): OrbitEvent[] { const e = s.events; s.events = []; return e; }

/** Free time for his dishes (fixed and bought again) and a radio relay. */
export const freeFor = (dishes: number, relay: boolean) => Math.min(T.maxFree, T.free + dishes * T.perDish + (relay ? 8 : 0));

/** The scripted children: nothing (never taps), clumsy (taps at random), skilled (taps the moment it is under; snaps often in free time). */
export type Child = 'nothing' | 'clumsy' | 'skilled';
export function inputFor(s: Sim, child: Child, rng: Rng): Input {
  if (child === 'nothing') return {};
  if (child === 'clumsy') return { tap: rng() < .02, deploy: rng() < .05 };
  if (s.phase === 'deploy') return { deploy: true };
  if (s.phase === 'photo') return { tap: isUnder(s) };
  return { tap: s.phase === 'free' && rng() < .04 };
}
export function orbitWith(setup: OrbitSetup, child: Child, seed = 1): Sim {
  const s = createSim(setup), rng = seeded(seed * 31 + 7);
  for (let i = 0; i < 60 * 60 * 6 && s.phase !== 'done'; i++) stepSim(s, inputFor(s, child, rng));
  return s;
}
