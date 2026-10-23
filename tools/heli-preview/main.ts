// Dev-only preview of one Helicopter for screenshots: ?heli=uh60&paint=2&weapons=3&rotor=2&rev=1&view=nose&fly=1
import { defaultFit, type Fit, type HeliId, type SlotId } from '../../src/chop-chop/hangar/catalog';
import { HELIS } from '../../src/chop-chop/hangar/helis';
import { HelipadStage } from '../../src/chop-chop/hangar/three/stage';

const q = new URLSearchParams(location.search);
const fit: Fit = defaultFit();
for (const k of ['paint', 'nose', 'tail', 'weapons', 'rotor', 'smoke', 'canopy', 'lights', 'number'] as const) if (q.has(k)) fit[k] = Number(q.get(k)) as Fit[typeof k];
if (q.has('colour')) fit.colour = q.get('colour') as Fit['colour'];
if (q.has('tn')) fit.tailNumber = Number(q.get('tn'));
const stage = new HelipadStage(document.getElementById('c') as HTMLCanvasElement, document.getElementById('s')!);
stage.setHeli(HELIS[(q.get('heli') ?? 'uh60') as HeliId], fit);
if (q.get('view')) stage.focus(q.get('view') as SlotId);
if (q.get('rev')) stage.rev(1e9);
if (q.get('fly')) setTimeout(() => stage.fly(true, q.get('fly') === 'air'), 50);
if (q.get('smoke')) stage.puff(1e9);
if (q.has('az')) stage.orbit(Number(q.get('az')), Number(q.get('el') ?? 20));
(window as unknown as { stage: HelipadStage }).stage = stage;
