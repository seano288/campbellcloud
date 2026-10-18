// Take Off: the Aircraft rolls down the runway, lifts off, tucks its gear up and climbs into open sky, its Smoke
// streaming behind. Up there, tapping it does a roll, a loop or a double roll (with the Legendary fireworks if they're
// fitted); holding 🔫 fires the guns and each 🚀 tap launches the next store under the wings. 🛬 flies it down to land on
// the runway, and once it has rolled to a stop it's back in the Hangar.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sCheer, tone } from '../../audio/sfx';
import { useVoiceScope } from '../voice';
import { JET_NAMES, PROP_JETS, type Fit, type JetId } from './catalog';
import { approachSound, bombSound, boomSound, fireworkSound, gearSound, gunSound, missileSound, takeOffSound, touchdownSound, trickSound } from './sounds';
import { TRICKS, type HangarStage } from './three/stage';

const TAP_PX = 12, GUN_SOUND_MS = 480;

export function TakeOff({ stage, canvas, jet, fit, onClose }: { stage: HangarStage; canvas: HTMLCanvasElement; jet: JetId; fit: Fit; onClose(): void }) {
  const voice = useVoiceScope(), next = useRef(0), gunTimer = useRef(0);
  const [phase, setPhase] = useState<'takeoff' | 'air' | 'landing'>('takeoff');
  const prop = PROP_JETS.includes(jet);
  useEffect(() => {
    if (!voice.active) return;
    stage.onFlight = e => {
      if (!voice.active) return;
      if (e === 'gear') gearSound();
      else if (e === 'boom') boomSound();
      else if (e === 'touchdown') { touchdownSound(); void voice.say('Touchdown!'); }
      else if (e === 'air') { setPhase('air'); void voice.say('Tap your plane to do a trick!'); }
    };
    stage.fly(true);
    takeOffSound(prop);
    void voice.say('Take off!');
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
    const brrrt = jet === 'a10';
    gunSound(brrrt);
    gunTimer.current = window.setInterval(() => gunSound(brrrt), GUN_SOUND_MS);
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
    else if (shot === 'none') void voice.say('Add Weapons in the Hangar to fire missiles!');
  }
  function land() {
    if (!voice.active || stage.flight !== 'air') return;
    gunsOff();
    setPhase('landing');
    approachSound(prop);
    void stage.land().then(() => voice.wait(700)).then(() => { if (voice.active) onClose(); });
  }
  return (
    <div class={`show-overlay flight ${phase}`}>
      <div class="showname">{JET_NAMES[jet]}</div>
      <button class="show-x" aria-label="Land" disabled={phase !== 'air'} onClick={land}>🛬</button>
      {phase === 'air' && <>
        <button class="fire-btn guns" aria-label="Guns" onPointerDown={gunsOn} onPointerUp={gunsOff} onPointerCancel={gunsOff} onLostPointerCapture={gunsOff} onContextMenu={e => e.preventDefault()}>🔫</button>
        <button class="fire-btn missiles" aria-label="Missiles" onClick={fire}>🚀</button>
      </>}
    </div>
  );
}
