// Hunch's page: the board, the keyboard, and the help, stats and settings sheets. Plain DOM; the rules live in game.ts.
import './hunch.css';
import { registerServiceWorker } from '../pwa';
import {
  MAX_GUESSES, WORD_LENGTH, emptyStats, hardModeProblem, keyMarks, pickAnswer, recordResult, score, shareText, status,
  type Mark, type Stats,
} from './game';
import { ANSWERS, isAllowed } from './words';

interface Save {
  answer: string;
  guesses: string[];
  hard: boolean;
  stats: Stats;
  recent: string[]; // answers already played, newest last, so they don't repeat soon
}

const SAVE_KEY = 'hunch-save';
const RECENT = 500;
const FLIP_MS = 300;

function load(): Save {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<Save> | null;
    if (saved?.answer && ANSWERS.includes(saved.answer) && Array.isArray(saved.guesses))
      return { answer: saved.answer, guesses: saved.guesses, hard: !!saved.hard, stats: { ...emptyStats(), ...saved.stats }, recent: saved.recent ?? [] };
  } catch { /* a broken save just starts fresh */ }
  return { answer: pickAnswer(ANSWERS, []), guesses: [], hard: false, stats: emptyStats(), recent: [] };
}

let save = load();
let typed = '';
let busy = false; // while a row is flipping

const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode */ } };
const finished = () => status(save.guesses, save.answer) !== 'playing';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

// --- layout ---------------------------------------------------------------------------------------------------------

const app = document.getElementById('app')!;
const header = el('header');
const home = el('a', 'icon', '⌂');
home.href = '../';
home.setAttribute('aria-label', 'All games');
const helpBtn = el('button', 'icon', '?');
helpBtn.setAttribute('aria-label', 'How to play');
const title = el('h1', '', 'Hunch');
const statsBtn = el('button', 'icon', '📊');
statsBtn.setAttribute('aria-label', 'Statistics');
const settingsBtn = el('button', 'icon', '⚙︎');
settingsBtn.setAttribute('aria-label', 'Settings');
const left = el('div', 'side'), right = el('div', 'side');
left.append(home, helpBtn);
right.append(statsBtn, settingsBtn);
header.append(left, title, right);

const toasts = el('div', 'toasts');
const board = el('div', 'board');
const tiles: HTMLDivElement[][] = [];
const rows: HTMLDivElement[] = [];
for (let r = 0; r < MAX_GUESSES; r++) {
  const row = el('div', 'row');
  rows.push(row);
  tiles.push([]);
  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = el('div', 'tile');
    tiles[r]!.push(tile);
    row.append(tile);
  }
  board.append(row);
}

const again = el('button', 'again', 'New word ↻');
again.addEventListener('click', () => newGame());

const keyboard = el('div', 'keyboard');
const keys = new Map<string, HTMLButtonElement>();
for (const line of ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-']) {
  const row = el('div', 'krow');
  for (const k of line) {
    const key = k === '+' ? 'enter' : k === '-' ? 'backspace' : k;
    const button = el('button', key.length > 1 ? 'key wide' : 'key', key === 'enter' ? 'Enter' : key === 'backspace' ? '⌫' : key);
    button.dataset.key = key;
    if (key === 'backspace') button.setAttribute('aria-label', 'Delete');
    button.addEventListener('click', () => press(key));
    keys.set(key, button);
    row.append(button);
  }
  keyboard.append(row);
}

const main = el('main');
main.append(board, again);
app.append(header, toasts, main, keyboard);

// --- drawing --------------------------------------------------------------------------------------------------------

function paintRow(r: number, word: string, marks?: Mark[]) {
  tiles[r]!.forEach((tile, c) => {
    tile.textContent = word[c] ?? '';
    tile.className = 'tile' + (word[c] ? ' filled' : '') + (marks ? ` ${marks[c]}` : '');
  });
}

function paintKeys() {
  const marks = keyMarks(save.guesses, save.answer);
  for (const [key, button] of keys) {
    button.classList.remove('correct', 'present', 'absent');
    const mark = marks.get(key);
    if (mark) button.classList.add(mark);
  }
}

function paint() {
  for (let r = 0; r < MAX_GUESSES; r++) {
    const guess = save.guesses[r];
    if (guess) paintRow(r, guess, score(guess, save.answer));
    else paintRow(r, r === save.guesses.length ? typed : '');
  }
  paintKeys();
  again.hidden = !finished();
}

function toast(text: string, ms = 1400) {
  const t = el('div', 'toast', text);
  toasts.prepend(t);
  setTimeout(() => { t.classList.add('fade'); setTimeout(() => t.remove(), 300); }, ms);
}

function shake() {
  const row = rows[save.guesses.length]!;
  row.classList.remove('shake');
  void row.offsetWidth;
  row.classList.add('shake');
}

const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

// --- playing --------------------------------------------------------------------------------------------------------

function press(key: string) {
  if (busy || finished() || sheetOpen()) return;
  if (key === 'enter') return submit();
  if (key === 'backspace') typed = typed.slice(0, -1);
  else if (/^[a-z]$/.test(key) && typed.length < WORD_LENGTH) {
    typed += key;
    const tile = tiles[save.guesses.length]![typed.length - 1]!;
    tile.classList.remove('pop');
    void tile.offsetWidth;
    tile.classList.add('pop');
  } else return;
  paintRow(save.guesses.length, typed);
}

function submit() {
  if (typed.length < WORD_LENGTH) { shake(); return toast('Not enough letters'); }
  if (!isAllowed(typed)) { shake(); return toast('Not in word list'); }
  const problem = save.hard ? hardModeProblem(typed, save.guesses, save.answer) : null;
  if (problem) { shake(); return toast(problem); }

  const r = save.guesses.length, guess = typed, marks = score(guess, save.answer);
  save.guesses.push(guess);
  typed = '';
  const over = finished();
  if (over) {
    const won = status(save.guesses, save.answer) === 'won';
    save.stats = recordResult(save.stats, won, save.guesses.length);
    save.recent = [...save.recent, save.answer].slice(-RECENT);
  }
  persist();

  busy = true;
  tiles[r]!.forEach((tile, c) => setTimeout(() => {
    tile.classList.add('flip');
    setTimeout(() => tile.classList.add(marks[c]!), FLIP_MS / 2);
  }, c * FLIP_MS));
  setTimeout(() => {
    busy = false;
    paint();
    if (!over) return;
    if (status(save.guesses, save.answer) === 'won') {
      toast(PRAISE[save.guesses.length - 1]!, 1800);
      tiles[r]!.forEach((tile, c) => setTimeout(() => tile.classList.add('bounce'), c * 100));
    } else toast(save.answer.toUpperCase(), 3000);
    setTimeout(showStats, 1800);
  }, WORD_LENGTH * FLIP_MS + FLIP_MS / 2);
}

function newGame() {
  closeSheet();
  save = { ...save, answer: pickAnswer(ANSWERS, save.recent), guesses: [] };
  typed = '';
  persist();
  for (const row of tiles) for (const tile of row) tile.className = 'tile';
  paint();
}

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') return closeSheet();
  const key = e.key === 'Enter' ? 'enter' : e.key === 'Backspace' ? 'backspace' : e.key.toLowerCase();
  if (key === 'enter' && finished() && !sheetOpen()) { e.preventDefault(); return newGame(); }
  if (key === 'enter' || key === 'backspace' || /^[a-z]$/.test(key)) {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur();
    press(key);
  }
});

// --- sheets ---------------------------------------------------------------------------------------------------------

const overlay = el('div', 'overlay');
overlay.hidden = true;
const sheet = el('div', 'sheet');
overlay.append(sheet);
document.body.append(overlay);
overlay.addEventListener('click', e => { if (e.target === overlay) closeSheet(); });

const sheetOpen = () => !overlay.hidden;
function closeSheet() { overlay.hidden = true; }
function openSheet(heading: string, ...content: Node[]) {
  const close = el('button', 'close', '✕');
  close.setAttribute('aria-label', 'Close');
  close.addEventListener('click', closeSheet);
  sheet.replaceChildren(close, el('h2', '', heading), ...content);
  overlay.hidden = false;
}

function exampleRow(word: string, at: number, mark: Mark, text: string) {
  const row = el('div', 'row example');
  [...word].forEach((letter, i) => row.append(el('div', `tile filled${i === at ? ` ${mark}` : ''}`, letter)));
  const p = el('p');
  p.innerHTML = text;
  return [row, p];
}

function showHelp() {
  const intro = el('p', '', `Guess the word in ${MAX_GUESSES} tries. Each guess must be a real ${WORD_LENGTH}-letter word. The tiles change colour to show how close you were.`);
  const more = el('p', 'muted', 'Play as many words as you like: tap New word when you finish one.');
  openSheet('How to play', intro,
    ...exampleRow('chirp', 0, 'correct', '<b>C</b> is in the word and in the right spot.'),
    ...exampleRow('flame', 2, 'present', '<b>A</b> is in the word but in the wrong spot.'),
    ...exampleRow('quest', 3, 'absent', '<b>S</b> is not in the word anywhere.'),
    more);
}

function showStats() {
  const s = save.stats;
  const numbers = el('div', 'numbers');
  for (const [value, label] of [[s.played, 'Played'], [s.played ? Math.round((100 * s.won) / s.played) : 0, 'Win %'], [s.streak, 'Current streak'], [s.bestStreak, 'Max streak']] as const) {
    const cell = el('div');
    cell.append(el('strong', '', String(value)), el('span', '', label));
    numbers.append(cell);
  }
  const bars = el('div', 'bars');
  const top = Math.max(1, ...s.distribution);
  const current = status(save.guesses, save.answer) === 'won' ? save.guesses.length - 1 : -1;
  s.distribution.forEach((count, i) => {
    const line = el('div', 'bar');
    const fill = el('div', i === current ? 'fill now' : 'fill', String(count));
    fill.style.width = `${Math.max(7, (100 * count) / top)}%`;
    line.append(el('span', '', String(i + 1)), fill);
    bars.append(line);
  });
  const content: Node[] = [numbers, el('h3', '', 'Guess distribution'), bars];
  if (finished()) {
    const actions = el('div', 'actions');
    const share = el('button', 'share', 'Share');
    share.addEventListener('click', async () => {
      const text = shareText(save.guesses, save.answer, save.hard);
      try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); toast('Copied results to clipboard'); }
      } catch { /* cancelled */ }
    });
    const next = el('button', 'next', 'New word ↻');
    next.addEventListener('click', () => newGame());
    actions.append(share, next);
    content.push(actions);
  }
  openSheet('Statistics', ...content);
}

function showSettings() {
  const label = el('label', 'setting');
  const text = el('div');
  text.append(el('strong', '', 'Hard mode'), el('span', '', 'Any revealed hints must be used in later guesses'));
  const toggle = el('input');
  toggle.type = 'checkbox';
  toggle.checked = save.hard;
  toggle.addEventListener('change', () => {
    if (save.guesses.length && !finished()) {
      toggle.checked = save.hard;
      return toast('Hard mode can only be changed at the start of a word');
    }
    save.hard = toggle.checked;
    persist();
  });
  label.append(text, toggle);
  const giveUp = el('button', 'link', 'Skip this word');
  giveUp.addEventListener('click', () => {
    if (finished() || !save.guesses.length) return newGame();
    save.stats = recordResult(save.stats, false, save.guesses.length);
    save.recent = [...save.recent, save.answer].slice(-RECENT);
    const answer = save.answer;
    newGame();
    toast(`It was ${answer.toUpperCase()}`, 2500);
  });
  openSheet('Settings', label, giveUp, el('p', 'muted small', 'Skipping a word you have started counts as a loss.'));
}

helpBtn.addEventListener('click', showHelp);
statsBtn.addEventListener('click', showStats);
settingsBtn.addEventListener('click', showSettings);

paint();
if (!save.stats.played && !save.guesses.length) showHelp();
registerServiceWorker(() => !save.guesses.length || finished());
