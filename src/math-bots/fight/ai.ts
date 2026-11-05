// Rivals drive with the same Input he does. `skill` is everything that separates Rusty from King Gear: how late it notices, how long it
// backs off after a hit, and how well it stays clear of hazards. Four styles give each rival a way of fighting a child can learn to read.
import { MOUNT_ANGLE } from '../bot/parts';
import type { Style } from '../league/rivals';
import { ARENA, sawAt, tipOf, ventState, type Fight, type Fighter, type Input } from './sim';

export interface Brain { style: Style; skill: number; next: number; plan: Input; backOff: number; seenHp: number; orbit: 1 | -1; flinchCd: number }
export const createBrain = (style: Style, skill: number): Brain => ({ style, skill, next: 0, plan: { x: 0, y: 0, hit: false, boost: false }, backOff: 0, seenHp: 0, orbit: 1, flinchCd: 0 });

const norm = (x: number, y: number) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n] as const; };

/** Pushes away from anything that hurts, as hard as this rival is sharp. */
function avoid(s: Fight, me: Fighter, skill: number) {
  let ax = 0, ay = 0;
  const away = (x: number, y: number, r: number) => {
    const d = Math.hypot(me.x - x, me.y - y), room = r + me.stats.radius + 70;
    if (d < room) { const [nx, ny] = norm(me.x - x, me.y - y); ax += nx * (room - d) / 60; ay += ny * (room - d) / 60; }
  };
  for (const h of s.arena.hazards) {
    if (h.kind === 'pit') { if (!me.hoverOver) away(h.x, h.y, h.r); }
    else if (h.kind === 'saw') { const p = sawAt(h, s.t); away(p.x, p.y, h.r); }
    else if (ventState(h, s.t) !== 'off') away(h.x, h.y, h.r);
  }
  const k = .25 + skill * .9;
  return [ax * k, ay * k] as const;
}

/** The weapon that points most nearly at the target, and how far off it is. */
function aim(me: Fighter, to: number) {
  let off = 0, best = Infinity, weapon = false;
  for (const a of me.fitted) {
    if (a.part.dmg <= 0) continue;
    let d = (to - me.a - MOUNT_ANGLE[a.mount]) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) < best) { best = Math.abs(d); off = d; weapon = true; }
  }
  return weapon ? off : 0;
}

export function think(s: Fight, me: Fighter, foe: Fighter, b: Brain, dt: number): Input {
  b.flinchCd = Math.max(0, b.flinchCd - dt);
  if (me.hp < b.seenHp && b.flinchCd <= 0) { b.backOff = .4 + (1 - b.skill) * .8; b.flinchCd = 3.2 - b.skill; } // hit: it flinches, which is his chance to get round it
  b.seenHp = me.hp;
  b.backOff = Math.max(0, b.backOff - dt);
  b.next -= dt;
  const plan = b.plan;
  plan.hit = false; plan.boost = false;
  if (b.next > 0) return plan;
  b.next = .34 - b.skill * .28; // how often it looks up

  const to = Math.atan2(foe.y - me.y, foe.x - me.x), gap = Math.hypot(foe.x - me.x, foe.y - me.y), [dx, dy] = norm(foe.x - me.x, foe.y - me.y);
  const off = aim(me, to), heading = me.a + off;
  // what it steers at: a little off the straight line, so the weapon that's nearest comes round to him
  let gx = Math.cos(to - off * .5), gy = Math.sin(to - off * .5), go = 1;
  const r = me.stats.radius + foe.stats.radius;
  if (b.backOff > 0) { gx = -dx; gy = -dy; go = .8; }
  else if (b.style === 'circle' && gap < r + 240) { // round to the side it isn't guarding
    const behindX = foe.x - Math.cos(foe.a) * (r + 30), behindY = foe.y - Math.sin(foe.a) * (r + 30);
    [gx, gy] = norm(behindX - me.x + dy * 120 * b.orbit, behindY - me.y - dx * 120 * b.orbit);
    if (s.rng() < .03) b.orbit = b.orbit === 1 ? -1 : 1;
  } else if (b.style === 'guard') { go = gap < r + 170 ? .45 : .75; }
  else if (b.style === 'dart' && gap < r + 40 && s.rng() < .3 + b.skill * .3) b.backOff = .5;

  const [ax, ay] = avoid(s, me, b.skill);
  // walls: head back toward the middle rather than pushing into them
  const wx = me.x < 110 ? 1 : me.x > ARENA - 110 ? -1 : 0, wy = me.y < 110 ? 1 : me.y > ARENA - 110 ? -1 : 0;
  const [mx, my] = norm(gx * go + ax + wx * .5, gy * go + ay + wy * .5);
  plan.x = mx * go; plan.y = my * go;

  const facing = Math.abs(Math.atan2(Math.sin(heading - to), Math.cos(heading - to))) < .7;
  for (const a of me.fitted) {
    const k = a.part.kind;
    if (k !== 'hammer' && k !== 'flip' && k !== 'claw' && k !== 'prod') continue;
    const tip = tipOf(me, a);
    if (Math.hypot(tip.x - foe.x, tip.y - foe.y) < foe.stats.radius + 30 && s.rng() < .25 + b.skill * .7) plan.hit = true;
  }
  if (me.fitted.some(a => a.part.kind === 'saw' || a.part.kind === 'spin' || a.part.kind === 'lance') && gap < r + 90 && facing && s.rng() < b.skill * .3) plan.hit = true;
  if (gap > 260 && gap < 520 && facing && b.backOff <= 0 && s.rng() < b.skill * .5) plan.boost = true;
  return plan;
}
