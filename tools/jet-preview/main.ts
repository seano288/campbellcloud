// Dev-only preview of one Aircraft for screenshots: ?jet=f16&paint=2&weapons=3&engine=2&rev=1&view=nose&fly=1&cam=side (see below)
import { defaultFit, type Fit, type JetId, type SlotId } from '../../src/time-flies/hangar/catalog';
import { JETS } from '../../src/time-flies/hangar/jets';
import { HangarStage } from '../../src/time-flies/hangar/three/stage';

const q = new URLSearchParams(location.search);
const fit: Fit = defaultFit();
for (const k of ['paint', 'nose', 'tail', 'weapons', 'engine', 'smoke', 'canopy', 'lights', 'number'] as const) if (q.has(k)) fit[k] = Number(q.get(k)) as Fit[typeof k];
if (q.has('colour')) fit.colour = q.get('colour') as Fit['colour'];
if (q.has('tn')) fit.tailNumber = Number(q.get('tn'));
const stage = new HangarStage(document.getElementById('c') as HTMLCanvasElement, document.getElementById('s')!);
stage.setJet(JETS[(q.get('jet') ?? 'f16') as JetId], fit);
if (q.get('view')) stage.focus(q.get('view') as SlotId);
if (q.get('rev')) stage.rev(1e9);
if (q.get('fly')) setTimeout(() => stage.fly(true), 50);
if (q.get('smoke')) stage.puff(1e9);
(window as unknown as { stage: HangarStage }).stage = stage;
// Fixed camera angles for comparing against three-views and photos: cam=side|top|front|rear|three|belly, or az/el in
// degrees (az 0 looks at the right side, 90 from the nose); dist scales the distance (default 1).
const cam = q.get('cam'), az = q.get('az'), el = q.get('el');
if (cam || az || el) setTimeout(() => {
  const s = stage as unknown as { camera: import('three').PerspectiveCamera; controls: { target: import('three').Vector3; update(): void; minPolarAngle: number; maxPolarAngle: number } };
  const presets: Record<string, [number, number]> = { side: [0, 2], top: [0, 89.5], front: [90, 4], rear: [-90, 6], three: [40, 22], belly: [0, -60] };
  const [a, e] = cam && presets[cam] ? presets[cam] : [Number(az ?? 40), Number(el ?? 20)];
  s.controls.minPolarAngle = 0; s.controls.maxPolarAngle = Math.PI;
  const t = s.controls.target, d = s.camera.position.distanceTo(t) * Number(q.get('dist') ?? 1);
  const ar = (a * Math.PI) / 180, er = (e * Math.PI) / 180;
  // nose is -x, right side is +z
  s.camera.position.set(t.x - Math.sin(ar) * Math.cos(er) * d, t.y + Math.sin(er) * d, t.z + Math.cos(ar) * Math.cos(er) * d);
  s.controls.update();
}, 400);
