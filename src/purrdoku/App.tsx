import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BuildLabel } from '../ui/BuildLabel';
import { catSvg } from './art';
import type { Puzzle } from './puzzle';
import { CAT, CROSS, EMPTY, LIVES, canUndo, clock, game, hint, next, paint, placeCat, puzzle, restart, shownHint, tick, undo } from './game';
import { muted, newBoard, react, toggleMute } from './voice';

// One colour per patch, picked to stay apart from each other and from the cats' orange. With no outline round the
// patches, colour is all that tells them apart, so neighbouring patches get the colours furthest from each other.
const PATCHES = ['#ff9aa2', '#ffe066', '#8fdc7a', '#79c3ff', '#bb9cff', '#5fd6c4', '#f5a8e6', '#d4d4d4', '#c8a97e', '#fdfbf3'];
const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const apart = (a: string, b: string) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]!));

function patchColours(board: Puzzle): string[] {
  const n = board.size, touching = Array.from({ length: n }, () => new Set<number>());
  board.regions.forEach((region, i) => {
    for (const j of [i % n < n - 1 ? i + 1 : -1, i + n]) {
      const other = board.regions[j];
      if (other !== undefined && other !== region) { touching[region]!.add(other); touching[other]!.add(region); }
    }
  });
  const colours: string[] = [], free = PATCHES.slice(0, n);
  const order = [...touching.keys()].sort((a, b) => touching[b]!.size - touching[a]!.size || a - b);
  for (const region of order) {
    const near = [...touching[region]!].flatMap(r => (colours[r] ? [colours[r]] : []));
    const score = (c: string) => Math.min(Infinity, ...near.map(o => apart(c, o)));
    const best = free.reduce((a, b) => (score(b) > score(a) ? b : a));
    colours[region] = best;
    free.splice(free.indexOf(best), 1);
  }
  return colours;
}
const CAT_ART = catSvg();

export function App() {
  return <Play />;
}

function Play() {
  const g = game.value!;
  const [shake, setShake] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const shown = shownHint.value;

  useEffect(() => {
    if (g.status !== 'playing') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (!document.hidden) tick(now - last);
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, [g.status, g.level]);
  useEffect(() => { if (g.status === 'playing') newBoard(); }, [g.status, g.level]);

  const onCat = (cell: number) => {
    const result = placeCat(cell);
    if (result) react(result);
    if (result === 'wrong' || result === 'lost') { setShake(s => s + 1); navigator.vibrate?.(120); }
    if (result === 'cat' || result === 'won') setPop(cell);
  };

  return (
    <div class="screen nap-play">
      <div class="nap-bar">
        <a class="nap-icon" href="../" aria-label="All games">☁️</a>
        <div class="nap-level">Level {g.level}</div>
        <div class="nap-time">⏱ {clock(g.elapsed)}</div>
        <div class="nap-fish" aria-label={`${LIVES - g.strikes} fish left`}>
          {Array.from({ length: LIVES }, (_, i) => <span key={i} class={i < LIVES - g.strikes ? '' : 'gone'}>🐟</span>)}
        </div>
      </div>
      <Board key={g.level} shake={shake} pop={pop} onCat={onCat} />
      <div class="nap-tools">
        <button class="nap-tool" aria-label="Undo" title="Undo" disabled={!canUndo.value || g.status !== 'playing'} onClick={undo}>↶</button>
        <button class="nap-tool" aria-label="Clear ✕" title="Clear ✕" disabled={g.status !== 'playing'} onClick={() => paint(g.marks.flatMap((m, i) => (m === CROSS ? [i] : [])), EMPTY)}>🧹</button>
        <button class={`nap-tool${shown ? ' on' : ''}`} aria-label="Hint" title="Hint" aria-pressed={!!shown} disabled={g.status !== 'playing'} onClick={hint}>💡</button>
        <button class="nap-tool" aria-pressed={muted.value} aria-label={muted.value ? 'Sound off' : 'Sound on'} title={muted.value ? 'Sound off' : 'Sound on'} onClick={toggleMute}>{muted.value ? '🔇' : '🔊'}</button>
      </div>
      <p class={`nap-help${shown ? ' hint' : ''}`}>{shown ? shown.why : 'Tap to mark ✕ · drag to mark lots · double-tap to lay a cat down'}</p>
      <BuildLabel />
      {g.status === 'won' && (
        <div class="nap-over">
          <div class="nap-card win">
            <div class="cats">{[0, 1, 2].map(i => <span key={i} dangerouslySetInnerHTML={{ __html: CAT_ART }} />)}</div>
            <h2>Purrfect!</h2>
            <p>Solved in {clock(g.elapsed)}{g.strikes === 0 && ' with no mistakes'}{!!g.hints && ` · ${g.hints} ${g.hints === 1 ? 'hint' : 'hints'}`}</p>
            <button class="nap-btn go" onClick={next}>Next level ▶</button>
          </div>
        </div>
      )}
      {g.status === 'lost' && (
        <div class="nap-over">
          <div class="nap-card">
            <div class="big">🙀</div>
            <h2>Out of fish!</h2>
            <p>You woke up too many cats.</p>
            <button class="nap-btn go" onClick={restart}>Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}

const DOUBLE_TAP_MS = 320;

function Board({ shake, pop, onCat }: { shake: number; pop: number | null; onCat: (cell: number) => void }) {
  const g = game.value!, board = puzzle.value!, n = board.size;
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mark: typeof EMPTY | typeof CROSS; seen: Set<number> } | null>(null);
  const lastTap = useRef({ cell: -1, at: 0 });
  // a lone tap's ✕ waits out the double-tap window, so a double-tap goes straight to a cat with no ✕ flashing first
  const held = useRef<{ cell: number; mark: typeof EMPTY | typeof CROSS; timer: number } | null>(null);
  const drop = () => { if (held.current) clearTimeout(held.current.timer); held.current = null; };
  const flush = () => { const h = held.current; drop(); if (h) paint([h.cell], h.mark); };
  useEffect(() => drop, [board]);
  const playing = g.status === 'playing';
  const colours = useMemo(() => patchColours(board), [board]);
  const shown = shownHint.value;
  const todo = new Set(shown?.cells), because = new Set(shown?.because);

  const cellAt = (e: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * n), row = Math.floor(((e.clientY - rect.top) / rect.height) * n);
    return row < 0 || col < 0 || row >= n || col >= n ? -1 : row * n + col;
  };

  const down = (e: PointerEvent) => {
    if (!playing) return;
    const cell = cellAt(e);
    if (cell < 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const now = performance.now(), last = lastTap.current;
    if (last.cell === cell && now - last.at < DOUBLE_TAP_MS) {
      drop();
      lastTap.current = { cell: -1, at: 0 };
      drag.current = null;
      onCat(cell);
      return;
    }
    flush();
    lastTap.current = { cell, at: now };
    if (g.marks[cell] === CAT) return;
    const mark = g.marks[cell] === CROSS ? EMPTY : CROSS;
    drag.current = { mark, seen: new Set([cell]) };
    held.current = { cell, mark, timer: window.setTimeout(flush, DOUBLE_TAP_MS) };
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const cell = cellAt(e);
    if (cell < 0 || d.seen.has(cell)) return;
    d.seen.add(cell);
    flush(); // a drag marks its first cell straight away
    lastTap.current = { cell: -1, at: 0 }; // a drag is never the first half of a double-tap
    paint([cell], d.mark, false);
  };

  const up = () => { drag.current = null; };

  return (
    <div class="nap-board-wrap">
      <div
        ref={ref}
        key={shake}
        class={`nap-board${shake ? ' shake' : ''}${g.status === 'won' ? ' won' : ''}`}
        style={{ '--n': n }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {g.marks.map((mark, i) => {
          // patches show by colour alone, with no outline round them: the same thin line runs between every cell
          const r = Math.floor(i / n), c = i % n;
          return (
            <div
              key={i}
              class={`nap-cell${todo.has(i) ? ` hint-${shown!.kind}` : because.has(i) ? ' hint-why' : ''}`}
              style={{ background: colours[board.regions[i]!], borderTop: r > 0 ? 'var(--line)' : 'none', borderLeft: c > 0 ? 'var(--line)' : 'none' }}
            >
              {mark === CROSS && <span class="x">✕</span>}
              {mark === CAT && <span class={`cat${i === pop ? ' pop' : ''}`} dangerouslySetInnerHTML={{ __html: CAT_ART }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

