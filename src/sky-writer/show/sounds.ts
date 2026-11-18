// The Show's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts), no files. The plane's propeller
// drone runs the whole Show and rises with its speed (the pattern is Rover Code's running sounds, copied, not imported); the rest are
// one-shots: a chime through a ring, a soft bonk off a cloud, a boing off the Bubble Shield, a whoosh for a trick.
import { audio } from '../../audio/context';
import { noise, tone } from '../../audio/sfx';

export interface Drone { set(level: number, pitch: number): void; stop(): void }
const SILENT: Drone = { set() {}, stop() {} };

/** The propeller's buzz: a low sawtooth through a soft filter, a little higher for a faster plane. */
export function propDrone(): Drone {
  try {
    const c = audio(), out = c.createGain(), osc = c.createOscillator(), osc2 = c.createOscillator(), lp = c.createBiquadFilter();
    out.gain.value = 0; out.connect(c.destination);
    osc.type = 'sawtooth'; osc.frequency.value = 80; osc2.type = 'square'; osc2.frequency.value = 40;
    lp.type = 'lowpass'; lp.frequency.value = 500;
    const g2 = c.createGain(); g2.gain.value = 0.3;
    osc.connect(lp); osc2.connect(g2).connect(lp); lp.connect(out);
    osc.start(); osc2.start();
    let stopped = false;
    const seen = () => { if (!stopped && document.hidden) out.gain.setTargetAtTime(0, c.currentTime, 0.05); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(level, pitch) {
        if (stopped) return;
        out.gain.setTargetAtTime(document.hidden ? 0 : Math.max(0, Math.min(1, level)) * 0.05, c.currentTime, 0.1);
        osc.frequency.setTargetAtTime(70 + pitch * 70, c.currentTime, 0.1);
        osc2.frequency.setTargetAtTime(35 + pitch * 35, c.currentTime, 0.1);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.setTargetAtTime(0, c.currentTime, 0.12);
        try { osc.stop(c.currentTime + 0.8); osc2.stop(c.currentTime + 0.8); } catch { /* already stopped */ }
        setTimeout(() => out.disconnect(), 1000);
      },
    };
  } catch { return SILENT; }
}

export const sRing = (n: number) => { tone(660 + n * 40, 0.12, 'triangle', 0, 0.12); tone(990 + n * 60, 0.25, 'triangle', 0.08, 0.1); };
export const sBonk = () => { tone(180, 0.2, 'sine', 0, 0.2, 120); noise({ dur: 0.15, vol: 0.15, f: 600 }); };
export const sBoingShield = () => tone(300, 0.3, 'sine', 0, 0.18, 900);
export const sTrick = () => noise({ dur: 0.7, vol: 0.25, type: 'bandpass', f: 500, f2: 2500 });
export const sTakeoff = () => { noise({ dur: 1.2, vol: 0.25, type: 'bandpass', f: 300, f2: 1500, grow: true }); tone(90, 1.2, 'sawtooth', 0, 0.06, 160); };
