// The Hangar stage. The Aircraft stands on the floor of a real hangar: a CC0 photo (HDRI) lights it and, projected onto
// a ground dome, surrounds it, with soft shadows from the ceiling lights and Neutral tone mapping so paint keeps its true
// colour. He orbits it with a finger; opening a Slot swings the camera to that part, and hotspots follow the parts.
// Take Off swaps the hangar for open sky: the gear comes up, the engines light, clouds and smoke stream past, and a tap
// does a roll or a loop (or fires the Legendary fireworks).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import type { Fit, SlotId } from '../catalog';
import { Smoke, smokeColors } from './effects';
import { buildJet, type BuiltJet } from './jet';
import type { JetSpec } from './spec';

export interface HotspotPlace { x: number; y: number; visible: boolean }

/** Camera direction per Slot when its sheet opens: [x, z] direction from the Aircraft (nose is -x), and polar angle. */
const VIEWS: Record<SlotId, [number, number, number]> = {
  paint: [-0.55, 1, 1.15], nose: [-1, 0.75, 1.3], tail: [0.85, 0.75, 1.15], weapons: [-0.4, 1, 1.45], engine: [1, 0.35, 1.35],
  smoke: [1, 0.25, 1.25], canopy: [-0.7, 0.55, 0.85], lights: [-0.25, 1, 0.9], number: [0.55, 1, 1.3],
};
/** The hangar photo's camera height, scaled so the hangar dwarfs even the SR-71 and the view stays undistorted from up high. */
const HANGAR_EYE = 9;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const TRICKS = ['roll', 'loop', 'roll2'] as const;
export type Trick = (typeof TRICKS)[number];

interface Tween { t0: number; dur: number; from: THREE.Spherical; to: THREE.Spherical; target0: THREE.Vector3; target1: THREE.Vector3 }

export function spreadHotspots(places: Record<SlotId, HotspotPlace>, d: number) {
  const shown = Object.values(places).filter(p => p.visible);
  for (let pass = 0; pass < 4; pass++) for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
    const a = shown[i]!, b = shown[j]!, dx = b.x - a.x, dy = b.y - a.y, gap = Math.hypot(dx, dy);
    if (gap >= d) continue;
    const [ux, uy] = gap > 0.01 ? [dx / gap, dy / gap] : [1, 0], push = (d - gap) / 2;
    a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
  }
}

export class HangarStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1200);
  private controls: OrbitControls;
  private jet: BuiltJet | null = null;
  private spec: JetSpec | null = null;
  private fit: Fit | null = null;
  private hangar = new THREE.Group();
  private sky = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private envs: { hangar?: THREE.Texture; sky?: THREE.Texture; hangarBg?: THREE.Texture; skyBg?: THREE.Texture } = {};
  private shadowFloor: THREE.Mesh;
  private smoke = new Smoke();
  private clouds: THREE.Sprite[] = [];
  private bursts: { points: THREE.Points; vel: Float32Array; t: number }[] = [];
  private tween: Tween | null = null;
  private throttle = 0;
  private throttleUntil = 0;
  private flying = false;
  private flyT = 0;
  private trick: { kind: Trick; t0: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private idleSince = performance.now();
  private resizeObs: ResizeObserver;
  private puffUntil = 0;
  private hotFrame = 0;
  onHotspots: ((places: Record<SlotId, HotspotPlace>) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, private host: HTMLElement) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in r186
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1;
    this.scene.background = new THREE.Color(0x3a3a36);
    this.scene.environmentIntensity = 1;

    // the ceiling lights: one soft key light casting the Aircraft's shadow, and a cool fill from the open door
    const sun = (this.sun = new THREE.DirectionalLight(0xfff4e2, 1.6));
    sun.position.set(-6, 22, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);
    const fill = new THREE.HemisphereLight(0xdfe8ff, 0x5a5348, 0.35);
    this.scene.add(fill);
    this.shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.55 }));
    this.shadowFloor.receiveShadow = true;
    this.shadowFloor.position.y = 0.002;
    this.hangar.add(this.shadowFloor);
    this.scene.add(this.hangar, this.sky);
    this.sky.visible = false;
    this.scene.add(this.smoke.points);

    const c = (this.controls = new OrbitControls(this.camera, canvas));
    c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false;
    c.minPolarAngle = 0.25; c.maxPolarAngle = 1.5;
    c.rotateSpeed = 0.8;
    c.addEventListener('start', () => { this.tween = null; this.touch(); });
    c.addEventListener('change', () => this.touch());

    this.loadEnvironment();
    this.buildSky();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();
    this.loop();
  }

  private loadEnvironment() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const hdr = new HDRLoader();
    const tex = new THREE.TextureLoader();
    hdr.load('./env/hangar-1k.hdr', t => {
      this.envs.hangar = pm.fromEquirectangular(t).texture;
      t.dispose();
      if (!this.flying) this.scene.environment = this.envs.hangar;
      this.touch();
    });
    hdr.load('./env/sky-1k.hdr', t => { this.envs.sky = pm.fromEquirectangular(t).texture; t.dispose(); if (this.flying) this.scene.environment = this.envs.sky; });
    tex.load('./env/hangar.jpg', t => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.colorSpace = THREE.SRGBColorSpace;
      this.envs.hangarBg = t;
      const g = new GroundedSkybox(t, HANGAR_EYE, 240, 128);
      (g.material as THREE.MeshBasicMaterial).toneMapped = false;
      g.position.y = HANGAR_EYE - 0.01;
      g.rotation.y = Math.PI * 1.5; // the corrugated hangar wall behind the Aircraft
      this.hangar.add(g);
      this.touch();
    });
    tex.load('./env/sky.jpg', t => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.colorSpace = THREE.SRGBColorSpace;
      this.envs.skyBg = t;
      if (this.flying) this.scene.background = t;
    });
  }

  private buildSky() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 9; i++) { // a puffy cloud from overlapping soft circles
      const x = 30 + Math.random() * 68, y = 50 + Math.random() * 30, r = 18 + Math.random() * 22, grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,.85)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(c);
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.7, fog: false }));
      const k = 10 + Math.random() * 30;
      s.scale.set(k * 1.8, k, 1);
      s.position.set(-150 + Math.random() * 300, -40 + Math.random() * 60, (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 110));
      this.sky.add(s);
      this.clouds.push(s);
    }
  }

  private touch() { this.idleSince = performance.now(); }

  setJet(spec: JetSpec, fit: Fit) {
    this.touch();
    if (this.spec === spec && this.jet) { this.jet.dress(fit); this.fit = fit; return; }
    const keepView = !!this.jet;
    if (this.jet) { this.scene.remove(this.jet.root); this.jet.dispose(); }
    this.spec = spec; this.fit = fit;
    this.jet = buildJet(spec, fit);
    this.jet.root.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    this.scene.add(this.jet.root);
    if (spec.id === 'v22') this.setPivots(0); // parked with its rotors up, like a helicopter
    const { length, span, height } = this.jet.size, big = Math.max(length, span);
    const sh = this.sun.shadow.camera;
    sh.left = sh.bottom = -big * 0.75; sh.right = sh.top = big * 0.75; sh.near = 1; sh.far = 60; sh.updateProjectionMatrix();
    this.controls.minDistance = big * 0.55; this.controls.maxDistance = big * 2.2;
    this.controls.target.set(0, height * 0.42, 0);
    if (!keepView) this.camera.position.set(-big * 0.9, big * 0.42, big * 1.05);
    else { const off = this.camera.position.clone().sub(this.controls.target).setLength(big * 1.35); this.camera.position.copy(this.controls.target).add(off); }
    this.smoke.setScale(this.host.clientHeight * 1.2);
  }

  /** Moving parts: the V-22's nacelles (0 up, 1 forward) and the F-14's wings (0 forward, 1 swept). */
  private setPivots(k: number) {
    if (!this.jet || !this.spec) return;
    for (const [key, pivot] of this.jet.pivots) {
      const part = key.split(':')[0];
      const axis = pivot.userData.axis as THREE.Vector3;
      const angle = part === 'nacelle' ? -(1 - k) * (Math.PI / 2) : part === 'wing' ? k * 0.85 : 0;
      pivot.quaternion.setFromAxisAngle(axis, angle);
    }
  }

  /** Swings the camera to look at a Slot's part (null: back to the whole Aircraft). */
  focus(slot: SlotId | null) {
    if (!this.jet) return;
    this.touch();
    const { length, span, height } = this.jet.size, big = Math.max(length, span);
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const target0 = this.controls.target.clone();
    let to: THREE.Spherical, target1: THREE.Vector3;
    if (!slot) { to = new THREE.Spherical(big * 1.35, 1.12, from.theta); target1 = new THREE.Vector3(0, height * 0.42, 0); }
    else {
      const [x, z, phi] = VIEWS[slot], anchor = new THREE.Vector3();
      this.jet.anchors[slot].getWorldPosition(anchor);
      to = new THREE.Spherical(big * (slot === 'paint' || slot === 'number' ? 1.0 : 0.62), phi, Math.atan2(x, z));
      target1 = anchor.lerp(new THREE.Vector3(0, height * 0.4, 0), slot === 'paint' ? 0.6 : 0.15);
    }
    // the shorter way round
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    this.tween = { t0: performance.now(), dur: 900, from, to, target0, target1 };
  }

  /** Runs the engines up for a moment: flames and spinning props, with the engine sound played by the caller. */
  rev(ms = 2600) { this.throttleUntil = performance.now() + ms; this.touch(); }
  /** A burst of the fitted Smoke. */
  puff(ms = 2200) { this.puffUntil = performance.now() + ms; this.touch(); }

  fly(on: boolean) {
    if (!this.jet) return;
    this.flying = on;
    this.flyT = 0;
    this.trick = null;
    this.hangar.visible = !on;
    this.sky.visible = on;
    this.scene.background = on ? (this.envs.skyBg ?? new THREE.Color(0x87b5e8)) : new THREE.Color(0x3a3a36);
    this.scene.environment = (on ? this.envs.sky : this.envs.hangar) ?? null;
    this.smoke.clear();
    // gear up in the air, down in the hangar
    this.jet.airframe.traverse(o => { if (o.userData.gear) o.visible = !on; });
    const root = this.jet.root;
    root.position.set(0, on ? 0 : 0, 0);
    root.rotation.set(0, 0, 0);
    this.jet.airframe.rotation.x = 0;
    if (this.spec?.id === 'v22') this.setPivots(on ? 1 : 0);
    if (this.spec?.id === 'f14') this.setPivots(on ? 1 : 0);
    const big = Math.max(this.jet.size.length, this.jet.size.span);
    this.controls.target.set(0, on ? 0 : this.jet.size.height * 0.42, 0);
    this.camera.position.set(on ? big * 1.2 : -big * 0.9, on ? big * 0.25 : big * 0.42, on ? big * 1.0 : big * 1.05);
    this.controls.maxPolarAngle = on ? Math.PI - 0.2 : 1.5;
    this.tween = null;
    if (on) this.throttleUntil = Infinity; else this.throttleUntil = 0;
    this.touch();
  }

  /** In the air: a roll or a loop, and the Legendary fireworks if they're fitted. */
  perform(kind: Trick) {
    if (!this.flying || !this.jet) return;
    this.trick = { kind, t0: performance.now() };
    if (this.fit?.weapons === 4) for (let k = 0; k < 3; k++) setTimeout(() => this.firework(), 250 + k * 380);
    this.touch();
  }

  private firework() {
    if (!this.flying || !this.jet) return;
    const n = 260, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    const at = new THREE.Vector3(-25 - Math.random() * 25, 6 + Math.random() * 14, -15 + Math.random() * 30), base = new THREE.Color().setHSL(Math.random(), 1, 0.6);
    for (let i = 0; i < n; i++) {
      pos.set(at.toArray(), i * 3);
      const d = new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 6);
      vel.set(d.toArray(), i * 3);
      const c = base.clone().offsetHSL((Math.random() - 0.5) * 0.15, 0, 0);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.scene.add(points);
    this.bursts.push({ points, vel, t: 0 });
  }

  /** Is (clientX, clientY) on the Aircraft? */
  hitsJet(x: number, y: number) {
    if (!this.jet) return false;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    return ray.intersectObject(this.jet.root, true).length > 0;
  }

  /** Where the Aircraft is on screen (for celebration sparks). */
  jetPoint() {
    const p = new THREE.Vector3(0, this.jet ? this.jet.size.height * 0.5 : 0, 0).project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.host.clientWidth, y: (-p.y * 0.5 + 0.5) * this.host.clientHeight };
  }

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.smoke.setScale(h * 1.2);
    this.touch();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now(), dt = Math.min((now - this.last) / 1000, 0.05), t = now / 1000;
    this.last = now;
    if (document.hidden) return;
    const jet = this.jet;
    // engines
    const want = now < this.throttleUntil ? 1 : 0;
    this.throttle += (want - this.throttle) * Math.min(1, dt * (want ? 2.5 : 1.2));
    const busy = this.throttle > 0.01 || this.tween || this.flying || now < this.puffUntil || this.bursts.length > 0 || (this.fit?.lights ?? 0) > 0;
    if (!busy && now - this.idleSince > 1500 && this.hotFrame++ % 30) return; // nothing moving: rest, but keep hotspots fresh now and then
    if (this.tween) {
      const k = Math.min((now - this.tween.t0) / this.tween.dur, 1), e = ease(k), { from, to } = this.tween;
      const s = new THREE.Spherical(from.radius + (to.radius - from.radius) * e, from.phi + (to.phi - from.phi) * e, from.theta + (to.theta - from.theta) * e);
      this.controls.target.lerpVectors(this.tween.target0, this.tween.target1, e);
      this.camera.position.setFromSpherical(s).add(this.controls.target);
      if (k >= 1) this.tween = null;
    }
    if (jet) {
      jet.update(dt, t, { throttle: this.throttle });
      if (this.flying) this.flyFrame(dt, t);
      const colors = smokeColors(this.fit?.smoke ?? 0, t);
      if (colors && (this.flying || now < this.puffUntil)) {
        // in the air the puffs stream back as fast as the clouds; several per frame, spread along the frame's travel, make one trail
        const p = new THREE.Vector3(), speed = this.flying ? 22 : 3, per = this.flying ? 6 : 1;
        jet.smokeFrom.forEach((o, i) => {
          if (!this.flying && i !== 1) return;
          o.getWorldPosition(p);
          for (let k = 0; k < per; k++) {
            const back = (k / per) * speed * dt, jitter = () => (Math.random() - 0.5) * 0.25;
            this.smoke.emit(p.clone().add(new THREE.Vector3(back + 0.5, jitter(), jitter())), new THREE.Vector3(speed, 0.2, jitter()), colors[i]!,
              this.flying ? 1.3 : 0.9, this.flying ? 0.35 : 0.8, this.flying ? 1.8 : 2.2);
          }
        });
      }
    }
    this.smoke.update(dt);
    for (const b of [...this.bursts]) {
      b.t += dt;
      const pos = b.points.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        b.vel[i * 3 + 1]! -= 9 * dt * 0.4;
        pos.setXYZ(i, pos.getX(i) + b.vel[i * 3]! * dt + 30 * dt, pos.getY(i) + b.vel[i * 3 + 1]! * dt, pos.getZ(i) + b.vel[i * 3 + 2]! * dt);
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - b.t / 1.8);
      if (b.t > 1.8) { this.scene.remove(b.points); b.points.geometry.dispose(); (b.points.material as THREE.Material).dispose(); this.bursts.splice(this.bursts.indexOf(b), 1); }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (jet && this.onHotspots) {
      const w = this.host.clientWidth, h = this.host.clientHeight, places = {} as Record<SlotId, HotspotPlace>, v = new THREE.Vector3();
      for (const [slot, o] of Object.entries(jet.anchors) as [SlotId, THREE.Object3D][]) {
        o.getWorldPosition(v).project(this.camera);
        places[slot] = { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: !this.flying && v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.92 };
      }
      this.onHotspots(places);
    }
  };

  private flyFrame(dt: number, t: number) {
    const jet = this.jet!;
    this.flyT += dt;
    for (const c of this.clouds) { // the world streams past
      c.position.x += dt * 60;
      if (c.position.x > 160) { c.position.x = -160; c.position.z = (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 110); c.position.y = -40 + Math.random() * 60; }
    }
    const root = jet.root;
    root.position.y = Math.sin(t * 0.7) * 0.6;
    root.rotation.x = Math.sin(t * 0.45) * 0.18; // a gentle bank (roll is about x: the Aircraft points along -x)
    root.rotation.z = Math.sin(t * 0.6) * 0.04;
    if (this.trick) {
      const k = Math.min((performance.now() - this.trick.t0) / (this.trick.kind === 'loop' ? 2600 : 1500), 1), e = ease(k);
      if (this.trick.kind === 'roll') root.rotation.x += e * Math.PI * 2;
      else if (this.trick.kind === 'roll2') root.rotation.x -= e * Math.PI * 4;
      else { // a loop: nose up and over, climbing and coming back down
        const a = e * Math.PI * 2;
        root.rotation.z = -a;
        root.position.x = Math.sin(a) * -7;
        root.position.y += (1 - Math.cos(a)) * 7;
      }
      if (k >= 1) this.trick = null;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.jet?.dispose();
    this.smoke.dispose();
    for (const v of Object.values(this.envs)) v?.dispose();
    this.renderer.dispose();
  }
}

