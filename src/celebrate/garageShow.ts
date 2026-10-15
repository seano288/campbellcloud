// Unlocking a Mod makes the 3D Truck jump, bigger for higher Rungs: a hop with sparks, a crouch and a 360° spin
// jump, or (top Rung) "Wow!", a big double-spin jump, fireworks and a shake, then "That's the best one!".
// A Legendary gets the big jump with more fireworks and confetti. A Horn Mod plays its horn on landing, and the
// Truck revs with its fitted Engine. A Siren wails on every jump. Buying a Body gets the biggest show of all. Ported from the "Celebrations" prototype (variant C).
import { ENGINES, HORNS, sBigFanfare, sCheer, sBoing, sChime, sFanfare, sSiren, sThud, sWhoosh } from '../audio/sfx';
import { LEGENDARY, type BuyRung, type Fit, type SlotId } from '../garage/catalog';
import { MOVES, type GarageStage, type Move } from '../garage/three/stage';
import type { Phrase } from '../voice/phrases';
import type { VoiceScope } from '../voice/say';
import { confetti, firework, shake, sparks } from './effects';

const KIND: Record<BuyRung, Move> = { 1: 'hop', 2: 'jump', 3: 'mega', 4: 'mega' };

function after(voice: VoiceScope, ms: number, run: () => void) {
  void voice.wait(ms).then(() => { if (voice.active) run(); });
}

/** The Truck jumps, and a fitted Siren wails. */
function play(stage: GarageStage, kind: Move, fit: Fit) {
  stage.play(kind);
  if (fit.topper === LEGENDARY) sSiren();
}

/** Plays the unlock moment with the Truck's fit (the new Mod on), revving its Engine, and returns how long taps are blocked for (the length of the jump). */
export function celebrateUnlock(stage: GarageStage, stageEl: HTMLElement, slot: SlotId, rung: BuyRung, fit: Fit, got: Phrase, voice: VoiceScope): number {
  const kind = KIND[rung], ms = MOVES[kind].dur, engine = fit.engine;
  const burst = () => { const r = stageEl.getBoundingClientRect(); sparks(stage.truckPoint(), { w: r.width, h: r.height }); };
  play(stage, kind, fit);
  if (slot === 'horn') after(voice, ms, () => HORNS[rung]!()); // on landing
  if (rung === 1) {
    sBoing(); sChime(); burst();
    if (slot === 'engine') ENGINES[engine]!();
    void voice.say(got);
    return ms;
  }
  if (rung >= 3) void voice.say('Wow!');
  ENGINES[engine]!();
  after(voice, 250, () => sWhoosh(0.6));
  after(voice, ms - 150, () => {
    burst();
    if (rung === 2) { sFanfare(); void voice.say(got); return; }
    after(voice, 200, burst);
    sThud(); sBigFanfare(); shake(stageEl);
    if (rung === 4) return finale(got, voice);
    [0, 300, 650].forEach(t => after(voice, t, () => firework()));
    void voice.sayMore(got, "That's the best one!");
  });
  return ms;
}

/** The end of the biggest moments: a crowd cheer, a run of fireworks and a lot of confetti. */
function finale(got: Phrase, voice: VoiceScope) {
  [0, 250, 500, 800, 1100, 1400].forEach(t => after(voice, t, () => firework()));
  confetti(140); sCheer();
  void voice.sayMore(got);
}

/** He bought a new Body: "Wow!", the big jump, a crowd cheer, fireworks and confetti. Returns how long taps are blocked. */
export function celebrateBody(stage: GarageStage, stageEl: HTMLElement, fit: Fit, got: Phrase, voice: VoiceScope): number {
  const ms = MOVES.mega.dur;
  void voice.say('Wow!');
  play(stage, 'mega', fit);
  ENGINES[fit.engine]!();
  after(voice, 250, () => sWhoosh(0.6));
  after(voice, ms - 150, () => {
    const r = stageEl.getBoundingClientRect();
    sparks(stage.truckPoint(), { w: r.width, h: r.height });
    sThud(); sBigFanfare(); shake(stageEl);
    finale(got, voice);
  });
  return ms;
}
