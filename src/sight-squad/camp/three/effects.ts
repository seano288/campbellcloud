// The Battle's effects, pooled so a big battle costs the same as a small one: confetti and splashes (points that fall and
// fade), the things his army throws (one InstancedMesh of balls, coloured by Boom Mod, flying in arcs), and the paint
// splats they leave on the mat.
import * as THREE from 'three';

const VERT = `
attribute float size; attribute vec4 tint; varying vec4 vTint;
uniform float scale;
void main() {
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
varying vec4 vTint;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  if (dot(p, p) > 0.25) discard;
  gl_FragColor = vTint;
}`;

/** Confetti, sparkles and droplets: bits that fly out, fall, and fade. */
export class Sparks {
  readonly points: THREE.Points;
  private next = 0;
  private life: Float32Array; private span: Float32Array; private vel: Float32Array; private fall: Float32Array;
  constructor(private n = 1500) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    this.life = new Float32Array(n); this.span = new Float32Array(n); this.vel = new Float32Array(n * 3); this.fall = new Float32Array(n);
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, uniforms: { scale: { value: 600 } } }));
    this.points.frustumCulled = false;
  }
  setScale(pixelsPerUnit: number) { (this.points.material as THREE.ShaderMaterial).uniforms.scale!.value = pixelsPerUnit; }
  emit(at: THREE.Vector3, vel: THREE.Vector3, color: THREE.Color, size = 0.12, life = 1.2, gravity = 6) {
    const i = this.next, g = this.points.geometry;
    this.next = (this.next + 1) % this.n;
    (g.attributes.position as THREE.BufferAttribute).setXYZ(i, at.x, at.y, at.z);
    (g.attributes.size as THREE.BufferAttribute).setX(i, size);
    (g.attributes.tint as THREE.BufferAttribute).setXYZW(i, color.r, color.g, color.b, 1);
    this.vel.set([vel.x, vel.y, vel.z], i * 3);
    this.life[i] = life; this.span[i] = life; this.fall[i] = gravity;
  }
  /** A burst of `n` bits in these colours. */
  burst(at: THREE.Vector3, colors: readonly THREE.Color[], n = 30, speed = 3, size = 0.12, gravity = 6) {
    const v = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      v.set(Math.random() - 0.5, Math.random() * 0.9 + 0.3, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.7));
      this.emit(at, v, colors[k % colors.length]!, size * (0.7 + Math.random() * 0.6), 0.8 + Math.random() * 0.8, gravity);
    }
  }
  get busy() { return this.life.some(l => l > 0); }
  update(dt: number) {
    const g = this.points.geometry, pos = g.attributes.position as THREE.BufferAttribute, tint = g.attributes.tint as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i]! <= 0) { if (tint.getW(i) !== 0) tint.setW(i, 0); continue; }
      this.life[i]! -= dt;
      this.vel[i * 3 + 1]! -= this.fall[i]! * dt;
      let y = pos.getY(i) + this.vel[i * 3 + 1]! * dt;
      if (y < 0.02) { y = 0.02; this.vel[i * 3]! *= 0.5; this.vel[i * 3 + 2]! *= 0.5; this.vel[i * 3 + 1] = 0; } // confetti lands on the mat
      pos.setXYZ(i, pos.getX(i) + this.vel[i * 3]! * dt, y, pos.getZ(i) + this.vel[i * 3 + 2]! * dt);
      tint.setW(i, Math.min(1, (this.life[i]! / this.span[i]!) * 2.5));
    }
    pos.needsUpdate = true; tint.needsUpdate = true;
  }
  clear() { this.life.fill(0); }
  dispose() { this.points.geometry.dispose(); (this.points.material as THREE.Material).dispose(); }
}

export const CONFETTI = ['#ff4f6d', '#ffd23f', '#3ddc84', '#4aa8ff', '#c77dff', '#ff9a3c'].map(c => new THREE.Color(c));
const rainbow = (k: number) => new THREE.Color().setHSL(((k % 1) + 1) % 1, 0.9, 0.6);

/** How each Boom Mod looks in flight: ball size and colour, and its trail. */
export function boomLook(boom: number, k: number) {
  switch (boom) {
    case 1: return { size: 0.13, color: new THREE.Color('#5ab8ff'), trail: null };
    case 2: return { size: 0.09, color: CONFETTI[Math.floor(k * 997) % CONFETTI.length]!, trail: null };
    case 3: return { size: 0.06, color: new THREE.Color('#fff2b0'), trail: CONFETTI[Math.floor(k * 997) % CONFETTI.length]! };
    case 4: return { size: 0.09, color: rainbow(k), trail: rainbow(k + 0.5) };
    default: return { size: 0.07, color: new THREE.Color('#ff8a2b'), trail: null };
  }
}

interface Shot { active: boolean; from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; arc: number; size: number; color: THREE.Color; trail: THREE.Color | null; hit: () => void }

/** Balls in flight: each follows an arc from one figure to another and calls `hit` when it lands. */
export class Shots {
  readonly mesh: THREE.InstancedMesh;
  private shots: Shot[] = [];
  private m = new THREE.Matrix4(); private p = new THREE.Vector3(); private q = new THREE.Quaternion(); private s = new THREE.Vector3();
  constructor(private sparks: Sparks, private n = 120) {
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: 0x222222 }), n);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }
  get busy() { return this.shots.some(s => s.active); }
  fire(from: THREE.Vector3, to: THREE.Vector3, look: { size: number; color: THREE.Color; trail: THREE.Color | null }, hit: () => void, speed = 7) {
    const dist = from.distanceTo(to), shot: Shot = { active: true, from: from.clone(), to: to.clone(), t: 0, dur: Math.max(0.35, dist / speed), arc: Math.min(2.5, dist * 0.3), ...look, hit };
    const free = this.shots.findIndex(s => !s.active);
    if (free >= 0) this.shots[free] = shot; else if (this.shots.length < this.n) this.shots.push(shot);
  }
  update(dt: number) {
    let n = 0;
    for (const s of this.shots) {
      if (!s.active) continue;
      s.t += dt;
      const k = Math.min(1, s.t / s.dur);
      this.p.lerpVectors(s.from, s.to, k).setY(s.from.y + (s.to.y - s.from.y) * k + Math.sin(k * Math.PI) * s.arc);
      if (s.trail && Math.random() < 0.8) this.sparks.emit(this.p, new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.2, (Math.random() - 0.5) * 0.4), s.trail, 0.07, 0.5, 1);
      if (k >= 1) { s.active = false; s.hit(); continue; }
      this.m.compose(this.p, this.q, this.s.setScalar(s.size));
      this.mesh.setMatrixAt(n, this.m);
      this.mesh.setColorAt(n, s.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() { for (const s of this.shots) s.active = false; this.mesh.count = 0; }
  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}

/** Paint Splats leave splats of paint on the mat (the oldest wash away as new ones land). */
export class Splats {
  readonly mesh: THREE.InstancedMesh;
  private next = 0;
  constructor(private n = 60) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(32, 32, 18, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 10; g.beginPath(); g.arc(32 + Math.cos(a) * r, 32 + Math.sin(a) * r, 3 + Math.random() * 5, 0, Math.PI * 2); g.fill(); }
    const tex = new THREE.CanvasTexture(c);
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.3 }), n);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.renderOrder = 1;
  }
  add(at: THREE.Vector3, color: THREE.Color) {
    const i = this.next;
    this.next = (this.next + 1) % this.n;
    this.mesh.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(at.x, 0.012 + i * 0.0002, at.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 6), new THREE.Vector3().setScalar(0.5 + Math.random() * 0.4)));
    this.mesh.setColorAt(i, color);
    this.mesh.count = Math.max(this.mesh.count, i + 1);
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() { this.mesh.count = 0; this.next = 0; }
  dispose() { this.mesh.geometry.dispose(); (this.mesh.material as THREE.MeshStandardMaterial).map?.dispose(); (this.mesh.material as THREE.Material).dispose(); }
}
