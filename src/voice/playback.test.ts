import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createPlayback } from './playback';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const PHRASES = ['Hello', 'Next', 'Done'] as const;

function recording(load: (file: string) => Promise<string | null> = async file => file) {
  const sounds: { clip: string; stopped: boolean; finish(): void; fail(): void }[] = [];
  const playback = createPlayback({
    phrases: PHRASES, clips: { Hello: 'hello.mp3', Next: 'next.mp3', Done: 'done.mp3' }, load,
    play(clip) {
      const ended = deferred<void>();
      const sound = { clip, stopped: false, finish: () => ended.resolve(), fail: () => ended.reject(new Error('Audio failed')) };
      sounds.push(sound);
      return { done: ended.promise, stop: () => { sound.stopped = true; } };
    },
  });
  return { playback, sounds };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const tick = () => vi.advanceTimersByTimeAsync(0);

describe('selected recorded playback', () => {
  it('plays selected phrases in order and lights the whole spoken group until completion', async () => {
    const { playback, sounds } = recording();
    const voice = playback.scope();
    let complete = false;
    const said = voice.say({ parts: ['Hello', 'Next'], light: 'greeting' }).then(() => { complete = true; });
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3']);
    expect(playback.speaking.value).toBe('greeting');
    expect(complete).toBe(false);
    sounds[0]!.finish();
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3', 'next.mp3']);
    expect(playback.speaking.value).toBe('greeting');
    sounds[1]!.finish();
    await said;
    expect(complete).toBe(true);
    expect(playback.speaking.value).toBeNull();
  });

  it('interrupts speech and releases its waiter without old completion clearing the new highlight', async () => {
    const { playback, sounds } = recording();
    const old = playback.scope();
    const next = playback.scope();
    const first = old.say({ parts: ['Hello', 'Done'], light: 'old' });
    await tick();
    const second = next.say({ parts: ['Next'], light: 'new' });
    await first;
    await tick();
    expect(sounds.map(s => [s.clip, s.stopped])).toEqual([['hello.mp3', true], ['next.mp3', false]]);
    sounds[0]!.finish();
    await tick();
    expect(playback.speaking.value).toBe('new');
    sounds[1]!.finish();
    await second;
    expect(playback.speaking.value).toBeNull();
  });

  it('appends speech behind current speech and completes each waiter at its own end', async () => {
    const { playback, sounds } = recording();
    const voice = playback.scope();
    let appendedDone = false;
    const first = voice.say('Hello');
    const appended = voice.sayMore({ parts: ['Next'], light: 'next' }).then(() => { appendedDone = true; });
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3']);
    sounds[0]!.finish();
    await first;
    await tick();
    expect(sounds.map(s => [s.clip, s.stopped])).toEqual([['hello.mp3', false], ['next.mp3', false]]);
    expect(appendedDone).toBe(false);
    expect(playback.speaking.value).toBe('next');
    sounds[1]!.finish();
    await appended;
    expect(appendedDone).toBe(true);
  });

  it('cancels only the owning scope, including its appended speech and later calls', async () => {
    const { playback, sounds } = recording();
    const old = playback.scope();
    const next = playback.scope();
    const first = old.say({ parts: ['Hello'], light: 'old' });
    const stale = old.sayMore('Done');
    const newer = next.sayMore({ parts: ['Next'], light: 'new' });
    await tick();
    old.cancel();
    await Promise.all([first, stale]);
    await tick();
    expect(old.active).toBe(false);
    expect(sounds.map(s => [s.clip, s.stopped])).toEqual([['hello.mp3', true], ['next.mp3', false]]);
    await old.say('Done');
    await old.sayMore('Done');
    old.cancel();
    sounds[0]!.finish();
    await tick();
    expect(playback.speaking.value).toBe('new');
    expect(sounds).toHaveLength(2);
    sounds[1]!.finish();
    await newer;
  });

  it('releases cancellation while a clip loads or decodes and ignores the late clip', async () => {
    const pending = deferred<string | null>();
    const { playback, sounds } = recording(file => file === 'hello.mp3' ? pending.promise : Promise.resolve(file));
    const old = playback.scope();
    const first = old.say({ parts: ['Hello'], light: 'old' });
    const appended = old.sayMore('Done');
    await tick();
    old.cancel();
    await Promise.all([first, appended]);
    expect(playback.speaking.value).toBeNull();
    const next = playback.scope();
    const said = next.say({ parts: ['Next'], light: 'new' });
    await tick();
    old.hush();
    pending.resolve('hello.mp3');
    await tick();
    expect(sounds.map(s => [s.clip, s.stopped])).toEqual([['next.mp3', false]]);
    expect(playback.speaking.value).toBe('new');
    sounds[0]!.finish();
    await said;
  });

  it('settles failed playback and continues appended work without stale highlighting', async () => {
    const { playback, sounds } = recording();
    const voice = playback.scope();
    const failed = voice.say({ parts: ['Hello', 'Done'], light: 'failed' });
    const next = voice.sayMore({ parts: ['Next'], light: 'next' });
    await tick();
    sounds[0]!.fail();
    await failed;
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3', 'next.mp3']);
    expect(playback.speaking.value).toBe('next');
    sounds[1]!.finish();
    await next;
  });

  it('preloads selected clips once and reuses them without starting speech', async () => {
    const loaded: string[] = [];
    const { playback, sounds } = recording(async file => { loaded.push(file); return file; });
    await playback.preload(['Hello', 'Next', 'Hello']);
    expect(loaded).toEqual(['hello.mp3', 'next.mp3']);
    expect(sounds).toEqual([]);
    expect(playback.speaking.value).toBeNull();
    const said = playback.scope().say('Hello');
    await tick();
    expect(loaded).toEqual(['hello.mp3', 'next.mp3']);
    sounds[0]!.finish();
    await said;
  });

  it('binds child playback and pending pauses to their originating lifetime', async () => {
    const { playback, sounds } = recording();
    const parent = playback.scope();
    const child = playback.scope(parent.signal);
    const said = child.say('Hello');
    const waited = child.wait(250);
    await tick();
    parent.cancel();
    await Promise.all([said, waited]);
    expect(child.active).toBe(false);
    expect(sounds[0]!.stopped).toBe(true);
    const late = playback.scope(parent.signal);
    await late.say('Next');
    await late.wait(1000);
    expect(late.active).toBe(false);
    expect(sounds).toHaveLength(1);
  });

  it('removes cancelled queued speech without stopping another scope', async () => {
    const { playback, sounds } = recording();
    const current = playback.scope(), queued = playback.scope();
    const first = current.say({ parts: ['Hello'], light: 'current' });
    const stale = queued.sayMore('Done');
    const next = current.sayMore('Next');
    await tick();
    queued.cancel();
    await stale;
    expect(sounds[0]!.stopped).toBe(false);
    expect(playback.speaking.value).toBe('current');
    sounds[0]!.finish();
    await first;
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3', 'next.mp3']);
    sounds[1]!.finish();
    await next;
  });

  it('interrupts current and appended waiters even while the current clip is pending', async () => {
    const pending = deferred<string | null>();
    const { playback, sounds } = recording(file => file === 'hello.mp3' ? pending.promise : Promise.resolve(file));
    const old = playback.scope(), next = playback.scope();
    const first = old.say('Hello'), appended = old.sayMore('Done');
    await tick();
    const said = next.say({ parts: ['Next'], light: 'new' });
    await Promise.all([first, appended]);
    pending.reject(new Error('Late decode failure'));
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['next.mp3']);
    expect(playback.speaking.value).toBe('new');
    sounds[0]!.finish();
    await said;
  });

  it.each(['load throw', 'load rejection', 'missing mapping', 'missing buffer', 'start throw', 'stop throw'])('settles %s without trapping the next speech', async failure => {
    const played: string[] = [];
    const playback = createPlayback({
      phrases: PHRASES, clips: failure === 'missing mapping' ? { Next: 'next.mp3' } : { Hello: 'hello.mp3', Next: 'next.mp3' },
      load(file) {
        if (file !== 'hello.mp3') return Promise.resolve(file);
        if (failure === 'load throw') throw new Error('Fetch failed');
        if (failure === 'load rejection') return Promise.reject(new Error('Decode failed'));
        return Promise.resolve(failure === 'missing buffer' ? null : file);
      },
      play(file) {
        if (file === 'hello.mp3' && failure === 'start throw') throw new Error('Cannot start audio');
        played.push(file);
        return {
          done: file === 'hello.mp3' ? new Promise<void>(() => {}) : Promise.resolve(),
          stop() { if (failure === 'stop throw') throw new Error('Already stopped'); },
        };
      },
    });
    const old = playback.scope();
    const failed = old.say({ parts: ['Hello'], light: 'failed' });
    await tick();
    if (failure === 'stop throw') old.cancel();
    await failed;
    old.cancel();
    await playback.scope().say('Next');
    expect(played.at(-1)).toBe('next.mp3');
    expect(playback.speaking.value).toBeNull();
  });

  it('keeps a pause pending for its requested duration when its scope stays active', async () => {
    const voice = recording().playback.scope();
    let complete = false;
    const pause = voice.wait(250).then(() => { complete = true; });
    await vi.advanceTimersByTimeAsync(249);
    expect(complete).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pause;
    expect(complete).toBe(true);
    expect(voice.active).toBe(true);
  });

  it('does not clear a newer highlight when observing the old highlight interrupts an empty group', async () => {
    const { playback, sounds } = recording();
    const old = playback.scope(), next = playback.scope();
    let newer = Promise.resolve();
    const unsubscribe = playback.speaking.subscribe(light => {
      if (light === 'old') newer = next.say({ parts: ['Next'], light: 'new' });
    });
    await old.say({ parts: [], light: 'old' });
    await tick();
    expect(playback.speaking.value).toBe('new');
    expect(sounds.map(s => s.clip)).toEqual(['next.mp3']);
    sounds[0]!.finish();
    await newer;
    unsubscribe();
  });

  it('cannot enqueue stale speech when interruption synchronously cancels its scope', async () => {
    const { playback, sounds } = recording();
    const old = playback.scope(), next = playback.scope();
    const first = old.say({ parts: ['Hello'], light: 'old' });
    await tick();
    let armed = true, replacement = Promise.resolve();
    const unsubscribe = playback.speaking.subscribe(light => {
      if (light !== null || !armed) return;
      armed = false;
      old.cancel();
      replacement = next.say({ parts: ['Next'], light: 'new' });
    });
    const stale = old.say({ parts: ['Done'], light: 'stale' });
    await first;
    await tick();
    expect(old.active).toBe(false);
    expect(playback.speaking.value).toBe('new');
    sounds[1]!.finish();
    await replacement;
    await tick();
    expect(sounds.map(s => s.clip)).toEqual(['hello.mp3', 'next.mp3']);
    expect(playback.speaking.value).toBeNull();
    await stale;
    unsubscribe();
  });

  it('keeps selected phrase types without a required money variant or arbitrary strings', () => {
    const { playback } = recording();
    const voice = playback.scope();
    type Item = Parameters<typeof voice.say>[number];
    expectTypeOf<Item>().toEqualTypeOf<'Hello' | 'Next' | 'Done' | { parts: readonly ('Hello' | 'Next' | 'Done')[]; light: string }>();
    expectTypeOf<string>().not.toExtend<Item>();
    expectTypeOf<{ cents: number }>().not.toExtend<Item>();
    expectTypeOf<'Garage!'>().not.toExtend<Item>();
  });
});
