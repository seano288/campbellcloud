// The trip's sounds, made in code with Web Audio like the rest of the family's effects (src/audio/sfx.ts). Two run the whole time:
// the rocket's roar through the flight, louder and deeper with each Engine Rung, and the rover's motor on the planet, which revs
// with his speed. The rest are one-shots: the countdown beeps, touching down, a lava sizzle, a Jump Booster puff.
//
// A running sound is turned up and down every frame by the canvas loop. It goes quiet while the page is hidden (the loop stops
// then, so nothing would turn it down) and fades out when stopped, so leaving the screen never cuts it off with a click.
import { audio } from '../../audio/context';
import { noise, tone } from '../../audio/sfx';

export interface Running {
  /** `level` 0 to 1; `pitch` 0 to 1. */
  set(level: number, pitch?: number): void;
  stop(): void;
}
const SILENT: Running = { set() {}, stop() {} };

let noiseBuffer: AudioBuffer | null = null;
function loopedNoise(c: AudioContext) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== c.sampleRate) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const ch = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuffer;
  s.loop = true;
  return s;
}

/** A sound that runs until stopped: `voices` are wired into `out`, and `tune` moves them with the level and pitch. */
function running(build: (c: AudioContext, out: GainNode) => { sources: AudioScheduledSourceNode[]; tune(level: number, pitch: number, at: number): void }, loudest: number): Running {
  try {
    const c = audio(), out = c.createGain();
    out.gain.value = 0;
    out.connect(c.destination);
    const { sources, tune } = build(c, out);
    for (const s of sources) s.start();
    let level = 0, stopped = false;
    const apply = () => out.gain.setTargetAtTime(document.hidden ? 0 : level * loudest, c.currentTime, .08);
    const seen = () => { if (!stopped) apply(); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(next, pitch = next) {
        if (stopped) return;
        const l = Math.max(0, Math.min(1, next));
        if (Math.abs(l - level) > .01 || l === 0) { level = l; apply(); }
        tune(l, Math.max(0, Math.min(1, pitch)), c.currentTime);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.cancelScheduledValues(c.currentTime);
        out.gain.setTargetAtTime(0, c.currentTime, .12);
        for (const s of sources) { try { s.stop(c.currentTime + .8); } catch { /* already stopped */ } }
        setTimeout(() => out.disconnect(), 1000);
      },
    };
  } catch { return SILENT; } // no audio: play on silently
}

/** How big an Engine sounds: a full step for each of the first three Rungs, then smaller steps, so Hyper Drive is the biggest
 * without getting painfully loud or so deep a speaker can't play it. */
const heft = (rung: number) => Math.min(rung, 3) + Math.max(0, rung - 3) * .35;

/** The rocket's roar, by Engine Rung (0 Puff to 6 Hyper Drive): a rushing flame over a deep rumble. */
export function rocketRoar(engineRung: number): Running {
  const rung = heft(engineRung);
  return running((c, out) => {
    const hiss = loopedNoise(c), flame = c.createBiquadFilter(), hissGain = c.createGain();
    flame.type = 'lowpass'; flame.frequency.value = 400; flame.Q.value = .7;
    hissGain.gain.value = .9;
    hiss.connect(flame).connect(hissGain).connect(out);
    const rumble = c.createOscillator(), body = c.createBiquadFilter(), rumbleGain = c.createGain();
    rumble.type = 'sawtooth'; rumble.frequency.value = 50 - rung * 4;
    body.type = 'lowpass'; body.frequency.value = 160;
    rumbleGain.gain.value = .5 + rung * .12;
    rumble.connect(body).connect(rumbleGain).connect(out);
    return {
      sources: [hiss, rumble],
      tune(level, pitch, at) {
        flame.frequency.setTargetAtTime(300 + level * (500 + rung * 220) + pitch * 300, at, .1);
        rumble.frequency.setTargetAtTime((50 - rung * 4) * (.85 + pitch * .35), at, .15);
      },
    };
  }, .2 + rung * .03);
}

/** The rover's electric motor: a hum that rises with his speed, and revs up when the wheels leave the ground. */
export function roverMotor(): Running {
  return running((c, out) => {
    const hum = c.createOscillator(), whine = c.createOscillator(), soft = c.createBiquadFilter(), whineGain = c.createGain();
    hum.type = 'square'; hum.frequency.value = 55;
    whine.type = 'triangle'; whine.frequency.value = 220;
    soft.type = 'lowpass'; soft.frequency.value = 500;
    whineGain.gain.value = .35;
    hum.connect(soft).connect(out);
    whine.connect(whineGain).connect(out);
    return {
      sources: [hum, whine],
      tune(_level, pitch, at) {
        hum.frequency.setTargetAtTime(55 + pitch * 75, at, .06);
        whine.frequency.setTargetAtTime(220 + pitch * 520, at, .06);
        soft.frequency.setTargetAtTime(450 + pitch * 900, at, .06);
      },
    };
  }, .09);
}

/** One beat of the countdown, higher as it gets closer: 3, 2, 1. */
export const countBeep = (n: number) => { tone(520 + (3 - n) * 140, .18, 'square', 0, .07); tone(70, .3, 'sine', 0, .3, 45); };
/** Ignition: a crackle as the engine lights. */
export const ignition = () => { noise({ dur: .6, vol: .4, type: 'bandpass', f: 600, f2: 2400 }); tone(90, .7, 'sawtooth', 0, .12, 40); };
/** A rock bounces off the rocket: a clunk with a little rattle. */
export const clunk = () => { tone(140, .25, 'square', 0, .1, 60); noise({ dur: .25, vol: .3, f: 700 }); };
/** The rocket settles on the planet. */
export const touchdown = () => { tone(70, .4, 'sine', 0, .4, 40); noise({ dur: .5, vol: .3, f: 350 }); };
/** The rover lands from a jump: a soft bump, bigger after a big fall. */
export const landing = (speed: number) => { const k = Math.min(1, speed / 700); tone(95, .16, 'sine', 0, .1 + k * .2, 55); };
/** Lava under the wheels: a hiss and a hop. */
export const sizzle = () => { noise({ dur: .45, vol: .28, type: 'highpass', f: 2500 }); tone(300, .3, 'sine', 0, .14, 900); };
/** The Jump Booster fires in mid-air. */
export const boost = () => { noise({ dur: .3, vol: .3, type: 'bandpass', f: 500, f2: 2800 }); tone(330, .25, 'triangle', 0, .1, 880); };

/** Trying an Engine at the Space Base: a short burst of its roar. */
export function engineTest(engineRung: number) {
  const rung = heft(engineRung);
  noise({ dur: .9 + rung * .2, vol: .3 + rung * .06, f: 700 + rung * 300 });
  tone(52 - rung * 4, .9 + rung * .2, 'sawtooth', 0, .14 + rung * .03, 38);
  if (rung >= 2) noise({ dur: .5, vol: .2, type: 'bandpass', f: 400, f2: 3500 });
}
