// The Jump's sounds, made in code with Web Audio like the family's other effects (src/audio/sfx.ts): the engine's rumble, rising with
// the pedal; a whoosh for the booster; a tick as the tape rolls out. Globe Hopper's Launch sounds are the pattern, copied.
import { audio } from '../../audio/context';
import { sWhoosh, tone } from '../../audio/sfx';

export interface Engine { set(power: number): void; stop(): void }
const QUIET: Engine = { set() {}, stop() {} };

export function engineSound(): Engine {
  try {
    const c = audio(), out = c.createGain(), filter = c.createBiquadFilter(), src = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    src.buffer = buf; src.loop = true;
    out.gain.value = 0; filter.type = 'lowpass'; filter.frequency.value = 200;
    src.connect(filter); filter.connect(out).connect(c.destination); src.start();
    let stopped = false, level = 0;
    const seen = () => { if (!stopped) out.gain.setTargetAtTime(document.hidden ? 0 : level, c.currentTime, .08); };
    document.addEventListener('visibilitychange', seen);
    return {
      set(power) {
        if (stopped) return;
        const p = Math.max(0, Math.min(1, power)), t = c.currentTime;
        filter.frequency.setTargetAtTime(180 + p * 700, t, .15);
        level = p * .16;
        out.gain.setTargetAtTime(document.hidden ? 0 : level, t, .15);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        document.removeEventListener('visibilitychange', seen);
        out.gain.setTargetAtTime(0, c.currentTime, .1);
        setTimeout(() => { try { src.stop(); } catch { /* stopped */ } out.disconnect(); }, 500);
      },
    };
  } catch { return QUIET; }
}
export const boostSound = () => { sWhoosh(.6); tone(200, .5, 'sawtooth', 0, .07, 600); };
export const tapeTick = () => tone(1400, .03, 'square', 0, .04);
