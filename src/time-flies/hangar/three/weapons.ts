// Take Off's weapons. Guns spray glowing tracers from the muzzles. Each Weapons tap launches the next store under the
// wings: a missile drops off its rail, lights its motor and streaks ahead on a smoke trail to burst in a fireball; a bomb
// whistles down and bursts below; a pod fires a rocket; and the Legendary rockets burst into fireworks. A launched
// store is back on its pylon a few seconds later. The air streams past at the flight's speed, so smoke and bursts drift
// back while the Aircraft holds still.
import * as THREE from 'three';
import { glow, plume, Smoke } from './effects';
import { storeModel, type StoreKind } from './stores';

export type Shot = 'missile' | 'bomb' | 'firework';
export type FireResult = Shot | 'reloading' | 'none';

interface StoreTag { kind: StoreKind; len: number; r: number; point: 'tip' | 'outer' | 'inner' | 'belly' }
interface Projectile { obj: THREE.Object3D; vel: THREE.Vector3; t: number; tag: StoreTag; flame: THREE.Mesh | null; fuse: number; owned: boolean }
interface Burst { points: THREE.Points; vel: Float32Array; t: number; life: number; fall: number }
interface Flash { sprite: THREE.Sprite; t: number; life: number; size: number }

const ORDER = { tip: 0, outer: 1, inner: 2, belly: 3 } as const;
const BOMBS: readonly StoreKind[] = ['mk82', 'gbu'];
const REARM_MS = 4500, TRACER_SPEED = 240, TRACER_LIFE = 0.9, MAX_TRACERS = 120, MISSILE_TOP = 110, MISSILE_PUSH = 90;
const NOSE = new THREE.Vector3(-1, 0, 0); // every store and the Aircraft itself point along -x

export class Weapons {
  readonly group = new THREE.Group();
  /** Something blew up (for the bang). */
  onBoom: (() => void) | null = null;
  private tracerGeo = new THREE.CylinderGeometry(0.13, 0.13, 7, 6, 1, true).rotateZ(Math.PI / 2);
  private tracerMat = new THREE.MeshBasicMaterial({ color: 0xffc14d, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false });
  private tracers: { mesh: THREE.Mesh; vel: THREE.Vector3; t: number }[] = [];
  private projectiles: Projectile[] = [];
  private bursts: Burst[] = [];
  private flashes: Flash[] = [];
  private rearm: { store: THREE.Object3D; at: number }[] = [];
  private smoke = new Smoke(1400);

  constructor() { this.group.add(this.smoke.points); }
  setScale(pixelsPerUnit: number) { this.smoke.setScale(pixelsPerUnit); }

  /** One round from each muzzle, flying the way the Aircraft points. */
  shoot(muzzles: readonly THREE.Object3D[], forward: THREE.Vector3) {
    for (const m of muzzles) {
      let tr = this.tracers.length >= MAX_TRACERS ? this.tracers.shift()! : null;
      if (!tr) { const mesh = new THREE.Mesh(this.tracerGeo, this.tracerMat); mesh.frustumCulled = false; this.group.add(mesh); tr = { mesh, vel: new THREE.Vector3(), t: 0 }; }
      const dir = forward.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02)).normalize();
      m.getWorldPosition(tr.mesh.position).addScaledVector(dir, 2.5 + Math.random() * 2);
      tr.mesh.quaternion.setFromUnitVectors(NOSE, dir);
      tr.mesh.visible = true;
      tr.vel.copy(dir).multiplyScalar(TRACER_SPEED);
      tr.t = 0;
      this.tracers.push(tr);
    }
  }

  /** Launches the next store that's ready, alternating sides from the wingtips in. */
  fire(stores: THREE.Object3D[]): FireResult {
    if (!stores.length) return 'none';
    const tag = (o: THREE.Object3D) => o.userData.store as StoreTag;
    const ready = stores.filter(o => o.visible).sort((a, b) => ORDER[tag(a).point] - ORDER[tag(b).point] || b.position.z - a.position.z);
    const store = ready[0];
    if (!store) return 'reloading';
    const t = tag(store);
    store.updateWorldMatrix(true, false);
    let obj: THREE.Object3D, owned = false;
    if (t.kind === 'pod') { // the pod stays; a rocket leaves its front
      obj = storeModel('hvar').group;
      owned = true;
    } else {
      obj = store.clone();
      store.visible = false;
      this.rearm.push({ store, at: performance.now() + REARM_MS });
    }
    store.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
    obj.visible = true;
    this.group.add(obj);
    const bomb = BOMBS.includes(t.kind), firework = t.kind === 'firework';
    const projTag: StoreTag = t.kind === 'pod' ? { kind: 'hvar', len: 1.73, r: 0.064, point: t.point } : t;
    this.projectiles.push({ obj, vel: new THREE.Vector3(0, bomb ? -1 : -3, 0), t: 0, tag: projTag, flame: null, fuse: bomb ? 1.5 : firework ? 1.5 : 2.1, owned });
    return bomb ? 'bomb' : firework ? 'firework' : 'missile';
  }

  /** A burst of firework sparks at a point. */
  firework(at: THREE.Vector3, size = 0.6) {
    const base = new THREE.Color().setHSL(Math.random(), 1, 0.6);
    this.burst(at, 260, () => base.clone().offsetHSL((Math.random() - 0.5) * 0.15, 0, 0), 9, 6, size, 1.8, 3.6);
  }

  private explode(at: THREE.Vector3, scale: number) {
    const fire = [new THREE.Color(1, 0.85, 0.3), new THREE.Color(1, 0.45, 0.08), new THREE.Color(1, 0.2, 0.05)];
    this.burst(at, 180, () => fire[Math.floor(Math.random() * 3)]!.clone(), 7 * scale, 5 * scale, 0.9 * scale, 1.1, 1);
    const sprite = glow(0xffc870, 1);
    sprite.position.copy(at);
    this.group.add(sprite);
    this.flashes.push({ sprite, t: 0, life: 0.8, size: 16 * scale });
    for (let k = 0; k < 14; k++) {
      const d = new THREE.Vector3().randomDirection().multiplyScalar(2 * scale);
      this.smoke.emit(at.clone().add(d), d.multiplyScalar(1.2).add(new THREE.Vector3(0, 2, 0)), new THREE.Color(0.32, 0.3, 0.29), 3 * scale, 0.45, 2);
    }
    this.onBoom?.();
  }

  private burst(at: THREE.Vector3, n: number, colour: () => THREE.Color, speed: number, spread: number, size: number, life: number, fall: number) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos.set(at.toArray(), i * 3);
      vel.set(new THREE.Vector3().randomDirection().multiplyScalar(speed + Math.random() * spread).toArray(), i * 3);
      const c = colour();
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    points.frustumCulled = false;
    this.group.add(points);
    this.bursts.push({ points, vel, t: 0, life, fall });
  }

  /** Moves everything on: `stream` is how fast the air flows back past the Aircraft. */
  update(dt: number, stream: number, t: number) {
    const now = performance.now();
    this.smoke.update(dt);
    for (const r of [...this.rearm]) if (now >= r.at) { r.store.visible = true; this.rearm.splice(this.rearm.indexOf(r), 1); }
    for (const tr of this.tracers) {
      if (!tr.mesh.visible) continue;
      tr.t += dt;
      tr.mesh.position.addScaledVector(tr.vel, dt);
      if (tr.t > TRACER_LIFE) tr.mesh.visible = false;
    }
    const at = new THREE.Vector3(), fwd = new THREE.Vector3();
    for (const p of [...this.projectiles]) {
      p.t += dt;
      const { obj, vel } = p, bomb = BOMBS.includes(p.tag.kind);
      fwd.copy(NOSE).applyQuaternion(obj.quaternion);
      if (bomb) { // falls away and drifts back as the Aircraft flies on, its nose dipping
        vel.y -= 12 * dt; vel.x += 5 * dt;
        obj.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(NOSE, vel.clone().normalize()), Math.min(1, dt * 1.5));
      } else if (p.t > 0.25) { // the motor lights
        if (!p.flame) {
          p.flame = plume(p.tag.r * 0.9, 1);
          p.flame.position.x = p.tag.len / obj.scale.x;
          p.flame.scale.x = p.tag.r * 16;
          obj.add(p.flame);
        }
        vel.y *= 1 - Math.min(1, dt * 4);
        vel.addScaledVector(fwd, MISSILE_PUSH * dt);
        if (vel.length() > MISSILE_TOP) vel.setLength(MISSILE_TOP);
        const u = (p.flame.material as THREE.ShaderMaterial).uniforms;
        u.time!.value = t; u.power!.value = 1.3;
        // the smoke trail, several puffs along this frame's travel so it reads as one line
        at.set(p.tag.len / obj.scale.x, 0, 0);
        obj.localToWorld(at);
        // spread along this frame's travel through the air (which is itself streaming back), so it reads as one line
        const travel = vel.clone().setX(vel.x - stream).multiplyScalar(dt), n = Math.min(18, Math.ceil(travel.length() / 0.6));
        const tint = p.tag.kind === 'firework' ? new THREE.Color().setHSL(Math.random(), 1, 0.65) : new THREE.Color(0.93, 0.93, 0.92);
        for (let k = 0; k < n; k++) this.smoke.emit(at.clone().addScaledVector(travel, -k / n), new THREE.Vector3(stream, 0.3, 0), tint, 1, 0.5, 1.8);
      }
      obj.position.addScaledVector(vel, dt);
      if (p.t > p.fuse) {
        if (p.tag.kind === 'firework') { this.firework(obj.position, 1.6); this.onBoom?.(); }
        else this.explode(obj.position, bomb ? 1.6 : 3.2); // a bomb bursts close by, a missile far ahead
        this.drop(p);
      }
    }
    for (const b of [...this.bursts]) {
      b.t += dt;
      const pos = b.points.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        b.vel[i * 3 + 1]! -= b.fall * dt;
        pos.setXYZ(i, pos.getX(i) + (b.vel[i * 3]! + stream * 0.5) * dt, pos.getY(i) + b.vel[i * 3 + 1]! * dt, pos.getZ(i) + b.vel[i * 3 + 2]! * dt);
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - b.t / b.life);
      if (b.t > b.life) { this.group.remove(b.points); b.points.geometry.dispose(); (b.points.material as THREE.Material).dispose(); this.bursts.splice(this.bursts.indexOf(b), 1); }
    }
    for (const f of [...this.flashes]) {
      f.t += dt;
      const k = f.t / f.life;
      f.sprite.scale.setScalar(f.size * (0.4 + k));
      f.sprite.material.opacity = Math.max(0, 1 - k);
      f.sprite.position.x += stream * 0.5 * dt;
      if (k >= 1) { this.group.remove(f.sprite); f.sprite.material.dispose(); this.flashes.splice(this.flashes.indexOf(f), 1); }
    }
  }

  /** Is anything still flying, bursting or waiting to be rearmed? */
  get busy() { return this.projectiles.length > 0 || this.bursts.length > 0 || this.flashes.length > 0 || this.tracers.some(t => t.mesh.visible); }

  private drop(p: Projectile) {
    this.group.remove(p.obj);
    if (p.flame) { p.flame.geometry.dispose(); (p.flame.material as THREE.Material).dispose(); }
    if (p.owned) p.obj.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); }); // a clone shares its store's geometry
    this.projectiles.splice(this.projectiles.indexOf(p), 1);
  }

  /** Everything gone and every store back on its pylon (landing, or a new Aircraft). */
  clear() {
    for (const p of [...this.projectiles]) this.drop(p);
    for (const r of this.rearm) r.store.visible = true;
    this.rearm = [];
    for (const tr of this.tracers) tr.mesh.visible = false;
    for (const b of this.bursts) { this.group.remove(b.points); b.points.geometry.dispose(); (b.points.material as THREE.Material).dispose(); }
    for (const f of this.flashes) { this.group.remove(f.sprite); f.sprite.material.dispose(); }
    this.bursts = []; this.flashes = [];
    this.smoke.clear();
  }

  dispose() {
    this.clear();
    this.tracerGeo.dispose(); this.tracerMat.dispose(); this.smoke.dispose();
  }
}
