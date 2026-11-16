// The build, seen from the side, as a little simulation (drawn by draw.ts). A crane carries the new building's next piece on its hook.
// He moves the hook with his finger and lets go to drop it. The piece falls, and slides over as it falls so it always lands square on
// the one below: a sloppy drop still lands. Then the next piece comes. Nothing can miss.
//
// World units: x is measured from the middle of the lot; y grows downward; the ground is at B_GROUND.
export const B_VIEW_H = 640, B_GROUND = 560, B_HALF_W = 340, B_SCALE = 1.2;
export const HOOK_Y = 96;
export const B_GRAVITY = 1500;

export interface PieceSize { w: number; h: number }
export type BuildEvent = 'drop' | 'land' | 'done';

export interface Build {
  pieces: readonly PieceSize[];
  /** The next piece to place (the one on the hook, or falling). */
  k: number;
  /** How tall the stack is so far. */
  stack: number;
  hookX: number;
  aimX: number;
  speed: number;
  drop: { x: number; y: number; vy: number; fromX: number; fromY: number } | null;
  /** Seconds until the next piece is on the hook. */
  wait: number;
  done: boolean;
  t: number;
  events: BuildEvent[];
}

export function createBuild(pieces: readonly PieceSize[], speed = 1): Build {
  return { pieces, k: 0, stack: 0, hookX: -200, aimX: -200, speed, drop: null, wait: .4, done: false, t: 0, events: [] };
}

/** Where the carried piece's top is, hanging under the hook. */
export const hangY = () => HOOK_Y + 46;
export const pieceH = (p: PieceSize) => p.h * B_SCALE;
export const pieceW = (p: PieceSize) => p.w * B_SCALE;
/** Where the next piece will land: its top. */
export const landingY = (b: Pick<Build, 'stack' | 'pieces' | 'k'>) => B_GROUND - b.stack - pieceH(b.pieces[b.k]!);
export const carrying = (b: Pick<Build, 'drop' | 'k' | 'pieces' | 'wait' | 'done'>) => !b.done && !b.drop && b.wait <= 0 && b.k < b.pieces.length;

export interface BuildInput {
  /** Where his finger is (the hook follows it). */
  aim?: number | null;
  /** He let go: drop the piece. */
  release?: boolean;
}

export function stepBuild(b: Build, dt: number, input: BuildInput = {}) {
  b.events = [];
  b.t += dt;
  if (b.done) return;
  if (input.aim !== undefined && input.aim !== null) b.aimX = Math.max(-B_HALF_W + 40, Math.min(B_HALF_W - 40, input.aim));
  const step = 620 * b.speed * dt;
  b.hookX += Math.max(-step, Math.min(step, b.aimX - b.hookX));
  if (b.wait > 0) b.wait = Math.max(0, b.wait - dt);
  if (input.release && carrying(b)) {
    b.drop = { x: b.hookX, y: hangY(), vy: 0, fromX: b.hookX, fromY: hangY() };
    b.events.push('drop');
  }
  const d = b.drop;
  if (!d) return;
  d.vy += B_GRAVITY * dt;
  d.y += d.vy * dt;
  const land = landingY(b), p = Math.max(0, Math.min(1, (d.y - d.fromY) / Math.max(1, land - d.fromY)));
  // it slides over to the middle as it falls, so it lands square on the stack wherever it was let go
  d.x = d.fromX + (0 - d.fromX) * (1 - (1 - p) ** 2);
  if (d.y >= land) {
    b.stack += pieceH(b.pieces[b.k]!);
    b.k++;
    b.drop = null;
    b.events.push('land');
    if (b.k >= b.pieces.length) { b.done = true; b.events.push('done'); }
    else b.wait = .55 / b.speed;
  }
}
