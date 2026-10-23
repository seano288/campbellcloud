// The Helipad stage, Time Flies' Hangar stage (src/time-flies/hangar/three/stage.ts) for helicopters: the Helicopter stands
// in the same real hangar, lit by its photo, and he orbits it with a finger; opening a Slot swings the camera to that
// part. Lift Off swaps the hangar for an airfield under open sky: the rotors spin up, it lifts straight off its helipad,
// noses down and flies off into the clouds. Up there a tap does a pirouette, a roll or a loop (or fires the Legendary
// fireworks), and it can fire its gun and launch what hangs under its stub wings. Landing slows to a hover, sinks down
// onto the helipad in a swirl of dust, and the rotors wind down. The Helicopter holds still; the world moves past.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { Airfield } from '../../../time-flies/hangar/three/airfield';
import { glow, Smoke, smokeColors } from '../../../time-flies/hangar/three/effects';
import { Weapons, type FireResult } from '../../../time-flies/hangar/three/weapons';
import type { Fit, SlotId } from '../catalog';
import { buildHeli, type BuiltHeli } from './heli';
import type { HeliSpec } from './spec';

export interface HotspotPlace { x: number; y: number; visible: boolean }

/** Camera direction per Slot when its sheet opens: [x, z] direction from the Helicopter (nose is -x), and polar angle. */
const VIEWS: Record<SlotId, [number, number, number]> = {
  paint: [-0.55, 1, 1.15], nose: [-1, 0.75, 1.3], tail: [0.85, 0.75, 1.15], weapons: [-0.4, 1, 1.45], rotor: [-0.4, 1, 0.55],
  smoke: [1, 0.25, 1.25], canopy: [-0.7, 0.55, 0.85], lights: [-0.25, 1, 0.9], number: [0.55, 1, 1.3],
};
/** The hangar photo's camera height, scaled so the hangar dwarfs even the Mi-26 and the view stays undistorted from up high. */
const HANGAR_EYE = 9;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const TRICKS = ['spin', 'roll', 'loop'] as const;
export type Trick = (typeof TRICKS)[number];
/** Parked in the hangar; spinning up and lifting off; up in the clouds; coming down; winding down on the helipad. */
export type FlightPhase = 'parked' | 'takeoff' | 'air' | 'landing' | 'rollout';
/** Moments in a flight for the sounds and words: off the ground, reaching the clouds, skids down, stopped, a bang. */
export type FlightEvent = 'liftoff' | 'air' | 'touchdown' | 'stopped' | 'boom';
/** Height above the helipad up in the clouds (m), how fast the air streams past there (m/s), and the timings (s). */
const CRUISE = 70, AIR_SPEED = 32, SPOOL_FOR = 2.4, CLIMB_FOR = 6, DESCEND_FOR = 6.5, ROLLOUT_FOR = 2.6;
/** Nose down in forward flight, and the flare as it slows to land. */
const CRUISE_PITCH = -0.13, FLARE = 0.1, GUN_RATE = 14;
const clamp01 = (k: number) => Math.min(Math.max(k, 0), 1);
const smooth = (k: number, a: number, b: number) => THREE.MathUtils.smoothstep(k, a, b);

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

/** The camera's height of view, kept on screens at least NARROW wide for each 1 tall; narrower ones see wider. */
const FOV = 34, NARROW = 0.9;

export class HelipadStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1200);
  private controls: OrbitControls;
  private heli: BuiltHeli | null = null;
  private spec: HeliSpec | null = null;
  private fit: Fit | null = null;
  private hangar = new THREE.Group();
  private sky = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private envs: { hangar?: THREE.Texture; sky?: THREE.Texture; hangarBg?: THREE.Texture; skyBg?: THREE.Texture } = {};
  private shadowFloor: THREE.Mesh;
  private smoke = new Smoke();
  private clouds: THREE.Sprite[] = [];
  private cloudLayer = new THREE.Group();
  private field = new Airfield();
  private weapons = new Weapons();
  private phase: FlightPhase = 'parked';
  private phaseT0 = 0;
  private altitude = 0;
  private speed = 0;
  private bob = 0;
  private landQueued = false;
  private landed: (() => void) | null = null;
  private gunning = false;
  private gunDue = 0;
  private muzzles: THREE.Sprite[] = [];
  private pad: THREE.Mesh;
  private tween: Tween | null = null;
  private afterTween: (() => void) | null = null;
  private throttle = 0;
  private throttleUntil = 0;
  private flying = false;
  private trick: { kind: Trick; t0: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private idleSince = performance.now();
  private resizeObs: ResizeObserver;
  private puffUntil = 0;
  private hotFrame = 0;
  onHotspots: ((places: Record<SlotId, HotspotPlace>) => void) | null = null;
  onFlight: ((e: FlightEvent) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, private host: HTMLElement) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in r186
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1;
    this.scene.background = new THREE.Color(0x3a3a36);
    this.scene.environmentIntensity = 1;

    // the ceiling lights: one soft key light casting the Helicopter's shadow, and a cool fill from the open door
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
    this.sky.add(this.cloudLayer, this.field.group);
    this.pad = helipad();
    this.field.group.add(this.pad);
    this.scene.add(this.smoke.points, this.weapons.group);
    this.weapons.onBoom = () => this.onFlight?.('boom');

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
      g.rotation.y = Math.PI * 1.5; // the corrugated hangar wall behind the Helicopter
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
    g.globalCompositeOperation = 'destination-in'; // soften to nothing before the canvas edge, so no cloud has a straight side
    const edge = g.createRadialGradient(64, 64, 40, 64, 64, 64);
    edge.addColorStop(0, '#fff'); edge.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = edge; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.7, fog: false }));
      const k = 10 + Math.random() * 30;
      s.scale.set(k * 1.8, k, 1);
      s.position.set(-150 + Math.random() * 300, -40 + Math.random() * 60, (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 110));
      this.cloudLayer.add(s);
      this.clouds.push(s);
    }
  }

  private touch() { this.idleSince = performance.now(); }

  setHeli(spec: HeliSpec, fit: Fit) {
    this.touch();
    if (this.spec === spec && this.heli) { this.heli.dress(fit); this.fit = fit; return; }
    const keepView = !!this.heli;
    this.weapons.clear();
    if (this.heli) { this.scene.remove(this.heli.root); this.heli.dispose(); }
    this.spec = spec; this.fit = fit;
    this.heli = buildHeli(spec, fit);
    this.heli.root.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    this.scene.add(this.heli.root);
    this.muzzles = this.heli.guns.map(g => { const m = glow(0xffd27a, 1.4); m.visible = false; g.add(m); return m; });
    const { length, span, height } = this.heli.size, big = Math.max(length, span);
    const sh = this.sun.shadow.camera;
    sh.left = sh.bottom = -big * 0.75; sh.right = sh.top = big * 0.75; sh.near = 1; sh.far = 60; sh.updateProjectionMatrix();
    this.controls.minDistance = big * 0.55; this.controls.maxDistance = big * 2.2;
    this.controls.target.set(0, height * 0.42, 0);
    if (!keepView) this.camera.position.set(-big * 0.9, big * 0.5, big * 1.05);
    else { const off = this.camera.position.clone().sub(this.controls.target).setLength(big * 1.35); this.camera.position.copy(this.controls.target).add(off); }
    this.smoke.setScale(this.host.clientHeight * 1.2);
    this.weapons.setScale(this.host.clientHeight * 1.2);
  }

  /** Swings the camera to look at a Slot's part (null: back to the whole Aircraft). */
  focus(slot: SlotId | null) {
    if (!this.heli) return;
    this.touch();
    const { length, span, height } = this.heli.size, big = Math.max(length, span);
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const target0 = this.controls.target.clone();
    let to: THREE.Spherical, target1: THREE.Vector3;
    if (!slot) { to = new THREE.Spherical(big * 1.35, 1.12, from.theta); target1 = new THREE.Vector3(0, height * 0.42, 0); }
    else {
      const [x, z, phi] = VIEWS[slot], anchor = new THREE.Vector3();
      this.heli.anchors[slot].getWorldPosition(anchor);
      to = new THREE.Spherical(big * (slot === 'paint' || slot === 'number' ? 1.0 : 0.62), phi, Math.atan2(x, z));
      target1 = anchor.lerp(new THREE.Vector3(0, height * 0.4, 0), slot === 'paint' ? 0.6 : 0.15);
    }
    // the shorter way round
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    this.tween = { t0: performance.now(), dur: 900, from, to, target0, target1 };
  }

  /** Puts the camera at an azimuth and elevation in degrees (the preview's screenshots). */
  orbit(az: number, el: number) {
    if (!this.heli) return;
    const big = Math.max(this.heli.size.length, this.heli.size.span), a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
    this.tween = null;
    this.camera.position.set(-Math.cos(a) * Math.cos(e) * big * 1.3, this.controls.target.y + Math.sin(e) * big * 1.3, Math.sin(a) * Math.cos(e) * big * 1.3);
    this.touch();
  }

  /** Spins the rotors up for a moment, with the engine sound played by the caller. */
  rev(ms = 2600) { this.throttleUntil = performance.now() + ms; this.touch(); }
  /** A burst of the fitted Smoke. */
  puff(ms = 2200) { this.puffUntil = performance.now() + ms; this.touch(); }

  /** Lift Off (spinning up on the helipad, or straight up in the clouds when `instant`) or back to the hangar. */
  fly(on: boolean, instant = false) {
    if (!this.heli) return;
    this.flying = on;
    this.phase = on ? (instant ? 'air' : 'takeoff') : 'parked';
    this.phaseT0 = performance.now();
    this.altitude = on && instant ? CRUISE : 0;
    this.speed = on && instant ? AIR_SPEED : 0;
    this.bob = 0;
    this.trick = null;
    this.landQueued = false;
    this.gunning = false;
    this.landed?.(); this.landed = null;
    this.hangar.visible = !on;
    this.sky.visible = on;
    this.scene.background = on ? (this.envs.skyBg ?? new THREE.Color(0x87b5e8)) : new THREE.Color(0x3a3a36);
    this.scene.environment = (on ? this.envs.sky : this.envs.hangar) ?? null;
    this.smoke.clear();
    this.weapons.clear();
    const root = this.heli.root;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    this.heli.airframe.rotation.x = 0;
    this.pad.position.x = 0;
    const big = Math.max(this.heli.size.length, this.heli.size.span);
    this.controls.target.set(0, this.heli.size.height * 0.42, 0);
    this.camera.position.set(on ? big * 1.2 : -big * 0.9, on ? big * 0.3 : big * 0.42, on ? big * 1.0 : big * 1.05);
    this.controls.maxPolarAngle = on && instant ? Math.PI - 0.2 : 1.5;
    this.tween = null; this.afterTween = null;
    if (on) this.throttleUntil = Infinity; else this.throttleUntil = 0;
    this.field.update(0, this.altitude);
    this.cloudLayer.position.y = CRUISE - this.altitude;
    this.touch();
  }

  /** Flies back down to the helipad, after any trick in progress; resolves once the rotors have wound down. */
  land(): Promise<void> {
    if (this.phase !== 'air') return Promise.resolve();
    this.gunning = false;
    return new Promise(done => {
      this.landed = done;
      if (this.trick) this.landQueued = true; else this.beginLanding();
    });
  }

  private beginLanding() {
    if (!this.heli) return;
    this.landQueued = false;
    this.phase = 'landing';
    this.phaseT0 = performance.now();
    this.throttleUntil = Infinity; // the rotors keep turning until the skids are down
    // swing round to watch it come in from beside and behind, above the helipad
    const big = Math.max(this.heli.size.length, this.heli.size.span);
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const to = new THREE.Spherical(big * 1.5, 1.3, Math.atan2(1, 1.2));
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    const target = new THREE.Vector3(0, this.heli.size.height * 0.42, 0);
    this.tween = { t0: performance.now(), dur: 1600, from, to, target0: this.controls.target.clone(), target1: target };
    this.afterTween = () => { this.controls.maxPolarAngle = 1.5; };
  }

  /** Where the flight is. */
  get flight() { return this.phase; }

  /** Holds the trigger down (true) or lets go (false). */
  guns(on: boolean) {
    this.gunning = on && this.phase === 'air';
    if (this.gunning) this.chase(false);
    this.touch();
  }

  /** Launches the next store under the wings, if the Helicopter is up in the clouds. */
  fire(): FireResult | null {
    if (this.phase !== 'air' || !this.heli) return null;
    this.touch();
    const shot = this.weapons.fire(this.heli.firable());
    if (shot === 'bomb') this.chase(true);
    else if (shot !== 'none') this.chase(false);
    return shot;
  }

  /** Swings round so he sees where his shots go (unless he's looking there already): behind and above the Helicopter looking
   * ahead, or for a bomb, off to the side looking down below it. */
  private chase(below: boolean) {
    if (!this.heli || this.tween) return;
    const off = this.camera.position.clone().sub(this.controls.target).normalize();
    if (below ? off.z > 0.8 && this.controls.target.y < 0 : off.x > 0.8 && off.y > 0.15) return;
    const { height } = this.heli.size, big = Math.max(this.heli.size.length, this.heli.size.span);
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const to = below ? new THREE.Spherical(big * 2.6, 1.42, Math.atan2(0.3, 1)) : new THREE.Spherical(big * 2.2, 1.32, Math.atan2(1, 0.3));
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    this.tween = { t0: performance.now(), dur: 700, from, to, target0: this.controls.target.clone(), target1: below ? new THREE.Vector3(big * 0.15, -big * 0.38, 0) : new THREE.Vector3(-big * 0.4, height * 0.42, 0) };
  }

  /** In the air: a roll or a loop, and the Legendary fireworks if they're fitted. */
  perform(kind: Trick) {
    if (this.phase !== 'air' || this.landQueued || !this.heli) return;
    this.trick = { kind, t0: performance.now() };
    if (this.fit?.weapons === 4) for (let k = 0; k < 3; k++) setTimeout(() => this.firework(), 250 + k * 380);
    this.touch();
  }

  private firework() {
    if (!this.flying || !this.heli) return;
    this.weapons.firework(new THREE.Vector3(-25 - Math.random() * 25, 6 + Math.random() * 14, -15 + Math.random() * 30));
  }

  /** Is (clientX, clientY) on the Helicopter? */
  hitsHeli(x: number, y: number) {
    if (!this.heli) return false;
    const r = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    return ray.intersectObject(this.heli.root, true).length > 0;
  }

  /** Where the Helicopter is on screen (for celebration sparks). */
  heliPoint() {
    const p = new THREE.Vector3(0, this.heli ? this.heli.size.height * 0.5 : 0, 0).project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.host.clientWidth, y: (-p.y * 0.5 + 0.5) * this.host.clientHeight };
  }

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // on a narrow screen (a phone held upright) widen the view so the whole Aircraft still fits across, hotspots and all
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * Math.max(1, NARROW / this.camera.aspect)));
    this.camera.updateProjectionMatrix();
    this.smoke.setScale(h * 1.2);
    this.weapons.setScale(h * 1.2);
    this.touch();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now(), dt = Math.min((now - this.last) / 1000, 0.05), t = now / 1000;
    this.last = now;
    if (document.hidden) return;
    const heli = this.heli;
    // engines
    const want = now < this.throttleUntil ? 1 : 0;
    this.throttle += (want - this.throttle) * Math.min(1, dt * (want ? 2.5 : 1.2));
    const busy = this.throttle > 0.01 || this.tween || this.flying || now < this.puffUntil || this.weapons.busy || (this.fit?.lights ?? 0) > 0;
    if (!busy && now - this.idleSince > 1500 && this.hotFrame++ % 30) return; // nothing moving: rest, but keep hotspots fresh now and then
    if (this.tween) {
      const k = Math.min((now - this.tween.t0) / this.tween.dur, 1), e = ease(k), { from, to } = this.tween;
      const s = new THREE.Spherical(from.radius + (to.radius - from.radius) * e, from.phi + (to.phi - from.phi) * e, from.theta + (to.theta - from.theta) * e);
      this.controls.target.lerpVectors(this.tween.target0, this.tween.target1, e);
      this.camera.position.setFromSpherical(s).add(this.controls.target);
      if (k >= 1) { this.tween = null; this.afterTween?.(); this.afterTween = null; }
    }
    if (heli) {
      heli.update(dt, t, { throttle: this.throttle });
      if (this.flying) this.flyFrame(dt, t);
      const colors = smokeColors(this.fit?.smoke ?? 0, t);
      if (colors && (this.flying ? this.speed > AIR_SPEED * 0.5 : now < this.puffUntil)) {
        // in the air the puffs stream back as fast as the clouds; several per frame, spread along the frame's travel, make one trail
        const p = new THREE.Vector3(), speed = this.flying ? (22 * this.speed) / AIR_SPEED : 3, per = this.flying ? 6 : 1;
        heli.smokeFrom.forEach((o, i) => {
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
    this.weapons.update(dt, this.speed, t);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (heli && this.onHotspots) {
      const w = this.host.clientWidth, h = this.host.clientHeight, places = {} as Record<SlotId, HotspotPlace>, v = new THREE.Vector3();
      for (const [slot, o] of Object.entries(heli.anchors) as [SlotId, THREE.Object3D][]) {
        o.getWorldPosition(v).project(this.camera);
        places[slot] = { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: !this.flying && v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.92 };
      }
      this.onHotspots(places);
    }
  };

  private flyFrame(dt: number, t: number) {
    const heli = this.heli!, now = performance.now(), s = (now - this.phaseT0) / 1000;
    let pitch = 0; // nose up
    switch (this.phase) {
      case 'takeoff': { // the rotors spin up, it lifts straight up off the pad, then noses down and flies off into the clouds
        const climb = clamp01((s - SPOOL_FOR) / CLIMB_FOR);
        if (s >= SPOOL_FOR && this.altitude === 0) { this.onFlight?.('liftoff'); this.dust(); }
        this.altitude = CRUISE * ease(climb);
        this.speed = AIR_SPEED * smooth(climb, 0.25, 0.9);
        pitch = CRUISE_PITCH * smooth(climb, 0.2, 0.6);
        if (this.altitude > 8) this.controls.maxPolarAngle = Math.PI - 0.2;
        if (climb >= 1) { this.phase = 'air'; this.phaseT0 = now; this.onFlight?.('air'); }
        break;
      }
      case 'air':
        this.altitude = CRUISE; this.speed = AIR_SPEED; pitch = CRUISE_PITCH;
        if (this.landQueued && !this.trick) this.beginLanding();
        break;
      case 'landing': { // slow down with the nose up, hover, and sink gently onto the pad
        const k = clamp01(s / DESCEND_FOR);
        this.speed = AIR_SPEED * (1 - smooth(k, 0, 0.55));
        this.altitude = CRUISE * (1 - ease(k));
        pitch = CRUISE_PITCH * (1 - smooth(k, 0, 0.25)) + FLARE * Math.sin(Math.PI * smooth(k, 0.15, 0.75));
        if (k >= 1) {
          this.phase = 'rollout'; this.phaseT0 = now; this.altitude = 0; this.speed = 0;
          this.controls.maxPolarAngle = 1.5;
          this.throttleUntil = now; // the rotors wind down
          this.dust();
          this.onFlight?.('touchdown');
        }
        break;
      }
      case 'rollout':
        if (s >= ROLLOUT_FOR) { this.phase = 'parked'; this.onFlight?.('stopped'); this.landed?.(); this.landed = null; }
        break;
    }
    const dist = this.speed * dt;
    for (const c of this.clouds) { // the world streams past
      c.position.x += dist;
      if (c.position.x > 160) { c.position.x = -160; c.position.z = (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 110); c.position.y = -40 + Math.random() * 60; }
    }
    this.cloudLayer.position.y = CRUISE - this.altitude;
    this.field.update(dist, this.altitude);
    this.pad.position.x = this.phase === 'landing' || this.phase === 'rollout' ? this.pad.position.x * (1 - Math.min(1, dt * 1.2)) : this.pad.position.x + dist;

    // up in the clouds it bobs and sways gently
    this.bob += ((this.phase === 'air' ? 1 : 0) - this.bob) * Math.min(1, dt * 1.2);
    const root = heli.root, b = this.bob;
    root.position.set(0, Math.sin(t * 0.8) * 0.5 * b, 0);
    root.rotation.set(Math.sin(t * 0.5) * 0.08 * b, 0, -pitch + Math.sin(t * 0.6) * 0.03 * b);
    if (this.trick) {
      const k = Math.min((now - this.trick.t0) / (this.trick.kind === 'loop' ? 2800 : 1700), 1), e = ease(k);
      if (this.trick.kind === 'spin') root.rotation.y = e * Math.PI * 2; // a pirouette
      else if (this.trick.kind === 'roll') root.rotation.x += e * Math.PI * 2;
      else { // a loop: nose up and over, climbing and coming back down
        const a = e * Math.PI * 2;
        root.rotation.z = -pitch - a;
        root.position.x = Math.sin(a) * -6;
        root.position.y += (1 - Math.cos(a)) * 6;
      }
      if (k >= 1) this.trick = null;
    }

    // the gun: rounds while the trigger is held, with a flickering flash
    const firing = this.gunning && this.phase === 'air';
    if (firing) {
      root.updateMatrixWorld(true);
      const forward = new THREE.Vector3(-1, -0.08, 0).normalize().applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
      this.gunDue += dt * GUN_RATE;
      for (; this.gunDue >= 1; this.gunDue--) this.weapons.shoot(heli.guns, forward);
    } else this.gunDue = 1;
    for (const m of this.muzzles) { m.visible = firing && Math.random() < 0.7; m.scale.setScalar(1 + Math.random()); }
  }

  /** The rotor wash blows a ring of dust off the pad as it lifts off and touches down. */
  private dust() {
    if (!this.heli) return;
    const tan = new THREE.Color(0.86, 0.8, 0.68), r = Math.max(this.heli.size.span, 6) * 0.35;
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      this.smoke.emit(out.clone().multiplyScalar(r).setY(0.4), out.multiplyScalar(6 + Math.random() * 4).setY(0.6), tan, 1.6, 0.55, 1.8);
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.heli?.dispose();
    this.smoke.dispose();
    this.weapons.dispose();
    this.field.dispose();
    for (const v of Object.values(this.envs)) v?.dispose();
    this.renderer.dispose();
  }
}


/** The helipad on the airfield: a yellow circle with a big H. */
function helipad() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#4a4d52'; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffd23f'; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#f4f4f0'; g.fillRect(78, 66, 26, 124); g.fillRect(152, 66, 26, 124); g.fillRect(100, 116, 56, 24);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(11, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, depthWrite: false }));
  m.rotation.y = Math.PI / 2;
  m.position.y = 0.01;
  m.renderOrder = 2;
  return m;
}
