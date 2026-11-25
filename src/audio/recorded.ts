/// <reference path="./voice-packs.d.ts" />
import voicePacks from 'virtual:voice-packs';
import type { PlaybackControls } from '../voice/playback';
import { audio } from './context';
import { packedClips } from './packs';

const clip = packedClips(voicePacks);

export const recordedAudio: PlaybackControls<AudioBuffer> = {
  async load(file) {
    const bytes = await clip(file);
    return bytes && audio().decodeAudioData(bytes);
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
