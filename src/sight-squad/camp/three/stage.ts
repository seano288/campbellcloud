// The Camp stage: his army of plastic soldiers standing in rows on a play-mat, lit like toys on a sunny table, and he
// orbits it with a finger. New recruits march in from the corner of the mat to their place in the rows. In the Parade they
// march round the mat in a column behind the flag and the drums, and do what the words he taps say. In a Battle a troop
// of wind-up robots lines up across the mat; when he taps go his army throws its Boom, robots that are hit topple over and
// bounce back up dented, then go poof in confetti the second time, and his soldiers that are hit fall over and spring
// straight back up. It always ends with his army jumping for joy.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { reducedMotion } from '../../../ui/motion';
import type { CampState } from '../camp';
import { colourById, type Gear, type UnitId } from '../catalog';
import { Army, blockSlots, Materials, Track, type Mover } from './army';
import { boomLook, CONFETTI, Shots, Sparks, Splats } from './effects';
import type { FigureId } from './figures';
import { Mat, matLook } from './mat';

export type StageMode = 'camp' | 'parade' | 'battle';
/** The orders he can give the Parade: each is a sight word. */
export const COMMANDS = ['go', 'stop', 'run', 'jump', 'look', 'come', 'down', 'up', 'play'] as const;
export type Command = (typeof COMMANDS)[number];
/** Moments for the sounds and words. */
export type StageEvent = 'arrived' | 'step' | 'ready' | 'throw' | 'hit' | 'topple' | 'poof' | 'bounce' | 'won';
export type BattlePhase = 'off' | 'lining-up' | 'ready' | 'fight' | 'won';

const FOV = 38, NARROW = 0.9;
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const MARCH = 1.1, RUN = 2.4;
/** Ranks in the parade, three abreast, this far apart. */
const RANK = 0.95;
const VEHICLES: readonly FigureId[] = ['jeep', 'cannon', 'tank'];
const THROWERS: Partial<Record<FigureId, number>> = { rifleman: 1.7, scout: 1.9, drummer: 2.4, medic: 2.6, rocket: 1.5, para: 1.8, jeep: 2, cannon: 2.6, tank: 2.8 };

interface Tween { t0: number; dur: number; from: THREE.Spherical; to: THREE.Spherical; target0: THREE.Vector3; target1: THREE.Vector3 }

export class CampStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  private controls: OrbitControls;
  private sun: THREE.DirectionalLight;
  private mats = new Materials();
  private army = new Army(this.mats);
  private robots = new Army(this.mats);
  private mat = new Mat();
  private sparks = new Sparks();
  private shots = new Shots(this.sparks);
  private splats = new Splats();
  private flags = new THREE.Group();
  private flagCloth: THREE.Mesh[] = [];
  private flagTex: THREE.CanvasTexture | null = null;
  private gear: Gear | null = null;
  private colour = '#4f7a2a';
  private placed = false;
  private tween: Tween | null = null;
  private raf = 0;
  private last = performance.now();
  private idleSince = performance.now();
  private resizeObs: ResizeObserver;
  private hotFrame = 0;
  private extent = 4;
  mode: StageMode = 'camp';
  // the Parade
  private track = new Track(4, 3);
  private lead = 0;
  private speed = 0;
  private speedWant = 0;
  private pose: 'stand' | 'look' | 'down' | 'come' = 'stand';
  private column = new Map<Mover, { back: number; side: number }>();
  private stepClock = 0;
  // the Battle
  battle: BattlePhase = 'off';
  private dents = new Map<Mover, number>();
  private wonAt = 0;
  onEvent: ((e: StageEvent) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, private host: HTMLElement) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in r186
    r.toneMapping = THREE.NeutralToneMapping;
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; // soft studio light: the plastic shines like a real toy
    this.scene.environmentIntensity = 0.55;
    pm.dispose();

    const sun = (this.sun = new THREE.DirectionalLight(0xfff2dc, 2.2));
    sun.position.set(-7, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun, sun.target, new THREE.HemisphereLight(0xdfefff, 0x6b5a40, 0.5));
    this.scene.add(this.mat.group, this.army.group, this.robots.group, this.flags, this.sparks.points, this.shots.mesh, this.splats.mesh);

    const c = (this.controls = new OrbitControls(this.camera, canvas));
    c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false;
    c.minPolarAngle = 0.3; c.maxPolarAngle = 1.38;
    c.rotateSpeed = 0.8;
    c.addEventListener('start', () => { this.tween = null; this.touch(); });
    c.addEventListener('change', () => this.touch());

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();
    this.loop();
  }

  private touch() { this.idleSince = performance.now(); }
  private get size() { return (k: FigureId) => this.army.figure(k)?.size ?? { w: 0.5, d: 0.5, h: 1 }; }

  /** His army as it is in the save: how many of each Squad, the Gear they wear, the Team Colour and the Mat. */
  setArmy(camp: CampState) {
    this.touch();
    const colour = colourById(camp.colour ?? 'green').hex;
    this.mats.dress(colour, camp.gear.finish);
    const gearChanged = JSON.stringify(camp.gear) !== JSON.stringify(this.gear);
    this.gear = { ...camp.gear };
    const recolour = colour !== this.colour;
    this.colour = colour;
    const total = Object.values(camp.army).reduce((a, b) => a + b, 0);
    this.extent = Math.max(3.2, Math.sqrt(total) * 0.95);
    // the parade track, long enough to leave room between the head of the column and its tail, and the mat round it
    const counts = camp.army as Partial<Record<FigureId, number>>;
    this.track = new Track(Math.max(2.5, this.extent * 0.75), Math.max(2.2, this.extent * 0.6));
    while (this.track.length < this.columnLength(counts) * 1.7) this.track = new Track(this.track.half + 0.5, this.track.r + 0.25);
    const matSize = Math.max(14, this.extent * 3.4, (this.track.half + this.track.r) * 2 + 5);
    const look = matLook(camp.gear.mat);
    this.mat.set(camp.gear.mat, matSize);
    this.scene.background = look.sky;
    this.scene.fog = new THREE.Fog(look.sky, matSize * 1.2, matSize * 3.2);
    this.army.gravity = this.robots.gravity = look.gravity;
    const corner = new THREE.Vector3(matSize * 0.42, 0, matSize * 0.42);
    const added = this.army.setRoster(counts, camp.gear, () => corner.clone().add(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5)));
    if (this.mode === 'camp') this.formUp(!this.placed || reducedMotion());
    else if (this.mode === 'parade') this.layColumn();
    if (!this.placed) for (const u of added) u.pos.copy(u.target);
    for (const u of added) if (this.placed && u.kind === 'para') { u.pos.copy(u.target); u.hop = 7; } // paratroopers drop in from the sky
    this.placed = true;
    if (gearChanged || recolour || added.length) this.dressFlags();
    const sh = this.sun.shadow.camera, big = matSize * 0.6;
    sh.left = sh.bottom = -big; sh.right = sh.top = big; sh.near = 1; sh.far = 60; sh.updateProjectionMatrix();
    this.controls.minDistance = 3; this.controls.maxDistance = matSize * 1.6;
    if (!this.tween && this.camera.position.lengthSq() < 0.01) this.frame(false);
    return added;
  }

  /** Everyone back to their place in the rows, facing him. */
  private formUp(instant: boolean) {
    // rows as wide as suits the screen: narrower and deeper on a phone held upright
    const slots = blockSlots(this.army.movers, this.size, this.extent * 2.2 * Math.min(1, Math.max(0.5, this.camera.aspect)));
    let halfW = 1, halfD = 1;
    for (const [u, p] of slots) {
      u.target.copy(p); u.face = 0; u.speed = MARCH * 1.6; u.proneWant = 0;
      if (instant) { u.pos.copy(p); u.yaw = 0; }
      halfW = Math.max(halfW, Math.abs(p.x) + 0.6); halfD = Math.max(halfD, Math.abs(p.z) + 0.8);
    }
    this.rows = { halfW, halfD };
  }
  private rows = { halfW: 2, halfD: 1 };
  private upright = false;

  /** The camera framing the whole army (or the whole mat, for the Parade and the Battle). */
  private frame(animate = true, wide = false) {
    const reach = this.mode === 'parade' ? this.track.half + this.track.r + 1 : this.mode === 'battle' ? Math.max(this.extent * 1.4, this.mat.size * 0.2) + 2 : 0;
    // the camp: far enough back that the widest row fits across the screen, with a margin
    const across = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    // the parade track and the battle line are wider than they are deep: on a screen held upright, step back until they fit across
    const r = wide ? Math.max(8, (reach * 2.3) / Math.min(1, Math.max(0.45, this.camera.aspect))) : Math.max(6, (this.rows.halfW / across) * 1.08 + this.rows.halfD * 0.6);
    const to = new THREE.Spherical(r, wide ? 0.95 : 1.05, wide ? 0.25 : 0.18);
    const target = new THREE.Vector3(0, 0.4, 0);
    if (!animate || reducedMotion()) { this.tween = null; this.controls.target.copy(target); this.camera.position.setFromSpherical(to).add(target); this.touch(); return; }
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    this.tween = { t0: performance.now(), dur: 1100, from, to, target0: this.controls.target.clone(), target1: target };
    this.touch();
  }

  // ---------- the Parade ----------

  /** How long the column is, from the flag to the last tank. */
  private counts() {
    const c: Partial<Record<FigureId, number>> = {};
    for (const u of this.army.movers) c[u.kind] = (c[u.kind] ?? 0) + 1;
    return c;
  }
  private columnLength(counts: Partial<Record<FigureId, number>>) {
    let walkers = 0, back = 0;
    for (const [kind, n] of Object.entries(counts) as [FigureId, number][]) if (VEHICLES.includes(kind)) back += n * 2; else walkers += n;
    return Math.ceil(walkers / 3) * RANK + back + 1;
  }
  /** The column: the flag bearer out front, then the drums, the soldiers three abreast, the dogs, and the vehicles single file. */
  private layColumn() {
    const order: FigureId[] = ['drummer', 'rifleman', 'scout', 'medic', 'rocket', 'para', 'dog', 'jeep', 'cannon', 'tank'];
    const movers = [...this.army.movers].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.slot - b.slot);
    const bearer = this.army.movers.find(u => u.kind === 'rifleman');
    this.column.clear();
    let back = 0, file = 0;
    if (bearer) { this.column.set(bearer, { back: 0, side: 0 }); back = 1; }
    for (const u of movers) {
      if (u === bearer) continue;
      if (VEHICLES.includes(u.kind)) {
        if (file) { back += RANK; file = 0; }
        const d = this.size(u.kind).d;
        this.column.set(u, { back: back + d / 2, side: 0 }); back += d + 0.5;
        continue;
      }
      this.column.set(u, { back, side: (file - 1) * 0.6 });
      if (++file === 3) { file = 0; back += RANK; }
    }
  }

  parade(on: boolean) {
    this.touch();
    this.mode = on ? 'parade' : 'camp';
    this.pose = 'stand';
    for (const u of this.army.movers) { u.proneWant = 0; u.spinV = 0; }
    if (on) { this.layColumn(); this.lead = this.columnLength(this.counts()); this.speed = 0; this.speedWant = MARCH; this.frame(true, true); }
    else { this.formUp(reducedMotion()); this.frame(true); }
  }

  /** An order, from a word he tapped. */
  command(c: Command) {
    if (this.mode !== 'parade') return;
    this.touch();
    const army = this.army, standUp = () => { for (const u of army.movers) u.proneWant = 0; };
    switch (c) {
      case 'go': this.pose = 'stand'; standUp(); this.speedWant = MARCH; break;
      case 'run': this.pose = 'stand'; standUp(); this.speedWant = RUN; break;
      case 'stop': this.speedWant = 0; break;
      case 'look': this.speedWant = 0; this.pose = 'look'; standUp(); break;
      case 'down': this.speedWant = 0; this.pose = 'down'; for (const u of army.movers) u.proneWant = 1; break;
      case 'up': this.pose = 'stand'; standUp(); army.hopAll(reducedMotion() ? 0 : 4.2, 0.15); break;
      case 'jump': standUp(); if (this.pose === 'down') this.pose = 'stand'; army.hopAll(reducedMotion() ? 0 : 3.2, 0.5); break;
      case 'come': { // everyone runs to the front of the mat, close to him
        this.pose = 'come'; this.speedWant = 0; standUp();
        const slots = blockSlots(army.movers, this.size, this.extent * 2.6), front = this.mat.size * 0.3;
        for (const [u, p] of slots) { u.target.set(p.x, 0, p.z + front); u.face = 0; u.speed = RUN * 1.3; }
        break;
      }
      case 'play': standUp(); if (this.pose !== 'come') this.pose = 'stand'; for (const u of army.movers) { u.spinV = (Math.random() < 0.5 ? -1 : 1) * (reducedMotion() ? 0 : 9); } army.hopAll(reducedMotion() ? 0 : 2.2, 0.3); break;
    }
  }

  private paradeFrame(dt: number) {
    this.speed += (this.speedWant - this.speed) * Math.min(1, dt * 3);
    if (this.pose === 'come') return;
    this.lead += this.speed * dt;
    const toCamera = new THREE.Vector3();
    for (const [u, c] of this.column) {
      const { p, heading } = this.track.at(this.lead - c.back, c.side);
      u.target.copy(p);
      u.speed = Math.max(this.speed * 1.5, MARCH * 2);
      if (this.pose === 'look') { toCamera.subVectors(this.camera.position, u.pos); u.face = Math.atan2(toCamera.x, toCamera.z); }
      else u.face = heading;
    }
    if (this.speed > 0.3) { // the drum keeps the step
      this.stepClock += dt * this.speed * 1.6;
      if (this.stepClock >= 1) { this.stepClock -= 1; this.onEvent?.('step'); }
    }
  }

  // ---------- the Battle ----------

  battleOn(on: boolean) {
    this.touch();
    this.shots.clear(); this.splats.clear(); this.sparks.clear(); this.dents.clear();
    if (!on) {
      this.mode = 'camp'; this.battle = 'off';
      this.robots.setRoster({}, this.gear!, () => new THREE.Vector3());
      for (const u of this.army.movers) { u.knocked = 0; u.out = false; }
      this.formUp(reducedMotion()); this.frame(true);
      return;
    }
    this.mode = 'battle'; this.battle = 'lining-up';
    const n = this.army.movers.length, foes = Math.round(Math.min(24, Math.max(6, n * 0.6)));
    const half = this.mat.size / 2, far = new THREE.Vector3(0, 0, -half - 4);
    const robots = this.robots.setRoster({ robot: foes }, this.gear!, () => far.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, 0, -Math.random() * 3)));
    // two lines facing each other across the middle of the mat
    const gap = Math.max(5, this.mat.size * 0.3);
    lineUp(this.army.movers, this.size, this.extent * 2.6, gap / 2, Math.PI);
    lineUp(robots, () => ({ w: 0.5, d: 0.5 }), this.extent * 2.6, -gap / 2, 0);
    for (const u of robots) { u.speed = 1.6; u.face = 0; }
    for (const u of this.army.movers) { u.speed = RUN; u.face = Math.PI; }
    this.frame(true, true);
    this.rotateTo(Math.PI / 2 - 0.5, 0.95);
  }
  /** Go! */
  charge() {
    if (this.battle !== 'ready') return;
    this.battle = 'fight';
    for (const u of this.army.movers) { u.target.z -= 1.2; u.reload = Math.random() * 0.8; }
    for (const u of this.robots.movers) { u.target.z += 0.8; u.reload = 1 + Math.random() * 2; }
    this.touch();
  }

  private rotateTo(theta: number, phi: number) {
    if (!this.tween) return;
    this.tween.to.theta = theta; this.tween.to.phi = phi;
    while (this.tween.to.theta - this.tween.from.theta > Math.PI) this.tween.to.theta -= Math.PI * 2;
    while (this.tween.from.theta - this.tween.to.theta > Math.PI) this.tween.to.theta += Math.PI * 2;
  }

  private battleFrame(dt: number, now: number) {
    const army = this.army.movers, robots = this.robots.movers, standing = robots.filter(r => !r.gone && !r.out);
    if (this.battle === 'lining-up' && ![...army, ...robots].some(u => u.pos.distanceToSquared(u.target) > 0.01)) { this.battle = 'ready'; this.onEvent?.('ready'); }
    if (this.battle === 'fight') {
      if (!standing.length && !robots.some(r => !r.gone)) { this.battle = 'won'; this.wonAt = now; this.onEvent?.('won'); this.army.hopAll(reducedMotion() ? 0 : 3.5, 0.4); }
      const boom = this.gear?.boom ?? 0, from = new THREE.Vector3();
      for (const u of army) {
        const every = THROWERS[u.kind];
        if (!every || u.fall > 0.2 || !standing.length) continue;
        u.reload -= dt;
        if (u.reload > 0) continue;
        u.reload = every * (0.8 + Math.random() * 0.5);
        const foe = standing[Math.floor(Math.random() * standing.length)]!, miss = Math.random() < 0.3;
        if (u.kind === 'tank' || u.kind === 'cannon') u.aim = Math.atan2(foe.pos.x - u.pos.x, foe.pos.z - u.pos.z) - u.yaw;
        const at = foe.pos.clone().add(new THREE.Vector3(miss ? (Math.random() - 0.5) * 2.4 : 0, miss ? 0 : 0.6, miss ? 0.8 + Math.random() : 0));
        const big = u.kind === 'tank' || u.kind === 'cannon', look = boomLook(boom, Math.random());
        this.army.muzzleOf(u, from);
        this.onEvent?.('throw');
        if (u.kind !== 'tank' && u.kind !== 'cannon' && u.kind !== 'jeep') this.army.hop(u, 1.2);
        this.shots.fire(from, at, { ...look, size: look.size * (big ? 1.8 : 1) }, () => this.landed(at, boom, miss ? null : foe, big), big ? 9 : 7);
      }
      for (const r of robots) {
        if (r.gone || r.out || r.fall > 0.2) continue;
        r.reload -= dt;
        if (r.reload > 0) continue;
        r.reload = 2.2 + Math.random() * 2.5;
        const mine = army.filter(u => u.fall < 0.2);
        if (!mine.length) continue;
        const target = mine[Math.floor(Math.random() * mine.length)]!, at = target.pos.clone().setY(0.6);
        this.shots.fire(this.robots.muzzleOf(r, from), at, { size: 0.06, color: new THREE.Color('#c0c8d0'), trail: null }, () => {
          if (target.fall < 0.2) { this.army.knock(target); this.onEvent?.('bounce'); }
        }, 6);
      }
    }
    if (this.battle === 'won' && now - this.wonAt > 1600 && !reducedMotion()) { this.wonAt = now; this.army.hopAll(3, 0.6); this.sparks.burst(new THREE.Vector3((Math.random() - 0.5) * 6, 2.5, (Math.random() - 0.5) * 4), CONFETTI, 50, 5); }
  }

  /** A throw lands: on a robot (first it topples and bounces back up dented; the second time, poof), or on the mat. */
  private landed(at: THREE.Vector3, boom: number, foe: Mover | null, big: boolean) {
    const colors = boom === 1 ? [new THREE.Color('#5ab8ff'), new THREE.Color('#bfe6ff')] : boom === 2 ? CONFETTI : boom >= 3 ? CONFETTI : [new THREE.Color('#ff8a2b'), new THREE.Color('#ffc078')];
    this.sparks.burst(at, colors, boom >= 3 ? 40 : 16, boom >= 3 ? 4 : 2.2, boom >= 3 ? 0.1 : 0.09);
    if (boom === 2) this.splats.add(at, colors[Math.floor(Math.random() * colors.length)]!);
    this.onEvent?.('hit');
    const victims = foe ? [foe] : [];
    if (big) for (const r of this.robots.movers) if (r !== foe && !r.gone && !r.out && r.pos.distanceTo(at) < 1.1) victims.push(r);
    for (const r of victims) {
      if (r.gone || r.out || r.fall > 0.3) continue;
      const dents = (this.dents.get(r) ?? 0) + 1;
      this.dents.set(r, dents);
      this.robots.knock(r, dents >= 2);
      this.onEvent?.('topple');
      if (dents >= 2) setTimeout(() => this.poof(r), 900);
    }
  }
  private poof(r: Mover) {
    if (this.mode !== 'battle' || r.gone) return;
    r.gone = true;
    this.sparks.burst(r.pos.clone().setY(0.4), CONFETTI, 60, 4, 0.12);
    this.onEvent?.('poof');
    this.touch();
  }

  // ---------- tapping ----------

  /** The soldier under (x, y) on screen, if one is close enough to a finger. */
  pick(x: number, y: number): Mover | null {
    const r = this.renderer.domElement.getBoundingClientRect(), v = new THREE.Vector3();
    let best: Mover | null = null, bestD = 46;
    for (const u of this.army.movers) {
      v.copy(u.pos).setY(u.pos.y + 0.5).project(this.camera);
      const d = Math.hypot((v.x * 0.5 + 0.5) * r.width + r.left - x, (-v.y * 0.5 + 0.5) * r.height + r.top - y);
      if (d < bestD) { bestD = d; best = u; }
    }
    return best;
  }
  /** Tapping a soldier: his whole Squad jumps. */
  cheer(kind: UnitId) { for (const u of this.army.movers) if (u.kind === kind) this.army.hop(u, reducedMotion() ? 0 : 3); this.touch(); }
  /** Where the army is on screen (for celebration sparks). */
  armyPoint() {
    const p = new THREE.Vector3(0, 0.6, 0).project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.host.clientWidth, y: (-p.y * 0.5 + 0.5) * this.host.clientHeight };
  }
  /** For tests and the preview: where every soldier is. */
  snapshot() { return { mode: this.mode, battle: this.battle, army: this.army.movers.map(u => ({ kind: u.kind, x: u.pos.x, z: u.pos.z, fall: u.fall })), robots: this.robots.movers.filter(r => !r.gone).length }; }

  // ---------- flags ----------

  /** The Flag Mod: the first Rifleman carries a flag (bigger at Big Flag), every Squad's first soldier too at Banner, with a gold eagle on top at Golden Eagle. */
  private clearFlags() {
    for (const o of [...this.flags.children]) { this.flags.remove(o); o.traverse(x => { if (x instanceof THREE.Mesh) { x.geometry.dispose(); if (x.material !== this.mats.gold) (x.material as THREE.Material).dispose(); } }); }
    this.flagCloth = [];
    this.flagTex?.dispose();
    this.flagTex = null;
  }
  private dressFlags() {
    this.clearFlags();
    const rung = this.gear?.flag ?? 0;
    if (!rung) return;
    this.flagTex = flagTexture(this.colour);
    const bearers = rung >= 3 ? [...new Set(this.army.movers.filter(u => !VEHICLES.includes(u.kind) && u.kind !== 'dog').map(u => u.kind))].map(k => this.army.movers.find(u => u.kind === k)!) : this.army.movers.filter(u => u.kind === 'rifleman').slice(0, 1);
    for (const [i, u] of bearers.entries()) {
      const big = i === 0 && rung !== 1, h = big ? 2.1 : 1.6, w = big ? 0.9 : 0.6;
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, h, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.6 }));
      pole.position.y = h / 2;
      pole.castShadow = true;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.62, 12, 4).translate(w / 2, 0, 0), new THREE.MeshStandardMaterial({ map: this.flagTex, side: THREE.DoubleSide, roughness: 0.8 }));
      cloth.position.set(0, h - w * 0.36, 0);
      cloth.castShadow = true;
      g.add(pole, cloth);
      if (rung === 4 && i === 0) { const eagle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 6), this.mats.gold); eagle.position.y = h + 0.12; const wings = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.06), this.mats.gold); wings.position.y = h + 0.08; g.add(eagle, wings); }
      g.userData.mover = u;
      this.flags.add(g);
      this.flagCloth.push(cloth);
    }
  }
  private flagFrame(t: number) {
    const m = new THREE.Matrix4(), off = new THREE.Matrix4().makeTranslation(-0.24, 0, 0.06);
    for (const g of this.flags.children) {
      const u = g.userData.mover as Mover;
      if (!this.army.movers.includes(u)) { g.visible = false; continue; }
      this.army.rootOf(u, m).multiply(off);
      g.matrixAutoUpdate = false;
      g.matrix.copy(m);
    }
    if (reducedMotion()) return;
    for (const cloth of this.flagCloth) { // ripple
      const pos = cloth.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin(t * 6 - x * 7) * 0.05 * x); }
      pos.needsUpdate = true;
    }
  }

  // ---------- the loop ----------

  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * Math.max(1, NARROW / this.camera.aspect)));
    this.camera.updateProjectionMatrix();
    this.sparks.setScale(h * 1.1);
    const upright = this.camera.aspect < 1;
    if (this.placed && this.mode === 'camp' && upright !== this.upright) { this.formUp(false); this.frame(true); } // turned round: re-form to suit the new shape
    this.upright = upright;
    this.touch();
  }

  /** Moves everything on by `dt` seconds (the loop calls it every frame; tests can call it directly). */
  step(dt: number, now = performance.now()) {
    const t = now / 1000;
    if (this.tween) {
      const k = Math.min((now - this.tween.t0) / this.tween.dur, 1), e = ease(k), { from, to } = this.tween;
      const s = new THREE.Spherical(from.radius + (to.radius - from.radius) * e, from.phi + (to.phi - from.phi) * e, from.theta + (to.theta - from.theta) * e);
      this.controls.target.lerpVectors(this.tween.target0, this.tween.target1, e);
      this.camera.position.setFromSpherical(s).add(this.controls.target);
      if (k >= 1) this.tween = null;
    }
    if (this.mode === 'parade') this.paradeFrame(dt);
    if (this.mode === 'battle') this.battleFrame(dt, now);
    this.army.update(dt, t);
    this.robots.update(dt, t);
    this.shots.update(dt);
    this.sparks.update(dt);
    this.flagFrame(t);
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now(), dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (document.hidden) return;
    const busy = this.tween || this.mode !== 'camp' || this.army.busy || this.sparks.busy || (this.gear?.flag ?? 0) > 0;
    if (!busy && now - this.idleSince > 1500 && this.hotFrame++ % 30) return; // nothing moving: rest
    this.step(dt, now);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.army.dispose(); this.robots.dispose(); this.mat.dispose(); this.sparks.dispose(); this.shots.dispose(); this.splats.dispose();
    this.clearFlags();
    this.mats.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss(); // Safari keeps only a few WebGL contexts: give this one back now, not when it's collected
  }
}

/** Lines of figures across the mat at depth `z`, facing `face`, front rank toward the middle. */
function lineUp(movers: readonly Mover[], size: (k: FigureId) => { w: number; d: number }, width: number, z: number, face: number) {
  const dir = Math.sign(z) || 1;
  let x = 0, rank = 0, row: Mover[] = [];
  const place = () => {
    const w = row.reduce((s, u) => s + size(u.kind).w + 0.35, -0.35);
    let cx = -w / 2;
    for (const u of row) { const s = size(u.kind); u.target.set(cx + s.w / 2, 0, z + dir * rank * 1.2); u.face = face; cx += s.w + 0.35; }
    row = []; x = 0; rank++;
  };
  for (const u of movers) { const w = size(u.kind).w + 0.35; if (row.length && x + w > width) place(); row.push(u); x += w; }
  if (row.length) place();
}

/** The flag: his Team Colour with a big white star. */
function flagTexture(hex: string) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 80;
  const g = c.getContext('2d')!;
  g.fillStyle = hex; g.fillRect(0, 0, 128, 80);
  g.fillStyle = '#ffffff';
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 11 : 26; g.lineTo(64 + Math.cos(a) * r, 40 + Math.sin(a) * r); }
  g.fill();
  g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 128, 7); g.fillRect(0, 73, 128, 7);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
