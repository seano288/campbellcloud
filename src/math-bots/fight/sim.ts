// @ts-nocheck: ported from the P7 prototype. Its TSL node graphs and terse maths don't fit the strict compiler flags, so the typed edge is stage.ts.
// The fight itself: a Rapier rigid-body world, a hand-written tyre/drive model, a simulated
// drum (angular momentum + gyroscope) and a jointed pneumatic hammer. No three.js rendering
// here, so this file also runs in plain Node for the seed soak test (tools/soak.ts).
import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 as V, Quaternion as Q, Euler } from 'three';

export const DT = 1 / 120;
export const ARENA = { hx: 6, hz: 6, wall: 3.2 };

export const N_PANELS = 6;
export const N_SHED = 2;
export const N_DEBRIS = 26;
export const SLOT = { T: 0, A: 1, HAMMER: 2, PANEL: 3, SHED: 3 + N_PANELS, DEBRIS: 3 + N_PANELS + N_SHED };
export const N_SLOTS = SLOT.DEBRIS + N_DEBRIS;
// per-frame non-pose values
export const X = {
  drumAngle: 0, drumOmega: 1, tHp: 2, aHp: 3, tWheel: 4, /*4*/ tComp: 8, /*4*/ aWheel: 12, /*6*/ aComp: 18, /*6*/
  aWheelMask: 24, panelMask: 25, state: 26, armAngle: 27, tSlip: 28, count: 30,
};
const FRAME = N_SLOTS * 7 + X.count;
export const FRAME_SIZE = FRAME;

const G = { FLOOR: 1, T: 2, A: 4, ARM: 8, DEBRIS: 16 };
const groups = (m: number, f: number) => ((m & 0xffff) << 16) | (f & 0xffff);
const RAY_GROUPS = groups(0xffff, G.FLOOR | G.T | G.A);

// Body origins sit y0 above the floor in model space, so a model built with its wheels on y = 0
// goes under the body with a plain -y0 offset. Dimensions below are the rendered bots' dimensions.
export const DRUM = { I: 0.42, R: 0.16, omegaMax: 400, torque: 72, halfW: 0.235, center: new V(0, -0.02, 0.515), teeth: 2 };
export const TORQUE_DIM = { wheelR: 0.108, y0: 0.2, sag: 0.0185 };
export const ANVIL_DIM = { wheelR: 0.1, y0: 0.33, sag: 0.0193, pivot: new V(0, 0.445, -0.2), armLen: 1.33 };
/** Where the axe blade lands, in metres ahead of ANVIL's origin, at deck height. */
export const HAMMER_REACH = 1.1;
const SWING_TIME = 0.33;

const q = (x: number, y: number, z: number) => new Q().setFromEuler(new Euler(x, y, z, 'YXZ'));
const HP = Math.PI / 2;
/** An armour plate: u = plate +X, v = plate +Y, outward normal = plate +Z. `q` maps plate to body axes. */
export interface Plate { name: string; c: V; q: Q; hw: number; hh: number; t: number; }
export const PANELS: Plate[] = [
  { name: 'front-upper', c: new V(0, 0.09, 0.512), q: q(0, 0, 0), hw: 0.35, hh: 0.205, t: 0.02 },
  { name: 'plow', c: new V(0, -0.195, 0.54), q: q(-0.62, 0, 0), hw: 0.35, hh: 0.125, t: 0.022 },
  { name: 'left', c: new V(0.372, 0.13, 0), q: q(0, HP, 0), hw: 0.47, hh: 0.17, t: 0.014 },
  { name: 'right', c: new V(-0.372, 0.13, 0), q: q(0, -HP, 0), hw: 0.47, hh: 0.17, t: 0.014 },
  { name: 'top', c: new V(0, 0.327, 0.13), q: q(-HP, 0, 0), hw: 0.36, hh: 0.36, t: 0.016 },
  { name: 'rear', c: new V(0, 0.03, -0.505), q: q(0, Math.PI, 0), hw: 0.34, hh: 0.25, t: 0.018 },
];
const TILT_F = Math.atan2(0.30 - 0.232, 0.46);
/** TORQUE's dentable armour. Never comes off: the hammer dents and cuts it. */
export const T_PLATES: Plate[] = [
  { name: 'deck-front', c: new V(0, 0.072, 0.155), q: q(-HP + TILT_F, 0, 0), hw: 0.334, hh: 0.2375, t: 0.014 },
  { name: 'deck-rear', c: new V(0, 0.091, -0.31), q: q(-HP - 0.11, 0, 0), hw: 0.334, hh: 0.215, t: 0.014 },
  { name: 'fork-left', c: new V(0.262, 0.0, 0.28), q: q(0, HP, 0), hw: 0.36, hh: 0.11, t: 0.036 },
  { name: 'fork-right', c: new V(-0.262, 0.0, 0.28), q: q(0, -HP, 0), hw: 0.36, hh: 0.11, t: 0.036 },
];
export const pointInPlate = (pl: Plate, l: V) => tv5.copy(l).sub(pl.c).applyQuaternion(tq.copy(pl.q).invert());
const tv5 = new V(), tq = new Q();
export type ScarKind = 'skim' | 'gouge' | 'axe' | 'bend' | 'tear' | 'rip';
/** One mark left on one plate at a real contact point. u, v in metres from the plate centre; du, dv = strike direction along the plate. */
export interface Scar { t: number; bot: 0 | 1; plate: number; kind: ScarKind; u: number; v: number; du: number; dv: number; e: number; a?: number; b?: number; }

export type HitType = 'drum' | 'skim' | 'hammer' | 'panel-loose' | 'panel-off' | 'wheel-off' | 'ko' | 'go' | 'wall' | 'land' | 'spinup';
export interface FightEvent { t: number; type: HitType; J: number; p: [number, number, number]; note?: string }
export interface SparkBurst { t: number; p: V; d: V; n: number; speed: number; cone: number; hot: number }
export interface SmokePuff { t: number; p: V; v: V; size: number; life: number; dark: number }
export interface Decal { t: number; p: V; size: number; kind: number; rot: number }

class Rng {
  s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 1; }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  r(a: number, b: number) { return a + (b - a) * this.next(); }
}

interface Wheel {
  local: V; s: number; r: number; omega: number; angle: number; comp: number; load: number; slip: number;
  alive: boolean; I: number;
}
interface BotCfg {
  wheels: V[]; r: number; rest: number; k: number; c: number; tauStall: number; omegaFree: number; mu: number;
}
class Bot {
  fwd = new V(); up = new V(); left = new V(); pos = new V(); vel = new V(); ang = new V(); q = new Q();
  wheels: Wheel[]; th = 0; turn = 0; power = 1;
  body: RAPIER.RigidBody; cfg: BotCfg;
  constructor(body: RAPIER.RigidBody, cfg: BotCfg) {
    this.body = body; this.cfg = cfg;
    this.wheels = cfg.wheels.map((w) => ({
      local: w, s: Math.sign(w.x), r: cfg.r, omega: 0, angle: 0, comp: 0, load: 0, slip: 0, alive: true,
      I: 0.32,
    }));
  }
  sync() {
    const b = this.body;
    const t = b.translation(), r = b.rotation(), v = b.linvel(), a = b.angvel();
    this.pos.set(t.x, t.y, t.z); this.q.set(r.x, r.y, r.z, r.w); this.vel.set(v.x, v.y, v.z); this.ang.set(a.x, a.y, a.z);
    this.fwd.set(0, 0, 1).applyQuaternion(this.q);
    this.up.set(0, 1, 0).applyQuaternion(this.q);
    this.left.set(1, 0, 0).applyQuaternion(this.q);
  }
  world(l: V, out = new V()) { return out.copy(l).applyQuaternion(this.q).add(this.pos); }
}

const tv = new V(), tv2 = new V(), tv3 = new V(), tv4 = new V();
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const vec = (v: { x: number; y: number; z: number }) => new V(v.x, v.y, v.z);
const arr = (v: V): [number, number, number] => [v.x, v.y, v.z];

type Pilot = 'hold' | 'circle' | 'charge' | 'retreat' | 'stunned' | 'offer' | 'victory';
type ArmState = 'stow' | 'fire' | 'retract' | 'limp';

export async function initPhysics() { await RAPIER.init(); }

export class Fight {
  world: RAPIER.World;
  rng: Rng;
  t = 0; frame = 0;
  rec: Float32Array;
  T!: Bot; A!: Bot; arm!: RAPIER.RigidBody; armJoint!: RAPIER.RevoluteImpulseJoint;
  hull!: RAPIER.Collider; tParts: RAPIER.Collider[] = []; armBar!: RAPIER.Collider; drumCol!: RAPIER.Collider; aFrame!: RAPIER.Collider; armHead!: RAPIER.Collider; floor!: RAPIER.Collider;
  panelCol: (RAPIER.Collider | null)[] = [];
  panelBody: (RAPIER.RigidBody | null)[] = [];
  panelJoint: (RAPIER.ImpulseJoint | null)[] = [];
  panelStage: number[] = []; panelHits = [0, 0, 0, 0, 0, 0]; looseT = [0, 0, 0, 0, 0, 0];
  panelHp: number[] = [];
  shedBody: (RAPIER.RigidBody | null)[] = [];
  debris: (RAPIER.RigidBody | null)[] = [];
  debrisNext = 0;
  drumOmega = 0; drumAngle = 0; drumOn = false;
  tHp = 100; aHp = 100;
  events: FightEvent[] = [];
  sparks: SparkBurst[] = []; smoke: SmokePuff[] = []; decals: Decal[] = [];
  hits = 0; hammerHits = 0; torn = 0; swings = 0; scars: Scar[] = []; scarT: Record<string, number> = {}; aDown = 0;
  pilot: Pilot = 'hold'; pilotT = 0; arm_: ArmState = 'stow'; armT = 0; armCool = 0; armHitThisSwing = false;
  tGo: number; tEngage: number; circleDir: number; orbitR: number;
  biteCool = 0; hitCool = 0; finale = false; koT = -1; winner = '';
  chargeRequested = false; offers = 0; offerBase = 0; jam = 0;
  tTrail: V[] = [];
  aInv = 0; tInv = 0; wasAir = false; tWasAir = false; aAirT = 0; tAirT = 0;
  smokeAcc = 0; grindAcc = 0;
  preTv = new V(); preTw = new V(); preAv = new V(); preAw = new V();
  stepMs = 0;

  seed: number;
  constructor(seed: number, seconds = 60) {
    this.seed = seed;
    this.rng = new Rng(seed);
    this.rec = new Float32Array(Math.ceil(seconds / DT) * FRAME);
    this.tGo = 3.1;
    this.tEngage = this.rng.r(6.0, 7.6);
    this.circleDir = this.rng.next() < 0.5 ? -1 : 1;
    this.orbitR = this.rng.r(2.2, 3.0);
    const g = new RAPIER.Vector3(0, -9.81, 0);
    this.world = new RAPIER.World(g);
    this.world.timestep = DT;
    this.world.numSolverIterations = 6;
    this.buildArena();
    this.buildTorque();
    this.buildAnvil();
    this.record();
  }

  buildArena() {
    const w = this.world;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const fl = RAPIER.ColliderDesc.cuboid(ARENA.hx + 2, 0.5, ARENA.hz + 2).setTranslation(0, -0.5, 0)
      .setFriction(0.42).setRestitution(0.12).setCollisionGroups(groups(G.FLOOR, 0xffff));
    this.floor = w.createCollider(fl, body);
    const add = (x: number, y: number, z: number, hx: number, hy: number, hz: number) =>
      w.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(0.3).setRestitution(0.3)
        .setCollisionGroups(groups(G.FLOOR, 0xffff)), body);
    const { hx, hz, wall } = ARENA;
    add(hx + 0.2, wall, 0, 0.2, wall, hz + 1); add(-hx - 0.2, wall, 0, 0.2, wall, hz + 1);
    add(0, wall, hz + 0.2, hx + 1, wall, 0.2); add(0, wall, -hz - 0.2, hx + 1, wall, 0.2);
    add(0, wall * 2 + 0.2, 0, hx + 1, 0.2, hz + 1);
  }

  bodyAt(x: number, y: number, z: number, yaw: number, mass: number, com: V, inertia: V) {
    const q = new Q().setFromAxisAngle(new V(0, 1, 0), yaw);
    const d = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(0.04).setAngularDamping(0.35).setCanSleep(false).setCcdEnabled(true)
      .setAdditionalMassProperties(mass, { x: com.x, y: com.y, z: com.z }, { x: inertia.x, y: inertia.y, z: inertia.z }, { x: 0, y: 0, z: 0, w: 1 });
    return this.world.createRigidBody(d);
  }

  buildTorque() {
    const b = this.bodyAt(-3.3, 0.215, -3.3, Math.PI * 0.25, 113, new V(0, -0.045, 0.06), new V(10, 15, 7));
    const w = this.world, y0 = TORQUE_DIM.y0;
    const P: number[] = [];
    const p = (x: number, y: number, z: number) => P.push(x, y - y0, z);
    for (const s of [-1, 1]) { // the side slabs and rail outline of the model
      p(0.515 * s, 0.035, -0.55); p(0.515 * s, 0.257, -0.55); p(0.515 * s, 0.257, 0.44); p(0.515 * s, 0.035, 0.44);
      p(0.335 * s, 0.30, -0.28); p(0.335 * s, 0.30, -0.5);
    }
    const G_T = groups(G.T, G.FLOOR | G.A | G.ARM | G.DEBRIS);
    this.hull = w.createCollider(RAPIER.ColliderDesc.convexHull(new Float32Array(P))!.setDensity(0).setFriction(0.25).setRestitution(0.12).setCollisionGroups(G_T), b);
    for (const s of [-1, 1]) {
      this.tParts.push(w.createCollider(RAPIER.ColliderDesc.cuboid(0.035, 0.1, 0.2).setTranslation(0.28 * s, -0.01, 0.43).setDensity(0).setFriction(0.25).setCollisionGroups(G_T), b));
      this.tParts.push(w.createCollider(RAPIER.ColliderDesc.cuboid(0.012, 0.075, 0.09).setTranslation(0.505 * s, -0.11, 0.53).setDensity(0).setFriction(0.25).setCollisionGroups(G_T), b));
    }
    const dq = new Q().setFromAxisAngle(new V(0, 0, 1), Math.PI / 2);
    this.drumCol = w.createCollider(RAPIER.ColliderDesc.cylinder(DRUM.halfW, DRUM.R).setTranslation(DRUM.center.x, DRUM.center.y, DRUM.center.z)
      .setRotation({ x: dq.x, y: dq.y, z: dq.z, w: dq.w }).setDensity(0).setFriction(0.2).setRestitution(0.1).setCollisionGroups(G_T), b);
    const r = TORQUE_DIM.wheelR, rest = 0.03, wy = rest + r - TORQUE_DIM.sag - y0;
    this.T = new Bot(b, {
      r, rest, k: 15000, c: 900, tauStall: 52, omegaFree: 67, mu: 1.05,
      wheels: [new V(0.442, wy, 0.22), new V(-0.442, wy, 0.22), new V(0.442, wy, -0.3), new V(-0.442, wy, -0.3)],
    });
  }

  buildAnvil() {
    const b = this.bodyAt(3.3, 0.345, 3.3, Math.PI * 1.25, 97, new V(0, -0.08, 0), new V(13, 12, 7));
    const w = this.world, y0 = ANVIL_DIM.y0;
    const fr = RAPIER.ColliderDesc.cuboid(0.345, 0.28, 0.49).setTranslation(0, 0.0325, 0).setDensity(0).setFriction(0.3).setRestitution(0.1)
      .setCollisionGroups(groups(G.A, G.FLOOR | G.T | G.DEBRIS));
    this.aFrame = w.createCollider(fr, b);
    PANELS.forEach((pn, i) => {
      const c = w.createCollider(RAPIER.ColliderDesc.cuboid(pn.hw, pn.hh, pn.t).setTranslation(pn.c.x, pn.c.y, pn.c.z)
        .setRotation({ x: pn.q.x, y: pn.q.y, z: pn.q.z, w: pn.q.w }).setDensity(0)
        .setFriction(0.3).setRestitution(0.1).setCollisionGroups(groups(G.A, G.FLOOR | G.T | G.DEBRIS)), b);
      this.panelCol[i] = c; this.panelBody[i] = null; this.panelJoint[i] = null; this.panelStage[i] = 0; this.panelHp[i] = 100;
    });
    const r = ANVIL_DIM.wheelR, rest = 0.04, wy = rest + r - ANVIL_DIM.sag - y0;
    this.A = new Bot(b, {
      r, rest, k: 8200, c: 620, tauStall: 30, omegaFree: 48, mu: 0.95,
      wheels: [0.335, 0, -0.335].flatMap((z) => [new V(0.43, wy, z), new V(-0.43, wy, z)]),
    });
    // hammer: a real body on a real revolute joint, driven by equal-and-opposite torque
    const q0 = b.rotation();
    const pivot = this.A_world0(b, ANVIL_DIM.pivot);
    const arm = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pivot.x, pivot.y, pivot.z).setRotation(q0)
      .setCanSleep(false).setCcdEnabled(true).setAngularDamping(0.5)
      .setAdditionalMassProperties(9, { x: 0, y: 0, z: 1.0 }, { x: 3.6, y: 3.6, z: 0.2 }, { x: 0, y: 0, z: 0, w: 1 }));
    const L = ANVIL_DIM.armLen;
    this.armBar = w.createCollider(RAPIER.ColliderDesc.cuboid(0.04, 0.05, L * 0.45).setTranslation(0, 0, L * 0.45).setDensity(0).setFriction(0.25)
      .setCollisionGroups(groups(G.ARM, G.FLOOR | G.T | G.DEBRIS)), arm);
    this.armHead = w.createCollider(RAPIER.ColliderDesc.cuboid(0.07, 0.195, 0.1).setTranslation(0, -0.09, L - 0.02).setDensity(0).setFriction(0.2).setRestitution(0.15)
      .setCollisionGroups(groups(G.ARM, G.FLOOR | G.T | G.DEBRIS)), arm);
    this.arm = arm;
    const jd = RAPIER.JointData.revolute({ x: ANVIL_DIM.pivot.x, y: ANVIL_DIM.pivot.y, z: ANVIL_DIM.pivot.z }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    jd.limitsEnabled = true; jd.limits = [-2.25, 0.62];
    this.armJoint = w.createImpulseJoint(jd, b, arm, true) as RAPIER.RevoluteImpulseJoint;
    // start stowed: arm tilted up and back over the top
    const stow = new Q().setFromAxisAngle(new V(1, 0, 0), -ARM_STOW);
    const rq = new Q(q0.x, q0.y, q0.z, q0.w).multiply(stow);
    arm.setRotation({ x: rq.x, y: rq.y, z: rq.z, w: rq.w }, true);
    void y0;
  }
  A_world0(b: RAPIER.RigidBody, l: V) {
    const t = b.translation(), r = b.rotation();
    return tv.copy(l).applyQuaternion(new Q(r.x, r.y, r.z, r.w)).add(tv2.set(t.x, t.y, t.z)).clone();
  }

  // ---- driving -----------------------------------------------------------------------
  wheelsStep(bot: Bot, cfg: BotCfg) {
    const body = bot.body;
    const dt = DT;
    for (const w of bot.wheels) {
      if (!w.alive) continue;
      const o = bot.world(w.local, tv);
      const dn = tv2.copy(bot.up).negate();
      const ray = new RAPIER.Ray({ x: o.x, y: o.y, z: o.z }, { x: dn.x, y: dn.y, z: dn.z });
      const len = cfg.rest + w.r;
      const hit = this.world.castRayAndGetNormal(ray, len, true, undefined, RAY_GROUPS, undefined, body);
      const cmd = clamp(bot.th - bot.turn * w.s, -1, 1) * bot.power;
      let tau = cfg.tauStall * clamp(cmd - w.omega / cfg.omegaFree * Math.abs(cmd), -1, 1);
      if (Math.abs(cmd) < 0.03) tau = -w.omega * 8;
      if (bot.power <= 0) tau = -w.omega * 3;
      let fLong = 0;
      w.load = 0; w.slip = 0;
      if (hit) {
        const toi = hit.timeOfImpact;
        const comp = Math.max(0, len - toi);
        w.comp = comp;
        const px = o.x + dn.x * toi, py = o.y + dn.y * toi, pz = o.z + dn.z * toi;
        const pt = { x: px, y: py, z: pz };
        const nrm = tv3.set(hit.normal.x, hit.normal.y, hit.normal.z);
        const vp = vec(body.velocityAtPoint(pt));
        const other = hit.collider.parent();
        if (other && other.isDynamic()) vp.sub(vec(other.velocityAtPoint(pt)));
        const vn = vp.dot(nrm);
        const N = clamp(cfg.k * comp - cfg.c * vn, 0, 9000);
        w.load = N;
        const f = tv4.copy(bot.fwd).addScaledVector(nrm, -bot.fwd.dot(nrm)).normalize();
        const side = new V().crossVectors(nrm, f);
        const vLong = vp.dot(f), vLat = vp.dot(side);
        const sx = vLong - w.omega * w.r, sy = vLat;
        const mag = Math.hypot(sx, sy) + 1e-5;
        const F = cfg.mu * N * (1 - Math.exp(-mag / 0.22));
        const fx = (-sx / mag) * F, fy = (-sy / mag) * F;
        fLong = fx;
        w.slip = mag;
        const imp = {
          x: (nrm.x * N + f.x * fx + side.x * fy) * dt,
          y: (nrm.y * N + f.y * fx + side.y * fy) * dt,
          z: (nrm.z * N + f.z * fx + side.z * fy) * dt,
        };
        body.applyImpulseAtPoint(imp, pt, true);
        if (other && other.isDynamic()) other.applyImpulseAtPoint({ x: -imp.x, y: -imp.y, z: -imp.z }, pt, true);
        // tyre smoke + rubber marks are driven by the real slip number
        if (mag > 2.2 && this.rng.next() < 0.05) {
          this.smoke.push({ t: this.t, p: new V(px, py + 0.03, pz), v: new V(this.rng.r(-.2, .2), 0.25, this.rng.r(-.2, .2)), size: 0.3, life: 1.3, dark: 0.15 });
        }
      } else w.comp = Math.max(0, w.comp - dt * 0.8);
      w.omega += ((tau - fLong * w.r) / w.I) * dt;
      w.angle += w.omega * dt;
    }
  }

  aim(bot: Bot, target: V, speed: number, kp = 2.4, kd = 0.45) {
    const to = tv.copy(target).sub(bot.pos); to.y = 0;
    const f = tv2.copy(bot.fwd); f.y = 0; f.normalize();
    const err = Math.atan2(f.x * 0 + (f.z * to.x - f.x * to.z), f.dot(to));
    bot.turn = clamp(kp * err - kd * bot.ang.y, -1, 1);
    const c = Math.cos(err);
    bot.th = speed * (c > 0 ? c * c : 0);
    return err;
  }

  // ---- computer-controlled behaviours -------------------------------------------------
  torquePilot() {
    const { T, A, t } = this;
    this.pilotT += DT;
    const set = (p: Pilot) => { this.pilot = p; this.pilotT = 0; };
    const dist = T.pos.distanceTo(A.pos);
    const toCentre = new V(-T.pos.x, 0, -T.pos.z);
    if (this.koT >= 0 && this.pilot !== 'victory') set('victory');
    switch (this.pilot) {
      case 'hold':
        T.th = 0; T.turn = 0;
        if (t >= this.tGo) set('circle');
        break;
      case 'circle': {
        const r = new V().subVectors(T.pos, A.pos); r.y = 0; r.normalize();
        const tan = new V(-r.z * this.circleDir, 0, r.x * this.circleDir);
        const tgt = new V().copy(A.pos).addScaledVector(r, this.orbitR).addScaledVector(tan, 1.6);
        tgt.x = clamp(tgt.x, -4.6, 4.6); tgt.z = clamp(tgt.z, -4.6, 4.6);
        this.aim(T, tgt, 0.62);
        const ready = this.drumOmega > DRUM.omegaMax * 0.82;
        if (this.needOffer()) { this.offerBase = this.hammerHits; set('offer'); break; }
        if (t > this.tEngage && ready) set('charge');
        if (this.chargeRequested && ready) { this.chargeRequested = false; set('charge'); }
        break;
      }
      case 'charge': {
        const lead = new V().copy(A.pos).addScaledVector(A.vel, 0.3 + dist * 0.05);
        // aim at the body, slightly off-centre so no two strikes land the same
        const err = this.aim(T, lead, 1, 3.0, 0.5);
        if (Math.abs(err) > 0.7 && dist < 1.4) T.th = 0.1;
        // driver backs out of a jam rather than pushing against a wall for ten seconds
        this.jam = T.vel.length() < 0.25 ? this.jam + DT : 0;
        if (this.jam > 0.9) { this.jam = 0; this.pilot = 'stunned'; this.pilotT = 0.3; break; }
        if (this.pilotT > (this.finale ? 6 : 3.6)) set('circle');
        break;
      }
      case 'stunned':
        T.th = 0; T.turn = 0;
        if (this.pilotT > 0.55) set('retreat');
        break;
      case 'retreat': {
        if (this.pilotT < 0.75) { T.th = -0.85; T.turn = 0; }
        else {
          const away = new V().subVectors(T.pos, A.pos).setY(0).normalize();
          const tgt = new V().copy(A.pos).addScaledVector(away, 3.2).addScaledVector(toCentre.normalize(), 1.5);
          tgt.x = clamp(tgt.x, -4.6, 4.6); tgt.z = clamp(tgt.z, -4.6, 4.6);
          this.aim(T, tgt, 0.7);
        }
        if (this.pilotT > 1.5) set('circle');
        break;
      }
      case 'offer': {
        // Bias: the drum driver stops where ANVIL's axe will land on its deck, so the hammer beat always happens.
        const strike = new V().copy(A.pos).addScaledVector(A.fwd, 1.42);
        const away = T.pos.distanceTo(strike);
        if (away > 0.22) this.aim(T, strike, Math.min(0.55, 0.2 + away * 0.3), 2.2, 0.45);
        else { T.th = 0; T.turn = 0; }
        if (this.hammerHits > this.offerBase || this.pilotT > 7) { this.offers++; set('retreat'); }
        break;
      }
      case 'victory': {
        const since = t - this.koT;
        if (since < 1.6) { T.th = since < 0.9 ? -0.7 : 0; T.turn = 0; }
        else { T.th = 0; T.turn = since > 3.2 ? 0.75 : 0; }
        break;
      }
    }
    if (this.finale && this.koT < 0 && (this.pilot === 'circle' || this.pilot === 'retreat') && this.pilotT > 0.5 && this.drumOmega > DRUM.omegaMax * 0.7) set('charge');
    if (t >= 1.15 && this.koT < 0) this.drumOn = true;
    if (this.koT >= 0 && t - this.koT > 2.5) this.drumOn = false;
  }
  needOffer() {
    return this.koT < 0 && !this.finale && this.hits >= 1 && this.hammerHits < Math.min(2, this.hits) && this.offers < 4 && this.t < 19;
  }

  anvilPilot() {
    const { T, A, t } = this;
    if (this.koT >= 0) { A.th = 0; A.turn = 0; return; }
    if (t < this.tGo + 0.25) { A.th = 0; A.turn = 0; return; }
    const seen = this.tTrail[0] ?? T.pos;
    const near = Math.abs(A.pos.x) > ARENA.hx - 1.0 || Math.abs(A.pos.z) > ARENA.hz - 1.0;
    const nose = tv.copy(A.pos).addScaledVector(A.fwd, 1.2);
    const pushing = Math.abs(nose.x) > ARENA.hx || Math.abs(nose.z) > ARENA.hz;
    if (near && pushing) { A.th = -0.7; A.turn = 0.4; }
    else {
      const sp = this.finale ? 0.25 : 0.72;
      const stand = this.pilot === 'offer' ? 0.25 : sp;
      this.aim(A, seen, seen.distanceTo(A.pos) > 1.25 ? stand : 0.05, 1.6, 0.5);
    }
    // hammer trigger: TORQUE inside the strike box in front of the bot
    const d = new V().subVectors(T.pos, A.pos);
    const ahead = d.dot(A.fwd), side = Math.abs(d.dot(A.left));
    void ahead; void side;
    // Air supply: each drum hit TORQUE lands leaves ANVIL one swing, plus a spare while TORQUE is in the zone.
    const air = this.swings < this.hits + (this.pilot === 'offer' ? 1 : 0) && !this.finale;
    if (this.hits >= 1 && air && this.arm_ === 'stow' && this.armCool <= 0 && A.up.y > 0.9 && this.wouldLand()) { this.swings++; this.fireArm(); }
  }
  /** Project both bots one swing ahead: fire only if the blade comes down on TORQUE's footprint. */
  wouldLand() {
    const { T, A } = this;
    if (T.up.y < 0.6 || T.vel.length() > (this.pilot === 'offer' ? 2.2 : 1.4) || A.vel.length() > 1.2 || Math.abs(A.ang.y) > 1.6 || A.pos.y > 0.42) return false;
    const yaw = A.ang.y * SWING_TIME, c = Math.cos(yaw), s = Math.sin(yaw);
    const f = new V(A.fwd.x * c + A.fwd.z * s, 0, -A.fwd.x * s + A.fwd.z * c);
    const hit = new V().copy(A.pos).addScaledVector(A.vel, SWING_TIME).addScaledVector(f, HAMMER_REACH);
    const pt = new V().copy(T.pos).addScaledVector(T.vel, SWING_TIME);
    const l = hit.sub(pt).applyQuaternion(new Q().copy(T.q).invert());
    return Math.abs(l.x) < 0.42 && l.z > -0.46 && l.z < 0.58;
  }
  fireArm() { this.arm_ = 'fire'; this.armT = 0; this.armHitThisSwing = false; }

  armAngle() {
    // angle of the arm above bot-forward, positive up, about the bot's lateral axis
    const r = this.arm.rotation();
    const dir = new V(0, 0, 1).applyQuaternion(new Q(r.x, r.y, r.z, r.w));
    return Math.atan2(dir.dot(this.A.up), dir.dot(this.A.fwd));
  }
  armStep() {
    const A = this.A, arm = this.arm;
    this.armT += DT; this.armCool -= DT;
    const ang = this.armAngle();
    const ax = A.left;
    const av = vec(arm.angvel()).sub(A.ang).dot(ax); // + = rotating about +X = nose-down in bot frame
    let tq = 0;
    switch (this.arm_) {
      case 'stow': tq = clamp((ang - ARM_STOW) * 900 - av * 110, -420, 420); break;
      case 'fire':
        tq = this.armT < 0.36 ? 560 : 0;
        if (this.armT > 0.6) { this.arm_ = 'retract'; this.armT = 0; }
        break;
      case 'retract':
        tq = clamp((ang - ARM_STOW) * 320 - av * 60, -320, 320);
        if (this.armT > 1.15) { this.arm_ = 'stow'; this.armCool = 0.8; }
        break;
      case 'limp': tq = av * -4; break;
    }
    if (tq !== 0) {
      const i = ax.clone().multiplyScalar(tq * DT);
      arm.applyTorqueImpulse({ x: i.x, y: i.y, z: i.z }, true);
      // Bias: the chassis takes under half of the swing's reaction. At full value a real-sized ram
      // pitches this 97 kg box onto its back every time, which is the main reason swings missed.
      const k = this.arm_ === 'fire' ? 0.42 : 1;
      A.body.applyTorqueImpulse({ x: -i.x * k, y: -i.y * k, z: -i.z * k }, true);
    }
  }

  drumStep() {
    const T = this.T;
    const torque = this.drumOn ? DRUM.torque * clamp((DRUM.omegaMax - this.drumOmega) / 60, 0, 1) : -this.drumOmega * 0.25;
    const dw = (torque / DRUM.I) * DT;
    if (this.drumOn && this.drumOmega < 1) this.pushEv('spinup', 0, T.pos);
    this.drumOmega = Math.max(0, this.drumOmega + dw);
    this.drumAngle = (this.drumAngle + this.drumOmega * DT) % (Math.PI * 2);
    // a = spin axis in world: the front of the drum moves UP
    const a = tv.copy(T.left).negate();
    // motor reaction on the chassis (spinning up the drum rocks the bot)
    const r = a.clone().multiplyScalar(-torque * DT);
    // gyroscopic torque on the chassis: tau = L x Omega
    const L = a.clone().multiplyScalar(DRUM.I * this.drumOmega);
    const g = L.cross(T.ang).multiplyScalar(DT * 0.85);
    T.body.applyTorqueImpulse({ x: r.x + g.x, y: r.y + g.y, z: r.z + g.z }, true);
  }

  // ---- contacts ------------------------------------------------------------------------
  pushEv(type: HitType, J: number, p: V, note?: string) { this.events.push({ t: this.t, type, J, p: arr(p), note }); }

  contactPoint(a: RAPIER.Collider, b: RAPIER.Collider): null | { p: V; n: V; imp: number } {
    let res: null | { p: V; n: V; imp: number } = null;
    this.world.contactPair(a, b, (m, flipped) => {
      const k = m.numSolverContacts();
      if (!k) return;
      const p = new V(); let imp = 0;
      for (let i = 0; i < k; i++) { const c = m.solverContactPoint(i); if (c) p.add(tv.set(c.x, c.y, c.z)); }
      p.multiplyScalar(1 / k);
      for (let i = 0; i < m.numContacts(); i++) imp += m.contactImpulse(i);
      const n = vec(m.normal()); if (flipped) n.negate();
      if (!res || imp > res.imp) res = { p, n, imp };
    });
    return res;
  }

  drumContacts() {
    if (this.biteCool > 0) { this.biteCool -= DT; }
    if (this.hitCool > 0) { this.hitCool -= DT; }
    const targets: [RAPIER.Collider, number][] = [[this.aFrame, -1]];
    this.panelCol.forEach((c, i) => { if (c) targets.push([c, i]); });
    let best: null | { p: V; n: V; imp: number; panel: number } = null;
    for (const [c, i] of targets) {
      const r = this.contactPoint(this.drumCol, c);
      if (r && (!best || r.imp > best.imp || (i >= 0 && best.panel < 0))) best = { ...r, panel: i };
    }
    if (best) { this.strike(best.p, best.n, best.panel); return; }
    // a hanging or fallen plate in the drum's way gets ripped off and thrown, instead of jamming TORQUE
    if (this.drumOmega < 40) return;
    for (let i = 0; i < N_PANELS; i++) {
      const b = this.panelBody[i]; if (!b || !b.numColliders()) continue;
      const r = this.contactPoint(this.drumCol, b.collider(0)); if (!r) continue;
      const d = new V().subVectors(r.p, this.T.pos).setY(0).normalize().setY(0.55);
      if (this.panelStage[i] === 1 && this.t - this.looseT[i] < 1.2) continue; // let it swing first
      if (this.panelStage[i] === 1) { this.markPlate(1, r.p, d, 'gouge', 0.7); this.tear(i, d, 200); }
      else b.applyImpulse({ x: d.x * 30, y: d.y * 30, z: d.z * 30 }, true);
      this.sparks.push({ t: this.t, p: r.p.clone(), d: d.clone().normalize(), n: 60, speed: 14, cone: 0.7, hot: 1 });
      this.biteCool = 0.12; return;
    }
  }

  strike(P: V, nn: V, panel: number) {
    const { T, A } = this;
    if (this.biteCool > 0) return;
    if (this.drumOmega < 40) return;
    const C = T.world(DRUM.center);
    const rv = new V().subVectors(P, C);
    const a = tv.copy(T.left).negate();
    const omegaV = a.clone().multiplyScalar(this.drumOmega);
    // tooth tip velocity at the contact, on the drum radius
    const rad = rv.clone().addScaledVector(a, -rv.dot(a)).normalize().multiplyScalar(DRUM.R);
    const vTip = omegaV.cross(rad);
    const vA = vec(A.body.velocityAtPoint(P));
    const vT = vec(T.body.velocityAtPoint(P));
    // the solver has already stopped the bots by now, so closing speed comes from the pre-step state
    const preT = this.preTv.clone().add(this.preTw.clone().cross(tv2.subVectors(P, T.pos)));
    const preA = this.preAv.clone().add(this.preAw.clone().cross(tv2.subVectors(P, A.pos)));
    const closing = Math.max(0.1, Math.abs(preT.sub(preA).dot(nn.clone().normalize())));
    const rps = this.drumOmega / (Math.PI * 2);
    const bite = closing / (DRUM.teeth * rps);                // how deep a tooth gets per pass
    const biteFrac = clamp(bite / 0.022, 0.08, 1);
    const vrel = vTip.clone().add(vT).sub(vA);
    const u = vrel.clone().normalize();
    // effective masses at the contact
    const rA = new V().subVectors(P, A.pos);
    const cr = rA.clone().cross(u);
    const kA = 1 / 113 + cr.lengthSq() / 12;
    const kD = (DRUM.R * DRUM.R) / DRUM.I;
    let J = (1.25 * vrel.length()) / (kA + kD) * biteFrac;
    // Bias: TORQUE always wins. Early strikes are capped so the fight lasts; the finisher is not.
    const big = J > 120 && this.hitCool <= 0 && this.pilot !== 'offer';
    if (big) {
      const caps = [235, 300, 360, 420];
      const finish = this.finale;
      J = Math.min(J, finish ? 760 : caps[Math.min(this.hits, caps.length - 1)]);
      if (finish) J = Math.max(J, 520);
    } else {
      J = Math.min(J, 32);
    }
    // shove direction: tooth tangent blended with the shove along the strike line
    const shove = new V().subVectors(A.pos, T.pos).setY(0).normalize();
    const dir = u.clone().multiplyScalar(0.62).addScaledVector(shove, 0.75).setY(Math.abs(u.y) * 0.62 + 0.12).normalize();
    const imp = dir.clone().multiplyScalar(J);
    A.body.applyImpulseAtPoint({ x: imp.x, y: imp.y, z: imp.z }, { x: P.x, y: P.y, z: P.z }, true);
    // equal and opposite through the drum: drum slows, chassis kicked back through the axle
    this.drumOmega = Math.max(0, this.drumOmega - (J * DRUM.R) / DRUM.I * 0.82);
    T.body.applyImpulseAtPoint({ x: -imp.x * 0.55, y: -imp.y * 0.55, z: -imp.z * 0.55 }, { x: C.x, y: C.y, z: C.z }, true);
    this.biteCool = big ? 0.16 : 0.07;
    const e = J / 300;
    this.sparks.push({ t: this.t, p: P.clone(), d: dir.clone().negate().lerp(new V(0, 1, 0), 0.45).normalize(), n: Math.round(big ? 170 + 200 * e : 14), speed: big ? 16 : 8, cone: 0.7, hot: 1 });
    this.sparks.push({ t: this.t, p: P.clone(), d: vTip.clone().normalize(), n: big ? 110 : 10, speed: big ? 24 : 12, cone: 0.38, hot: 1.3 });
    if (big) {
      this.hitCool = 0.55;
      this.hits++;
      this.pushEv('drum', J, P, panel >= 0 ? PANELS[panel].name : 'frame');
      const finisher = this.finale;
      this.aHp = Math.max(finisher ? 0 : 6, this.aHp - J / 9);
      this.markPlate(1, P, vTip, finisher ? 'tear' : 'gouge', Math.min(1.4, J / 420));
      this.damagePanels(panel, J, P, dir, finisher);
      this.burst(P, 3 + Math.round(e * 4), vA.clone().addScaledVector(dir, 3), 9);
      this.decals.push({ t: this.t, p: new V(P.x, 0.003, P.z), size: 0.5, kind: 1, rot: this.rng.r(0, 6.28) });
      for (let i = 0; i < 4; i++) this.smoke.push({ t: this.t, p: P.clone(), v: new V(this.rng.r(-.8, .8), this.rng.r(.3, 1.2), this.rng.r(-.8, .8)), size: 0.4, life: 1.2, dark: 0.45 });
      if (finisher) this.ko('drum');
      else if (this.aHp <= 34 && this.t > 15) this.finale = true;
      this.tEngage = this.t + this.rng.r(2.6, 3.8);
      if (this.pilot !== 'victory') { this.pilot = 'stunned'; this.pilotT = 0; }
    } else {
      this.pushEv('skim', J, P);
      this.markPlate(1, P, vTip, 'skim', Math.min(1, J / 32));
    }
  }

  burst(p: V, n: number, base: V, spread: number) {
    for (let i = 0; i < n; i++) this.spawnDebris(p, new V(base.x + this.rng.r(-spread, spread) * 0.5, Math.abs(base.y) + this.rng.r(0.5, spread), base.z + this.rng.r(-spread, spread) * 0.5));
  }

  spawnDebris(p: V, v: V) {
    const i = this.debrisNext; this.debrisNext = (i + 1) % N_DEBRIS;
    const old = this.debris[i];
    if (old) this.world.removeRigidBody(old);
    const s = this.rng.r(0.018, 0.05);
    const b = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, Math.max(0.06, p.y), p.z).setLinvel(v.x, v.y, v.z)
      .setAngvel({ x: this.rng.r(-30, 30), y: this.rng.r(-30, 30), z: this.rng.r(-30, 30) }).setLinearDamping(0.1).setAngularDamping(0.8));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(s * 1.3, s * 0.35, s).setDensity(5000).setFriction(0.4).setRestitution(0.45)
      .setCollisionGroups(groups(G.DEBRIS, G.FLOOR | G.T | G.A | G.ARM)), b);
    this.debris[i] = b;
  }

  /** Plate-space position of a world point for one plate, whether attached or loose. */
  toPlate(bot: 0 | 1, i: number, P: V, out: V) {
    const B = bot ? this.A : this.T, pl = (bot ? PANELS : T_PLATES)[i], b = bot ? this.panelBody[i] : null;
    if (b) {
      const t = b.translation(), r = b.rotation();
      return out.copy(P).sub(tv.set(t.x, t.y, t.z)).applyQuaternion(new Q(r.x, r.y, r.z, r.w).multiply(pl.q).invert());
    }
    return out.copy(P).sub(B.pos).applyQuaternion(new Q().copy(B.q).invert()).sub(pl.c).applyQuaternion(new Q().copy(pl.q).invert());
  }
  /** Find the plate under a real contact point and write a scar there. */
  markPlate(bot: 0 | 1, P: V, along: V, kind: ScarKind, e: number, a?: number) {
    const list = bot ? PANELS : T_PLATES;
    let best = -1, bd = 1e9; const l = new V(), bl = new V();
    list.forEach((pl, i) => {
      if (bot && this.panelStage[i] === 2) return;
      this.toPlate(bot, i, P, l);
      const dx = Math.max(0, Math.abs(l.x) - pl.hw), dy = Math.max(0, Math.abs(l.y) - pl.hh), d = Math.hypot(dx, dy, l.z);
      if (d < bd) { bd = d; best = i; bl.copy(l); }
    });
    if (best < 0 || bd > 0.3) return -1;
    const key = `${bot}${best}${kind}`;
    if (kind === 'skim' && this.t - (this.scarT[key] ?? -9) < 0.3) return best;
    this.scarT[key] = this.t;
    if (this.scars.length > 240) return best;
    const pl = list[best];
    const w = new V(), wq = new Q();
    if (bot && this.panelBody[best]) { const r = this.panelBody[best]!.rotation(); wq.set(r.x, r.y, r.z, r.w).multiply(pl.q); } else wq.copy((bot ? this.A : this.T).q).multiply(pl.q);
    w.copy(along).applyQuaternion(wq.invert());
    const len = Math.hypot(w.x, w.y) || 1;
    this.scars.push({ t: this.t, bot, plate: best, kind, u: clamp(bl.x, -pl.hw, pl.hw), v: clamp(bl.y, -pl.hh, pl.hh), du: w.x / len, dv: w.y / len, e, a });
    return best;
  }
  panelWorld(i: number) {
    const pos = this.A.world(PANELS[i].c);
    return pos;
  }
  damagePanels(panel: number, J: number, P: V, dir: V, finisher: boolean) {
    // pick the struck panel, or the nearest still attached one
    let i = panel;
    if (i < 0 || this.panelStage[i] === 2) {
      let bd = 1e9;
      for (let k = 0; k < N_PANELS; k++) {
        if (this.panelStage[k] === 2) continue;
        const d = this.panelWorld(k).distanceTo(P);
        if (d < bd) { bd = d; i = k; }
      }
    }
    if (i < 0) return;
    const go = (k: number) => {
      const st = this.panelStage[k];
      if (st === 0) this.loosen(k, dir, P);
      else if (st === 1) this.tear(k, dir, J);
    };
    // A plate dents first. The second strike on it, or the third of the fight, levers it off its bolts so it hangs bent;
    // the next one rips it away. The finisher always takes the struck plate.
    const prior = this.panelHits[i]++;
    const hanging = this.panelStage.findIndex((s) => s === 1);
    if (hanging >= 0 && hanging !== i) go(hanging);
    if (finisher || this.panelStage[i] === 1 || prior >= 1 || this.hits >= 3) go(i);
    if (finisher) {
      if (this.panelStage[i] === 1) go(i);
      for (let k = 0; k < N_PANELS; k++) if (this.panelStage[k] === 1) this.tear(k, dir, J);
      const list = [...this.A.wheels.keys()].filter((k) => this.A.wheels[k].alive);
      const near = list.sort((a, b) => this.A.world(this.A.wheels[a].local).distanceTo(P) - this.A.world(this.A.wheels[b].local).distanceTo(P));
      near.slice(0, 2).forEach((k) => this.shedWheel(k, dir));
    }
  }
  panelBodyFromAttached(i: number) {
    const pn = PANELS[i], A = this.A;
    const c = this.panelCol[i]; if (c) this.world.removeCollider(c, true);
    this.panelCol[i] = null;
    const p = A.world(pn.c);
    const b = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation({ x: A.q.x, y: A.q.y, z: A.q.z, w: A.q.w })
      .setLinvel(A.vel.x, A.vel.y, A.vel.z).setAngvel({ x: A.ang.x, y: A.ang.y, z: A.ang.z }).setLinearDamping(0.05).setAngularDamping(0.25).setCcdEnabled(true));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(pn.hw, pn.hh, pn.t).setRotation({ x: pn.q.x, y: pn.q.y, z: pn.q.z, w: pn.q.w }).setMass(5.5).setFriction(0.3).setRestitution(0.3)
      .setCollisionGroups(groups(G.DEBRIS, G.FLOOR | G.T | G.ARM)), b);
    this.panelBody[i] = b;
    return b;
  }
  loosen(i: number, dir: V, P?: V) {
    const pn = PANELS[i], A = this.A;
    // the bolts farthest from the blow are the ones that hold: the plate swings on that edge
    const l = new V(); if (P) this.toPlate(1, i, P, l);
    const edges: [V, V, number][] = [
      [new V(0, pn.hh, 0), new V(1, 0, 0), pn.hh - l.y + 0.12],
      [new V(pn.hw, 0, 0), new V(0, 1, 0), pn.hw - l.x],
      [new V(-pn.hw, 0, 0), new V(0, 1, 0), pn.hw + l.x],
    ];
    const far = edges.reduce((a, e) => (e[2] > a[2] ? e : a));
    const hinge = far[0].clone().applyQuaternion(pn.q), axis = far[1].clone().applyQuaternion(pn.q);
    const b = this.panelBodyFromAttached(i);
    const anchorA = pn.c.clone().add(hinge);
    const j = RAPIER.JointData.revolute({ x: anchorA.x, y: anchorA.y, z: anchorA.z }, { x: hinge.x, y: hinge.y, z: hinge.z }, { x: axis.x, y: axis.y, z: axis.z });
    j.limitsEnabled = true; j.limits = [-1.5, 1.5];
    this.panelJoint[i] = this.world.createImpulseJoint(j, A.body, b, true);
    this.panelStage[i] = 1; this.looseT[i] = this.t;
    b.applyImpulse({ x: dir.x * 9 + A.fwd.x * 6, y: 4, z: dir.z * 9 + A.fwd.z * 6 }, true);
    this.pushEv('panel-loose', 0, A.world(pn.c), pn.name);
    // bend scar: fold line along the holding edge. a = edge (0 top, 1 +u, 2 -u)
    this.scars.push({ t: this.t, bot: 1, plate: i, kind: 'bend', u: l.x, v: l.y, du: far[0].x, dv: far[0].y, e: 1, a: edges.indexOf(far) });
  }
  tear(i: number, dir: V, J: number) {
    const b = this.panelBody[i], j = this.panelJoint[i];
    if (j) { this.world.removeImpulseJoint(j, true); this.panelJoint[i] = null; }
    if (b) {
      const k = 22 + J * 0.03;
      b.applyImpulse({ x: dir.x * k, y: k * 0.6 + 8, z: dir.z * k }, true);
      b.applyTorqueImpulse({ x: this.rng.r(-3, 3), y: this.rng.r(-3, 3), z: this.rng.r(-3, 3) }, true);
    }
    this.panelStage[i] = 2; this.torn++;
    this.scars.push({ t: this.t, bot: 1, plate: i, kind: 'rip', u: 0, v: 0, du: 1, dv: 0, e: 1 });
    this.pushEv('panel-off', J, this.A.world(PANELS[i].c), PANELS[i].name);
    const p = this.A.world(PANELS[i].c);
    this.sparks.push({ t: this.t, p, d: dir.clone().setY(0.7).normalize(), n: 70, speed: 12, cone: 0.9, hot: 1 });
  }
  shedWheel(k: number, dir: V) {
    const slot = this.shedBody.findIndex((b) => !b);
    const idx = slot < 0 ? this.shedBody.length : slot;
    if (idx >= N_SHED) return;
    const A = this.A, w = A.wheels[k];
    w.alive = false;
    const p = A.world(w.local.clone().setY(w.local.y - A.cfg.rest));
    const q = new Q().setFromAxisAngle(new V(0, 0, 1), Math.PI / 2).premultiply(A.q);
    const b = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, Math.max(0.2, p.y), p.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinvel(A.vel.x + dir.x * 2.5, A.vel.y + 2.5, A.vel.z + dir.z * 2.5).setAngvel({ x: A.left.x * w.omega, y: A.left.y * w.omega, z: A.left.z * w.omega }).setLinearDamping(0.04).setAngularDamping(0.06).setCcdEnabled(true));
    this.world.createCollider(RAPIER.ColliderDesc.cylinder(0.05, w.r).setMass(5).setFriction(0.9).setRestitution(0.45)
      .setCollisionGroups(groups(G.DEBRIS, G.FLOOR | G.T | G.ARM)), b);
    this.shedBody[idx] = b;
    (w as Wheel & { shed?: number }).shed = idx;
    this.pushEv('wheel-off', 0, p);
  }

  ko(why: string) {
    if (this.koT >= 0) return;
    this.koT = this.t; this.winner = 'TORQUE'; this.aHp = 0;
    this.A.power = 0; this.A.th = 0; this.A.turn = 0;
    this.arm_ = 'limp';
    this.pushEv('ko', 0, this.A.pos, why);
  }

  hammerContacts() {
    let r = this.contactPoint(this.armHead, this.hull) ?? this.contactPoint(this.armHead, this.drumCol);
    for (const c of this.tParts) r = r ?? this.contactPoint(this.armHead, c);
    r = r ?? this.contactPoint(this.armBar, this.hull);
    if (r) {
      const J = r.imp;
      if (J > 3 && !this.armHitThisSwing) {
        this.armHitThisSwing = true;
        this.hammerHits++;
        this.tHp = Math.max(55, this.tHp - 14);
        this.markPlate(0, r.p, this.A.fwd, 'axe', 1);
        const up = new V(0, 1, 0);
        this.sparks.push({ t: this.t, p: r.p.clone(), d: up, n: 160, speed: 14, cone: 1.25, hot: 1 });
        this.sparks.push({ t: this.t, p: r.p.clone(), d: this.A.fwd.clone().setY(0.3).normalize(), n: 60, speed: 22, cone: 0.5, hot: 1.2 });
        const v = vec(this.arm.linvel());
        this.pushEv('hammer', Math.max(J, 16 * v.length()), r.p);
        this.burst(r.p, 3, new V(0, 2, 0), 6);
        if (this.pilot !== 'victory') { this.pilot = 'stunned'; this.pilotT = 0; }
      }
      return;
    }
    const f = this.contactPoint(this.armHead, this.floor);
    if (f && this.arm_ === 'fire' && !this.armHitThisSwing) {
      this.armHitThisSwing = true;
      this.sparks.push({ t: this.t, p: f.p.clone(), d: new V(0, 1, 0), n: 90, speed: 11, cone: 1.3, hot: 1 });
      this.decals.push({ t: this.t, p: new V(f.p.x, 0.003, f.p.z), size: 0.42, kind: 1, rot: this.rng.r(0, 6.28) });
      this.smoke.push({ t: this.t, p: f.p.clone(), v: new V(0, 0.5, 0), size: 0.5, life: 1.1, dark: 0.3 });
    }
  }

  grind() {
    // sliding steel: sparks spawn at the real contact points, along the real slip direction
    if (++this.grindAcc % 3) return;
    const pairs: [RAPIER.Collider, RAPIER.Collider, RAPIER.RigidBody, RAPIER.RigidBody | null][] = [
      [this.hull, this.aFrame, this.T.body, this.A.body],
      [this.hull, this.floor, this.T.body, null],
      [this.drumCol, this.floor, this.T.body, null],
      [this.aFrame, this.floor, this.A.body, null],
    ];
    for (const [a, b, ba, bb] of pairs) {
      const c = this.contactPoint(a, b);
      if (!c) continue;
      const pt = { x: c.p.x, y: c.p.y, z: c.p.z };
      const vs = vec(ba.velocityAtPoint(pt));
      if (bb) vs.sub(vec(bb.velocityAtPoint(pt)));
      const sp = vs.length();
      if (sp > 1.3) {
        this.sparks.push({ t: this.t, p: c.p.clone(), d: vs.clone().normalize().negate().setY(0.25).normalize(), n: 2 + Math.round(sp * 1.1), speed: Math.min(14, sp * 1.6), cone: 0.5, hot: 0.8 });
        if (b === this.floor && this.rng.next() < 0.09) this.decals.push({ t: this.t, p: new V(c.p.x, 0.003, c.p.z), size: 0.28, kind: 2, rot: Math.atan2(vs.x, vs.z) });
      }
    }
  }

  damageFx() {
    this.smokeAcc += DT;
    const A = this.A, T = this.T;
    const lost = 1 - this.aHp / 100;
    if (this.smokeAcc > 0.05) {
      this.smokeAcc = 0;
      if (lost > 0.2 && this.t < 70) {
        const rate = lost * lost * (this.koT >= 0 ? 2.2 : 1.1);
        for (let q = 0; q < 2; q++) if (this.rng.next() < rate * 0.9) {
          const vent = A.world(new V(this.rng.r(-.2, .2), 0.3, this.rng.r(-.3, .1)));
          this.smoke.push({ t: this.t, p: vent, v: new V(A.vel.x * .3 + this.rng.r(-.15, .15), this.rng.r(.5, .9), A.vel.z * .3 + this.rng.r(-.15, .15)), size: 0.3 + lost * 0.32, life: 2.6 + lost * 1.4, dark: 0.7 + lost * 0.3 });
        }
      }
      if (this.tHp < 90 && this.rng.next() < 0.1) {
        const vent = T.world(new V(0, 0.15, -0.3));
        this.smoke.push({ t: this.t, p: vent, v: new V(T.vel.x * .3, .4, T.vel.z * .3), size: 0.18, life: 1.5, dark: 0.5 });
      }
    }
  }

  groundedCheck() {
    // heavy landings: real impact impulse from the floor manifold drives the camera shake + dust
    for (const [hull, wasAir, setAir, label] of [
      [this.aFrame, this.A.pos.y > 0.56, (v: number) => { this.aAirT = v; }, 'A'],
      [this.hull, this.T.pos.y > 0.38, (v: number) => { this.tAirT = v; }, 'T'],
    ] as const) {
      const bot = label === 'A' ? this.A : this.T;
      const air = label === 'A' ? this.aAirT : this.tAirT;
      if (wasAir) setAir(air + DT);
      else if (air > 0.14) {
        const vy = Math.abs(bot.vel.y);
        setAir(0);
        const J = air * 113 * 9.81;
        this.pushEv('land', J, bot.pos, label);
        for (let i = 0; i < 6; i++) {
          const a = i * 1.05 + this.rng.r(0, 1);
          this.smoke.push({ t: this.t, p: new V(bot.pos.x + Math.cos(a) * .4, 0.05, bot.pos.z + Math.sin(a) * .4), v: new V(Math.cos(a) * 1.2, 0.2, Math.sin(a) * 1.2), size: 0.34, life: 1, dark: 0.2 });
        }
        void hull; void vy;
      } else setAir(0);
    }
  }

  uprightAssist() {
    // Bias: both bots have (invisible) self-righting help while the fight is on. ANVIL's is
    // fronted by a hammer swing, TORQUE's reads as the drum gyro kicking it back over.
    for (const [bot, key] of [[this.A, 'aInv'], [this.T, 'tInv']] as const) {
      const low = bot.up.y < 0.35 && bot.pos.y < 0.9;
      this[key] = low ? this[key] + DT : Math.max(0, this[key] - DT * 4);
      if (bot === this.A && this.koT >= 0) continue;
      if (this[key] > (bot === this.T ? 0.5 : 1.0)) {
        // ANVIL: a hammer swing starts the roll, then a damped torque finishes it, like a real self-righter
        const axis = tv.copy(bot.up).cross(tv2.set(0, 1, 0));
        if (axis.lengthSq() < 1e-3) axis.copy(bot.fwd);
        axis.normalize();
        const rate = bot.ang.dot(axis);
        const tq = clamp((3.2 - rate) * 240, 0, bot === this.T ? 520 : 760) * DT;
        bot.body.applyTorqueImpulse({ x: axis.x * tq, y: axis.y * tq, z: axis.z * tq }, true);
        if (bot === this.A && this.arm_ === 'stow' && this.armCool <= 0 && this[key] < 1.05) this.fireArm();
      }
    }
  }

  deadline() {
    const t = this.t, A = this.A;
    if (this.koT >= 0) return;
    if (!this.finale && (t > 20 || (t > 15 && this.aHp <= 34))) this.finale = true;
    // the arena rule: a bot that cannot drive for 3.5 s is counted out
    const down = this.finale && (A.up.y < 0.3 || A.wheels.filter((w) => w.alive).length < 3 || (A.vel.length() < 0.05 && this.aHp < 20));
    this.aDown = down ? this.aDown + DT : 0;
    if (this.aDown > 5) { this.pushEv('panel-off', 0, A.pos, 'count'); this.ko('stopped'); this.pilot = 'victory'; return; }
    // last-resort guarantee. The soak reports how often this fires; it should be never.
    if (t > 29) {
      const d = new V(0, 0.4, 1).normalize();
      for (let k = 0; k < N_PANELS && this.torn < 2; k++) if (this.panelStage[k] === 1) this.tear(k, d, 200);
      if (!this.torn) { this.loosen(0, d, A.pos); this.tear(0, d, 200); }
      this.ko('breaker');
      this.pilot = 'victory';
    }
  }

  pilotLoop() {
    this.tTrail.push(this.T.pos.clone());
    if (this.tTrail.length > 26) this.tTrail.shift();
  }

  /** One fixed step of the whole fight. */
  step() {
    const started = STEP_TIMER ? performance.now() : 0;
    this.T.sync(); this.A.sync();
    this.pilotLoop();
    this.torquePilot();
    this.anvilPilot();
    this.wheelsStep(this.T, this.T.cfg);
    this.wheelsStep(this.A, this.A.cfg);
    this.drumStep();
    this.armStep();
    this.uprightAssist();
    this.preTv.copy(vec(this.T.body.linvel())); this.preTw.copy(vec(this.T.body.angvel()));
    this.preAv.copy(vec(this.A.body.linvel())); this.preAw.copy(vec(this.A.body.angvel()));
    this.world.step();
    this.t += DT;
    this.T.sync(); this.A.sync();
    this.drumContacts();
    this.hammerContacts();
    this.grind();
    this.damageFx();
    this.groundedCheck();
    this.deadline();
    if (this.t >= this.tGo && !this.events.some((e) => e.type === 'go')) this.pushEv('go', 0, this.T.pos);
    this.frame++;
    this.record();
    if (STEP_TIMER) this.stepMs += performance.now() - started;
  }

  setSlot(f: number, slot: number, p: { x: number; y: number; z: number }, q: { x: number; y: number; z: number; w: number }) {
    const o = f * FRAME + slot * 7, r = this.rec;
    r[o] = p.x; r[o + 1] = p.y; r[o + 2] = p.z; r[o + 3] = q.x; r[o + 4] = q.y; r[o + 5] = q.z; r[o + 6] = q.w;
  }
  record() {
    const f = this.frame;
    if ((f + 1) * FRAME > this.rec.length) return;
    const { T, A } = this;
    this.setSlot(f, SLOT.T, T.body.translation(), T.body.rotation());
    this.setSlot(f, SLOT.A, A.body.translation(), A.body.rotation());
    this.setSlot(f, SLOT.HAMMER, this.arm.translation(), this.arm.rotation());
    const ap = A.body.translation(), aq = A.body.rotation();
    const qq = new Q(aq.x, aq.y, aq.z, aq.w);
    for (let i = 0; i < N_PANELS; i++) {
      const b = this.panelBody[i];
      if (b) this.setSlot(f, SLOT.PANEL + i, b.translation(), b.rotation());
      else { const p = PANELS[i].c.clone().applyQuaternion(qq).add(tv.set(ap.x, ap.y, ap.z)); this.setSlot(f, SLOT.PANEL + i, p, aq); }
    }
    const hidden = { x: 0, y: -50, z: 0 }, iq = { x: 0, y: 0, z: 0, w: 1 };
    for (let i = 0; i < N_SHED; i++) {
      const b = this.shedBody[i];
      if (b) this.setSlot(f, SLOT.SHED + i, b.translation(), b.rotation()); else this.setSlot(f, SLOT.SHED + i, hidden, iq);
    }
    for (let i = 0; i < N_DEBRIS; i++) {
      const b = this.debris[i];
      if (b) this.setSlot(f, SLOT.DEBRIS + i, b.translation(), b.rotation()); else this.setSlot(f, SLOT.DEBRIS + i, hidden, iq);
    }
    const x = f * FRAME + N_SLOTS * 7, r = this.rec;
    r[x + X.drumAngle] = this.drumAngle; r[x + X.drumOmega] = this.drumOmega; r[x + X.tHp] = this.tHp; r[x + X.aHp] = this.aHp;
    T.wheels.forEach((w, i) => { r[x + X.tWheel + i] = w.angle; r[x + X.tComp + i] = w.comp; });
    let mask = 0;
    A.wheels.forEach((w, i) => { r[x + X.aWheel + i] = w.angle; r[x + X.aComp + i] = w.comp; if (w.alive) mask |= 1 << i; });
    r[x + X.aWheelMask] = mask;
    let pm = 0;
    this.panelStage.forEach((s, i) => { pm |= s << (i * 2); });
    r[x + X.panelMask] = pm;
    r[x + X.state] = this.koT >= 0 ? 1 : 0;
    r[x + X.armAngle] = this.armAngle();
    r[x + X.tSlip] = T.wheels.reduce((a, w) => Math.max(a, w.slip), 0);
  }
}

export const ARM_STOW = 1.95; // radians above bot-forward
let STEP_TIMER = false;
export function setStepTimer(v: boolean) { STEP_TIMER = v; }
