// The fight's sound, made in code through the shared audio context, so it obeys the same wake logic as the voice. The drum's whine
// and the crowd are long notes that follow the fight; hits are short bursts of noise and a thump. Everything stops with the signal.
import { audio } from '../../audio/context';

export interface FightSound {
  /** The drum's speed, 0 to 1, each frame. */
  drum(speed: number): void;
  /** A hit, 0 to 1 as hard as it gets. */
  impact(strength: number, heavy?: boolean): void;
  /** A panel or wheel coming away. */
  clatter(): void;
  /** The crowd rises to this, then settles. */
  crowd(level: number): void;
}

const silent: FightSound = { drum() {}, impact() {}, clatter() {}, crowd() {} };

export function createFightSound(signal: AbortSignal): FightSound {
  try {
    const c = audio(), out = c.createGain();
    out.gain.value = .9;
    out.connect(c.destination);
    // two seconds of noise, shared by the crowd and every hit
    const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const voices: AudioScheduledSourceNode[] = [];
    const held = (n: AudioScheduledSourceNode) => { n.start(); voices.push(n); return n; };

    // ---------- the drum: a saw and a square a fifth up, through a filter that opens with speed ----------
    const whine = c.createGain(), tone = c.createBiquadFilter(), saw = c.createOscillator(), buzz = c.createOscillator();
    whine.gain.value = 0; tone.type = 'lowpass'; tone.frequency.value = 400; saw.type = 'sawtooth'; buzz.type = 'square';
    saw.connect(tone); buzz.connect(tone); tone.connect(whine).connect(out);
    held(saw); held(buzz);

    // ---------- the crowd: band-passed noise with a slow swell ----------
    const room = c.createBufferSource(), band = c.createBiquadFilter(), crowdGain = c.createGain(), sway = c.createOscillator(), swayBy = c.createGain();
    room.buffer = noise; room.loop = true; band.type = 'bandpass'; band.frequency.value = 900; band.Q.value = .6;
    sway.frequency.value = .23; swayBy.gain.value = .012; crowdGain.gain.value = .03;
    room.connect(band).connect(crowdGain).connect(out); sway.connect(swayBy).connect(crowdGain.gain);
    held(room); held(sway);

    const away = () => { out.gain.setTargetAtTime(document.hidden ? 0 : .9, c.currentTime, .05); };
    document.addEventListener('visibilitychange', away);
    signal.addEventListener('abort', () => {
      document.removeEventListener('visibilitychange', away);
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setTargetAtTime(0, c.currentTime, .03); // no click
      setTimeout(() => {
        for (const v of voices) { try { v.stop(); } catch { /* already stopped */ } }
        out.disconnect();
      }, 200);
    }, { once: true });

    const burst = (when: number, dur: number, vol: number, type: BiquadFilterType, freq: number) => {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = noise; f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.001, when + dur);
      s.connect(f).connect(g).connect(out);
      s.start(when, Math.random() * 1.5, dur + .05);
    };
    const thump = (when: number, dur: number, vol: number, from: number, to: number) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(from, when); o.frequency.exponentialRampToValueAtTime(to, when + dur);
      g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.001, when + dur);
      o.connect(g).connect(out); o.start(when); o.stop(when + dur + .05);
    };
    const ring = (when: number, f: number, dur: number, vol: number) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.001, when + dur);
      o.connect(g).connect(out); o.start(when); o.stop(when + dur + .05);
    };

    return {
      drum(speed) {
        const t = c.currentTime, f = 45 + speed * 230;
        saw.frequency.setTargetAtTime(f, t, .08); buzz.frequency.setTargetAtTime(f * 1.5, t, .08);
        tone.frequency.setTargetAtTime(300 + speed * 2200, t, .08);
        whine.gain.setTargetAtTime(speed * speed * .09, t, .08);
      },
      impact(strength, heavy = false) {
        const t = c.currentTime + .005, k = Math.max(.25, Math.min(1, strength));
        burst(t, .12 + k * .22, .55 * k, 'highpass', heavy ? 700 : 1400);
        thump(t, heavy ? .4 : .22, .85 * k, heavy ? 150 : 210, heavy ? 36 : 60);
        for (const f of [730, 1270, 2110]) ring(t, f * (.9 + Math.random() * .2), .25 + k * .4, .07 * k);
      },
      clatter() {
        const t = c.currentTime;
        for (let i = 0; i < 4; i++) { ring(t + i * .09, 900 + Math.random() * 1400, .16, .1); burst(t + i * .09, .06, .18, 'bandpass', 3200); }
      },
      crowd(level) {
        const t = c.currentTime;
        crowdGain.gain.cancelScheduledValues(t);
        crowdGain.gain.setTargetAtTime(.03 + level * .22, t, .08);
        crowdGain.gain.setTargetAtTime(.03, t + .9, .9);
      },
    };
  } catch { return silent; } // no audio: the fight plays on silently
}
