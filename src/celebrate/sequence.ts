export type Moment = (signal: AbortSignal) => Promise<void>;
export type ShowResult = 'finished' | 'cancelled' | 'failed';

export async function playMoments(moments: readonly Moment[], signal: AbortSignal): Promise<ShowResult> {
  if (signal.aborted) return 'cancelled';
  const run = new AbortController();
  const cancel = () => run.abort();
  const cancelled = new Promise<void>(resolve => run.signal.addEventListener('abort', () => resolve(), { once: true }));
  signal.addEventListener('abort', cancel, { once: true });
  run.signal.addEventListener('abort', () => signal.removeEventListener('abort', cancel), { once: true });
  try {
    for (const moment of moments) {
      if (run.signal.aborted) return 'cancelled';
      await Promise.race([moment(run.signal), cancelled]);
      if (run.signal.aborted) return 'cancelled';
    }
    return 'finished';
  } catch {
    const result = run.signal.aborted ? 'cancelled' : 'failed';
    run.abort();
    return result;
  }
}
