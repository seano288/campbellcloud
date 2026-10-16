// Take Off: the Aircraft leaves the hangar for open sky, gear up and engines lit, its Smoke streaming behind. Tapping it
// does a roll, a loop or a double roll (with the Legendary fireworks if they're fitted). ✕ lands back in the Hangar.
import { useEffect, useRef } from 'preact/hooks';
import { sCheer } from '../../audio/sfx';
import { useVoiceScope } from '../voice';
import { JET_NAMES, PROP_JETS, type Fit, type JetId } from './catalog';
import { fireworkSound, takeOffSound, trickSound } from './sounds';
import { TRICKS, type HangarStage } from './three/stage';

const TAP_PX = 12;

export function TakeOff({ stage, canvas, jet, fit, onClose }: { stage: HangarStage; canvas: HTMLCanvasElement; jet: JetId; fit: Fit; onClose(): void }) {
  const voice = useVoiceScope(), next = useRef(0);
  useEffect(() => {
    if (!voice.active) return;
    stage.fly(true);
    takeOffSound(PROP_JETS.includes(jet));
    void voice.say('Take off!').then(() => voice.wait(1200)).then(() => voice.say('Tap your plane to do a trick!'));
    let down: { x: number; y: number } | null = null;
    const press = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const release = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < TAP_PX && stage.hitsJet(e.clientX, e.clientY)) perform();
    };
    canvas.addEventListener('pointerdown', press);
    canvas.addEventListener('pointerup', release);
    return () => { canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release); stage.fly(false); };
  }, []);
  function perform() {
    if (!voice.active) return;
    stage.perform(TRICKS[next.current++ % TRICKS.length]!);
    trickSound();
    if (fit.weapons === 4) fireworkSound();
    if (next.current % 3 === 0) sCheer();
  }
  return (
    <div class="show-overlay">
      <div class="showname">{JET_NAMES[jet]}</div>
      <button class="show-x" aria-label="Land" onClick={() => { voice.cancel(); onClose(); }}>🛬</button>
    </div>
  );
}
