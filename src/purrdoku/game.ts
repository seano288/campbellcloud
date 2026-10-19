// Purrdoku's state: one endless run of levels, the board in progress and how many have been solved.
// It is all kept in localStorage under its own key; the board itself isn't stored, it's remade from its seed.
import { computed, effect, signal } from '@preact/signals';
import { levelBoard } from './ladder';
import { generate, turn, type Puzzle } from './puzzle';

export const LIVES = 3;
export const EMPTY = 0, CROSS = 1, CAT = 2;
export type Mark = typeof EMPTY | typeof CROSS | typeof CAT;

export interface Game {
  level: number;
  size: number;
  /** the board is generate(size, seed), turned `turn` ways */
  seed: number;
  turn: number;
  marks: Mark[];
  strikes: number;
  /** milliseconds spent on this board so far */
  elapsed: number;
  status: 'playing' | 'won' | 'lost';
}

export interface Save {
  v: 2;
  /** the level being played, or the next one after a win */
  level: number;
  solved: number;
  game?: Game;
}

export const SAVE_KEY = 'purrdoku-save';
const fresh = (): Save => ({ v: 2, level: 1, solved: 0 });

function load(): Save {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Save | null;
    if (saved?.v === 2) return { ...fresh(), ...saved };
  } catch { /* a broken save starts over */ }
  return fresh(); // including the old easy/medium/hard saves, which start the new ladder from level 1
}

export const save = signal<Save>(load());
effect(() => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save.value)); } catch { /* private browsing: play on without saving */ }
});

export const game = computed(() => save.value.game);

const boards = new Map<string, Puzzle>();
function boardOf(g: Pick<Game, 'size' | 'seed' | 'turn'>): Puzzle {
  const key = `${g.size}:${g.seed}:${g.turn}`;
  let board = boards.get(key);
  if (!board) boards.set(key, board = turn(generate(g.size, g.seed), g.turn));
  return board;
}
export const puzzle = computed(() => game.value && boardOf(game.value));

const newGame = (level: number, { size, seed, turn }: Pick<Game, 'size' | 'seed' | 'turn'>): Game =>
  ({ level, size, seed, turn, marks: new Array(size ** 2).fill(EMPTY), strikes: 0, elapsed: 0, status: 'playing' });

function setGame(next: Game) {
  save.value = { ...save.value, game: next };
}

/** Puts the current level on the board, carrying on where it was left if it's already there. */
export function start() {
  const level = save.value.level;
  if (save.value.game?.level === level) return;
  history.length = 0;
  canUndo.value = false;
  setGame(newGame(level, levelBoard(level)));
}

export function restart() {
  const g = game.value;
  if (!g) return;
  history.length = 0;
  canUndo.value = false;
  setGame(newGame(g.level, g));
}

/** After a win: on to the next level. */
export const next = start;

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

export type Placed = 'cat' | 'wrong' | 'won' | 'lost';

/**
 * Lays a cat down. The wrong cell costs a fish and gets crossed out; three wrong and the board is lost. A right cat
 * crosses nothing else out: keeping track of the cells it rules out is the player's job.
 */
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
  const won = marks.filter(m => m === CAT).length === n;
  update(() => ({ marks, status: won ? 'won' : 'playing' }));
  if (won) save.value = { ...save.value, level: g.level + 1, solved: save.value.solved + 1 };
  return won ? 'won' : 'cat';
}

/** Adds time to the board in play; called every second while it's on screen. */
export function tick(ms: number) {
  const g = game.value;
  if (g?.status === 'playing') setGame({ ...g, elapsed: g.elapsed + ms });
}

export const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
