// Cat Nap's state: one game in progress per mode, the level reached in each, best times and the daily streak.
// It is all kept in localStorage under its own key; boards aren't stored, they're remade from their seed.
import { computed, effect, signal } from '@preact/signals';
import { daySeed, generate, type Puzzle } from './puzzle';

export const MODES = {
  easy: { name: 'Easy', size: 5 },
  medium: { name: 'Medium', size: 7 },
  hard: { name: 'Hard', size: 8 },
  extreme: { name: 'Extreme', size: 10 },
  daily: { name: 'Daily', size: 8 },
} as const;
export type Mode = keyof typeof MODES;
export const LEVEL_MODES = ['easy', 'medium', 'hard', 'extreme'] as const satisfies readonly Mode[];

export const LIVES = 3;
export const EMPTY = 0, CROSS = 1, CAT = 2;
export type Mark = typeof EMPTY | typeof CROSS | typeof CAT;

export interface Game {
  mode: Mode;
  /** the level number, or the day (yyyymmdd) for the daily board */
  level: number;
  marks: Mark[];
  strikes: number;
  /** milliseconds spent on this board so far */
  elapsed: number;
  status: 'playing' | 'won' | 'lost';
}

export interface Save {
  v: 1;
  levels: Record<Exclude<Mode, 'daily'>, number>;
  best: Partial<Record<Mode, number>>;
  solved: Partial<Record<Mode, number>>;
  daily: { last: number; streak: number };
  autoCross: boolean;
  games: Partial<Record<Mode, Game>>;
}

export const SAVE_KEY = 'cat-nap-save';
const fresh = (): Save => ({ v: 1, levels: { easy: 1, medium: 1, hard: 1, extreme: 1 }, best: {}, solved: {}, daily: { last: 0, streak: 0 }, autoCross: true, games: {} });

function load(): Save {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Save | null;
    if (saved?.v === 1) return { ...fresh(), ...saved, levels: { ...fresh().levels, ...saved.levels } };
  } catch { /* a broken save starts over */ }
  return fresh();
}

export const save = signal<Save>(load());
effect(() => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save.value)); } catch { /* private browsing: play on without saving */ }
});

export const screen = signal<'home' | 'play'>('home');
export const mode = signal<Mode>('easy');
export const game = computed(() => save.value.games[mode.value]);

const seedFor = (m: Mode, level: number) => (m === 'daily' ? level : level * 7919 + MODES[m].size * 1_000_003);
const boards = new Map<string, Puzzle>();
export function boardFor(m: Mode, level: number): Puzzle {
  const key = `${m}:${level}`;
  let board = boards.get(key);
  if (!board) boards.set(key, board = generate(MODES[m].size, seedFor(m, level)));
  return board;
}
export const puzzle = computed(() => game.value && boardFor(game.value.mode, game.value.level));

export const today = () => daySeed(new Date());
const yesterday = () => daySeed(new Date(Date.now() - 864e5));
export const dailyDone = () => save.value.daily.last === today();
/** The streak still counts if yesterday's board was solved and today's hasn't been yet. */
export const streak = () => (save.value.daily.last >= yesterday() ? save.value.daily.streak : 0);

const newGame = (m: Mode, level: number): Game => ({ mode: m, level, marks: new Array(MODES[m].size ** 2).fill(EMPTY), strikes: 0, elapsed: 0, status: 'playing' });

function setGame(next: Game) {
  save.value = { ...save.value, games: { ...save.value.games, [next.mode]: next } };
}

/** Opens a mode where it was left, or on its current level (today's board for daily). */
export function open(m: Mode) {
  const level = m === 'daily' ? today() : save.value.levels[m];
  const current = save.value.games[m];
  if (!current || current.level !== level) setGame(newGame(m, level));
  mode.value = m;
  history.length = 0;
  screen.value = 'play';
}

export function restart() {
  const g = game.value;
  if (!g) return;
  history.length = 0;
  setGame(newGame(g.mode, g.level));
}

/** After a win: the next level, or home after the daily board. */
export function next() {
  const g = game.value;
  if (!g || g.mode === 'daily') { screen.value = 'home'; return; }
  open(g.mode);
}

const history: Mark[][] = [];
export const canUndo = signal(false);

function update(change: (g: Game) => Partial<Game>, remember = true) {
  const g = game.value;
  if (!g || g.status !== 'playing') return;
  if (remember) { history.push(g.marks); if (history.length > 200) history.shift(); }
  setGame({ ...g, ...change(g) });
  canUndo.value = history.length > 0;
}

export function undo() {
  const marks = history.pop();
  if (marks) update(() => ({ marks }), false);
  canUndo.value = history.length > 0;
}

/** Crosses or clears cells (a drag paints the same mark across them). Cats stay put. */
export function paint(cells: readonly number[], mark: typeof EMPTY | typeof CROSS, remember = true) {
  update(g => {
    const marks = [...g.marks];
    for (const cell of cells) if (marks[cell] !== CAT) marks[cell] = mark;
    return { marks };
  }, remember);
}

/** Every cell a cat at `cell` rules out: its row, column, patch and the eight around it. */
export function blocked(board: Puzzle, cell: number) {
  const n = board.size, r = Math.floor(cell / n), c = cell % n;
  return board.regions.flatMap((region, i) => {
    const ri = Math.floor(i / n), ci = i % n;
    const hit = i !== cell && (ri === r || ci === c || region === board.regions[cell] || (Math.abs(ri - r) < 2 && Math.abs(ci - c) < 2));
    return hit ? [i] : [];
  });
}

export type Placed = 'cat' | 'wrong' | 'won' | 'lost';

/** Lays a cat down. The wrong cell costs a fish and gets crossed out; three wrong and the board is lost. */
export function placeCat(cell: number): Placed | undefined {
  const g = game.value, board = puzzle.value;
  if (!g || !board || g.status !== 'playing' || g.marks[cell] === CAT) return;
  const n = board.size;
  if (board.cats[Math.floor(cell / n)] !== cell % n) {
    const strikes = g.strikes + 1;
    update(({ marks }) => ({ marks: marks.map((m, i) => (i === cell ? CROSS : m)), strikes, status: strikes >= LIVES ? 'lost' : 'playing' }));
    return strikes >= LIVES ? 'lost' : 'wrong';
  }
  const marks = [...g.marks];
  marks[cell] = CAT;
  if (save.value.autoCross) for (const i of blocked(board, cell)) marks[i] = CROSS;
  const won = marks.filter(m => m === CAT).length === n;
  update(() => ({ marks, status: won ? 'won' : 'playing' }));
  if (won) record(g);
  return won ? 'won' : 'cat';
}

function record(g: Game) {
  const s = save.value, time = g.elapsed;
  const best = s.best[g.mode];
  save.value = {
    ...s,
    best: { ...s.best, [g.mode]: best === undefined ? time : Math.min(best, time) },
    solved: { ...s.solved, [g.mode]: (s.solved[g.mode] ?? 0) + 1 },
    levels: g.mode === 'daily' ? s.levels : { ...s.levels, [g.mode]: g.level + 1 },
    daily: g.mode === 'daily' && s.daily.last !== g.level ? { last: g.level, streak: streak() + 1 } : s.daily,
  };
}

/** Adds time to the board in play; called every second while it's on screen. */
export function tick(ms: number) {
  const g = game.value;
  if (g?.status === 'playing') setGame({ ...g, elapsed: g.elapsed + ms });
}

export function toggleAutoCross() {
  save.value = { ...save.value, autoCross: !save.value.autoCross };
}

export const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
