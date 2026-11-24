// The Mission's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts). The engine runs the whole Mission
// and rises with the catapult and the speed (a jet hisses, a propeller or rotor buzzes); the rest are one-shots: the catapult's whoosh, a
// ring's ping, the crate's splash, the winch, a gust, and the wire catching. Jetway's Flight sounds are the pattern, copied, not imported.
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
        level = .02 + p * .04;
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

export const catapultSound = (power: number) => { sWhoosh(.6 + power * .4); noise({ dur: .5, vol: .2 + power * .2, type: 'highpass', f: 1200 }); };
export const ping = (i: number) => { tone(880 + (i % 5) * 110, .12, 'triangle', 0, .09); tone(1320 + (i % 5) * 110, .14, 'triangle', .06, .06); };
export const gustSound = () => noise({ dur: .7, vol: .1, type: 'bandpass', f: 500, f2: 1400 });
export const splash = () => noise({ dur: .6, vol: .22, type: 'highpass', f: 1500 });
export const winchSound = () => tone(220, .5, 'square', 0, .04, 330);
export const lightPing = () => tone(1568, .06, 'sine', 0, .05);
/** The hook catches the wire: a thud and the wire's twang, and a chime for the wire he aimed for. */
export const wireCatch = (grade: number) => { noise({ dur: .25, vol: .3, f: 400 }); tone(110, .4, 'sawtooth', 0, .08, 60); if (grade === 3) setTimeout(sChime, 300); };
export const cheer = () => sCheer();
