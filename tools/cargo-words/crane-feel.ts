// The Crane with plain boxes, alone, to try its feel before the Port is built round it: npx vite tools/cargo-words --port 5170
import { createCrane, stepCrane, takeEvents, BASE_SPEC, STEP, type Input } from '../../src/cargo-words/crane/sim';
import { createCraneScene } from '../../src/cargo-words/crane/render';
import { PLAIN_LOOK } from '../../src/cargo-words/art/container';
const q = new URLSearchParams(location.search);
const cols = Number(q.get('cols') ?? 3), tiers = Number(q.get('tiers') ?? 2);
const words = [['rab', 'bit'], ['sun', 'set'], ['nap', 'kin'], ['pic', 'nic'], ['muf', 'fin'], ['tick', 'et'], ['bas', 'ket'], ['rock', 'et'], ['pump', 'kin']].slice(0, Math.ceil(cols * tiers / 2));
const c = createCrane({ ...BASE_SPEC, twin: q.has('twin') }, { cols, tiers }, words);
const canvas = document.getElementById('c') as HTMLCanvasElement, scene = createCraneScene(canvas);
(window as unknown as { __crane: unknown }).__crane = c;
let finger: number | null = null, down: { x: number; t: number; moved: boolean } | null = null, pending: Input = { to: null, lower: null };
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, t: performance.now(), moved: false }; finger = scene.toWorld(e.clientX - canvas.getBoundingClientRect().left); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!down) return; if (Math.abs(e.clientX - down.x) > 12) down.moved = true; if (down.moved) { finger = scene.toWorld(e.clientX - canvas.getBoundingClientRect().left); pending = { ...pending, to: finger }; } });
canvas.addEventListener('pointerup', e => { if (down && !down.moved) pending = { to: null, lower: scene.toWorld(e.clientX - canvas.getBoundingClientRect().left) }; down = null; finger = null; });
document.getElementById('down')!.onclick = () => { pending = { to: null, lower: true }; };
const log = document.getElementById('log')!;
let last = 0, spare = 0;
const loop = (ms: number) => {
  requestAnimationFrame(loop);
  const now = ms / 1000, dt = last ? Math.min(0.1, now - last) : 0; last = now; spare += dt;
  while (spare >= STEP) { spare -= STEP; stepCrane(c, pending); pending = { to: down?.moved ? finger : null, lower: null }; }
  for (const e of takeEvents(c)) log.textContent = `${e.t} ${'word' in e ? words[e.word]!.join('') : ''}`;
  scene.frame(c, now, () => PLAIN_LOOK, { kind: 'feeder', hull: '#2f6fb5', trim: '#ffffff', funnel: '#ffd23f', mark: '⚓', name: 'Test' }, { paint: '#ffcc00', kind: 'gantry', lights: null }, false, finger);
};
requestAnimationFrame(loop);
