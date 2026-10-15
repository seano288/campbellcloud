// Show Off: his Truck on stage, full screen. The lights dim, a spotlight falls on it, the turntable spins and the
// crowd cheers with his Engine and Horn (and a Siren), and the Exhaust puffs. Tapping the Truck makes it hop, jump or
// mega-jump with the horn (and a Dragon Jaw snap and a Siren wail), so he can perform it for someone. ✕ goes back to the Garage.
import { useEffect, useRef } from 'preact/hooks';
import { ENGINES, HORNS, sCheer, sSiren } from '../../audio/sfx';
import { sparks } from '../../celebrate/effects';
import { useVoiceScope } from '../../voice/context';
import { BODY_NAMES, LEGENDARY, type BodyId, type Rung } from '../catalog';
import type { GarageStage, Move } from '../three/stage';

const ROUTINE: readonly Move[] = ['hop', 'jump', 'mega'];
/** A press that moves less than this is a tap, not a spin of the turntable. */
const TAP_PX = 12;

interface Props { stage: GarageStage; canvas: HTMLCanvasElement; stageEl: HTMLElement; body: BodyId; horn: Rung; engine: Rung; topper: Rung; onClose: () => void }

export function ShowOff({ stage, canvas, stageEl, body, horn, engine, topper, onClose }: Props) {
  const voice = useVoiceScope(), { say } = voice;
  const next = useRef(0);
  const siren = topper === LEGENDARY;

  useEffect(() => {
    if (!voice.active) return;
    void say('Show time!');
    sCheer();
    ENGINES[engine]!();
    stage.puff();
    const t = setTimeout(() => { if (voice.active) HORNS[horn]!(); }, 900), w = siren ? setTimeout(() => { if (voice.active) sSiren(); }, 1900) : 0;
    let down: { x: number; y: number } | null = null;
    const press = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const release = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < TAP_PX && stage.hitsTruck(e.clientX, e.clientY)) perform();
    };
    canvas.addEventListener('pointerdown', press);
    canvas.addEventListener('pointerup', release);
    return () => { clearTimeout(t); clearTimeout(w); canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release); };
  }, []);

  function perform() {
    if (!voice.active) return;
    stage.play(ROUTINE[next.current++ % ROUTINE.length]!);
    stage.snap();
    HORNS[horn]!();
    if (siren) sSiren();
    const r = stageEl.getBoundingClientRect();
    sparks(stage.truckPoint(), { w: r.width, h: r.height });
  }

  return (
    <div class="show-overlay">
      <div class="showname">{BODY_NAMES[body]}</div>
      <button class="show-x" aria-label="Back to the Garage" onClick={() => { voice.cancel(); onClose(); }}>✕</button>
    </div>
  );
}
