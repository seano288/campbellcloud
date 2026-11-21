// The Race's sounds and the fifteen horns, made in code with Web Audio like the family's other effects (src/audio/sfx.ts). The engine runs
// the whole race and revs with his speed (deeper and louder with a bigger Engine); the rest are one-shots: the countdown beeps, a bump
// off a wall or a car, a boost's whoosh, the crowd at the finish. The engine goes quiet while the page is hidden and fades out when
// stopped, so leaving the screen never cuts it off with a click. (Rover Code's trip sounds are the pattern; they're copied, not imported.)
import { audio } from '../../audio/context';
import { noise, sCheer, sWhoosh, tone } from '../../audio/sfx';

export interface Engine {
  /** `speed` 0 to 1 of the fastest a car goes. */
  set(speed: number): void;
  stop(): void;
}
const QUIET: Engine = { set() {}, stop() {} };

/** The engine note: a saw and a square a fifth up through a filter that opens with speed. `size` 0 to 1 is the Engine's Rung. */
export function engineSound(size: number): Engine {
  try {
    const c = audio(), out = c.createGain(), filter = c.createBiquadFilter(), saw = c.createOscillator(), sq = c.createOscillator();
    out.gain.value = 0; filter.type = 'lowpass'; filter.frequency.value = 300; saw.type = 'sawtooth'; sq.type = 'square';
    saw.connect(filter); sq.connect(filter); filter.connect(out).connect(c.destination);
    saw.start(); sq.start();
    let stopped = false, level = 0;
    const base = 52 - size * 18, loud = .05 + size * .04;
    const seen = () => { if (!stopped) out.gain.setTargetAtTime(document.hidden ? 0 : level, c.currentTime, .08); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(speed) {
        if (stopped) return;
        const s = Math.max(0, Math.min(1, speed)), t = c.currentTime, f = base + s * (150 + size * 40);
        saw.frequency.setTargetAtTime(f, t, .06); sq.frequency.setTargetAtTime(f * 1.5, t, .06);
        filter.frequency.setTargetAtTime(260 + s * 1600, t, .08);
        level = loud * (.35 + s * .65);
        out.gain.setTargetAtTime(document.hidden ? 0 : level, t, .08);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.setTargetAtTime(0, c.currentTime, .05);
        setTimeout(() => { try { saw.stop(); sq.stop(); } catch { /* already stopped */ } out.disconnect(); }, 300);
      },
    };
  } catch { return QUIET; }
}

export const countBeep = (last: boolean) => tone(last ? 880 : 440, last ? .5 : .2, 'square', 0, .1);
export const wallBump = (hard: number) => { noise({ dur: .18, vol: .25 + hard * .3, f: 500 }); tone(90, .2, 'sine', 0, .25 * hard + .1, 50); };
export const carBump = () => { tone(180, .12, 'square', 0, .08, 120); noise({ dur: .1, vol: .2, type: 'highpass', f: 1200 }); };
export const boostSound = () => { sWhoosh(.9); tone(140, .8, 'sawtooth', 0, .08, 420); };
export const finishCheer = () => sCheer();
export const passPing = () => { tone(988, .1, 'triangle', 0, .08); tone(1319, .16, 'triangle', .08, .08); };

/** The fifteen horns, by the Horn part's `sound`. */
export const HORN_SOUNDS: readonly (() => void)[] = [
  () => tone(880, .18, 'square', 0, .14), // beep
  () => { tone(392, .45, 'sawtooth', 0, .12); tone(494, .45, 'sawtooth', 0, .12); }, // honk
  () => { for (const w of [0, .18]) { tone(2100, .5, 'sine', w, .08); tone(2640, .45, 'sine', w, .05); } }, // bike bell
  () => { tone(600, .15, 'sawtooth', 0, .1, 380); tone(620, .18, 'sawtooth', .2, .1, 360); }, // duck
  () => { tone(233, 1, 'sawtooth', 0, .13); tone(311, 1, 'sawtooth', 0, .13); tone(370, 1, 'sawtooth', 0, .08); }, // air horn
  () => { tone(520, .12, 'square', 0, .1, 900); tone(900, .14, 'square', .14, .1, 480); }, // clown
  () => { for (const w of [0, .7]) for (const f of [185, 233, 277, 370]) tone(f, w ? 1.1 : .5, 'sawtooth', w, .07); }, // train
  () => { for (const k of [0, .45, .9]) { tone(700, .45, 'sawtooth', k, .06, 1300); } }, // siren
  () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', i * .13, .08)), // tune
  () => { tone(98, 1.1, 'sawtooth', 0, .18); tone(147, 1.1, 'sawtooth', 0, .12); noise({ dur: 1, vol: .12, f: 400 }); }, // big rig
  () => { // lion roar: a growl that swells, then a low roar sliding down, rough with noise
    noise({ dur: .35, vol: .14, f: 380, beat: .03, grow: true });
    tone(150, 1.1, 'sawtooth', .2, .2, 62); tone(112, 1.1, 'square', .2, .07, 48); tone(225, .8, 'sawtooth', .2, .05, 90);
    noise({ dur: 1.1, vol: .24, type: 'bandpass', f: 520, f2: 180, when: .2, beat: .028 });
  },
  () => { for (const [k, w] of [[1, 0], [.85, .2], [.7, .4]] as const) { tone(2400 * k, .18, 'square', w, .06, 260); tone(1800 * k, .18, 'sine', w, .08, 200); } }, // laser: pew pew pew
  () => { for (let i = 0; i < 6; i++) tone(i % 2 ? 1500 : 700, .2, 'square', i * .2, .055, i % 2 ? 700 : 1500); }, // car alarm: whoop-whoop
  () => { // fanfare: ta-ta-ta-taaa, brassy (a saw and a square together)
    [392, 523, 659].forEach((f, i) => { tone(f, .13, 'sawtooth', i * .13, .09); tone(f, .13, 'square', i * .13, .04); });
    for (const f of [784, 988]) { tone(f, .75, 'sawtooth', .39, .08); tone(f * 1.003, .75, 'square', .39, .03); }
  },
  () => { // mystery: a spooky theremin wobble that climbs, then a sparkle
    for (let i = 0; i < 8; i++) { const f = 330 * Math.pow(1.09, i); tone(f, .2, 'sine', i * .13, .09, f * (i % 2 ? .9 : 1.14)); tone(f / 2, .2, 'triangle', i * .13, .03); }
    tone(1568, .5, 'triangle', 1.05, .06); tone(2093, .5, 'sine', 1.12, .04);
  },
];
export const honk = (sound: number) => HORN_SOUNDS[Math.max(0, Math.min(HORN_SOUNDS.length - 1, sound))]!();
