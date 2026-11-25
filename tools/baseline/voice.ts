import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright';
import { moneyBuild } from '../money-build';

export interface VoiceEvent {
  kind: 'start' | 'stop' | 'end';
  id: number;
  running: boolean;
  audible: boolean;
  duration: number;
}

// Observes recorded playback in the current document and every later one (reloads and relaunches in the same
// page). Ids stay unique across documents.
const IDS_PER_DOCUMENT = 1_000_000;

export async function observeRecordedVoice(page: Page) {
  const events: VoiceEvent[] = [];
  let documents = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) documents++; });
  await page.exposeFunction('recordedVoiceEvent', (event: VoiceEvent) => { events.push({ ...event, id: documents * IDS_PER_DOCUMENT + event.id }); });
  const instrument = () => {
    const report: (event: VoiceEvent) => Promise<void> = Reflect.get(window, 'recordedVoiceEvent');
    const decoded = new WeakMap<AudioBuffer, { audible: boolean; duration: number }>();
    const sources = new WeakMap<AudioBufferSourceNode, number>();
    let nextId = 0;
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (data) {
      return decode.call(this, data).then(buffer => {
        decoded.set(buffer, { duration: buffer.duration, audible: buffer.getChannelData(0).some(sample => Math.abs(sample) > 0.001) });
        return buffer;
      });
    };
    const probe = {
      emit(kind: VoiceEvent['kind'], source: AudioBufferSourceNode, id: number) {
        const clip = source.buffer && decoded.get(source.buffer);
        if (clip) void report({ kind, id, running: source.context.state === 'running', ...clip });
      },
    };
    const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      start.apply(this, args);
      if (!this.buffer || !decoded.has(this.buffer)) return;
      const id = ++nextId;
      sources.set(this, id);
      probe.emit('start', this, id);
      this.addEventListener('ended', () => probe.emit('end', this, id), { once: true });
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      stop.apply(this, args);
      const id = sources.get(this);
      if (id) probe.emit('stop', this, id);
    };
  };
  await page.addInitScript(instrument);
  await page.evaluate(instrument);
  return events;
}

// A clip that started in a running audio context with audible samples and played to its end.
export const playedToEnd = (events: readonly VoiceEvent[], start: VoiceEvent) =>
  start.kind === 'start' && start.running && start.audible && start.duration > 0 &&
  events.some(end => end.kind === 'end' && end.id === start.id);

/** A money clip's bytes, as the page decodes them, for picking that clip out in decodeAudioData. */
export const clipBytes = (file: string) => readFileSync(resolve(moneyBuild.voice.root, file)).toString('base64');

let holds = 0;

// Holds one recorded clip from loading until `held` settles, telling `requested` when the game asks for it. The voice
// comes packed, a few files a game (tools/voice-packs.ts), so a clip can't be held by its URL: it is held at its
// decode instead, which happens once each time the game loads the clip, as its fetch used to.
export async function holdClip(page: Page, file: string, held: Promise<unknown>, requested: () => void = () => {}) {
  const name = `heldClip${++holds}`;
  await page.exposeFunction(name, async () => { requested(); await held; });
  const hold = ({ name, bytes }: { name: string; bytes: string }) => {
    const clip = Uint8Array.from(atob(bytes), c => c.charCodeAt(0));
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (data, ...rest) {
      const view = new Uint8Array(data);
      if (view.length !== clip.length || view.some((b, i) => b !== clip[i])) return decode.call(this, data, ...rest);
      const wait: () => Promise<void> = Reflect.get(window, name);
      return wait().then(() => decode.call(this, data, ...rest));
    };
  };
  const bytes = clipBytes(file);
  await page.addInitScript(hold, { name, bytes });
  await page.evaluate(hold, { name, bytes });
}
