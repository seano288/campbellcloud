// Unlocking a Mod makes the 3D Truck jump, bigger for higher Rungs: a hop with sparks, a crouch and a 360° spin
// jump, or (top Rung) "Wow!", a big double-spin jump, fireworks and a shake, then "That's the best one!".
// A Legendary gets the big jump with more fireworks and confetti. A Horn Mod plays its horn on landing, and the
// Truck revs with its fitted Engine. A Siren wails on every jump. Buying a Body gets the biggest show of all. Ported from the "Celebrations" prototype (variant C).
import { ENGINES, HORNS, sBigFanfare, sCheer, sBoing, sChime, sFanfare, sSiren, sThud, sWhoosh } from '../audio/sfx';
import { LEGENDARY, type BuyRung, type Fit, type SlotId } from '../garage/catalog';
import { MOVES, type GarageStage, type Move } from '../garage/three/stage';
import type { Phrase } from '../voice/phrases';
import { createVoiceScope, type VoiceScope } from '../voice/say';
import { effectsFor } from './effects';
import { playMoments, type Moment } from './sequence';

const KIND: Record<BuyRung, Move> = { 1: 'hop', 2: 'jump', 3: 'mega', 4: 'mega' };

function after(voice: VoiceScope, ms: number, run: () => void | Promise<void>) {
  return voice.wait(ms).then(() => { if (voice.active) return run(); });
}

function show(moment: Moment, voice: VoiceScope) {
  void playMoments([moment], voice.signal).then(result => { if (result === 'failed') voice.cancel(); });
}

function burst(stage: GarageStage, stageEl: HTMLElement, signal: AbortSignal) {
  const r = stageEl.getBoundingClientRect();
  effectsFor(signal).sparks(stage.truckPoint(), { w: r.width, h: r.height });
}

async function jump(stage: GarageStage, stageEl: HTMLElement, kind: Move, fit: Fit, voice: VoiceScope, landed: () => void | Promise<void>) {
  const { sound, shake } = effectsFor(voice.signal);
  const ms = MOVES[kind].dur;
  play(stage, kind, fit, voice.signal);
  sound(ENGINES[fit.engine]!);
  await Promise.all([
    voice.wait(ms),
    after(voice, 250, () => sound(sWhoosh, 0.6)),
    after(voice, ms - 150, () => {
      burst(stage, stageEl, voice.signal);
      if (kind === 'mega') { sound(sThud); sound(sBigFanfare); shake(stageEl); }
      return landed();
    }),
  ]);
}

/** The Truck jumps, and a fitted Siren wails. */
function play(stage: GarageStage, kind: Move, fit: Fit, signal: AbortSignal) {
  stage.play(kind, signal);
  if (fit.topper === LEGENDARY) effectsFor(signal).sound(sSiren);
}

/** Plays the unlock moment with the Truck's fit (the new Mod on), revving its Engine, and returns how long taps are blocked for (the length of the jump). */
export function celebrateUnlock(stage: GarageStage, stageEl: HTMLElement, slot: SlotId, rung: BuyRung, fit: Fit, got: Phrase, voice: VoiceScope): number {
  const kind = KIND[rung], ms = MOVES[kind].dur, engine = fit.engine;
  show(async signal => {
    const scoped = createVoiceScope(signal), { firework, sound } = effectsFor(signal);
    const landing = slot === 'horn' ? after(scoped, ms, () => sound(HORNS[rung]!)) : scoped.wait(ms); // on landing
    if (rung === 1) {
      play(stage, kind, fit, signal);
      sound(sBoing); sound(sChime); burst(stage, stageEl, signal);
      if (slot === 'engine') sound(ENGINES[engine]!);
      void scoped.say(got);
      await landing;
      return;
    }
    if (rung >= 3) void scoped.say('Wow!');
    await Promise.all([
      landing,
      jump(stage, stageEl, kind, fit, scoped, async () => {
        if (rung === 2) { sound(sFanfare); void scoped.say(got); return; }
        await Promise.all([
          after(scoped, 200, () => burst(stage, stageEl, signal)),
          rung === 4 ? finale(got, scoped) : (async () => {
            void scoped.sayMore(got, "That's the best one!");
            await Promise.all([0, 300, 650].map(t => after(scoped, t, firework)));
          })(),
        ]);
      }),
    ]);
  }, voice);
  return ms;
}

/** The end of the biggest moments: a crowd cheer, a run of fireworks and a lot of confetti. */
async function finale(got: Phrase, voice: VoiceScope) {
  const { confetti, firework, sound } = effectsFor(voice.signal);
  confetti(140); sound(sCheer);
  void voice.sayMore(got);
  await Promise.all([0, 250, 500, 800, 1100, 1400].map(t => after(voice, t, firework)));
}

/** He bought a new Body: "Wow!", the big jump, a crowd cheer, fireworks and confetti. Returns how long taps are blocked. */
export function celebrateBody(stage: GarageStage, stageEl: HTMLElement, fit: Fit, got: Phrase, voice: VoiceScope): number {
  const ms = MOVES.mega.dur;
  show(async signal => {
    const scoped = createVoiceScope(signal);
    void scoped.say('Wow!');
    await jump(stage, stageEl, 'mega', fit, scoped, () => finale(got, scoped));
  }, voice);
  return ms;
}
