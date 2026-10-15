import { signal } from '@preact/signals';

export type PlaybackItem<P extends string> = P | { parts: readonly P[]; light: string };
export interface PlaybackControls<B> {
  load(file: string): Promise<B | null>;
  play(buffer: B): { done: Promise<void>; stop(): void };
}
export interface PlaybackScope<P extends string> {
  readonly active: boolean;
  readonly signal: AbortSignal;
  cancel(): void;
  hush(): void;
  say(...items: PlaybackItem<P>[]): Promise<void>;
  sayMore(...items: PlaybackItem<P>[]): Promise<void>;
  wait(ms: number): Promise<void>;
}

export function createPlayback<P extends string, B>({
  phrases, clips, load, play,
}: PlaybackControls<B> & { phrases: readonly P[]; clips: Readonly<Partial<Record<NoInfer<P>, string>>> }) {
  const selected = new Set(phrases);
  const speaking = signal<string | null>(null);
  const buffers = new Map<P, Promise<B | null>>();
  type Work = { owner: AbortSignal; items: PlaybackItem<P>[]; release(): void; ended: Promise<null>; source?: ReturnType<typeof play> };
  let current: Work | null = null;
  let queue: Work[] = [];

  function clip(phrase: P): Promise<B | null> {
    let buffer = buffers.get(phrase);
    if (!buffer) {
      const file = selected.has(phrase) ? clips[phrase] : undefined;
      buffer = file ? Promise.resolve().then(() => load(file)).catch(() => null) : Promise.resolve(null);
      buffers.set(phrase, buffer);
    }
    return buffer;
  }

  function pump() {
    if (current || !queue.length) return;
    current = queue.shift()!;
    void run(current);
  }

  function finish(work: Work) {
    if (current === work) { current = null; speaking.value = null; }
    const source = work.source;
    work.source = undefined;
    try { source?.stop(); } catch {}
    work.release();
    pump();
  }

  async function run(work: Work) {
    try {
      for (const item of work.items) {
        if (current !== work) return;
        speaking.value = typeof item === 'string' ? null : item.light;
        if (current !== work) return;
        for (const phrase of typeof item === 'string' ? [item] : item.parts) {
          const buffer = await Promise.race([clip(phrase), work.ended]);
          if (current !== work) return;
          if (buffer) {
            work.source = play(buffer);
            await Promise.race([work.source.done, work.ended]);
            if (current !== work) return;
            work.source = undefined;
          }
        }
        speaking.value = null;
      }
    } catch {}
    finally { finish(work); }
  }

  function enqueue(owner: AbortSignal, items: PlaybackItem<P>[]): Promise<void> {
    if (owner.aborted) return Promise.resolve();
    let release!: () => void;
    const ended = new Promise<null>(resolve => { release = () => resolve(null); });
    const work: Work = { owner, items, release, ended };
    queue.push(work);
    pump();
    return ended.then(() => {});
  }

  function hush(owner?: AbortSignal) {
    const old = current;
    const pending = queue.filter(work => !owner || work.owner === owner);
    queue = queue.filter(work => owner && work.owner !== owner);
    for (const work of pending) work.release();
    if (old && (!owner || old.owner === owner)) finish(old);
  }

  function scope(parent?: AbortSignal): PlaybackScope<P> {
    const controller = new AbortController(), owner = controller.signal;
    const cancel = () => controller.abort();
    owner.addEventListener('abort', () => { parent?.removeEventListener('abort', cancel); hush(owner); }, { once: true });
    if (parent?.aborted) cancel();
    else parent?.addEventListener('abort', cancel, { once: true });
    return {
      get active() { return !owner.aborted; },
      signal: owner,
      cancel,
      hush: () => hush(owner),
      say: (...items) => {
        if (owner.aborted) return Promise.resolve();
        hush();
        return enqueue(owner, items);
      },
      sayMore: (...items) => owner.aborted ? Promise.resolve() : enqueue(owner, items),
      wait: ms => new Promise<void>(resolve => {
        if (owner.aborted) return resolve();
        const done = () => { clearTimeout(timer); owner.removeEventListener('abort', done); resolve(); };
        const timer = setTimeout(done, ms);
        owner.addEventListener('abort', done, { once: true });
      }),
    };
  }

  return { speaking, scope, preload: (phrases: readonly P[]) => Promise.all(phrases.map(clip)).then(() => {}) };
}
