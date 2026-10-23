// Purrdoku's state: one endless run of levels, the board in progress and how many have been solved.
// It is all kept in localStorage under its own key; the board itself isn't stored, it's remade from its seed.
import { computed, effect, signal } from '@preact/signals';
import { type LevelBoard, levelBoard } from './ladder';
import { decode, generate, nextStep, settle, stuck, touches, turn, type Puzzle } from './puzzle';

export const LIVES = 3;
export const EMPTY = 0, CROSS = 1, CAT = 2;
export type Mark = typeof EMPTY | typeof CROSS | typeof CAT;

export interface Game {
  level: number;
  size: number;
  /** the board is generate(size, seed), or `board` decoded for a bonus round, turned `turn` ways */
  seed: number;
  turn: number;
  board?: string;
  marks: Mark[];
  strikes: number;
  /** cells where a wrong cat was laid, whose ✕ shows red (missing from older saves) */
  wrong?: number[];
  /** hints asked for on this board (missing from saves made before there were hints) */
  hints?: number;
  /** milliseconds spent on this board so far */
  elapsed: number;
  status: 'playing' | 'won' | 'lost';
}

export interface Save {
  v: 2;
  /** the level being played, or the next one after a win */
  level: number;
  solved: number;
  /** how far up the ladder the next level sits (see levelBoard); missing from older saves, where it's the level */
  rung?: number;
  /** how fast the ladder used to climb, before the climb-speed slider went (older saves only; ignored) */
  pace?: number;
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
function boardOf(g: LevelBoard): Puzzle {
  const key = `${g.size}:${g.board ?? g.seed}:${g.turn}`;
  let board = boards.get(key);
  if (!board) boards.set(key, board = turn(g.board ? decode(g.size, g.board) : generate(g.size, g.seed), g.turn));
  return board;
}
export const puzzle = computed(() => game.value && boardOf(game.value));

const newGame = (level: number, { size, seed, turn, board }: LevelBoard): Game =>
  ({ level, size, seed, turn, ...(board && { board }), marks: new Array(size ** 2).fill(EMPTY), strikes: 0, elapsed: 0, status: 'playing' });

function setGame(next: Game) {
  save.value = { ...save.value, game: next };
}

/** Puts the current level on the board, carrying on where it was left if it's already there. */
export function start() {
  const level = save.value.level;
  if (save.value.game?.level === level) return;
  history.length = 0;
  canUndo.value = false;
  shownHint.value = shownMistake.value = null;
  setGame(newGame(level, levelBoard(level, save.value.rung ?? level)));
}

export function restart() {
  const g = game.value;
  if (!g) return;
  history.length = 0;
  canUndo.value = false;
  shownHint.value = shownMistake.value = null;
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
  shownHint.value = shownMistake.value = null; // the board has moved on, so these may not hold any more
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
 * Lays a cat down. The wrong cell costs a fish and gets a red ✕, with the reason shown when the board gives one; three
 * wrong and the board is lost. A right cat crosses nothing else out: keeping track of the cells it rules out is the
 * player's job.
 */
export function placeCat(cell: number): Placed | undefined {
  const g = game.value, board = puzzle.value;
  if (!g || !board || g.status !== 'playing' || g.marks[cell] === CAT) return;
  const n = board.size;
  if (board.cats[Math.floor(cell / n)] !== cell % n) {
    const strikes = g.strikes + 1, mistake = whyWrong(board, g.marks, g.wrong ?? [], cell);
    update(({ marks, wrong = [] }) => ({
      marks: marks.map((m, i) => (i === cell ? CROSS : m)), wrong: [...wrong, cell], strikes, status: strikes >= LIVES ? 'lost' : 'playing',
    }));
    shownMistake.value = mistake;
    return strikes >= LIVES ? 'lost' : 'wrong';
  }
  const marks = [...g.marks];
  marks[cell] = CAT;
  const won = marks.filter(m => m === CAT).length === n;
  update(() => ({ marks, status: won ? 'won' : 'playing' }));
  if (won) {
    const s = save.value;
    save.value = { ...s, level: g.level + 1, rung: (s.rung ?? g.level) + 1, solved: s.solved + 1 };
  }
  return won ? 'won' : 'cat';
}

export interface Mistake {
  /** where the wrong cat was laid */
  cell: number;
  /** the cells that show why (none when the board doesn't give a reason yet) */
  because: number[];
  why: string;
}

/** Why the last wrong cat was wrong, until the board changes. */
export const shownMistake = signal<Mistake | null>(null);

/**
 * Why a cat can't go in `cell`, going only on what's settled: the cats laid so far and the cells already found wrong.
 * Either it clashes with a cat, or it would leave some row, column or patch with nowhere for its cat.
 */
export function whyWrong(board: Puzzle, marks: readonly Mark[], wrong: readonly number[], cell: number): Mistake {
  const n = board.size, cats = marks.flatMap((m, i) => (m === CAT ? [i] : []));
  const clash = cats.find(cat => touches(board, cell, cat));
  if (clash !== undefined) {
    const why = Math.floor(clash / n) === Math.floor(cell / n) ? "There's already a cat in this row."
      : clash % n === cell % n ? "There's already a cat in this column."
      : board.regions[clash] === board.regions[cell] ? 'This color already has its cat.'
      : "Cats can't touch, not even at a corner.";
    return { cell, because: [clash], why };
  }
  const open = new Array<boolean>(n * n).fill(true), done = new Array<boolean>(3 * n).fill(false);
  for (const i of wrong) open[i] = false;
  for (const cat of cats) settle(board, open, done, cat);
  settle(board, open, done, cell);
  const left = stuck(board, open, done);
  if (left) return { cell, because: left.cells, why: `A cat here would leave this ${left.kind} with nowhere for its cat.` };
  return { cell, because: [], why: 'No cat sleeps here.' };
}

export interface Hint {
  /** 'cat': a cat goes in cells[0]; 'cross': none of `cells` can have a cat */
  kind: 'cat' | 'cross';
  cells: number[];
  /** the cells that show why */
  because: number[];
  why: string;
}

/** The hint on show, until the board changes. */
export const shownHint = signal<Hint | null>(null);

/**
 * The next thing the player can work out from their own marks: first a ✕ that's hiding a cat, then cells a cat they've
 * laid rules out, then the easiest step of reasoning left (see nextStep). When only guessing is left, it gives a cat.
 */
export function findHint(board: Puzzle, marks: readonly Mark[]): Hint {
  const n = board.size, answer = board.cats.map((col, row) => row * n + col);
  const hidden = answer.find(cell => marks[cell] === CROSS);
  if (hidden !== undefined) return { kind: 'cat', cells: [hidden], because: [], why: "There's a cat under this ✕." };

  const open = marks.map(m => m === EMPTY), done = new Array<boolean>(3 * n).fill(false);
  for (const cat of answer) {
    if (marks[cat] !== CAT) continue;
    const loose = marks.flatMap((m, i) => (m === EMPTY && touches(board, cat, i) ? [i] : []));
    if (loose.length) return { kind: 'cross', cells: loose, because: [cat], why: 'This cat rules out its row, column and color, and every cell touching it.' };
    settle(board, open, done, cat);
  }
  const step = nextStep(board, open, done);
  if (step) return { kind: step.kind, cells: step.cells, because: step.because, why: step.why };
  const free = answer.find(cell => marks[cell] !== CAT)!;
  return { kind: 'cat', cells: [free], because: [], why: "Nothing more can be worked out here without guessing, so here's a cat." };
}

/** Shows a hint for the board in play, or hides the one on show. */
export function hint() {
  const g = game.value, board = puzzle.value;
  if (!g || !board || g.status !== 'playing') return;
  if (shownHint.value) { shownHint.value = null; return; }
  shownMistake.value = null;
  shownHint.value = findHint(board, g.marks);
  setGame({ ...g, hints: (g.hints ?? 0) + 1 });
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
