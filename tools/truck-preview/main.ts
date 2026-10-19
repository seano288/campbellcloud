// Dev-only preview of one Truck for screenshots: ?body=jeep&tires=2&paint=1&colour=teal&view=tires&az=40&show=1
import * as THREE from 'three';
import { defaultFit, type BodyId, type Fit, type SlotId } from '../../src/garage/catalog';
import { GarageStage } from '../../src/garage/three/stage';

const q = new URLSearchParams(location.search);
const fit: Fit = defaultFit();
for (const k of ['tires', 'paint', 'decals', 'lights', 'horn', 'engine', 'grille', 'exhaust', 'topper', 'number'] as const) if (q.has(k)) fit[k] = Number(q.get(k)) as Fit[typeof k];
if (q.has('colour')) fit.colour = q.get('colour') as Fit['colour'];
if (q.has('dn')) fit.doorNumber = Number(q.get('dn'));
const stage = new GarageStage(document.getElementById('c') as HTMLCanvasElement, document.getElementById('s')!);
stage.setTruck((q.get('body') ?? 'pickup') as BodyId, fit);
if (q.get('view')) stage.focus(q.get('view') as SlotId);
if (q.get('show')) stage.show(true);
if (q.has('az')) { // look from this many degrees round from the front-left, this many degrees up
  const { camera, controls } = stage as unknown as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3 } };
  const off = camera.position.clone().sub(controls.target), r = off.length() * Number(q.get('zoom') ?? 1);
  camera.position.setFromSpherical(new THREE.Spherical(r, THREE.MathUtils.degToRad(90 - Number(q.get('el') ?? 20)), THREE.MathUtils.degToRad(Number(q.get('az'))))).add(controls.target);
}
(window as unknown as { stage: GarageStage }).stage = stage;
