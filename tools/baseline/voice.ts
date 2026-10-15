import type { Page } from 'playwright';

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
