// Purrdoku's sound effects, made in code (see audio/sfx), under the same mute switch as the narrator.
import { noise, sBigFanfare, tone } from '../audio/sfx';
import { muted } from './voice';

const unlessMuted = (effect: () => void) => () => { if (!muted.peek()) effect(); };

export const sound = {
  /** a ✕ marked: "tschk", a click, a short hiss and a stop */
  cross: unlessMuted(() => {
    tone(2400, 0.012, 'square', 0, 0.04);
    noise({ dur: 0.07, vol: 0.3, type: 'highpass', f: 4500, f2: 2500 });
    noise({ dur: 0.025, vol: 0.25, type: 'bandpass', f: 1400, when: 0.065 });
  }),
  /** a right cat: a quick rising sparkle */
  cat: unlessMuted(() => [784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.06, 0.11))),
  /** a wrong cat: a low bonk */
  wrong: unlessMuted(() => tone(220, 0.25, 'square', 0, 0.07, 140)),
  /** the board solved: a fanfare */
  won: unlessMuted(sBigFanfare),
};
