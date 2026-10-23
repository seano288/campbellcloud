// Lift Off: the rotors spin up, the Helicopter lifts straight off its helipad, noses down and flies off into the sky with
// its Smoke streaming behind. Up there, tapping it does a pirouette, a roll or a loop (with the Legendary fireworks if
// they're fitted); holding 🔫 fires the gun and each 🚀 tap launches the next thing under the stub wings. 🛬 brings it
// back down onto the pad, and once the rotors have wound down it's back on the Helipad.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sCheer, tone } from '../../audio/sfx';
import { useVoiceScope } from '../voice';
import { HELI_NAMES, type Fit, type HeliId } from './catalog';
import { approachSound, bombSound, boomSound, fireworkSound, gunSound, liftOffSound, missileSound, touchdownSound, trickSound, windDownSound } from './sounds';
import { TRICKS, type HelipadStage } from './three/stage';

const TAP_PX = 12, GUN_SOUND_MS = 480;

export function LiftOff({ stage, canvas, heli, fit, onClose }: { stage: HelipadStage; canvas: HTMLCanvasElement; heli: HeliId; fit: Fit; onClose(): void }) {
  const voice = useVoiceScope(), next = useRef(0), gunTimer = useRef(0);
  const [phase, setPhase] = useState<'takeoff' | 'air' | 'landing'>('takeoff');
  useEffect(() => {
    if (!voice.active) return;
    stage.onFlight = e => {
      if (!voice.active) return;
      if (e === 'boom') boomSound();
      else if (e === 'touchdown') { touchdownSound(); windDownSound(); void voice.say('Touchdown!'); }
      else if (e === 'air') { setPhase('air'); void voice.say('Tap your helicopter to do a trick!'); }
    };
    stage.fly(true);
    liftOffSound();
    void voice.say('Lift off!');
    let down: { x: number; y: number } | null = null;
    const press = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const release = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < TAP_PX && stage.hitsHeli(e.clientX, e.clientY)) perform();
    };
    canvas.addEventListener('pointerdown', press);
    canvas.addEventListener('pointerup', release);
    return () => {
      canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release);
      clearInterval(gunTimer.current);
      stage.onFlight = null;
      stage.fly(false);
    };
  }, []);
  function perform() {
    if (!voice.active || stage.flight !== 'air') return;
    stage.perform(TRICKS[next.current++ % TRICKS.length]!);
    trickSound();
    if (fit.weapons === 4) fireworkSound();
    if (next.current % 3 === 0) sCheer();
  }
  function gunsOn(e: PointerEvent) {
    e.preventDefault();
    if (!voice.active || stage.flight !== 'air' || gunTimer.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    stage.guns(true);
    gunSound();
    gunTimer.current = window.setInterval(gunSound, GUN_SOUND_MS);
  }
  function gunsOff() {
    clearInterval(gunTimer.current);
    gunTimer.current = 0;
    stage.guns(false);
  }
  function fire() {
    if (!voice.active) return;
    const shot = stage.fire();
    if (shot === 'missile' || shot === 'firework') missileSound();
    else if (shot === 'bomb') bombSound();
    else if (shot === 'reloading') tone(1400, 0.06, 'square', 0, 0.06); // a dry click: they're still loading back on
    else if (shot === 'none') void voice.say('Add Weapons on the Helipad to fire rockets!');
  }
  function land() {
    if (!voice.active || stage.flight !== 'air') return;
    gunsOff();
    setPhase('landing');
    approachSound();
    void stage.land().then(() => voice.wait(400)).then(() => { if (voice.active) onClose(); });
  }
  return (
    <div class={`show-overlay flight ${phase}`}>
      <div class="showname">{HELI_NAMES[heli]}</div>
      <button class="show-x" aria-label="Land" disabled={phase !== 'air'} onClick={land}>🛬</button>
      {phase === 'air' && <>
        <button class="fire-btn guns" aria-label="Gun" onPointerDown={gunsOn} onPointerUp={gunsOff} onPointerCancel={gunsOff} onLostPointerCapture={gunsOff} onContextMenu={e => e.preventDefault()}>🔫</button>
        <button class="fire-btn missiles" aria-label="Rockets" onClick={fire}>🚀</button>
      </>}
    </div>
  );
}
