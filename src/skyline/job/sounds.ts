// The Job's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts). The motor hums the whole Job and
// rises with his speed (a helicopter's rotor chops instead); the rest are one-shots: a ding when people get on, a soft bump, a horn.
// The motor goes quiet while the page is hidden and fades out when stopped. (Turbo Tally's race sounds are the pattern; copied, not
// imported.)
import { audio } from '../../audio/context';
import { noise, tone } from '../../audio/sfx';

export interface Motor { set(speed: number): void; stop(): void }
const QUIET: Motor = { set() {}, stop() {} };

export function motorSound(rotor: boolean): Motor {
  try {
    const c = audio(), out = c.createGain(), filter = c.createBiquadFilter(), osc = c.createOscillator(), lfo = c.createOscillator(), lfoGain = c.createGain();
    out.gain.value = 0; filter.type = 'lowpass'; filter.frequency.value = 400; osc.type = rotor ? 'square' : 'sawtooth';
    osc.frequency.value = rotor ? 60 : 70;
    lfo.frequency.value = rotor ? 14 : 0.1; lfoGain.gain.value = rotor ? .5 : 0;
    lfo.connect(lfoGain).connect(out.gain);
    osc.connect(filter).connect(out).connect(c.destination);
    osc.start(); lfo.start();
    let stopped = false, level = 0;
    const seen = () => { if (!stopped) out.gain.setTargetAtTime(document.hidden ? 0 : level, c.currentTime, .08); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(speed) {
        if (stopped) return;
        const s = Math.max(0, Math.min(1, speed)), t = c.currentTime;
        osc.frequency.setTargetAtTime((rotor ? 55 : 62) + s * 70, t, .08);
        filter.frequency.setTargetAtTime(300 + s * 900, t, .1);
        level = .035 + s * .04;
        out.gain.setTargetAtTime(document.hidden ? 0 : level, t, .08);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.setTargetAtTime(0, c.currentTime, .05);
        setTimeout(() => { try { osc.stop(); lfo.stop(); } catch { /* already stopped */ } out.disconnect(); }, 300);
      },
    };
  } catch { return QUIET; }
}

export const sDing = () => { tone(988, .12, 'triangle', 0, .12); tone(1319, .2, 'triangle', .1, .1); };
export const sBump = (hard: boolean) => { tone(hard ? 90 : 120, .18, 'sine', 0, hard ? .3 : .18, 50); noise({ dur: .12, vol: hard ? .25 : .12, f: 500 }); };
export const sHorn = () => { tone(330, .25, 'square', 0, .06); tone(415, .25, 'square', 0, .05); };
