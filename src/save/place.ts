// Where he was: the screen he was on and the Round he was in the middle of, with how each answer went. It's kept under
// its own key, apart from the save, so when the page reloads (an update to the site, or the iPad closing the app) the
// Start tap takes him back there instead of to Home. His progress itself is already in the save after every answer.
import type { Outcome, SolvedProblem } from '../learning/session';
import { ROUND_LENGTH } from '../round/rules';
import { browserStorage, createStore, type BackingStore } from './storage';

export interface Place<Screen extends string, Mode extends string> {
  screen: Screen | null;
  /** The Round in progress: never a finished one. */
  round: { mode: Mode; results: SolvedProblem[] } | null;
}

const OUTCOMES: readonly Outcome[] = ['clean', 'helped', 'missed'];
const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function readResults(raw: unknown): SolvedProblem[] | null {
  if (!Array.isArray(raw) || raw.length >= ROUND_LENGTH) return null;
  const results = raw.map((r, i): SolvedProblem | null => isRecord(r) && r.index === i + 1 && OUTCOMES.includes(r.outcome as Outcome)
    && Number.isInteger(r.misses) && (r.misses as number) >= 0 && typeof r.helped === 'boolean' && typeof r.replay === 'boolean'
    ? { index: i + 1, outcome: r.outcome as Outcome, misses: r.misses as number, helped: r.helped, replay: r.replay }
    : null);
  return results.every(r => r !== null) ? results : null;
}

export function createPlace<const Screen extends string, const Mode extends string>(
  key: string, screens: readonly Screen[], modes: readonly Mode[], backing: BackingStore = browserStorage,
) {
  type P = Place<Screen, Mode>;
  const fresh = (): P => ({ screen: null, round: null });
  const store = createStore<P>({
    key, backing,
    adapter: {
      fresh,
      decode(raw) {
        if (!isRecord(raw)) return fresh();
        const screen = screens.find(s => s === raw.screen) ?? null;
        const round = isRecord(raw.round) ? raw.round : {};
        const mode = modes.find(m => m === round.mode), results = readResults(round.results);
        return { screen, round: mode && results ? { mode, results } : null };
      },
      encode: place => place,
    },
  });
  return {
    load: store.load,
    get: () => store.state.peek(),
    /** Screens not in the list (the Start screen, first-launch setup) aren't remembered. */
    screen(screen: string) {
      const known = screens.find(s => s === screen);
      if (known) store.commit(p => (p.screen === known ? null : { ...p, screen: known }));
    },
    round(round: P['round']) {
      store.commit(p => (p.round === null && round === null ? null : { ...p, round: round && round.results.length < ROUND_LENGTH ? round : null }));
    },
  };
}
