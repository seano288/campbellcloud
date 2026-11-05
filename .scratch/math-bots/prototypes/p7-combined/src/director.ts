// The broadcast truck. Runs at a fixed 60 Hz on top of the recorded fight, slightly behind the
// physics (so it can see a hit coming, like a director with a delay), and writes a camera track
// for the whole programme. Every camera is a person-ish control system, not a look-at.
import { Vector3 as V, Quaternion as Q, Matrix4 } from 'three';
import { ARENA, DT, FRAME_SIZE, N_SLOTS, SLOT, X, type Fight, type FightEvent } from './sim.ts';

export const TICK = 1 / 60;
export const LOOKAHEAD = 1.15;
export type CamId = 'wide' | 'lowA' | 'lowB' | 'jib' | 'bot' | 'anvilbot' | 'replay' | 'open';
const IDS: CamId[] = ['wide', 'lowA', 'lowB', 'jib', 'bot', 'anvilbot', 'replay', 'open'];
const STRIDE = 14;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const noise = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.5 + Math.sin(t * 2.9 + s * 1.7) * 0.28 + Math.sin(t * 6.1 + s * 2.3) * 0.15 + Math.sin(t * 13.7 + s * 3.1) * 0.07;

interface OpCfg { w: number; z: number; amax: number; noise: number; react: number; fovMin: number; fovMax: number }

/** Pan/tilt head + zoom + focus, each with a human response curve. */
class Operator {
  pos: V; cfg: OpCfg; seed: number;
  az = 0; el = 0; vaz = 0; vel = 0; fov = 30; vfov = 0; focus = 8; hunt = 0; huntT = 0; punch = 0; kick = 0; zoomHold = 0;
  constructor(pos: V, cfg: OpCfg, seed: number) { this.pos = pos.clone(); this.cfg = cfg; this.seed = seed; }
  snap(tgt: V, fov: number) {
    const d = tgt.clone().sub(this.pos);
    this.az = Math.atan2(d.x, d.z); this.el = Math.atan2(d.y, Math.hypot(d.x, d.z));
    this.vaz = this.vel = 0; this.fov = fov; this.vfov = 0;
    this.focus = d.length() * 1.13; this.startHunt(0.16);
  }
  startHunt(a: number) { this.hunt = a; this.huntT = 0; }
  update(dt: number, t: number, tgt: V, want: number) {
    const c = this.cfg;
    const d = tgt.clone().sub(this.pos);
    const az = Math.atan2(d.x, d.z), el = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const tel = Math.tan(this.fov * Math.PI / 360);     // long lens: operators slow the head down
    const w = c.w * (0.55 + tel * 1.6);
    const ax = clamp(w * w * wrap(az - this.az) - 2 * c.z * w * this.vaz, -c.amax, c.amax);
    const ay = clamp(w * w * (el - this.el) - 2 * c.z * w * this.vel, -c.amax, c.amax);
    this.vaz += ax * dt; this.vel += ay * dt; this.az = wrap(this.az + this.vaz * dt); this.el += this.vel * dt;
    // zoom rocker: slew limited, slightly under-damped
    const wz = 3.6, tz = want;
    const az2 = wz * wz * (tz - this.fov) - 2 * 0.6 * wz * this.vfov;
    this.vfov = clamp(this.vfov + az2 * dt, -36, 36);
    this.fov = clamp(this.fov + this.vfov * dt, c.fovMin, c.fovMax);
    // focus pull trails the subject and hunts after any big change
    const dist = d.length();
    const k = 1 - Math.exp(-dt * 5.5);
    this.focus += (dist - this.focus) * k;
    this.huntT += dt; this.hunt *= Math.exp(-dt * 2.4);
    return dist;
  }
  shake(t: number, amt: number) {
    const a = this.cfg.noise, s = this.seed;
    return [noise(t, s) * a + noise(t * 7, s + 3) * amt * 0.1, noise(t * 1.1, s + 5) * a * 0.7 + noise(t * 6.3, s + 9) * amt * 0.1];
  }
  focusNow() { return this.focus * (1 + this.hunt * Math.sin(this.huntT * 13)); }
  write(out: Float32Array, o: number, t: number, shake: number) {
    const [sx, sy] = this.shake(t, shake);
    const az = this.az + sx, el = this.el + sy;
    const f = new V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const m = new Matrix4().lookAt(new V(), f, new V(0, 1, 0));
    const roll = noise(t * 0.6, this.seed + 11) * this.cfg.noise * 0.5;
    const q = new Q().setFromRotationMatrix(m).multiply(new Q().setFromAxisAngle(new V(0, 0, -1), roll));
    writeCam(out, o, this.pos, q, this.fov, this.focusNow());
  }
}
function writeCam(out: Float32Array, o: number, p: V, q: Q, fov: number, focus: number) {
  out[o] = p.x; out[o + 1] = p.y; out[o + 2] = p.z; out[o + 3] = q.x; out[o + 4] = q.y; out[o + 5] = q.z; out[o + 6] = q.w; out[o + 7] = fov; out[o + 8] = focus;
}

export class Programme {
  fight: Fight;
  rec: Float32Array;
  ticks = 0;
  cur: CamId = 'open'; cutT = 0;
  ops: Record<'wide' | 'lowA' | 'lowB' | 'jib' | 'replay', Operator>;
  bigEvents: FightEvent[] = [];
  evIdx = 0; shock = 0; glitch = 0;
  replayStart = -1; replayLen = 0; liveEnd = -1; progEnd = -1;
  replayFrom = 0; hit: FightEvent | null = null;
  botMount = new V(); botMountV = new V(); botQ = new Q(); botInit = false;
  aMount = new V(); aMountV = new V(); aQ = new Q();
  lastPick = 0;
  mountShock = 0;
  forced: CamId | null;
  cuts: number[] = [];

  constructor(f: Fight, forced: CamId | null = null) {
    this.fight = f; this.forced = forced;
    this.rec = new Float32Array(Math.ceil(70 / TICK) * STRIDE);
    const s = f.seed;
    this.ops = {
      wide: new Operator(new V(4.9, 4.5, -5.5), { w: 5.5, z: 0.85, amax: 2.2, noise: 0.0012, react: 0.1, fovMin: 26, fovMax: 66 }, s + 1),
      lowA: new Operator(new V(5.8, 0.42, -3.0), { w: 7.5, z: 0.58, amax: 7.5, noise: 0.0028, react: 0.14, fovMin: 11, fovMax: 42 }, s + 2),
      lowB: new Operator(new V(-3.0, 0.5, 5.8), { w: 7, z: 0.62, amax: 7, noise: 0.0034, react: 0.14, fovMin: 11, fovMax: 42 }, s + 3),
      jib: new Operator(new V(0, 3, 8.2), { w: 5.4, z: 0.72, amax: 4, noise: 0.002, react: 0.1, fovMin: 20, fovMax: 50 }, s + 4),
      replay: new Operator(new V(0, 0.42, -5.8), { w: 8, z: 0.8, amax: 9, noise: 0.0016, react: 0.05, fovMin: 7, fovMax: 30 }, s + 5),
    };
    const mid = new V(0, 0.3, 0);
    this.ops.wide.snap(mid, 33); this.ops.lowA.snap(mid, 30); this.ops.lowB.snap(mid, 30); this.ops.jib.snap(mid, 40);
    this.ops.replay.snap(mid, 16);
  }

  pose(slot: number, t: number, p: V, q?: Q) {
    const f = clamp(t / DT, 0, this.fight.frame), i = Math.floor(f), k = f - i, o = i * FRAME_SIZE + slot * 7, r = this.fight.rec;
    const j = i + 1 > this.fight.frame ? o : o + FRAME_SIZE;
    p.set(r[o] + (r[j] - r[o]) * k, r[o + 1] + (r[j + 1] - r[o + 1]) * k, r[o + 2] + (r[j + 2] - r[o + 2]) * k);
    if (q) { q.set(r[o + 3], r[o + 4], r[o + 5], r[o + 6]); const q2 = new Q(r[j + 3], r[j + 4], r[j + 5], r[j + 6]); q.slerp(q2, k); }
  }
  extra(t: number, key: number) {
    const i = Math.round(clamp(t / DT, 0, this.fight.frame));
    return this.fight.rec[i * FRAME_SIZE + N_SLOTS * 7 + key];
  }

  /** simT at programme time T; replay is spliced into the middle of the fight. */
  simTime(T: number) {
    if (this.liveEnd < 0 || T <= this.liveEnd) return T;
    if (T < this.liveEnd + this.replayLen) return this.replayMap(T - this.liveEnd);
    return T - this.replayLen;
  }
  replayMap(u: number) {
    // ramp into super-slow around the hit
    const hit = this.hit!.t, from = this.replayFrom;
    const pre = hit - 0.24 - from, slow = 0.55, rate = 0.14;
    const slowLen = slow / rate;
    if (u < pre) return from + u;
    if (u < pre + slowLen) return hit - 0.24 + (u - pre) * rate;
    return hit - 0.24 + slow + (u - pre - slowLen) * 0.6;
  }
  replayDuration() { return 1.1 - 0.24 + 0.55 / 0.14 + 1.3; }
  inReplay(T: number) { return this.liveEnd >= 0 && T > this.liveEnd && T < this.liveEnd + this.replayLen; }

  biggest() {
    let b: FightEvent | null = null;
    for (const e of this.fight.events) if (e.type === 'drum' && (!b || e.J >= b.J)) b = e;
    return b ?? this.fight.events.find((e) => e.type === 'ko') ?? null;
  }

  /** Advance until tick n exists. Caller guarantees the sim has run past the lookahead. */
  tick() {
    const f = this.fight;
    const i = this.ticks, T = i * TICK, dt = TICK;
    if (this.liveEnd < 0 && f.koT >= 0 && T >= f.koT + 3.4) {
      this.liveEnd = T; this.hit = this.biggest();
      this.replayFrom = (this.hit?.t ?? f.koT) - 1.1;
      this.replayLen = this.replayDuration();
      this.progEnd = this.liveEnd + this.replayLen + 4.5;
      const h = this.hit!;
      const R = this.ops.replay;
      // low tele, tight behind a wall-panel centre so no post crosses the lens, side-on to the hit line
      const hitP = new V(h.p[0], 0.3, h.p[2]);
      const tt = new V(), aa = new V(); this.pose(SLOT.T, h.t, tt); this.pose(SLOT.A, h.t, aa);
      const line = aa.sub(tt).setY(0).normalize();
      let best = -1e9;
      for (const u of [-5, -3, -1, 1, 3, 5]) for (const c of [[u, 5.8], [u, -5.8], [5.8, u], [-5.8, u]]) {
        const pos = new V(c[0], 0.42, c[1]);
        const d = pos.distanceTo(hitP);
        const dir = pos.clone().sub(hitP).setY(0).normalize();
        const score = -Math.abs(dir.dot(line)) * 3 - Math.abs(d - 6) * 0.25;
        if (score > best && d > 3.2) { best = score; R.pos.copy(pos); }
      }
      const p0 = new V(), p1 = new V(); this.pose(SLOT.A, this.replayFrom, p0); this.pose(SLOT.T, this.replayFrom, p1);
      R.snap(p0.lerp(p1, 0.4).setY(0.35), 16);
    }
    const replay = this.inReplay(T);
    const simT = this.simTime(T);
    const o = i * STRIDE;
    const tp = new V(), ap = new V(), tq = new Q(), aq = new Q();
    // operators follow where the bots are a beat ago, plus a little of where they are going
    const see = (t: number) => {
      this.pose(SLOT.T, t, tp, tq); this.pose(SLOT.A, t, ap, aq);
    };
    const react = 0.1;
    see(simT - react);
    const tp2 = tp.clone(), ap2 = ap.clone();
    see(simT + 0.1);
    tp2.lerp(tp, 0.55); ap2.lerp(ap, 0.55);
    see(simT);

    // events reaching "now": shake, punch-ins, glitches
    if (!replay) {
      while (this.evIdx < f.events.length && f.events[this.evIdx].t <= simT) {
        const e = f.events[this.evIdx++];
        const big = e.type === 'drum' || e.type === 'hammer';
        if (big || e.type === 'land') {
          const s = Math.min(1, e.J / (e.type === 'land' ? 900 : 420));
          this.shock = Math.max(this.shock, s);
          if (big) {
            this.glitch = 1;
            for (const k of ['wide', 'lowA', 'lowB', 'jib'] as const) {
              const op = this.ops[k]; op.punch = 1; op.startHunt(0.12);
              op.vaz += (Math.sin(i * 1.7) + 0.2) * 0.14; op.vel += 0.09 * Math.cos(i * 2.3);
            }
          }
        }
      }
    }
    this.shock *= Math.exp(-dt * 3.6);
    this.glitch *= Math.exp(-dt * 7);

    // director rules
    if (!replay && !this.forced) this.direct(simT, T);
    let id: CamId = this.forced ?? this.cur;
    if (replay) id = 'replay';
    const focusBot = this.subject(simT, T, id);

    // run all the operators all the time: an operator not on air is still following the action
    const sep = tp2.distanceTo(ap2), mid = tp2.clone().lerp(ap2, 0.5).setY(0.32);
    const fit = (op: Operator, margin: number) => {
      const dist = op.pos.distanceTo(mid);
      return (2 * Math.atan((sep * 0.5 + margin) / dist) * 180) / Math.PI / 1.05;
    };
    for (const k of ['wide', 'lowA', 'lowB', 'jib'] as const) {
      const op = this.ops[k];
      let target = mid, w = fit(op, k === 'wide' ? 1.25 : 1.0);
      const who = T < 3.1 ? (k === 'lowB' ? 'T' : k === 'lowA' ? 'A' : null) : focusBot;
      if (who && k !== 'wide') { target = who === 'T' ? tp2.clone().setY(0.2) : ap2.clone().setY(0.45); w = (2 * Math.atan(1.05 / op.pos.distanceTo(target)) * 180) / Math.PI; }
      op.punch *= Math.exp(-dt * 1.5);
      w *= 1 - 0.34 * clamp(op.punch * 1.6, 0, 1);
      if (k === 'jib') {
        const a = T * 0.13 + 0.8;
        op.pos.set(Math.sin(a) * 8.3, 5 + Math.sin(T * 0.21) * 0.5, Math.cos(a) * 8.3);
        op.pos.x = clamp(op.pos.x, -8.3, 8.3);
      }
      op.update(dt, T, target, w);
    }
    if (replay) {
      const R = this.ops.replay;
      const h = this.hit!;
      const hp = new V(h.p[0], Math.max(0.3, h.p[1]), h.p[2]);
      const blend = simT < h.t ? clamp((simT - (h.t - 0.8)) / 0.8, 0, 1) : 1;
      const a2 = ap2.clone().setY(ap2.y * 0.9);
      const target = tp2.clone().lerp(a2, 0.5).lerp(simT > h.t + 0.25 ? a2 : hp, blend);
      const k = 3.0 * Math.pow((this.replayDuration() + 0.1 - (T - this.liveEnd)) / this.replayDuration(), 0.5);
      R.update(dt, T, target, (2 * Math.atan((simT > h.t + 0.2 ? 1.5 : 1.0) / R.pos.distanceTo(target)) * 180) / Math.PI);
      void k;
    }

    // write the active camera
    const out = this.rec;
    if (id === 'bot' || id === 'anvilbot') this.onBot(o, id, simT, tq, aq, tp, ap, T);
    else if (id === 'open') this.onOpen(o, T);
    else {
      const op = this.ops[id as keyof Programme['ops']];
      const amt = this.shock * (id === 'wide' ? 0.08 : id === 'replay' ? 0 : 0.28) * (id === 'lowA' || id === 'lowB' ? 1 : 0.6);
      op.write(out, o, T, amt);
    }
    out[o + 9] = IDS.indexOf(id);
    out[o + 10] = (id === 'bot' || id === 'anvilbot') ? this.glitch : 0;
    out[o + 11] = this.cutT;
    out[o + 12] = simT;
    out[o + 13] = replay ? 1 : 0;
    this.ticks++;
  }

  subject(simT: number, T: number, id: CamId): 'T' | 'A' | null {
    const f = this.fight;
    if (T < 3.1) return id === 'lowB' ? 'T' : id === 'lowA' ? 'A' : null;
    if (this.liveEnd >= 0 && T > this.liveEnd) return 'T';
    if (f.koT >= 0 && simT > f.koT + 0.9) return 'A';
    return null;
  }

  direct(simT: number, T: number) {
    const f = this.fight;
    const held = T - this.cutT;
    const cut = (c: CamId, hunt = 0.18) => {
      if (c === this.cur) return;
      this.cur = c; this.cutT = T; this.cuts.push(T);
      const op = (this.ops as Record<string, Operator>)[c];
      if (op) op.startHunt(hunt);
    };
    const nextHit = f.events.find((e) => e.t > simT && e.t < simT + LOOKAHEAD && (e.type === 'drum' || e.type === 'hammer'));
    const lastHit = [...f.events].reverse().find((e) => e.t <= simT && (e.type === 'drum' || e.type === 'hammer'));
    const sinceHit = lastHit ? simT - lastHit.t : 99;
    if (this.liveEnd >= 0) {
      if (T > this.liveEnd + this.replayLen) {
        const p = new V(); this.pose(SLOT.T, simT, p);
        const best = this.ops.lowA.pos.distanceTo(p) > this.ops.lowB.pos.distanceTo(p) ? 'lowA' : 'lowB';
        if (T < this.liveEnd + this.replayLen + 0.1) cut(best);
      }
      return;
    }
    // scripted open
    if (T < 3.1) {
      if (T > 2.4) cut('lowA'); else if (T > 1.7) cut('lowB');
      return;
    }
    if (T < 3.4) { cut('wide'); return; }
    if (f.koT >= 0 && simT > f.koT + 0.9) { if (held > 0.8) cut(this.bestLow(simT)); return; }
    if (nextHit && held > 0.7 && nextHit.t - simT < 0.85 && this.cur !== 'lowA' && this.cur !== 'lowB') {
      cut(this.bestLow(simT)); return;
    }
    if (sinceHit < 0.9) return;
    // after a hit: bot-cam reaction shot, then wide to re-establish
    if (sinceHit < 1.5 && held > 0.8 && this.cur !== 'wide' && this.cur !== 'anvilbot' && this.cur !== 'bot') { cut(lastHit!.type === 'hammer' ? 'bot' : 'wide'); return; }
    if (held > (this.cur === 'bot' || this.cur === 'anvilbot' ? 1.7 : 3.4)) {
      const seq: CamId[] = ['jib', 'bot', 'wide', 'anvilbot'];
      const c = seq[this.lastPick++ % seq.length];
      cut(c === this.cur ? 'wide' : c);
    }
  }
  bestLow(simT: number): CamId {
    const p = new V(), a = new V(); this.pose(SLOT.T, simT, p); this.pose(SLOT.A, simT, a);
    const m = p.clone().add(a).multiplyScalar(0.5);
    const side = a.clone().sub(p).setY(0).normalize();
    const score = (c: V) => { const d = c.clone().sub(m).setY(0).normalize(); return Math.abs(d.dot(side)) * -1 - m.distanceTo(c) * 0.02; };
    return score(this.ops.lowA.pos) > score(this.ops.lowB.pos) ? 'lowA' : 'lowB';
  }

  /** Opening shot: low on a long-ish lens over TORQUE's shoulder, slowly pushing in, so the two bots stack up in depth instead of sitting at opposite ends of a wide. */
  onOpen(o: number, T: number) {
    const t = new V(), a = new V(); this.pose(SLOT.T, 0, t); this.pose(SLOT.A, 0, a);
    const dir = a.clone().sub(t).setY(0).normalize(), side = new V(dir.z, 0, -dir.x), k = clamp(T / 1.7, 0, 1), ease = k * (2 - k);
    const pos = t.clone().addScaledVector(dir, -3.15 + ease * .35).addScaledVector(side, 0.55).setY(0.8 + ease * 0.05);
    const look = t.clone().lerp(a, 0.42).addScaledVector(side, -0.2).setY(0.08);
    const m = new Matrix4().lookAt(new V(), look.clone().sub(pos).normalize(), new V(0, 1, 0));
    const roll = noise(T * 0.6, 3) * 0.0012, q = new Q().setFromRotationMatrix(m).multiply(new Q().setFromAxisAngle(new V(0, 0, 1), roll));
    writeCam(this.rec, o, pos, q, 27 - ease * 1.2, 5);
  }

  onBot(o: number, id: 'bot' | 'anvilbot', simT: number, tq: Q, aq: Q, tp: V, ap: V, T: number) {
    const isT = id === 'bot';
    const q = (isT ? tq : aq).clone(), p = isT ? tp : ap;
    const local = isT ? new V(0.0, 0.28, -0.42) : new V(0.25, 0.46, 0.34);
    const pos = local.clone().applyQuaternion(q).add(p);
    // stiff rubber mount: camera lags the chassis by a few cm and rings
    const spring = isT ? this.botMount : this.aMount, vel = isT ? this.botMountV : this.aMountV;
    const a = pos.clone().sub(spring).multiplyScalar(700).addScaledVector(vel, -34);
    if (pos.distanceTo(spring) > 0.5) { spring.copy(pos); vel.set(0, 0, 0); }
    vel.addScaledVector(a, TICK); spring.addScaledVector(vel, TICK);
    const rq = isT ? this.botQ : this.aQ;
    const lookDown = new Q().setFromAxisAngle(new V(1, 0, 0), isT ? 0.12 : 0.34);
    const yaw = new Q().setFromAxisAngle(new V(0, 1, 0), isT ? 0 : -0.14);
    const flip = new Q().setFromAxisAngle(new V(0, 1, 0), Math.PI); // three cameras look down -Z, bots forward is +Z
    const target = q.clone().multiply(yaw).multiply(flip).multiply(new Q().setFromAxisAngle(new V(1, 0, 0), -(isT ? 0.12 : 0.34)));
    void lookDown;
    rq.slerp(target, 0.55);
    const drum = this.extra(simT, X.drumOmega) / 400;
    const buzz = (isT ? drum * 0.004 : 0.0015) + this.shock * 0.03;
    const jq = new Q().setFromAxisAngle(new V(Math.sin(T * 91), Math.cos(T * 77), 0.2).normalize(), Math.sin(T * 143) * buzz);
    writeCam(this.rec, o, spring, rq.clone().multiply(jq), isT ? 78 : 74, 2.2);
  }

  read(T: number, out: { p: V; q: Q; fov: number; focus: number; id: CamId; glitch: number; cutAge: number; simT: number; replay: boolean }) {
    const f = clamp(T / TICK, 0, this.ticks - 1.001), i = Math.floor(f), k = f - i, r = this.rec, a = i * STRIDE, b = a + STRIDE;
    const sameShot = r[a + 9] === r[b + 9] && r[a + 11] === r[b + 11];
    const l = sameShot ? k : 0;
    out.p.set(r[a] + (r[b] - r[a]) * l, r[a + 1] + (r[b + 1] - r[a + 1]) * l, r[a + 2] + (r[b + 2] - r[a + 2]) * l);
    out.q.set(r[a + 3], r[a + 4], r[a + 5], r[a + 6]);
    if (l > 0) out.q.slerp(new Q(r[b + 3], r[b + 4], r[b + 5], r[b + 6]), l);
    out.fov = r[a + 7] + (r[b + 7] - r[a + 7]) * l;
    out.focus = r[a + 8] + (r[b + 8] - r[a + 8]) * l;
    out.id = IDS[r[a + 9]]; out.glitch = r[a + 10]; out.cutAge = T - r[a + 11];
    out.simT = r[a + 12] + (sameShot ? (r[b + 12] - r[a + 12]) * l : 0); out.replay = r[a + 13] > 0.5;
  }
  distanceFromArena(p: V) { return Math.max(Math.abs(p.x) - ARENA.hx, Math.abs(p.z) - ARENA.hz); }
}
