import type { PlaybackControls } from '../voice/playback';
import { audio } from './context';

export const recordedAudio: PlaybackControls<AudioBuffer> = {
  async load(file) {
    const response = await fetch(`./voice/${file}`);
    if (!response.ok) return null;
    return audio().decodeAudioData(await response.arrayBuffer());
  },
  play(buffer) {
    const context = audio(), source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    let release!: () => void;
    const done = new Promise<void>(resolve => { release = resolve; });
    source.onended = () => { source.disconnect(); release(); };
    try { source.start(); } catch (error) { source.disconnect(); throw error; }
    return {
      done,
      stop() {
        source.onended = null;
        try { source.stop(); } catch { /* already stopped */ }
        source.disconnect();
        release();
      },
    };
  },
};
