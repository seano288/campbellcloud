// The Flight's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts). The engine runs the whole Flight
// and rises with the throttle and speed (a jet hisses, a propeller buzzes); the rest are one-shots: a star's ping, a gust, the touchdown,
// the water drop, the supersonic boom. Turbo Tally's race sounds are the pattern, copied, not imported.
import { audio } from '../../audio/context';
import { noise, sChime, sCheer, sWhoosh, tone } from '../../audio/sfx';

export interface Engine { set(power: number): void; stop(): void }
const QUIET: Engine = { set() {}, stop() {} };

export function engineSound(jet: boolean): Engine {
  try {
    const c = audio(), out = c.createGain(), filter = c.createBiquadFilter(), osc = c.createOscillator();
    out.gain.value = 0; filter.type = jet ? 'bandpass' : 'lowpass'; filter.frequency.value = jet ? 900 : 400; osc.type = jet ? 'sawtooth' : 'square';
    osc.connect(filter); filter.connect(out).connect(c.destination); osc.start();
    let stopped = false, level = 0;
    const seen = () => { if (!stopped) out.gain.setTargetAtTime(document.hidden ? 0 : level, c.currentTime, .08); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(power) {
        if (stopped) return;
        const p = Math.max(0, Math.min(1, power)), t = c.currentTime;
        osc.frequency.setTargetAtTime((jet ? 90 : 60) + p * (jet ? 160 : 90), t, .1);
        filter.frequency.setTargetAtTime((jet ? 700 : 300) + p * 1400, t, .1);
        level = .025 + p * .045;
        out.gain.setTargetAtTime(document.hidden ? 0 : level, t, .1);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.setTargetAtTime(0, c.currentTime, .05);
        setTimeout(() => { try { osc.stop(); } catch { /* stopped */ } out.disconnect(); }, 300);
      },
    };
  } catch { return QUIET; }
}

export const starPing = (i: number) => { tone(880 + (i % 5) * 110, .12, 'triangle', 0, .09); tone(1320 + (i % 5) * 110, .14, 'triangle', .06, .06); };
export const gustSound = () => noise({ dur: .7, vol: .12, type: 'bandpass', f: 500, f2: 1400 });
export const touchdown = (grade: number) => { noise({ dur: .25, vol: .3, f: 400 }); tone(80, .3, 'sine', 0, .2, 50); if (grade === 3) setTimeout(sChime, 250); };
export const splash = () => { sWhoosh(.5); noise({ dur: .6, vol: .25, type: 'highpass', f: 1800 }); };
export const boom = () => { tone(60, .6, 'sine', 0, .35, 30); noise({ dur: .5, vol: .4, f: 300 }); };
export const lightPing = () => tone(1568, .06, 'sine', 0, .05);
export const cheer = () => sCheer();
