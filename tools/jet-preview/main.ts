// Dev-only preview of one Aircraft for screenshots: ?jet=f16&paint=2&weapons=3&engine=2&rev=1&view=nose&fly=1&az=40
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
