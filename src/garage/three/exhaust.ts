// The Exhaust's puffs: soft round particles out of the pipe tips. Plain smoke from the Tailpipe and Twin Stacks,
// thick dark smoke from Smoke Stacks, flames from Flame Stacks and a rainbow from Rainbow Blast. A fixed pool of
// CAP particles in one draw call, so a mega jump stays smooth on the iPad. Puffs come out where the Truck is
// when they leave the pipe and then stay put in the air, so a jump leaves its smoke behind.
import * as THREE from 'three';
import type { Rung } from '../catalog';

/** Most particles in the air at once; past it, the oldest are reused. */
export const CAP = 96;
/** How hard each thing puffs: a move, an engine rev, and the gentle idle puff in Show Off. */
export const PUFF = { hop: 0.4, jump: 0.7, mega: 1, rev: 0.8, idle: 0.3 } as const;

/** A pipe's open end and the way it points, in the Truck's space. */
export interface Tip { p: THREE.Vector3; dir: THREE.Vector3 }

interface Style {
  /** Particles per pipe for a full-strength puff. */
  per: number;
  /** Seconds each lasts. */
  life: number;
  speed: number;
  spread: number;
  /** Upward pull, per second. */
  rise: number;
  size: [number, number];
  alpha: number;
  /** Colour over its life; null gives each one a rainbow colour of its own. */
  colors: number[] | null;
  /** Flames glow (added light); smoke and the rainbow cover what is behind them, so the colours stay bright. */
  glow: boolean;
}

const STYLES: Record<Rung, Style> = {
  0: { per: 4, life: 1.2, speed: 0.9, spread: 0.15, rise: 0.5, size: [0.2, 0.7], alpha: 0.7, colors: [0xf0f0f0, 0xcfcfcf], glow: false },
  1: { per: 4, life: 1.3, speed: 1.0, spread: 0.18, rise: 0.4, size: [0.22, 0.8], alpha: 0.7, colors: [0xeeeeee, 0xc8c8c8], glow: false },
  2: { per: 7, life: 1.8, speed: 1.2, spread: 0.22, rise: 0.5, size: [0.3, 1.2], alpha: 0.85, colors: [0x55555c, 0x2c2c30], glow: false },
  3: { per: 9, life: 0.6, speed: 3, spread: 0.25, rise: 1, size: [0.4, 0.12], alpha: 0.7, colors: [0xffe080, 0xff8a00, 0xff3000, 0x7a1000], glow: true },
  4: { per: 10, life: 0.9, speed: 3.2, spread: 0.35, rise: 0.8, size: [0.45, 0.2], alpha: 0.9, colors: null, glow: false },
};
const RAINBOW = [0xff3b3b, 0xffb800, 0xf4ff5a, 0x3dff8b, 0x3dc8ff, 0xc04dff].map(c => new THREE.Color(c));

/** Pixels per scene unit at distance 1; the stage sets it from the canvas height and field of view. */
export const POINT_SCALE = { value: 500 };

const VERT = `
attribute float size;
attribute float alpha;
attribute vec3 tint;
uniform float scale;
varying vec3 vTint;
varying float vAlpha;
void main() {
  vTint = tint; vAlpha = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
varying vec3 vTint;
varying float vAlpha;
void main() {
  float a = vAlpha * smoothstep(1.0, 0.2, length(gl_PointCoord - 0.5) * 2.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vTint, a);
  #include <colorspace_fragment>
}`;

export class Exhaust {
  readonly points: THREE.Points;
  private readonly s: Style;
  private readonly stops: THREE.Color[];
  private readonly pos = new Float32Array(CAP * 3);
  private readonly vel = new Float32Array(CAP * 3);
  private readonly age = new Float32Array(CAP).fill(Infinity);
  private readonly rainbowIx = new Uint8Array(CAP);
  private readonly size = new Float32Array(CAP);
  private readonly alpha = new Float32Array(CAP);
  private readonly tint = new Float32Array(CAP * 3);
  private nextRainbow = 0;

  constructor(rung: Rung, readonly tips: readonly Tip[]) {
    this.s = STYLES[rung];
    this.stops = (this.s.colors ?? []).map(c => new THREE.Color(c));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    g.setAttribute('tint', new THREE.BufferAttribute(this.tint, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: { scale: POINT_SCALE },
      transparent: true, depthWrite: false, blending: this.s.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false; // the particles move; the bounds would be stale
    this.points.renderOrder = 2;
  }

  get alive() { let n = 0; for (const a of this.age) if (a < this.s.life) n++; return n; }

  /** Send out a puff from every pipe, 0-1 strong. `m` places the pipes where the Truck is now. */
  puff(strength: number, m?: THREE.Matrix4) {
    const { s } = this, n = Math.max(1, Math.round(strength * s.per)), p = new THREE.Vector3(), d = new THREE.Vector3();
    for (const tip of this.tips) {
      p.copy(tip.p); d.copy(tip.dir);
      if (m) { p.applyMatrix4(m); d.transformDirection(m); }
      for (let k = 0; k < n; k++) {
        const i = this.freeParticle(), j = i * 3, v = s.speed * (0.3 + 0.9 * Math.random()); // fast and slow ones, so a puff comes out as a plume, not a ball
        this.pos[j] = p.x + (Math.random() - 0.5) * 0.06; this.pos[j + 1] = p.y + (Math.random() - 0.5) * 0.06; this.pos[j + 2] = p.z + (Math.random() - 0.5) * 0.06;
        this.vel[j] = d.x * v + (Math.random() - 0.5) * 2 * s.spread; this.vel[j + 1] = d.y * v + (Math.random() - 0.5) * 2 * s.spread; this.vel[j + 2] = d.z * v + (Math.random() - 0.5) * 2 * s.spread;
        this.age[i] = 0; this.rainbowIx[i] = this.nextRainbow++ % RAINBOW.length;
      }
    }
  }

  /** Move every particle on by dt seconds and write them to the GPU buffers. */
  step(dt: number) {
    const { s } = this, drag = Math.exp(-1.6 * dt), c = new THREE.Color();
    for (let i = 0; i < CAP; i++) {
      const j = i * 3;
      if (this.age[i]! >= s.life) { this.size[i] = this.alpha[i] = 0; continue; }
      const k = (this.age[i]! += dt) / s.life;
      if (k >= 1) { this.size[i] = this.alpha[i] = 0; continue; }
      this.vel[j + 1]! += s.rise * dt;
      for (let a = 0; a < 3; a++) { this.vel[j + a]! *= drag; this.pos[j + a]! += this.vel[j + a]! * dt; }
      this.size[i] = s.size[0] + (s.size[1] - s.size[0]) * k;
      this.alpha[i] = s.alpha * (1 - k) * Math.min(1, k * 12 + 0.4);
      if (s.colors) { const x = k * (this.stops.length - 1), q = Math.min(this.stops.length - 2, Math.floor(x)); c.copy(this.stops[q]!).lerp(this.stops[q + 1]!, x - q); }
      else c.copy(RAINBOW[this.rainbowIx[i]!]!);
      this.tint[j] = c.r; this.tint[j + 1] = c.g; this.tint[j + 2] = c.b;
    }
    const g = this.points.geometry;
    for (const name of ['position', 'size', 'alpha', 'tint']) g.getAttribute(name).needsUpdate = true;
  }

  clear() { this.age.fill(Infinity); this.step(0); }

  dispose() { this.points.geometry.dispose(); (this.points.material as THREE.Material).dispose(); }

  /** A free particle, or the oldest one when all CAP are in the air. */
  private freeParticle() {
    let best = 0;
    for (let i = 0; i < CAP; i++) {
      if (this.age[i]! >= this.s.life) return i;
      if (this.age[i]! > this.age[best]!) best = i;
    }
    return best;
  }
}
