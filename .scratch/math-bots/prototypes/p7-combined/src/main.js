// P7: P5's fight and broadcast, on P2's WebGPU frame, with P3's scans, P1's modelling and new structural armour damage.
import * as THREE from 'three/webgpu';
import { loadTextures, makeMaterials } from './materials.js';
import { buildTorque, buildAnvil, buildDebris } from './bots.js';
import { buildArena, buildLights, buildEnvironment, buildBackdrop, loadBackdrop } from './arena.js';
import { makeSparks } from './sparks.js';
import { Smoke, Scorch } from './fx.js';
import { DamageAtlas } from './damage.js';
import { makePipeline, makeVolume } from './post.js';
import { Fight, initPhysics, DT, SLOT, X, N_PANELS, N_DEBRIS, N_SHED, FRAME_SIZE, N_SLOTS, PANELS, T_PLATES, TORQUE_DIM, ANVIL_DIM, DRUM } from './sim.ts';
import { Programme, LOOKAHEAD, TICK } from './director.ts';

const q = new URLSearchParams(location.search);
const TIERS = {
  cinema: { pr: 1, ssgi: [2, 10], ssr: true, ssrQ: .55, ssrRes: .5, gtao: true, vol: { steps: 20, res: .33, gain: 1 }, traa: true, mb: true, mbSamples: 12, dof: true, bloom: true, sparks: true, nSparks: 60000, shadowLights: 4, shadowSize: 2048, smokeRes: .6, drumSteps: 12 },
  ipad: { pr: 1.085, ssgi: null, ssr: true, ssrQ: .3, ssrRes: .4, ssrBlur: 1, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: { steps: 10, res: .25, gain: 1 }, traa: true, mb: true, mbSamples: 8, dof: false, bloom: true, sparks: true, nSparks: 30000, shadowLights: 2, shadowSize: 1024, smokeRes: .5, drumSteps: 8 },
  lite: { pr: .85, ssgi: null, ssr: false, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: { steps: 8, res: .2, gain: 1 }, traa: true, mb: false, dof: false, bloom: true, sparks: true, nSparks: 12000, shadowLights: 1, shadowSize: 1024, smokeRes: .4, drumSteps: 6 },
  // WebGL2 fallback: same fight, models, damage, drum, billboard smoke and mirrored floor sparks. No SSR, volume light, motion blur or GPU compute.
  webgl: { pr: 1.085, ssgi: null, ssr: false, gtao: true, gtaoSamples: 6, gtaoRes: .5, vol: null, traa: true, mb: false, dof: false, bloom: true, sparks: true, nSparks: 2500, shadowLights: 2, shadowSize: 1024, smokeRes: .5, drumSteps: 8 },
};
const wantWebGL = q.get('q') === 'webgl' || q.has('webgl');
const renderer = new THREE.WebGPURenderer({ antialias: false, forceWebGL: wantWebGL, powerPreference: 'high-performance' });
const hud = document.getElementById('hud'), load = document.getElementById('load');
const shot = q.has('shot') ? parseFloat(q.get('shot')) : null;
if (shot !== null) document.body.classList.add('shot');
if (q.has('record')) document.body.classList.add('rec');

async function main() {
  const t0 = performance.now();
  await initPhysics(); await renderer.init();
  const isGPU = !!renderer.backend.isWebGPUBackend, name = isGPU ? (q.get('q') || 'ipad') : 'webgl';
  const Q = { ...TIERS[name] }; Q.off = new Set((q.get('off') || '').split(',').filter(Boolean));
  if (q.has('pr')) Q.pr = parseFloat(q.get('pr'));
  document.body.appendChild(renderer.domElement);
  renderer.setPixelRatio(Q.pr); renderer.setSize(innerWidth, innerHeight, false); renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .78;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010102);
  const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .12, 70);

  const [T, back] = await Promise.all([loadTextures(renderer), loadBackdrop()]), mats = makeMaterials(T);
  buildEnvironment(renderer, scene, back); buildBackdrop(scene, back);
  buildArena(scene, mats, T);
  const { flash, fill, VOL } = buildLights(scene, Q);
  const atlasT = new DamageAtlas(T_PLATES, { dRes: 384, sRes: 1024 }), atlasA = new DamageAtlas(PANELS, { dRes: 512, sRes: 1024 });
  const torque = buildTorque(mats, T, atlasT), anvil = buildAnvil(mats, T, atlasA);
  scene.add(torque.root, anvil.root, anvil.hammer, ...anvil.panels, ...anvil.shed);
  anvil.hammer.position.set(0, 0, 0);
  const debris = buildDebris(mats, N_DEBRIS); scene.add(debris);
  const scorch = new Scorch(); scene.add(scorch.mesh);
  const smoke = new Smoke(T), sparks = makeSparks(renderer, Q.nSparks, isGPU);
  const volume = Q.vol && !Q.off.has('vol') ? makeVolume(scene, Q, VOL) : null;
  const { pipe, u: pu } = makePipeline(renderer, scene, cam, Q, { volume, sparksMesh: sparks.mesh, mirrorMesh: sparks.mirrorMesh, smoke: Q.off.has('smoke') ? null : smoke, VOL });
  torque.shell.uArc.value = 3.3;

  const cnt = { draws: 0, tris: 0, last: { draws: 0, tris: 0 } }, oU = renderer.info.update.bind(renderer.info);
  renderer.info.update = (o, c, i) => { cnt.draws++; if (o.isMesh) cnt.tris += (i || 1) * (c / 3); oU(o, c, i); };
  const roll = () => { cnt.last = { draws: cnt.draws, tris: Math.round(cnt.tris) }; cnt.draws = cnt.tris = 0; };

  const inspect = q.has('inspect') ? q.get('inspect').split(',') : null;
  let seed = q.has('seed') ? +q.get('seed') : shot !== null ? 7 : (Date.now() % 100000) + 1, fight, prog, T0 = 0, bursts = [], bi = 0, scN = 0, lastSim = 0, lastCut = -1;
  const v = new THREE.Vector3(), v2 = new THREE.Vector3(), qt = new THREE.Quaternion(), m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  const view = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 30, focus: 8, id: 'wide', glitch: 0, cutAge: 9, simT: 0, replay: false };

  const start = s => {
    if (fight) fight.world.free();
    fight = new Fight(s, 62); prog = new Programme(fight, q.get('cam')); bursts = []; bi = 0; scN = 0; lastSim = 0; lastCut = -1;
    smoke.reset(); scorch.list.length = 0; atlasT.clear(); atlasA.clear(); sparks.clear();
    const ko = document.getElementById('ko'); ko.className = ''; ko.innerHTML = '';
    window.__prog = prog;
  };
  const drain = () => {
    const f = fight;
    for (const b of f.sparks) bursts.push(b); for (const s of f.smoke) smoke.add(s); for (const d of f.decals) scorch.list.push(d);
    f.sparks.length = 0; f.smoke.length = 0; f.decals.length = 0;
    while (scN < f.scars.length) { const s = f.scars[scN++]; (s.bot ? atlasA : atlasT).add(s); }
  };
  const advance = T => {
    let guard = 0;
    while (prog.ticks * TICK < T + TICK * 2 && guard++ < 200000) {
      const want = prog.ticks * TICK;
      if (fight.t < Math.max(prog.simTime(want) + LOOKAHEAD, want - prog.replayLen + LOOKAHEAD)) { fight.step(); drain(); continue; }
      prog.tick();
    }
    while (fight.t < prog.simTime(T) + LOOKAHEAD && guard++ < 200000) { fight.step(); drain(); }
  };

  const applyPose = t => {
    const P = (slot, o) => prog.pose(slot, t, o.position, o.quaternion);
    P(SLOT.T, torque.root); P(SLOT.A, anvil.root); P(SLOT.HAMMER, anvil.hammer);
    for (let i = 0; i < N_PANELS; i++) P(SLOT.PANEL + i, anvil.panels[i]);
    for (let i = 0; i < N_SHED; i++) { P(SLOT.SHED + i, anvil.shed[i]); anvil.shed[i].visible = anvil.shed[i].position.y > -10; }
    for (let i = 0; i < N_DEBRIS; i++) { prog.pose(SLOT.DEBRIS + i, t, v, qt); const k = v.y > -10 ? .8 + (i * .618 % 1) * .7 : 0; m4.compose(v, qt, v2.setScalar(k)); debris.setMatrixAt(i, m4); }
    debris.instanceMatrix.needsUpdate = true;
    const f = Math.round(Math.min(t / DT, fight.frame)), x = f * FRAME_SIZE + N_SLOTS * 7, r = fight.rec;
    torque.wheels.forEach((w, i) => { w.rotation.x = r[x + X.tWheel + i]; w.position.y = .108 + r[x + X.tComp + i] - TORQUE_DIM.sag; });
    const mask = r[x + X.aWheelMask];
    anvil.wheels.forEach((w, i) => { w.rotation.x = r[x + X.aWheel + i]; w.position.y = .1 + r[x + X.aComp + i] - ANVIL_DIM.sag; w.visible = !!(mask & (1 << i)); });
    const om = r[x + X.drumOmega], spin = om > 42, a = r[x + X.drumAngle];
    torque.drum.children[0].visible = !spin; torque.shell.mesh.visible = spin; torque.drum.rotation.x = -a;
    const shutter = view.replay ? 1 / 500 : 1 / 120;
    torque.shell.uAngle.value = a; torque.shell.uArc.value = om * shutter;
    // the whole chassis buzzes with the drum: a little out of balance, as a two-tooth drum is
    const buzz = Math.min(1, om / 400) * .0012; torque.model.position.y = -TORQUE_DIM.y0 + Math.sin(a) * buzz; torque.model.position.z = Math.cos(a) * buzz * .6;
    // ram follows the real arm body
    anvil.root.updateMatrixWorld(true); anvil.hammer.updateMatrixWorld(true);
    v.copy(anvil.ramTip).applyMatrix4(anvil.hammer.matrixWorld); anvil.model.worldToLocal(v);
    v2.copy(v).sub(anvil.ramBase); const L = v2.length(); v2.normalize();
    anvil.ramBody.position.copy(anvil.ramBase); anvil.ramBody.quaternion.setFromUnitVectors(Y, v2);
    anvil.ramRod.position.copy(v); anvil.ramRod.quaternion.setFromUnitVectors(Y, v2.clone().negate()); anvil.ramRod.scale.y = Math.max(.1, (L - .29) / .5);
    return { om };
  };

  const hudT = document.querySelector('#t i'), hudA = document.querySelector('#a i'), tag = document.getElementById('tag'), koEl = document.getElementById('ko');
  let koShown = false;
  const scoreboard = T => {
    const t = view.simT, f = Math.round(Math.min(t / DT, fight.frame)), x = f * FRAME_SIZE + N_SLOTS * 7, r = fight.rec;
    hudT.style.transform = `scaleX(${r[x + X.tHp] / 100})`; hudA.style.transform = `scaleX(${r[x + X.aHp] / 100})`;
    tag.className = view.replay ? 'rep' : ''; tag.textContent = view.replay ? 'REPLAY' : 'LIVE';
    const show = fight.koT >= 0 && !view.replay && t > fight.koT + 1.2;
    if (show && !koShown) { koShown = true; koEl.innerHTML = `TORQUE WINS<small>${fight.events.find(e => e.type === 'ko')?.note === 'stopped' ? 'ANVIL STOPPED' : 'ANVIL KNOCKED OUT'}</small>`; koEl.className = 'on'; }
    if (!show && koShown) { koShown = false; koEl.className = ''; }
  };

  const renderAt = (T, dtT) => {
    prog.read(T, view);
    const t = view.simT, dSim = t - lastSim, jumped = dSim < -.001 || dSim > .5;
    if (jumped) { sparks.clear(); bi = bursts.findIndex(b => b.t >= t); if (bi < 0) bi = bursts.length; }
    const { om } = applyPose(t);
    atlasT.pump(1.5); atlasA.pump(1.5); atlasT.seek(t); atlasA.seek(t); scorch.update(t);
    while (bi < bursts.length && bursts[bi].t <= t) {
      const b = bursts[bi++], big = b.n > 40, n = big ? b.n * 4 : b.n * 2;
      sparks.emit({ origin: v2.copy(b.p).clone(), dir: b.d.clone(), n: isGPU ? n : Math.min(160, n >> 1), spread: b.cone, vmin: b.speed * .16, vmax: b.speed * .72 });
    }
    const rate = jumped ? 1 : Math.max(.02, dSim / Math.max(dtT, 1e-4));
    sparks.uShutter.value = (view.replay ? 1 / 500 : 1 / 120); sparks.update(Math.max(0, jumped ? 1 / 60 : dSim));
    smoke.uT.value = t;
    let fl = 0, puff = 0; v.set(0, .3, 0);
    for (const e of fight.events) {
      if (e.t > t || (e.type !== 'drum' && e.type !== 'hammer' && e.type !== 'panel-off') || t - e.t > 1.4) continue;
      const age = t - e.t, a = (Math.exp(-age * 15) + .22 * Math.exp(-age * 3) * (Math.sin(age * 70) * .5 + .5)) * Math.min(1.5, e.J / 230);
      if (a > fl) { fl = a; v.set(e.p[0], Math.max(.2, e.p[1]), e.p[2]); }
      const w = Math.exp(-age * 1.4) * Math.min(1.4, e.J / 280); if (w > puff) { puff = w; volume?.u.puff.value.set(e.p[0], e.p[1] + age * .6, e.p[2], w); }
    }
    flash.position.copy(v); flash.position.y += .5; flash.intensity = fl * 5.5; // above the hit, so nothing sits inside its inverse-square peak
    smoke.uFlash.value = Math.min(1, fl);
    const f = Math.round(Math.min(t / DT, fight.frame)), hp = fight.rec[f * FRAME_SIZE + N_SLOTS * 7 + X.aHp];
    if (volume) {
      if (!puff) volume.u.puff.value.w = 0;
      volume.u.t.value = t; volume.u.amt.value = Math.max(0, (100 - hp) / 100) ** 1.5 * .9;
      v.copy(anvil.root.position); volume.u.plume.value.set(v.x, Math.min(v.y + .25, .6), v.z);
    }
    cam.position.copy(view.p); cam.quaternion.copy(view.q); cam.fov = view.fov;
    if (inspect) { // ?inspect=T|A,azimuth deg,elevation deg,distance,fov: a fixed camera on a bot, for judging surfaces
      const [w, az, el, d, fv] = inspect, o = w === 'A' ? anvil.root : torque.root, a = (+az) * Math.PI / 180, e = (+el) * Math.PI / 180;
      v.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(+d).applyQuaternion(o.quaternion).add(o.position);
      cam.position.copy(v); cam.lookAt(q.has('aim') ? o.localToWorld(v.fromArray(q.get('aim').split(',').map(Number))) : o.position); cam.fov = +(fv || 30); }
    cam.updateProjectionMatrix();
    const cutId = `${view.id}${(T - view.cutAge).toFixed(2)}`, cut = cutId !== lastCut || jumped; lastCut = cutId;
    pu.mb.value = cut ? 0 : (view.replay ? .12 : .5);
    fill.position.copy(view.p).add(v.set(.3, .55, 0)); fill.intensity = view.focus < 2.5 ? 2.4 : 0;
    pu.focus.value = view.focus; pu.aperture.value = view.focus * 1.1; pu.grain.value = (pu.grain.value + 17.3) % 997;
    torque.shell.uFrame.value = (torque.shell.uFrame.value + 1) % 64;
    lastSim = t; void om; void rate;
    roll(); pipe.render();
  };

  const onResize = () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); };
  addEventListener('resize', onResize);
  const res = () => { const s = new THREE.Vector2(); renderer.getDrawingBufferSize(s); return [s.x, s.y]; };
  start(seed); advance(0); renderAt(0, 1 / 60);
  await new Promise(r => requestAnimationFrame(r));
  const loadMs = performance.now() - t0; load.remove();
  window.__dbg = { tier: name, isGPU, res, loadMs, seed: () => seed, fight: () => fight, atlasT, atlasA, anvil, torque, scene, cam };

  if (shot !== null) {
    const dt = 1 / 60, from = Math.max(0, shot - 1.0), n = Math.round((shot - from) / dt);
    advance(shot + .05);
    for (let i = n; i >= 0; i--) { renderAt(shot - i * dt, dt); await new Promise(r => requestAnimationFrame(r)); }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.__stats = { seed, T: shot, simT: view.simT, cam: view.id, draws: cnt.last.draws, tris: cnt.last.tris, res: res(), backend: isGPU ? 'WebGPU' : 'WebGL2', tier: name, loadMs, liveEnd: prog.liveEnd, replayLen: prog.replayLen, ko: fight.koT, why: fight.events.find(e => e.type === 'ko')?.note, events: fight.events.filter(e => !['skim', 'spinup', 'go', 'land'].includes(e.type)).map(e => [+e.t.toFixed(2), e.type, Math.round(e.J), e.note]), scars: fight.scars.length };
    window.__ready = true; return;
  }
  if (q.has('record')) {
    let T = q.has('t') ? +q.get('t') : 0; const dt = 1 / 30;
    window.__frame = async () => { advance(T); renderAt(T, dt); T += dt; scoreboard(T); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return { T, end: prog.progEnd }; };
    window.__ready = true; return;
  }
  document.getElementById('replay').onclick = () => { seed = seed + 1; start(seed); T0 = performance.now(); };
  document.getElementById('fire').onclick = () => { fight.chargeRequested = true; };
  T0 = performance.now() - (q.has('t') ? +q.get('t') * 1000 : 0);
  let prev = performance.now(), frames = 0, acc = 0, ms = [], phys = 0;
  const bench = q.has('bench');
  const finish = () => { const s = [...ms].sort((a, b) => a - b), avg = s.reduce((a, b) => a + b, 0) / s.length; window.__bench = { tier: name, frames: s.length, avgFps: 1000 / avg, medMs: s[s.length >> 1], p95Ms: s[s.length * .95 | 0], p99Ms: s[s.length * .99 | 0], maxMs: s[s.length - 1], over50: s.filter(x => x > 50).length, res: res(), draws: cnt.last.draws, tris: cnt.last.tris, backend: isGPU ? 'WebGPU' : 'WebGL2', physMs: phys / s.length, loadMs }; };
  window.__finish = finish;
  renderer.setAnimationLoop(() => {
    const now = performance.now(), raw = now - prev; prev = now; const T = (now - T0) / 1000;
    const a = performance.now(); advance(T); phys += performance.now() - a;
    renderAt(T, Math.min(raw / 1000, 1 / 15)); scoreboard(T);
    frames++; acc += raw; ms.push(raw);
    if (acc > 500) { const r = res(), i = cnt.last; hud.textContent = `${isGPU ? 'WebGPU' : 'WebGL2'} ${name}  ${r[0]}x${r[1]}  ${(frames * 1000 / acc).toFixed(0)} fps  ${i.draws} draws  ${(i.tris / 1000 | 0)}k tris  seed ${seed}`; frames = 0; acc = 0; }
    if (prog.progEnd > 0 && T > prog.progEnd) { seed = seed + 1; start(seed); T0 = performance.now(); }
  });
  window.__ready = true;
}
main().catch(e => { console.error(e); hud.textContent = 'failed: ' + e.message; window.__error = String(e.stack || e); });
