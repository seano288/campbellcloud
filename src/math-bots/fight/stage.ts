// The fight's 3D stage, loaded only when a fight opens: a programme of a recorded Rapier fight, cut by simulated TV cameras and drawn
// on WebGPU, or WebGL2 where that's all there is. Everything in this chunk (three.js, Rapier, the textures it fetches) stays out of
// the question screens.
//
// openFight() runs one fight in `host` until close(). It looks after itself: detail.ts picks where to start and judges real frame
// times, a change of resolution happens in place, and a change of tier, a lost GPU or a thrown frame frees the stage and builds a
// lower one that carries on from the same moment. The fight is deterministic from its seed, so that's only a pause. If nothing
// works, onFailed says so and the screen shows the plain outcome. close() frees the GPU device, the physics world and the sound.
import * as THREE from 'three/webgpu';
import type { Look } from '../workshop/catalog';
import { buildArena, buildBackdrop, buildEnvironment, buildLights, loadBackdrop } from './arena';
import { buildAnvil, buildDebris, buildTorque } from './bots';
import { DamageAtlas } from './damage';
import { FIRST_GL, fightClosed, fightForgotten, fightOpened, isGL, LADDER, newWatch, watchFrame, type Tier, type Rung } from './detail';
import { LOOKAHEAD, Programme, TICK } from './director';
import { Scorch, Smoke } from './fx';
import { loadTextures, makeMaterials } from './materials';
import { makePipeline, makeVolume } from './post';
import { ANVIL_DIM, DT, Fight, FRAME_SIZE, initPhysics, N_DEBRIS, N_PANELS, N_SHED, N_SLOTS, PANELS, SLOT, T_PLATES, TORQUE_DIM, X } from './sim';
import { createFightSound, type FightSound } from './sounds';
import { makeSparks } from './sparks';
import { createStepper, nothingHeard, reached, type Heard } from './timeline';

const TIERS: Record<Tier, Record<string, unknown>> = {
  full: { ssgi: null, ssr: true, ssrQ: .3, ssrRes: .4, ssrBlur: 1, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: { steps: 10, res: .25, gain: 1 }, traa: true, mb: true, mbSamples: 8, dof: false, bloom: true, sparks: true, nSparks: 30000, shadowLights: 2, shadowSize: 1024, smokeRes: .5 },
  lite: { ssgi: null, ssr: false, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: { steps: 8, res: .2, gain: 1 }, traa: true, mb: false, dof: false, bloom: true, sparks: true, nSparks: 12000, shadowLights: 1, shadowSize: 1024, smokeRes: .4 },
  basic: { ssgi: null, ssr: false, gtao: false, vol: null, traa: true, mb: false, dof: false, bloom: true, sparks: true, nSparks: 8000, shadowLights: 1, shadowSize: 1024, smokeRes: .4 },
  // The WebGL2 path: the same fight, models, damage, drum, billboard smoke and mirrored floor sparks, with no SSR, volume light, motion blur or GPU compute.
  gl: { ssgi: null, ssr: false, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: null, traa: true, mb: false, dof: false, bloom: true, sparks: true, nSparks: 2500, shadowLights: 2, shadowSize: 1024, smokeRes: .5 },
  'gl-basic': { ssgi: null, ssr: false, gtao: false, vol: null, traa: false, mb: false, dof: false, bloom: false, sparks: true, nSparks: 1200, shadowLights: 1, shadowSize: 512, smokeRes: .35 },
};
// The prototype's objects, typed loosely on purpose: see the note at the top of those files.
type Ported = any;

/** A slow frame moves the programme on by at most this, so a stall holds the fight instead of skipping the hit. */
const MAX_STEP_MS = 100;
/** Rebuilding the stage is a pause: fine in the opening, not in the middle of the action. */
const REBUILD_UNTIL_S = 9;
const MAX_REBUILDS = 6;
/** Picture width a landscape iPad shows. Narrower screens keep this much of the arena side to side, so portrait still sees both robots. */
const WIDE_ASPECT = 1.44, MAX_FOV = 74;

export type Cue =
  | { kind: 'open' | 'go' | 'spinup' | 'hammer' | 'panel-off' | 'wheel-off' | 'replay' | 'result' }
  | { kind: 'drum'; strength: number }
  | { kind: 'ko'; how: 'knocked out' | 'stopped' };

export interface FightOptions {
  look: Look;
  seed: number;
  rung: number;
  cue(cue: Cue): void;
  /** Each frame: TORQUE's and ANVIL's health, 0 to 1, and whether this is the replay. */
  hud(torque: number, anvil: number, replay: boolean): void;
  /** True while a stage is being built, so the screen can show it's warming up. */
  busy(on: boolean): void;
  /** How far the build has got, 0 to 1. `blind`: a long stretch that can't report as it goes, and the bar is heading to `to` meanwhile. */
  progress(to: number, blind?: boolean): void;
  onFailed(): void;
}
export interface FightRun {
  /** The big button: TORQUE charges as soon as its drum is ready. */
  charge(): void;
  /** Back to the start of the slow-motion replay. */
  watchAgain(): void;
  close(): Promise<void>;
}

interface Stage { destroy(): Promise<void>; charge(): void; watchAgain(): void }
/** What survives a rebuild. */
interface Shared { T: number; heard: Heard; /** Physics steps of his 💥 taps. */ taps: number[]; /** It had to step down, so the rung isn't proven. */ rocky: boolean; rung: number; rebuilds: number; closed: boolean; koSeen: boolean; repSeen: boolean; ended: boolean }

/** Out here on purpose: a closure inside buildStage would hold its whole scope. */
const nothing = () => {};
/** Gives the page a frame to paint in, or a moment if it's hidden, where frames stop. */
const painted = () => new Promise<void>(r => { requestAnimationFrame(() => { setTimeout(r); }); setTimeout(r, 200); });
let physics: Promise<void> | null = null;
const rapier = () => (physics ??= initPhysics());
const pixelRatio = (w: number, h: number, r: Rung) => Math.min(devicePixelRatio || 1, r.px / Math.max(w, h, 1));
/** Keeps the picture's width as the screen narrows. */
function fovFor(fov: number, aspect: number) {
  if (aspect >= WIDE_ASPECT) return fov;
  return Math.min(MAX_FOV, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * WIDE_ASPECT / aspect) * 180 / Math.PI);
}

export function openFight(host: HTMLElement, o: FightOptions): FightRun {
  const stopSound = new AbortController(), sound = createFightSound(stopSound.signal);
  const shared: Shared = { T: 0, heard: nothingHeard(), taps: [], rocky: false, rung: o.rung, rebuilds: 0, closed: false, koSeen: false, repSeen: false, ended: false };
  let stage: Stage | null = null, building = false, failed = false;
  // A page that's put away properly isn't a crash; only a fight the page never came back from starts lower next time.
  // A fight that reached the knockout without stepping down also earns back a rung, so one bad day doesn't stay for good.
  const leaving = () => fightClosed(shared.rung, shared.koSeen && !shared.rocky);
  addEventListener('pagehide', leaving);

  function fail() {
    if (failed || shared.closed) return;
    failed = true;
    void stage?.destroy();
    stage = null;
    removeEventListener('pagehide', leaving);
    stopSound.abort();
    fightForgotten();
    o.onFailed();
  }
  // A stage that wouldn't build drops to the WebGL2 path, then down it; off the bottom, the plain outcome.
  function lower() {
    const r = Math.max(shared.rung + 1, isGL(LADDER[shared.rung]!) ? 0 : FIRST_GL);
    if (r < LADDER.length) void build(r); else fail();
  }
  async function build(rung: number) {
    if (building || failed || shared.closed) return;
    if (shared.rebuilds++ > MAX_REBUILDS) { fail(); return; }
    building = true;
    o.busy(true);
    const old = stage;
    stage = null;
    try {
      await old?.destroy();
      if (rung !== shared.rung) shared.rocky = true;
      shared.rung = rung;
      if (!shared.closed) fightOpened(rung); // he may have left while the old one was freed, which is no crash
      o.progress(.3);
      await painted();
      await rapier();
      stage = await buildStage(host, o, shared, sound, { rebuild: r => void build(r), fail });
      building = false;
      o.busy(false);
    } catch (e) {
      building = false;
      if (!shared.closed && !failed) { console.warn('Math Bots: the fight stage would not build', e); lower(); }
    }
  }
  void build(o.rung);

  return {
    charge: () => stage?.charge(),
    watchAgain: () => stage?.watchAgain(),
    async close() {
      if (shared.closed) return;
      shared.closed = true;
      removeEventListener('pagehide', leaving);
      if (!failed) leaving(); // after a failure the memory is already forgotten, and this would write it back
      stopSound.abort();
      const s = stage;
      stage = null;
      await s?.destroy();
    },
  };
}

async function buildStage(host: HTMLElement, o: FightOptions, shared: Shared, sound: FightSound, ask: { rebuild(rung: number): void; fail(): void }): Promise<Stage> {
  const wanted = LADDER[shared.rung]!;
  const renderer = new THREE.WebGPURenderer({ antialias: false, forceWebGL: isGL(wanted), powerPreference: 'high-performance' });
  // Nothing built yet needs freeing beyond the renderer, and these run on every path out of here.
  let dead = false, destroyed: Promise<void> | null = null, free: () => void = () => {};
  const size = () => [host.clientWidth || innerWidth, host.clientHeight || innerHeight] as const;
  const destroy = () => (destroyed ??= (async () => {
    dead = true;
    free();
    try { await renderer.dispose(); } catch { /* it was on its way out anyway */ } // frees the GPU device and the GL context with everything on them
    renderer.domElement.remove();
    // three.js's shared empty texture keeps a listener on every renderer it has met, for good, so nothing of ours may hang off the renderer
    renderer.onDeviceLost = nothing;
    renderer.onError = nothing;
  })());
  const stillWanted = () => { if (shared.closed) throw new Error('left'); };
  // Building is long work on a slow device. In one piece it would be a single frozen frame, so it stops to let the screen show progress.
  const beat = async (to: number, blind?: boolean) => { o.progress(to, blind); await painted(); stillWanted(); };

  try {
    await renderer.init();
    stillWanted();
    // three.js falls back to WebGL2 by itself when WebGPU won't start, so the rung follows the backend it got
    const isGPU = !!(renderer.backend as Ported).isWebGPUBackend;
    if (!isGPU && !isGL(wanted)) shared.rung = FIRST_GL;
    const rung = () => LADDER[shared.rung]!;
    const Q: Record<string, unknown> = { ...TIERS[rung().tier], off: new Set<string>() };
    host.dataset.backend = isGPU ? 'webgpu' : 'webgl2';
    host.dataset.tier = rung().tier;

    const [w0, h0] = size();
    const canvas = renderer.domElement;
    renderer.setPixelRatio(pixelRatio(w0, h0, rung())); renderer.setSize(w0, h0, false); renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .78;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010102);
    const cam = new THREE.PerspectiveCamera(30, w0 / h0, .12, 70);

    await beat(.34);
    const [T, back]: Ported = await Promise.all([loadTextures(renderer, (f: number) => o.progress(.34 + f * .28)), loadBackdrop()]);
    stillWanted();
    await beat(.68);
    const mats: Ported = makeMaterials(T, o.look);
    buildEnvironment(renderer, scene, back); buildBackdrop(scene, back);
    buildArena(scene, mats, T);
    await beat(.72);
    const { flash, fill, VOL }: Ported = buildLights(scene, Q);
    const atlasT: Ported = new DamageAtlas(T_PLATES, { dRes: 384, sRes: 1024 }), atlasA: Ported = new DamageAtlas(PANELS, { dRes: 512, sRes: 1024 });
    const torque: Ported = buildTorque(mats, T, atlasT, o.look), anvil: Ported = buildAnvil(mats, T, atlasA);
    scene.add(torque.root, anvil.root, anvil.hammer, ...anvil.panels, ...anvil.shed);
    anvil.hammer.position.set(0, 0, 0);
    const debris: Ported = buildDebris(mats, N_DEBRIS); scene.add(debris);
    const scorch: Ported = new Scorch(); scene.add(scorch.mesh);
    const smoke: Ported = new Smoke(T), sparks: Ported = makeSparks(renderer, Q.nSparks, isGPU);
    const volume: Ported = Q.vol ? makeVolume(scene, Q, VOL) : null;
    await beat(.76);
    const { pipe, u: pu }: Ported = makePipeline(renderer, scene, cam, Q, { volume, sparksMesh: sparks.mesh, mirrorMesh: sparks.mirrorMesh, smoke, VOL });
    torque.shell.uArc.value = 3.3;

    const fight: Ported = new Fight(o.seed, 62), prog: Ported = new Programme(fight, null), stepper = createStepper(fight, shared.taps);
    const resizer: ResizeObserver | null = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resized());
    free = () => {
      renderer.setAnimationLoop(null);
      resizer?.disconnect();
      fight.world.free();
      pipe.dispose();
      // three.js's shared nodes keep the last object and material they saw, so what they kept must not lead to the rest of the fight
      const all: Ported[] = [];
      scene.traverse((x: THREE.Object3D) => { all.push(x); });
      for (const x of all) {
        x.geometry?.dispose();
        for (const mat of [x.material].flat() as Ported[]) {
          mat?.dispose();
          if (mat) for (const key of Object.keys(mat)) if (key.endsWith('Node')) mat[key] = null;
        }
        x.geometry = x.material = x.parent = null;
        x.children = [];
      }
      for (const t of [...Object.values(T), back.t, atlasT.dispTex, atlasT.surfTex, atlasA.dispTex, atlasA.surfTex] as Ported[]) { t.dispose(); t.mipmaps = []; t.source.data = null; }
      scene.environment?.dispose();
    };

    let bursts: Ported[] = [], bi = 0, scN = 0, lastSim = 0, lastCut = '';
    const v = new THREE.Vector3(), v2 = new THREE.Vector3(), qt = new THREE.Quaternion(), m4 = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
    const view: Ported = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 30, focus: 8, id: 'wide', glitch: 0, cutAge: 9, simT: 0, replay: false };

    const drain = () => {
      const f = fight;
      for (const b of f.sparks) bursts.push(b);
      for (const s of f.smoke) smoke.add(s);
      for (const d of f.decals) scorch.list.push(d);
      f.sparks.length = 0; f.smoke.length = 0; f.decals.length = 0;
      while (scN < f.scars.length) { const s = f.scars[scN++]; (s.bot ? atlasA : atlasT).add(s); }
    };
    const advance = (t: number) => {
      let guard = 0;
      while (prog.ticks * TICK < t + TICK * 2 && guard++ < 200000) {
        const want = prog.ticks * TICK;
        if (fight.t < Math.max(prog.simTime(want) + LOOKAHEAD, want - prog.replayLen + LOOKAHEAD)) { stepper.step(); drain(); continue; }
        prog.tick();
      }
      while (fight.t < prog.simTime(t) + LOOKAHEAD && guard++ < 200000) { stepper.step(); drain(); }
    };

    const applyPose = (t: number) => {
      const P = (slot: number, ob: THREE.Object3D) => prog.pose(slot, t, ob.position, ob.quaternion);
      P(SLOT.T, torque.root); P(SLOT.A, anvil.root); P(SLOT.HAMMER, anvil.hammer);
      for (let i = 0; i < N_PANELS; i++) P(SLOT.PANEL + i, anvil.panels[i]);
      for (let i = 0; i < N_SHED; i++) { P(SLOT.SHED + i, anvil.shed[i]); anvil.shed[i].visible = anvil.shed[i].position.y > -10; }
      for (let i = 0; i < N_DEBRIS; i++) { prog.pose(SLOT.DEBRIS + i, t, v, qt); const k = v.y > -10 ? .8 + (i * .618 % 1) * .7 : 0; m4.compose(v, qt, v2.setScalar(k)); debris.setMatrixAt(i, m4); }
      debris.instanceMatrix.needsUpdate = true;
      const f = Math.round(Math.min(t / DT, fight.frame)), x = f * FRAME_SIZE + N_SLOTS * 7, r = fight.rec;
      torque.wheels.forEach((w: THREE.Object3D, i: number) => { w.rotation.x = r[x + X.tWheel + i]; w.position.y = .108 + r[x + X.tComp + i] - TORQUE_DIM.sag; });
      const mask = r[x + X.aWheelMask];
      anvil.wheels.forEach((w: THREE.Object3D, i: number) => { w.rotation.x = r[x + X.aWheel + i]; w.position.y = .1 + r[x + X.aComp + i] - ANVIL_DIM.sag; w.visible = !!(mask & (1 << i)); });
      const om = r[x + X.drumOmega], spin = om > 42, a = r[x + X.drumAngle];
      torque.drum.children[0].visible = !spin; torque.shell.mesh.visible = spin; torque.drum.rotation.x = -a;
      torque.shell.uAngle.value = a; torque.shell.uArc.value = om * (view.replay ? 1 / 500 : 1 / 120);
      // the whole chassis buzzes with the drum: a little out of balance, as a two-tooth drum is
      const buzz = Math.min(1, om / 400) * .0012; torque.model.position.y = -TORQUE_DIM.y0 + Math.sin(a) * buzz; torque.model.position.z = Math.cos(a) * buzz * .6;
      // ram follows the real arm body
      anvil.root.updateMatrixWorld(true); anvil.hammer.updateMatrixWorld(true);
      v.copy(anvil.ramTip).applyMatrix4(anvil.hammer.matrixWorld); anvil.model.worldToLocal(v);
      v2.copy(v).sub(anvil.ramBase); const L = v2.length(); v2.normalize();
      anvil.ramBody.position.copy(anvil.ramBase); anvil.ramBody.quaternion.setFromUnitVectors(Y, v2);
      anvil.ramRod.position.copy(v); anvil.ramRod.quaternion.setFromUnitVectors(Y, v2.clone().negate()); anvil.ramRod.scale.y = Math.max(.1, (L - .29) / .5);
      return om as number;
    };

    /** What the picture has just reached: sound, and cues for the voice. A rebuild plays from where it was, so nothing repeats. */
    function hear(t: number) {
      for (const e of reached<Ported>(fight.events, shared.heard, t)) {
        const J = e.J as number;
        if (e.type === 'drum') { sound.impact(J / 700); sound.crowd(Math.min(1, J / 500)); o.cue({ kind: 'drum', strength: J / 760 }); }
        else if (e.type === 'hammer') { sound.impact(J / 500, true); sound.crowd(.6); o.cue({ kind: 'hammer' }); }
        else if (e.type === 'panel-off' || e.type === 'wheel-off') { sound.clatter(); sound.crowd(.8); o.cue({ kind: e.type }); }
        else if (e.type === 'skim') sound.impact(.15);
        else if ((e.type === 'wall' || e.type === 'land') && J > 120) sound.impact(J / 900, true);
        else if (e.type === 'go' || e.type === 'spinup') o.cue({ kind: e.type });
        else if (e.type === 'ko') { shared.koSeen = true; sound.crowd(1); o.cue({ kind: 'ko', how: e.note === 'stopped' ? 'stopped' : 'knocked out' }); }
      }
    }

    const renderAt = (t: number) => {
      prog.read(t, view);
      const st = view.simT as number, dSim = st - lastSim, jumped = dSim < -.001 || dSim > .5;
      if (jumped) { sparks.clear(); bi = bursts.findIndex(b => b.t >= st); if (bi < 0) bi = bursts.length; }
      const om = applyPose(st);
      atlasT.pump(1.5); atlasA.pump(1.5); atlasT.seek(st); atlasA.seek(st); scorch.update(st);
      while (bi < bursts.length && bursts[bi]!.t <= st) {
        const b = bursts[bi++], big = b.n > 40, n = big ? b.n * 4 : b.n * 2;
        sparks.emit({ origin: v2.copy(b.p).clone(), dir: b.d.clone(), n: isGPU ? n : Math.min(160, n >> 1), spread: b.cone, vmin: b.speed * .16, vmax: b.speed * .72 });
      }
      sparks.uShutter.value = view.replay ? 1 / 500 : 1 / 120; sparks.update(Math.max(0, jumped ? 1 / 60 : dSim));
      smoke.uT.value = st;
      let fl = 0, puff = 0; v.set(0, .3, 0);
      for (const e of fight.events) {
        if (e.t > st || (e.type !== 'drum' && e.type !== 'hammer' && e.type !== 'panel-off') || st - e.t > 1.4) continue;
        const age = st - e.t, a = (Math.exp(-age * 15) + .22 * Math.exp(-age * 3) * (Math.sin(age * 70) * .5 + .5)) * Math.min(1.5, e.J / 230);
        if (a > fl) { fl = a; v.set(e.p[0], Math.max(.2, e.p[1]), e.p[2]); }
        const w = Math.exp(-age * 1.4) * Math.min(1.4, e.J / 280); if (w > puff) { puff = w; volume?.u.puff.value.set(e.p[0], e.p[1] + age * .6, e.p[2], w); }
      }
      flash.position.copy(v); flash.position.y += .5; flash.intensity = fl * 5.5; // above the hit, so nothing sits inside its inverse-square peak
      smoke.uFlash.value = Math.min(1, fl);
      const f = Math.round(Math.min(st / DT, fight.frame)), hud = f * FRAME_SIZE + N_SLOTS * 7, hp = fight.rec[hud + X.aHp];
      if (volume) {
        if (!puff) volume.u.puff.value.w = 0;
        volume.u.t.value = st; volume.u.amt.value = Math.max(0, (100 - hp) / 100) ** 1.5 * .9;
        v.copy(anvil.root.position); volume.u.plume.value.set(v.x, Math.min(v.y + .25, .6), v.z);
      }
      cam.position.copy(view.p); cam.quaternion.copy(view.q); cam.fov = fovFor(view.fov, cam.aspect);
      cam.updateProjectionMatrix();
      const cutId = `${view.id}${(t - view.cutAge).toFixed(2)}`, cut = cutId !== lastCut || jumped; lastCut = cutId;
      pu.mb.value = cut ? 0 : (view.replay ? .12 : .5);
      fill.position.copy(view.p).add(v.set(.3, .55, 0)); fill.intensity = view.focus < 2.5 ? 2.4 : 0;
      pu.focus.value = view.focus; pu.aperture.value = view.focus * 1.1; pu.grain.value = (pu.grain.value + 17.3) % 997;
      torque.shell.uFrame.value = (torque.shell.uFrame.value + 1) % 64;
      lastSim = st;
      pipe.render();
      if (!view.replay) hear(st);
      sound.drum(Math.min(1, om / 400));
      o.hud(fight.rec[hud + X.tHp] / 100, hp / 100, view.replay);
    };

    const resized = () => {
      const [w, h] = size();
      cam.aspect = w / h; cam.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio(w, h, rung())); renderer.setSize(w, h, false);
    };

    // Build to the moment he was at (the start, or where a rebuild left off) and draw it once before anything shows.
    await beat(.97, true); // compiling every shader for the first picture is the longest stretch of all, and it can't be split
    advance(shared.T);
    renderAt(shared.T);
    stillWanted();
    await new Promise(r => requestAnimationFrame(r));
    stillWanted();
    host.prepend(canvas);
    resizer?.observe(host);
    const broke = (e?: unknown) => {
      if (dead) return;
      console.warn('Math Bots: lost the picture', e);
      dead = true;
      // an iPad can drop the GPU of a page it has put away, which says nothing about how well the fight runs
      const r = document.hidden ? shared.rung : Math.max(shared.rung + 1, isGL(rung()) ? 0 : FIRST_GL);
      if (r < LADDER.length) ask.rebuild(r); else ask.fail();
    };
    renderer.onDeviceLost = broke;
    renderer.onError = broke;

    let prev = performance.now(), watch = newWatch();
    function judge(ms: number) {
      if (shared.koSeen) return;
      const verdict = watchFrame(watch, ms, shared.rung === LADDER.length - 1);
      if (verdict === 'wait' || verdict === 'keep') return;
      if (verdict === 'give-up') { console.info('Math Bots: too slow even at the bottom'); dead = true; ask.fail(); return; }
      const down = verdict === 'jump' && shared.rung < FIRST_GL ? FIRST_GL : verdict === 'jump' ? LADDER.length - 1 : shared.rung + 1;
      watch = newWatch();
      shared.rocky = true;
      console.info(`Math Bots: stepping down from ${rung().tier} ${rung().px}: ${verdict}, last frame ${Math.round(ms)} ms`);
      if (LADDER[down]!.tier === rung().tier) { shared.rung = down; fightOpened(down); resized(); }
      else if (shared.T < REBUILD_UNTIL_S || verdict === 'jump') { dead = true; ask.rebuild(down); }
    }
    renderer.setAnimationLoop(() => {
      if (dead) return;
      const now = performance.now(), raw = now - prev;
      prev = now;
      if (document.hidden) return;
      try {
        if (shared.T === 0) o.cue({ kind: 'open' });
        const end = prog.progEnd > 0 ? prog.progEnd : Infinity;
        shared.T = Math.min(shared.T + Math.min(raw, MAX_STEP_MS) / 1000, end);
        advance(shared.T);
        renderAt(shared.T);
        if (!shared.repSeen && view.replay) { shared.repSeen = true; o.cue({ kind: 'replay' }); }
        if (!shared.ended && prog.progEnd > 0 && shared.T >= prog.progEnd) { shared.ended = true; o.cue({ kind: 'result' }); }
        judge(raw);
      } catch (e) { broke(e); }
    });

    return {
      destroy,
      charge() { stepper.tap(); },
      watchAgain() { if (shared.ended) { shared.T = prog.liveEnd; shared.ended = false; shared.repSeen = false; } },
    };
  } catch (e) {
    await destroy();
    throw e;
  }
}
