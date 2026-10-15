import type { Page } from 'playwright';

interface VoiceEvent {
  kind: 'start' | 'stop' | 'end';
  id: number;
  running: boolean;
  audible: boolean;
  duration: number;
}

export async function observeRecordedVoice(page: Page) {
  const events: VoiceEvent[] = [];
  await page.exposeFunction('recordedVoiceEvent', (event: VoiceEvent) => { events.push(event); });
  await page.evaluate(() => {
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
  });
  return events;
}
