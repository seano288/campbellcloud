// Effects on the Aircraft, all cheap enough for an iPad: the afterburner plume (an additive shader cone with shock
// diamonds and flicker), flames from piston exhaust stacks, the blurred disc of a spinning propeller, glowing light
// sprites, and pooled smoke puffs for the Smoke Mods.
import * as THREE from 'three';
import type { Rung } from '../catalog';

const glowTexture = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

/** A soft glowing dot (nav lights, strobes, nozzle glow). */
export function glow(color: THREE.ColorRepresentation, size: number) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  s.scale.setScalar(size);
  return s;
}

const FLAME_VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FLAME_FRAG = `
uniform float time; uniform float power; uniform float diamonds; uniform float rainbow; uniform vec3 core; uniform vec3 outer;
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  float along = vUv.y;                       // 0 at the nozzle, 1 at the tip
  float edge = 0.35 + 0.65 * pow(abs(dot(vN, vView)), 0.9); // brightest through the middle, softer at the silhouette
  float flicker = 0.85 + 0.15 * sin(time * 47.0 + along * 23.0) * sin(time * 31.0 + vUv.x * 40.0);
  float fade = pow(1.0 - along, 0.85);
  float shock = diamonds > 0.0 ? smoothstep(0.55, 1.0, sin(along * diamonds * 6.2832 - time * 2.0) * 0.5 + 0.5) * (1.0 - along) : 0.0;
  vec3 col = mix(outer, core, clamp(1.0 - along * 1.6 + shock, 0.0, 1.0));
  if (rainbow > 0.5) col = mix(hue(fract(along * 1.2 - time * 0.6)), vec3(1.0), 0.25 * (1.0 - along));
  float a = edge * fade * flicker * power + shock * 0.8 * power;
  gl_FragColor = vec4(col * a * 1.6, a);
}`;

/** An afterburner plume along +x from the origin: radius at the nozzle and length. Flat ones are scaled flat by the caller. */
export function plume(r: number, len: number) {
  const geo = new THREE.CylinderGeometry(r * 0.35, r * 0.92, len, 24, 1, true);
  geo.rotateZ(Math.PI / 2); // along x, base (uv.y 0) at -len/2
  geo.translate(len / 2, 0, 0);
  // CylinderGeometry's uv.y runs 1 at the top (now +x end) — flip so 0 is at the nozzle
  const uv = geo.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  const mat = new THREE.ShaderMaterial({
    vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, power: { value: 1 }, diamonds: { value: 0 }, rainbow: { value: 0 }, core: { value: new THREE.Color(1, 0.95, 0.85) }, outer: { value: new THREE.Color(1, 0.45, 0.1) } },
  });
  return new THREE.Mesh(geo, mat);
}

/** How each Engine Mod burns: plume length (in nozzle radii), shock diamonds, and colours. */
export function flameLook(rung: Rung) {
  return [
    { len: 2.5, diamonds: 0, core: [1, 0.85, 0.6], outer: [1, 0.35, 0.05], power: 0.6, rainbow: 0 },
    { len: 4.5, diamonds: 0, core: [1, 0.9, 0.75], outer: [1, 0.45, 0.1], power: 0.85, rainbow: 0 },
    { len: 8, diamonds: 4, core: [0.85, 0.9, 1], outer: [1, 0.5, 0.15], power: 1.1, rainbow: 0 },
    { len: 11, diamonds: 6, core: [0.75, 0.85, 1], outer: [0.45, 0.55, 1], power: 1.35, rainbow: 0 },
    { len: 12, diamonds: 6, core: [1, 1, 1], outer: [1, 1, 1], power: 1.4, rainbow: 1 },
  ][rung]!;
}

/** A spinning propeller's blur: a translucent disc that hides the blades when they turn fast. */
export function propDisc(r: number) {
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  let tex: THREE.Texture | null = null;
  if (c) {
    c.width = c.height = 256;
    const g = c.getContext('2d')!, grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(30,30,30,.0)'); grad.addColorStop(0.2, 'rgba(30,30,30,.35)'); grad.addColorStop(0.88, 'rgba(40,40,40,.22)');
    grad.addColorStop(0.9, 'rgba(255,210,0,.16)'); grad.addColorStop(0.97, 'rgba(255,210,0,.1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    tex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.y = Math.PI / 2;
  return m;
}

// ---------- smoke ----------

const puffTexture = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(0.5, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

const SMOKE_VERT = `
attribute float size; attribute vec4 tint; varying vec4 vTint;
uniform float scale;
void main() {
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SMOKE_FRAG = `
uniform sampler2D map; varying vec4 vTint;
void main() { vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vTint.rgb, vTint.a * t.a); }`;

/** A pool of smoke puffs in world space: each one drifts, grows and fades. */
export class Smoke {
  readonly points: THREE.Points;
  private n: number;
  private next = 0;
  private life: Float32Array;
  private vel: Float32Array;
  private grow: Float32Array;
  private base: Float32Array;
  constructor(n = 900) {
    this.n = n;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    this.life = new Float32Array(n); this.vel = new Float32Array(n * 3); this.grow = new Float32Array(n); this.base = new Float32Array(n * 4);
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, transparent: true, depthWrite: false,
      uniforms: { map: { value: puffTexture }, scale: { value: 600 } },
    }));
    this.points.frustumCulled = false;
  }
  setScale(pixelsPerUnit: number) { (this.points.material as THREE.ShaderMaterial).uniforms.scale!.value = pixelsPerUnit; }
  emit(at: THREE.Vector3, vel: THREE.Vector3, color: THREE.Color, size = 1, alpha = 0.8, life = 2.2) {
    const i = this.next, geo = this.points.geometry;
    this.next = (this.next + 1) % this.n;
    (geo.attributes.position as THREE.BufferAttribute).setXYZ(i, at.x, at.y, at.z);
    (geo.attributes.size as THREE.BufferAttribute).setX(i, size);
    this.vel.set([vel.x, vel.y, vel.z], i * 3);
    this.base.set([color.r, color.g, color.b, alpha], i * 4);
    this.life[i] = life; this.grow[i] = size;
  }
  update(dt: number, drift = new THREE.Vector3()) {
    const geo = this.points.geometry, pos = geo.attributes.position as THREE.BufferAttribute;
    const size = geo.attributes.size as THREE.BufferAttribute, tint = geo.attributes.tint as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i]! <= 0) { if (tint.getW(i) !== 0) tint.setW(i, 0); continue; }
      this.life[i]! -= dt;
      const k = Math.max(this.life[i]!, 0) / 2.2;
      pos.setXYZ(i, pos.getX(i) + (this.vel[i * 3]! + drift.x) * dt, pos.getY(i) + (this.vel[i * 3 + 1]! + drift.y) * dt, pos.getZ(i) + (this.vel[i * 3 + 2]! + drift.z) * dt);
      size.setX(i, size.getX(i) + this.grow[i]! * dt * 1.6);
      tint.setXYZW(i, this.base[i * 4]!, this.base[i * 4 + 1]!, this.base[i * 4 + 2]!, this.base[i * 4 + 3]! * Math.min(1, k * 1.5));
    }
    pos.needsUpdate = size.needsUpdate = tint.needsUpdate = true;
  }
  clear() { this.life.fill(0); }
  dispose() { this.points.geometry.dispose(); (this.points.material as THREE.Material).dispose(); }
}

/** The colours each Smoke Mod puffs, from the left wingtip, the tail and the right wingtip. */
export function smokeColors(rung: Rung, t: number): [THREE.Color, THREE.Color, THREE.Color] | null {
  switch (rung) {
    case 0: return null;
    case 1: { const w = new THREE.Color(0xf4f6f8); return [w, w, w]; }
    case 2: return [new THREE.Color(0xe0202f), new THREE.Color(0xf4f6f8), new THREE.Color(0x2048c8)];
    case 3: return [0, 1, 2].map(k => new THREE.Color().setHSL((t * 0.25 + k * 0.33) % 1, 0.9, 0.6)) as [THREE.Color, THREE.Color, THREE.Color];
    case 4: return [0, 1, 2].map(k => new THREE.Color().setHSL(0.12 + 0.03 * Math.sin(t * 9 + k), 1, 0.55 + 0.35 * Math.random())) as [THREE.Color, THREE.Color, THREE.Color];
  }
}
