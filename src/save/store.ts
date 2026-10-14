import { batch, computed, signal } from '@preact/signals';

export interface BackingStore {
  read(key: string): string | null | Promise<string | null>;
  write(key: string, value: string): void | Promise<void>;
}

export interface SaveAdapter<State> {
  fresh(): State;
  decode(raw: unknown): State;
  encode(state: State): unknown;
}

export type Commit<State> =
  | { kind: 'accepted'; state: State; saved: Promise<boolean> }
  | { kind: 'rejected'; reason: 'not-ready' | 'rejected' | 'calculation-failed' };

export function createStore<State>({ key, adapter, backing }: { key: string; adapter: SaveAdapter<State>; backing: BackingStore }) {
  const state = signal(adapter.fresh());
  const ready = signal(false);
  let loading: Promise<void> | undefined;
  let writing = Promise.resolve(true);

  function load() {
    return loading ??= Promise.resolve().then(async () => {
      let loaded: State;
      try {
        const text = await backing.read(key);
        loaded = adapter.decode(text ? JSON.parse(text) : null);
      } catch {
        loaded = adapter.fresh();
      }
      batch(() => { state.value = loaded; ready.value = true; });
    });
  }

  function commit(propose: (current: State) => State | null): Commit<State> {
    if (!ready.peek()) return { kind: 'rejected', reason: 'not-ready' };
    let next: State | null;
    try {
      next = propose(state.peek());
    } catch {
      return { kind: 'rejected', reason: 'calculation-failed' };
    }
    if (next === null || next === state.peek()) return { kind: 'rejected', reason: 'rejected' };
    return batch(() => {
      state.value = next;
      let saved: Promise<boolean>;
      try {
        const snapshot = JSON.stringify(adapter.encode(next));
        if (snapshot === undefined) throw new Error('Save adapter did not produce JSON');
        saved = writing = writing.then(async () => { await backing.write(key, snapshot); return true; }).catch(() => false);
      } catch {
        saved = Promise.resolve(false);
      }
      return { kind: 'accepted', state: next, saved };
    });
  }

  return { state: computed(() => state.value), ready: computed(() => ready.value), load, commit };
}
