// The Garage stage: the Truck on a turntable he can spin, a camera that swings to a Slot's part,
// hotspots that follow the parts, a slow spin after 12 s idle, and the Truck's jumps, each with a puff from the
// Exhaust. For Show Off it dims the lights, puts a spotlight on the Truck, spins the turntable and puffs gently.
// It is lit like Time Flies' Hangar: the turntable stands in a real warehouse, a CC0 photo (HDRI) that lights the Truck
// and, projected onto a ground dome, surrounds it, with soft shadows and Neutral tone mapping so paint keeps its colour.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import type { BodyId, Fit, SlotId } from '../catalog';
import { POINT_SCALE, PUFF } from './exhaust';
import { buildTruck, type BuiltTruck } from './truck';

// Camera per Slot when its sheet opens: [x, z] direction from the Truck, polar angle
const VIEWS: Record<SlotId, [number, number, number]> = { tires: [0.5, 1, 1.32], paint: [0.8, 1, 1.12], decals: [0, 1, 1.3], lights: [1, 0.4, 1.3], horn: [1, 0.7, 0.95], engine: [1, 0.3, 1], grille: [1, 0.15, 1.35], exhaust: [-1, 0.9, 1.1], topper: [-0.7, 1, 0.85], number: [0.25, 1, 1.3] };
export const IDLE_SPIN_MS = 12000;
/** The warehouse photo's camera height: high enough that the view stays undistorted from up high, low enough that the Truck still looks big. */
const WAREHOUSE_EYE = 3.2;
/** The floor, just under the turntable. */
const FLOOR_Y = -0.12;
/** How long a Dragon Jaw snap takes: two chomps. */
const SNAP_MS = 700;
/** While jumping the Exhaust keeps puffing this often; idle in Show Off it puffs gently this often. */
const TRAIL_MS = 150, IDLE_PUFF_MS = 1600;

/** The Truck's moves: a hop, a spin jump and a big double-spin jump. */
export const MOVES = { hop: { dur: 600, h: 0.35, spin: 0 }, jump: { dur: 1300, h: 1.1, spin: 1 }, mega: { dur: 2100, h: 1.9, spin: 2 } } as const;
export type Move = keyof typeof MOVES;

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

interface Tween { t0: number; dur: number; from: { th: number; phi: number; r: number }; to: { th: number; phi: number; r: number } }

export interface HotspotPlace { x: number; y: number; visible: boolean }

/** Pushes visible hotspots that land closer than `d` pixels apart away from each other, so a Truck with many Slots keeps every one tappable. */
export function spreadHotspots(places: Record<SlotId, HotspotPlace>, d: number) {
  const shown = Object.values(places).filter(p => p.visible);
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
      const a = shown[i]!, b = shown[j]!, dx = b.x - a.x, dy = b.y - a.y, gap = Math.hypot(dx, dy);
      if (gap >= d) continue;
      const [ux, uy] = gap > 0.01 ? [dx / gap, dy / gap] : [1, 0], push = (d - gap) / 2;
      a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
    }
  }
}

export class GarageStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  private controls: OrbitControls;
  private truck: BuiltTruck | null = null;
  private sig = '';
  private fitted: { body: BodyId; fit: Fit } | null = null;
  private tween: Tween | null = null;
  private lastTouch = performance.now();
  private off = { x: 0, y: 0 };
  private move: { kind: Move; t0: number } | null = null;
  private stopMove = () => {};
  private snapAt = -Infinity;
  /** Puffs asked for since the last frame, sent out once the Truck is where it will be drawn. */
  private puffs: number[] = [];
  private lastPuff = 0;
  private raf = 0;
  private sheetOpen = false;
  private resizeObs: ResizeObserver;
  private lastLand: boolean | null = null;
  /** The table, its ring and the Truck: this is what spins in the show. */
  private turntable = new THREE.Group();
  private lights: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; rim: THREE.DirectionalLight; spot: THREE.SpotLight; beam: THREE.Mesh; shade: THREE.ShadowMaterial };
  /** The warehouse around the Truck, dimmed for Show Off. */
  private backdrop: THREE.MeshBasicMaterial | null = null;
  private showing = false;
  private disposed = false;
  private lastFrame = performance.now();
  /** Called every frame with where each Slot's hotspot goes (in stage pixels). */
  onHotspots: ((places: Record<SlotId, HotspotPlace>) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, private stage: HTMLElement) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in r186
    r.toneMapping = THREE.NeutralToneMapping;
    const scene = this.scene;
    scene.background = new THREE.Color(0x3a3a36);
    // a studio room lights the Truck until the warehouse photo arrives
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    scene.environmentIntensity = 1;
    // the ceiling lights: one warm key light casting the Truck's shadow, a soft fill and a cool rim from the open door
    const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x5a5348, 0.35); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e2, 1.6); sun.position.set(3, 9, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 24 });
    sun.shadow.radius = 6; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xcfdcff, 0.6); rim.position.set(-4, 3, -5); scene.add(rim);
    const spot = new THREE.SpotLight(0xfff4dc, 90, 16, 0.42, 0.45, 1.2); spot.position.set(0, 8, 1.5); spot.target.position.set(0, 0.6, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.visible = false; scene.add(spot, spot.target);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.3, 8, 48, 1, true).translate(0, -4, 0), new THREE.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.copy(spot.position); beam.lookAt(spot.target.position); beam.rotateX(-Math.PI / 2); beam.visible = false; scene.add(beam);
    // the warehouse floor is the photo; this only catches the shadows on it
    const shade = new THREE.ShadowMaterial({ opacity: 0.55 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), shade);
    floor.position.y = FLOOR_Y + 0.002; floor.receiveShadow = true; scene.add(floor);
    this.lights = { hemi, sun, rim, spot, beam, shade };
    this.loadWarehouse();
    scene.add(this.turntable);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.3, 0.12, 72), new THREE.MeshStandardMaterial({ color: 0x3a4256, metalness: 0.6, roughness: 0.45 }));
    table.position.y = -0.06; table.receiveShadow = true; this.turntable.add(table);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.22, 0.03, 8, 96), new THREE.MeshStandardMaterial({ color: 0xffc53d, emissive: 0xffc53d, emissiveIntensity: 1.2 }));
    ring.rotation.x = -Math.PI / 2; this.turntable.add(ring);

    const c = (this.controls = new OrbitControls(this.camera, canvas));
    c.target.set(0, 0.85, 0); c.enablePan = false; c.enableDamping = true;
    c.minDistance = 4; c.maxDistance = 15; c.minPolarAngle = 0.35; c.maxPolarAngle = 1.48; c.autoRotateSpeed = 0.7;
    c.addEventListener('start', () => { this.tween = null; this.lastTouch = performance.now(); c.autoRotate = false; });
    c.addEventListener('end', () => { this.lastTouch = performance.now(); });
    this.camera.position.setFromSpherical(new THREE.Spherical(7.6, 1.18, Math.atan2(0.75, 1))).add(c.target);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(stage);
    this.resize();
    this.camera.position.sub(c.target).setLength(this.fitDist(false)).add(c.target);
    this.raf = requestAnimationFrame(this.loop);
  }

  /** Show this Body with these Mods fitted (rebuilt only when something changed, and just repainted for a new Door Number). A newly fitted Exhaust puffs. */
  setTruck(body: BodyId, fit: Fit) {
    const sig = body + JSON.stringify(fit);
    if (sig === this.sig) return;
    if (this.truck && this.fitted?.body === body && this.sig === body + JSON.stringify({ ...fit, doorNumber: this.fitted.fit.doorNumber })) { // only the Door Number changed
      this.truck.setDoorNumber(fit.doorNumber);
      this.sig = sig; this.fitted = { body, fit: { ...fit } };
      return;
    }
    if (this.fitted?.body === body && this.fitted.fit.exhaust !== fit.exhaust) this.puff();
    this.sig = sig; this.fitted = { body, fit: { ...fit } };
    if (this.truck) { this.turntable.remove(this.truck.group, this.truck.exhaust.points); this.truck.dispose(); }
    this.truck = buildTruck(body, fit);
    this.turntable.add(this.truck.group, this.truck.exhaust.points);
  }

  /** Swing the camera to a Slot's part and shift the Truck clear of its sheet; null goes back to the whole Truck. */
  focus(slot: SlotId | null) {
    this.sheetOpen = !!slot;
    this.lastTouch = performance.now();
    const sp = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const from = { th: sp.theta, phi: sp.phi, r: sp.radius };
    if (!slot) { this.tween = { t0: performance.now(), dur: 600, from, to: { ...from, r: this.fitDist(false) } }; return; }
    const [dx, dz, phi] = VIEWS[slot], side = this.camera.position.z >= 0 ? 1 : -1;
    let d = Math.atan2(dx, dz * side) - sp.theta; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.tween = { t0: performance.now(), dur: 850, from, to: { th: sp.theta + d, phi, r: this.fitDist(true) } };
  }

  /** Play one of the Truck's jumps. The Exhaust puffs as it takes off, and keeps puffing through a jump. */
  play(kind: Move, signal?: AbortSignal) {
    if (signal?.aborted) return;
    this.stopMove();
    this.move = { kind, t0: performance.now() };
    this.puff(PUFF[kind]);
    if (!signal) return;
    const cancel = () => {
      signal.removeEventListener('abort', cancel);
      if (this.stopMove !== cancel) return;
      this.stopMove = () => {};
      this.move = null;
      this.puffs = [];
      if (this.truck) {
        this.truck.group.rotation.set(0, 0, 0);
        this.truck.group.position.y = 0;
        this.truck.exhaust.clear();
      }
    };
    this.stopMove = cancel;
    signal.addEventListener('abort', cancel, { once: true });
  }

  /** A puff from the Exhaust, 0-1 strong. */
  puff(strength: number = PUFF.rev) { this.puffs.push(strength); }

  /** A Dragon Jaw snaps shut twice (nothing happens without one). */
  snap() { this.snapAt = performance.now(); }

  /** Show Off: the lights dim, a spotlight falls on the Truck and the turntable spins slowly. Off puts the Garage back. */
  show(on: boolean) {
    this.showing = on;
    this.light(on);
    if (!on) this.turntable.rotation.y = 0;
    this.lastTouch = performance.now();
    const sp = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const from = { th: sp.theta, phi: sp.phi, r: sp.radius };
    this.tween = { t0: performance.now(), dur: 900, from, to: on ? { th: Math.atan2(0.75, 1), phi: 1.3, r: this.fitDist(false) * 1.12 } : { ...from, r: this.fitDist(false) } };
  }

  /** Is this point on the page on the Truck? */
  hitsTruck(clientX: number, clientY: number): boolean {
    if (!this.truck) return false;
    const rc = this.stage.getBoundingClientRect(), ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((clientX - rc.left) / rc.width) * 2 - 1, -((clientY - rc.top) / rc.height) * 2 + 1), this.camera);
    return ray.intersectObject(this.truck.group, true).length > 0;
  }

  /** Where on the page the Truck is (for sparks). */
  truckPoint(): { x: number; y: number } {
    const v = new THREE.Vector3(0, 1, 0).project(this.camera), rc = this.stage.getBoundingClientRect();
    return { x: rc.left + ((v.x + 1) / 2) * rc.width, y: rc.top + ((1 - v.y) / 2) * rc.height };
  }

  dispose() {
    this.disposed = true;
    this.stopMove();
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.controls.dispose();
    if (this.truck) this.truck.dispose();
    this.scene.environment?.dispose();
    this.backdrop?.map?.dispose();
    this.renderer.dispose();
  }

  /** The warehouse: its HDRI lights the Truck, and its photo surrounds the turntable. Both are Time Flies' hangar. */
  private loadWarehouse() {
    new HDRLoader().load('./env/hangar-1k.hdr', t => {
      if (this.disposed) { t.dispose(); return; }
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment?.dispose(); // the studio room it stood in for
      this.scene.environment = pm.fromEquirectangular(t).texture;
      pm.dispose(); t.dispose();
    });
    new THREE.TextureLoader().load('./env/hangar.jpg', t => {
      if (this.disposed) { t.dispose(); return; }
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.colorSpace = THREE.SRGBColorSpace;
      const g = new GroundedSkybox(t, WAREHOUSE_EYE, 100, 64), m = g.material as THREE.MeshBasicMaterial;
      m.toneMapped = false;
      this.backdrop = m;
      g.position.y = FLOOR_Y + WAREHOUSE_EYE - 0.01;
      g.rotation.y = Math.PI * 1.5; // the corrugated wall behind the Truck
      this.scene.add(g);
      this.light(this.showing);
    });
  }

  private light(show: boolean) {
    const L = this.lights;
    L.hemi.intensity = show ? 0.04 : 0.35; L.sun.intensity = show ? 0.2 : 1.6; L.rim.intensity = show ? 0.5 : 0.6;
    L.spot.visible = L.beam.visible = show;
    L.shade.opacity = show ? 0.8 : 0.55;
    this.scene.environmentIntensity = show ? 0.25 : 1;
    this.scene.background = new THREE.Color(show ? 0x05060a : 0x3a3a36);
    this.backdrop?.color.setScalar(show ? 0.03 : 1); // the warehouse lights go down
  }

  /** Distance that keeps the whole Truck in the part of the stage the sheet leaves free. */
  private fitDist(sheet: boolean) {
    const w = this.stage.clientWidth || 1, h = this.stage.clientHeight || 1, land = w > h, t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const wa = (w / h) * (sheet && land ? 0.5 : 0.9), ha = sheet && !land ? 0.5 : 0.85;
    return Math.max(2.3 / (t * wa), 1.5 / (t * ha));
  }

  private resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    POINT_SCALE.value = (h * this.renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.camera.aspect = w / h;
    this.applyOffset();
    const land = w > h;
    if (this.lastLand !== null && land !== this.lastLand) this.focusDistance();
    this.lastLand = land;
  }

  private focusDistance() {
    const sp = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const from = { th: sp.theta, phi: sp.phi, r: sp.radius };
    this.tween = { t0: performance.now(), dur: 600, from, to: { ...from, r: this.fitDist(this.sheetOpen) } };
  }

  private applyOffset() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    this.camera.setViewOffset(w, h, this.off.x * w, this.off.y * h, w, h);
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    const { camera, controls } = this;
    if (this.tween) {
      const tw = this.tween, k = Math.min(1, (now - tw.t0) / tw.dur), e = ease(k), a = tw.from, b = tw.to;
      camera.position.setFromSpherical(new THREE.Spherical(a.r + (b.r - a.r) * e, a.phi + (b.phi - a.phi) * e, a.th + (b.th - a.th) * e)).add(controls.target);
      if (k === 1) this.tween = null;
    }
    controls.autoRotate = !this.showing && !this.sheetOpen && !this.tween && now - this.lastTouch > IDLE_SPIN_MS;
    if (this.showing) this.turntable.rotation.y += (now - this.lastFrame) * 0.0003; // about one turn in 20 s
    controls.update();
    const land = this.stage.clientWidth > this.stage.clientHeight, tx = this.sheetOpen && land ? 0.24 : 0, ty = this.sheetOpen && !land ? 0.23 : 0;
    if (Math.abs(this.off.x - tx) + Math.abs(this.off.y - ty) > 0.001) { this.off.x += (tx - this.off.x) * 0.12; this.off.y += (ty - this.off.y) * 0.12; this.applyOffset(); }

    const t = this.truck;
    if (t) {
      const g = t.group;
      let y = 0;
      if (this.move) {
        const c = MOVES[this.move.kind], q = (now - this.move.t0) / c.dur;
        if (q >= 1) { this.move = null; g.rotation.set(0, 0, 0); }
        else if (q < 0.15) y = -Math.sin((q / 0.15) * Math.PI) * 0.08; // crouch
        else {
          const a = (q - 0.15) / 0.85;
          y = Math.sin(a * Math.PI) * c.h;
          g.rotation.y = c.spin * Math.PI * 2 * ease(a);
          if (this.move.kind === 'mega') g.rotation.z = Math.sin(a * Math.PI) * 0.35;
        }
      }
      g.position.y = y;
      if (this.move && this.move.kind !== 'hop' && now - this.lastPuff > TRAIL_MS) this.puff(PUFF.hop);
      else if (this.showing && !this.move && now - this.lastPuff > IDLE_PUFF_MS) this.puff(PUFF.idle);
      if (this.puffs.length) { g.updateMatrix(); for (const s of this.puffs) t.exhaust.puff(s, g.matrix); this.puffs = []; this.lastPuff = now; }
      t.exhaust.step(Math.min(0.05, (now - this.lastFrame) / 1000));
      for (const w of t.anim.spin) w.rotation.z -= 0.06;
      if (t.anim.lasers) t.anim.lasers.rotation.y = now / 700;
      if (t.anim.glow) { const p = 0.65 + 0.35 * Math.sin(now / 220); t.anim.glow.m.opacity = p; t.anim.glow.l.intensity = 4 * p; }
      if (t.anim.jaw) {
        const k = (now - this.snapAt) / SNAP_MS;
        t.anim.jaw.hinge.rotation.z = -(k < 1 ? 0.75 * Math.abs(Math.sin(k * Math.PI * 2)) : 0.07 + 0.05 * Math.sin(now / 500));
        t.anim.jaw.fire.emissiveIntensity = 0.9 + 0.35 * Math.sin(now / 90) * Math.sin(now / 37);
      }
      t.anim.wave?.(now);
      if (t.anim.siren) {
        const { rotor, lamps, light } = t.anim.siren, k = Math.floor(now / 260) % 2;
        rotor.rotation.y = now / 150;
        lamps.forEach((m, i) => { m.emissiveIntensity = i === k ? 5 : 1.2; });
        light.color.setHex(k ? 0x1a6bff : 0xff1a1a); light.intensity = 2 + 2.5 * Math.abs(Math.sin(now / 70));
      }
      if (t.anim.goldNumber) t.anim.goldNumber.emissiveIntensity = 0.7 + 0.35 * Math.sin(now / 280);
      t.anim.repaint?.(now);
      this.placeHotspots(t);
    }
    this.lastFrame = now;
    this.renderer.render(this.scene, camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private placeHotspots(t: BuiltTruck) {
    if (!this.onHotspots) return;
    const w = this.stage.clientWidth, h = this.stage.clientHeight, side = this.camera.position.z >= 0 ? 1 : -1;
    const A = t.anchors(side), out = {} as Record<SlotId, HotspotPlace>;
    for (const [slot, a] of Object.entries(A) as [SlotId, (typeof A)[SlotId]][]) {
      const p = a.p.clone(); p.y += t.group.position.y;
      const v = p.clone().project(this.camera);
      let visible = v.z < 1 && !this.move;
      if (a.n) visible &&= a.n.dot(this.camera.position.clone().sub(p).normalize()) > a.min; // hide when the part faces away
      out[slot] = { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, visible };
    }
    this.onHotspots(out);
  }
}
