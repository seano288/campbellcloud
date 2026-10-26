// A crowd of figures on the mat, drawn with one InstancedMesh per part per kind of figure, so 65 soldiers cost the same
// handful of draw calls as one. Each figure is a few numbers (where it is, where it's going, how far through a step, a
// hop, a topple) and every frame turns them into a matrix per part: the legs swing from the hip, the body bobs, a robot's
// key winds, a toppled figure lies on its back and springs back up. Research: .scratch/sight-squad/research/army-display.md.
import * as THREE from 'three';
import type { Gear } from '../catalog';
import { buildFigure, KEY_AT, type Bone, type Figure, type FigureId, type Stuff } from './figures';

export interface Mover {
  readonly kind: FigureId;
  /** Which one of its kind it is (its instance in the meshes). */
  slot: number;
  pos: THREE.Vector3;
  yaw: number;
  target: THREE.Vector3;
  /** Which way it faces once it gets there. */
  face: number;
  /** How fast it walks (figure heights a second). */
  speed: number;
  /** Eases to 1 while it walks, 0 when it stands. */
  walk: number;
  phase: number;
  hop: number;
  hopV: number;
  /** Toppled over on its back: 0 standing, 1 flat; it springs back unless `out`. */
  fall: number;
  fallV: number;
  knocked: number;
  /** Lying down on its front (the "down" order). */
  prone: number;
  proneWant: number;
  spin: number;
  spinV: number;
  /** Gone in a puff of confetti (a robot that was knocked over). */
  gone: boolean;
  /** Stays down instead of bouncing back up. */
  out: boolean;
  /** Turret or cannon aim, from straight ahead. */
  aim: number;
  /** Seconds until it may throw again (Battle). */
  reload: number;
  /** Hops on the Moon float (lower gravity). */
  delay: number;
}

export const ORDER: readonly FigureId[] = ['rifleman', 'scout', 'drummer', 'medic', 'rocket', 'para', 'dog', 'jeep', 'cannon', 'tank', 'robot'];
const GRAVITY = 9;

function mover(kind: FigureId, slot: number, at: THREE.Vector3, face = 0): Mover {
  return {
    kind, slot, pos: at.clone(), yaw: face, target: at.clone(), face, speed: 1.4, walk: 0, phase: Math.random() * Math.PI * 2, hop: 0, hopV: 0,
    fall: 0, fallV: 0, knocked: 0, prone: 0, proneWant: 0, spin: 0, spinV: 0, gone: false, out: false, aim: 0, reload: Math.random() * 1.5, delay: 0,
  };
}

/** The army's materials: its plastic (in the Team Colour and Finish), and the other stuff figures are made of. */
export class Materials {
  readonly plastic = new THREE.MeshPhysicalMaterial({ color: 0x4f7a2a, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3 });
  readonly white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });
  readonly tin = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: 0.3, metalness: 0.85 });
  readonly gold = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.25, metalness: 1 });
  readonly glow = new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false });
  readonly eye = new THREE.MeshBasicMaterial({ color: 0xfff6a0, toneMapped: false });
  readonly rubber = new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.85 });
  private sparkle: THREE.Texture | null = null;
  of(stuff: Stuff): THREE.Material { return this[stuff]; }

  /** The plastic's colour and Finish: plain, shiny, glittery, glowing, or Gold Chrome all over. */
  dress(hex: string, finish: number) {
    const m = this.plastic;
    m.color.set(finish === 4 ? '#f5c542' : hex);
    m.roughness = [0.5, 0.18, 0.32, 0.45, 0.16][finish]!;
    m.metalness = [0, 0, 0.45, 0, 1][finish]!;
    m.clearcoat = [0.35, 1, 0.9, 0.3, 0.6][finish]!;
    m.emissive.set(finish === 3 ? hex : '#000000');
    m.emissiveIntensity = finish === 3 ? 0.75 : 0;
    m.roughnessMap = finish === 2 ? (this.sparkle ??= sparkleTexture()) : null;
    m.needsUpdate = true;
  }
  dispose() { for (const s of ['plastic', 'white', 'tin', 'gold', 'glow', 'eye', 'rubber'] as const) this[s].dispose(); this.sparkle?.dispose(); }
}

/** Glitter: a speckle of very smooth flecks in rougher plastic, so tiny points catch the light. */
function sparkleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; g.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

interface Kind { figure: Figure; cap: number; meshes: { mesh: THREE.InstancedMesh; bone: Bone; local: THREE.Matrix4 }[] }

export class Army {
  readonly group = new THREE.Group();
  readonly movers: Mover[] = [];
  private kinds = new Map<FigureId, Kind>();
  private gear: Gear | null = null;
  /** Hops float on the Moon. */
  gravity = GRAVITY;
  private m = new THREE.Matrix4(); private b = new THREE.Matrix4(); private t = new THREE.Matrix4(); private q = new THREE.Quaternion();
  private v = new THREE.Vector3(); private s = new THREE.Vector3(1, 1, 1); private e = new THREE.Euler();
  private zero = new THREE.Matrix4().makeScale(0, 0, 0);
  private rt = new THREE.Matrix4(); private rr = new THREE.Matrix4();

  constructor(private mats: Materials) {}

  figure(kind: FigureId): Figure | undefined { return this.kinds.get(kind)?.figure; }

  /**
   * How many of each kind there are, and the Gear they wear. Figures already on the mat stay where they are; new ones appear
   * at `spawn` (and walk to wherever they're sent), and the last ones of a kind leave first.
   */
  setRoster(counts: Partial<Record<FigureId, number>>, gear: Gear, spawn: (kind: FigureId) => THREE.Vector3): Mover[] {
    const added: Mover[] = [];
    for (const kind of ORDER) {
      const want = counts[kind] ?? 0, mine = this.movers.filter(u => u.kind === kind);
      for (let i = mine.length; i < want; i++) { const u = mover(kind, i, spawn(kind)); this.movers.push(u); added.push(u); }
      for (const u of mine.slice(want)) this.movers.splice(this.movers.indexOf(u), 1);
    }
    this.movers.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.slot - b.slot);
    const rebuild = JSON.stringify(gear) !== JSON.stringify(this.gear);
    this.gear = { ...gear };
    for (const kind of ORDER) {
      const want = counts[kind] ?? 0, have = this.kinds.get(kind);
      if (have && (rebuild || have.cap < want || !want)) this.drop(kind);
      if (!want || this.kinds.has(kind)) continue;
      const figure = buildFigure(kind, gear), cap = Math.max(want, kind === 'robot' ? 30 : 24); // room to recruit without rebuilding
      const meshes = figure.parts.map(p => {
        const mesh = new THREE.InstancedMesh(p.geo, this.mats.of(p.stuff), cap);
        mesh.castShadow = p.stuff !== 'glow' && p.stuff !== 'eye';
        mesh.frustumCulled = false;
        mesh.count = 0;
        this.group.add(mesh);
        return { mesh, bone: p.bone, local: p.local };
      });
      this.kinds.set(kind, { figure, cap, meshes });
    }
    for (const [kind, k] of this.kinds) { const n = counts[kind] ?? 0; for (const x of k.meshes) x.mesh.count = n; }
    this.pose(0);
    return added;
  }

  private drop(kind: FigureId) {
    const k = this.kinds.get(kind);
    if (!k) return;
    for (const x of k.meshes) { this.group.remove(x.mesh); x.mesh.dispose(); }
    this.kinds.delete(kind);
  }

  /** Is anything moving (so the stage keeps drawing)? */
  get busy() {
    return this.movers.some(u => u.walk > 0.01 || u.hop > 0 || u.hopV !== 0 || Math.abs(u.fallV) > 0.01 || u.fall > 0.01 || Math.abs(u.prone - u.proneWant) > 0.01 || Math.abs(u.spinV) > 0.01 || u.pos.distanceToSquared(u.target) > 0.0004);
  }

  hopAll(v = 3.2, stagger = 0.25) {
    for (const u of this.movers) if (!u.gone && u.hop <= 0.001) { u.delay = Math.random() * stagger; u.hopV = -v; }
  }
  hop(u: Mover, v = 3.2) { if (u.hop <= 0.001 && u.hopV === 0) u.hopV = v; }
  knock(u: Mover, out = false) { u.knocked = out ? Infinity : 1.1; u.out = out; u.fallV = Math.max(u.fallV, 6); }

  update(dt: number, t: number) {
    for (const u of this.movers) {
      if (u.gone) continue;
      // walk toward the target, turning to face where it's going, then face `face` once there
      this.v.subVectors(u.target, u.pos); this.v.y = 0;
      const dist = this.v.length(), moving = dist > 0.03 && u.fall < 0.3 && u.prone < 0.3;
      if (moving) u.pos.addScaledVector(this.v, Math.min(dist, u.speed * dt) / dist);
      u.walk += ((moving ? 1 : 0) - u.walk) * Math.min(1, dt * 8);
      const want = moving && dist > 0.25 ? Math.atan2(this.v.x, this.v.z) : u.face;
      u.yaw += Math.atan2(Math.sin(want - u.yaw), Math.cos(want - u.yaw)) * Math.min(1, dt * 7);
      u.phase += dt * (5 + u.speed * 3.5) * u.walk;
      // hops (a negative hopV is a hop waiting for its delay)
      if (u.hopV < 0) { u.delay -= dt; if (u.delay <= 0) u.hopV = -u.hopV; }
      else if (u.hopV > 0 || u.hop > 0) { u.hopV -= this.gravity * dt; u.hop += u.hopV * dt; if (u.hop <= 0) { u.hop = 0; u.hopV = 0; } }
      // knocked over: it springs back up when the time's up, with a wobble
      u.knocked -= dt;
      const down = u.knocked > 0 ? 1 : 0;
      u.fallV += ((down - u.fall) * (down ? 60 : 90) - u.fallV * (down ? 9 : 7)) * dt;
      u.fall = Math.max(-0.15, Math.min(1, u.fall + u.fallV * dt));
      if (u.fall >= 1 && u.fallV > 0) u.fallV *= -0.3; // a little bounce as it hits the mat
      u.prone += (u.proneWant - u.prone) * Math.min(1, dt * 6);
      u.spinV *= Math.pow(0.2, dt);
      u.spin += u.spinV * dt;
    }
    this.pose(t);
  }

  /** Writes every part's matrix from each figure's numbers. */
  private pose(t: number) {
    const counters = new Map<FigureId, number>();
    for (const u of this.movers) {
      const k = this.kinds.get(u.kind);
      if (!k) continue;
      const i = counters.get(u.kind) ?? 0;
      counters.set(u.kind, i + 1);
      u.slot = i;
      if (u.gone) { for (const x of k.meshes) x.mesh.setMatrixAt(i, this.zero); continue; }
      const f = k.figure;
      this.rootOf(u, this.m);
      const swing = f.walker ? Math.sin(u.phase) * 0.55 * u.walk : 0, bob = f.walker ? Math.abs(Math.cos(u.phase)) * 0.035 * u.walk : 0;
      for (const x of k.meshes) {
        this.b.copy(this.m);
        switch (x.bone) {
          case 'body': if (bob) this.b.multiply(this.t.makeTranslation(0, bob, 0)); break;
          case 'legL': case 'legR':
            if (swing) this.b.multiply(this.t.makeTranslation(0, f.hip, 0)).multiply(this.t.makeRotationX(x.bone === 'legL' ? swing : -swing)).multiply(this.t.makeTranslation(0, -f.hip, 0));
            break;
          case 'turret': if (u.aim) this.b.multiply(this.t.makeTranslation(f.turret.x, 0, f.turret.z)).multiply(this.t.makeRotationY(u.aim)).multiply(this.t.makeTranslation(-f.turret.x, 0, -f.turret.z)); break;
          case 'key': this.b.multiply(this.t.makeTranslation(KEY_AT.x, KEY_AT.y + bob, KEY_AT.z)).multiply(this.t.makeRotationFromEuler(this.e.set(0, 0, t * 5 + u.phase))); break;
          case 'sticks': this.b.multiply(this.t.makeTranslation(0, bob + (u.walk > 0.2 ? Math.sin(t * 14 + u.phase) * 0.03 : 0), 0)); break;
          default: break;
        }
        x.mesh.setMatrixAt(i, this.b.multiply(x.local));
      }
    }
    for (const k of this.kinds.values()) for (const x of k.meshes) x.mesh.instanceMatrix.needsUpdate = true;
  }

  /** The figure as a whole: where it stands, which way it faces, lying on its back (toppled) or its front (down). */
  rootOf(u: Mover, out: THREE.Matrix4) {
    const d = this.kinds.get(u.kind)?.figure.size.d ?? 0.5, t = this.rt, r = this.rr;
    out.compose(this.v.set(u.pos.x, u.pos.y + u.hop, u.pos.z), this.q.setFromAxisAngle(Y, u.yaw + u.spin), this.s.set(1, 1, 1));
    if (Math.abs(u.fall) > 0.001) out.multiply(t.makeTranslation(0, 0, -d / 2)).multiply(r.makeRotationX(-u.fall * Math.PI / 2)).multiply(t.makeTranslation(0, 0, d / 2));
    if (u.prone > 0.001) out.multiply(t.makeTranslation(0, 0, d / 2)).multiply(r.makeRotationX(u.prone * Math.PI / 2 * 0.95)).multiply(t.makeTranslation(0, 0, -d / 2));
    return out;
  }

  /** Where a figure's throws start from, in the world. */
  muzzleOf(u: Mover, out = new THREE.Vector3()) {
    const f = this.kinds.get(u.kind)?.figure;
    out.copy(f?.muzzle ?? new THREE.Vector3(0, 0.8, 0.3));
    out.applyAxisAngle(Y, u.yaw + u.spin + (u.kind === 'tank' || u.kind === 'cannon' ? u.aim : 0));
    return out.add(u.pos).setY(out.y + u.hop);
  }

  dispose() { for (const kind of [...this.kinds.keys()]) this.drop(kind); }
}
const Y = new THREE.Vector3(0, 1, 0);

// ---------- formations ----------

export type Slots = Map<Mover, THREE.Vector3>;
const GAP = 0.32;

/**
 * Standing in the Camp: rows by Squad, the Riflemen in front and the vehicles behind, everyone facing +z. Rows are as wide
 * as `width` (figure heights).
 */
export function blockSlots(movers: readonly Mover[], size: (k: FigureId) => { w: number; d: number }, width: number): Slots {
  const out: Slots = new Map(), rows: { movers: Mover[]; z: number; width: number }[] = [];
  const group = (k: FigureId) => (k === 'dog' ? 1 : k === 'jeep' || k === 'cannon' || k === 'tank' ? 2 : 0); // soldiers, dogs, vehicles
  let x = 0, z = 0, rowDepth = 0, row: Mover[] = [];
  const close = () => { if (row.length) rows.push({ movers: row, z, width: x - GAP }); z -= rowDepth + GAP * 1.6; x = 0; rowDepth = 0; row = []; };
  for (const u of movers) {
    const s = size(u.kind);
    if (row.length && (x + s.w > width || group(row[0]!.kind) !== group(u.kind))) close();
    out.set(u, new THREE.Vector3(x + s.w / 2, 0, z - s.d / 2));
    row.push(u); x += s.w + GAP; rowDepth = Math.max(rowDepth, s.d);
  }
  close();
  for (const r of rows) for (const u of r.movers) out.get(u)!.x -= r.width / 2;
  for (const p of out.values()) p.z -= z / 2; // the middle of the block on the middle of the mat
  return out;
}

/** The parade track: a stadium (two straights joined by half circles) around the middle of the mat, walked anticlockwise from above. */
export class Track {
  constructor(readonly half: number, readonly r: number) {}
  get length() { return 4 * this.half + 2 * Math.PI * this.r; }
  /** Where `s` along the track is, and which way it heads; `side` steps out sideways (positive: outward). */
  at(s: number, side = 0, out = new THREE.Vector3()): { p: THREE.Vector3; heading: number } {
    const L = this.length, h = this.half, r = this.r;
    s = ((s % L) + L) % L;
    const straight = 2 * h, bend = Math.PI * r;
    if (s < straight) { const x = -h + s; return { p: out.set(x, 0, r + side), heading: Math.PI / 2 }; } // along the front, heading +x
    s -= straight;
    if (s < bend) { const a = s / r; return { p: out.set(h + Math.sin(a) * (r + side), 0, Math.cos(a) * (r + side)), heading: Math.PI / 2 + a }; }
    s -= bend;
    if (s < straight) { const x = h - s; return { p: out.set(x, 0, -r - side), heading: -Math.PI / 2 }; }
    s -= straight;
    const a = s / r;
    return { p: out.set(-h - Math.sin(a) * (r + side), 0, -Math.cos(a) * (r + side)), heading: -Math.PI / 2 + a };
  }
}
