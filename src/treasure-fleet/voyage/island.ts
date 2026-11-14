// The Island, seen from the side, as a little simulation (drawn by draw.ts). His pirate steps off the ship onto the beach. He holds
// anywhere on the sand to walk and taps the jump button to hop over crabs. A crab he walks into only nips at him and bumps him back a
// step, then scuttles into the sand for a moment so he can walk on: nothing can stop him. At the X he taps to dig, three times, and the
// chest comes up and opens.
//
// The world is 600 units tall; heights are measured up from the sand.
export const BEACH = 2300, X_AT = BEACH - 220, START_X = 260, VIEW_H = 600, GROUND_Y = 470;
export const WALK = 270, JUMP_V = 820, GRAVITY = 2000, CRAB_R = 30, PIRATE_R = 28, DIGS = 3;
/** Where the crabs live, each pacing about its own spot. */
export const CRAB_AT = [760, 1260, 1760] as const;

export interface Crab { home: number; x: number; dir: 1 | -1; hidden: number }
export type IslandEvent = 'jump' | 'land' | 'nip' | 'hop-over' | 'at-x' | 'dig' | 'chest';
export interface Walk {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  bump: number;
  crabs: Crab[];
  cleared: Set<number>;
  atX: boolean;
  dug: number;
  open: boolean;
  events: IslandEvent[];
}

export const createWalk = (): Walk => ({
  t: 0, x: START_X, y: 0, vx: 0, vy: 0, grounded: true, bump: 0,
  crabs: CRAB_AT.map((home, i) => ({ home, x: home, dir: i % 2 ? -1 : 1, hidden: 0 })), cleared: new Set(), atX: false, dug: 0, open: false, events: [],
});

/** The sand's gentle dunes: flat where he lands and where the X is. */
export function dune(x: number) {
  const edge = Math.min(1, Math.max(0, (x - 420) / 200), Math.max(0, (X_AT - 120 - x) / 200));
  return (Math.sin(x / 260) * 14 + Math.sin(x / 97 + 1) * 5) * edge;
}

/** `walking`: he's holding on the sand; `jump`: he tapped jump this step. */
export function stepWalk(w: Walk, dt: number, walking: boolean, jump: boolean) {
  w.events = [];
  w.t += dt;
  for (const c of w.crabs) {
    c.hidden = Math.max(0, c.hidden - dt);
    c.x += c.dir * 60 * dt;
    if (Math.abs(c.x - c.home) > 70) c.dir = (c.x > c.home ? -1 : 1);
  }
  if (w.atX) { w.vx = 0; return; }
  w.bump = Math.max(0, w.bump - dt);
  const want = walking && w.bump <= 0 ? WALK : 0;
  w.vx += (want - w.vx) * Math.min(1, dt * 10);
  if (jump && w.grounded) { w.vy = JUMP_V; w.grounded = false; w.events.push('jump'); }
  if (!w.grounded) {
    w.vy -= GRAVITY * dt;
    w.y += w.vy * dt;
    if (w.y <= 0) { w.y = 0; w.vy = 0; w.grounded = true; w.events.push('land'); }
  }
  w.x = Math.max(START_X - 60, Math.min(X_AT, w.x + w.vx * dt));
  for (const [i, c] of w.crabs.entries()) {
    if (c.hidden > 0) continue;
    const close = Math.abs(c.x - w.x) < CRAB_R + PIRATE_R;
    if (close && w.y < 30) { // a nip: bumped back a step, and the crab ducks into the sand
      w.vx = -340; w.bump = .35; w.x -= 6; c.hidden = 2.2;
      w.events.push('nip');
    } else if (!w.cleared.has(i) && w.x > c.x + CRAB_R && w.y > 0) { w.cleared.add(i); w.events.push('hop-over'); }
  }
  if (w.x >= X_AT - 4) { w.x = X_AT; w.atX = true; w.vx = 0; w.events.push('at-x'); }
}

/** He tapped dig at the X. The third dig brings the chest up. */
export function dig(w: Walk): boolean {
  if (!w.atX || w.open) return false;
  w.dug++;
  w.events.push('dig');
  if (w.dug >= DIGS) { w.open = true; w.events.push('chest'); }
  return true;
}

/** How far along the beach he is, 0 to 1. */
export const progress = (w: Pick<Walk, 'x'>) => Math.max(0, Math.min(1, (w.x - START_X) / (X_AT - START_X)));
