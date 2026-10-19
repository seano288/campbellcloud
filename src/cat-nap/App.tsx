import { useEffect, useRef, useState } from 'preact/hooks';
import { BuildLabel } from '../ui/BuildLabel';
import { catSvg } from './art';
import {
  CAT, CROSS, EMPTY, LEVEL_MODES, LIVES, MODES, blocked, canUndo, clock, dailyDone, game, next, open, paint, placeCat,
  puzzle, restart, save, screen, streak, tick, toggleAutoCross, undo,
} from './game';

// One colour per patch, picked to stay apart from each other and from the cats' orange.
const PATCHES = ['#ffc1cc', '#b5e8c8', '#ffe39a', '#bcd7ff', '#e2c6ff', '#ffd0a6', '#a9eae6', '#d8c49a', '#d3e9a0', '#c9ccd6'];
const CAT_ART = catSvg();

export function App() {
  return screen.value === 'home' ? <Home /> : <Play />;
}

function Home() {
  const s = save.value;
  const days = streak();
  return (
    <div class="screen nap-home">
      <a class="nap-back" href="../" aria-label="All games">☁️</a>
      <div class="nap-title">
        <span class="nap-title-cat" dangerouslySetInnerHTML={{ __html: CAT_ART }} />
        <h1>Cat Nap</h1>
        <p>One cat per row, column and colour. Cats don't like to touch!</p>
      </div>
      <button class={`nap-daily${dailyDone() ? ' done' : ''}`} onClick={() => open('daily')}>
        <span class="nm">Daily Nap</span>
        <span class="sub">{dailyDone() ? '✓ Done today' : 'A new board every day'}{days > 0 && ` · 🔥 ${days}`}</span>
      </button>
      <div class="nap-modes">
        {LEVEL_MODES.map(m => (
          <button key={m} class={`nap-mode m-${m}`} onClick={() => open(m)}>
            <span class="nm">{MODES[m].name}</span>
            <span class="sz">{MODES[m].size}×{MODES[m].size}</span>
            <span class="lv">Level {s.levels[m]}</span>
            {s.best[m] !== undefined && <span class="best">Best {clock(s.best[m]!)}</span>}
          </button>
        ))}
      </div>
      <BuildLabel />
    </div>
  );
}

function Play() {
  const g = game.value!;
  const [shake, setShake] = useState(0);
  const [pop, setPop] = useState<number | null>(null);

  useEffect(() => {
    if (g.status !== 'playing') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (!document.hidden) tick(now - last);
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, [g.status, g.mode, g.level]);

  const onCat = (cell: number) => {
    const result = placeCat(cell);
    if (result === 'wrong' || result === 'lost') { setShake(s => s + 1); navigator.vibrate?.(120); }
    if (result === 'cat' || result === 'won') setPop(cell);
  };

  const title = g.mode === 'daily' ? 'Daily Nap' : `${MODES[g.mode].name} · Level ${g.level}`;
  return (
    <div class="screen nap-play">
      <div class="nap-bar">
        <button class="nap-icon" onClick={() => { screen.value = 'home'; }} aria-label="Home">🏠</button>
        <div class="nap-level">{title}</div>
        <div class="nap-time">⏱ {clock(g.elapsed)}</div>
        <div class="nap-fish" aria-label={`${LIVES - g.strikes} fish left`}>
          {Array.from({ length: LIVES }, (_, i) => <span key={i} class={i < LIVES - g.strikes ? '' : 'gone'}>🐟</span>)}
        </div>
      </div>
      <Board key={`${g.mode}:${g.level}`} shake={shake} pop={pop} onCat={onCat} />
      <div class="nap-tools">
        <button class="nap-tool" disabled={!canUndo.value || g.status !== 'playing'} onClick={undo}>↶ Undo</button>
        <button class="nap-tool" disabled={g.status !== 'playing'} onClick={() => paint(g.marks.flatMap((m, i) => (m === CROSS ? [i] : [])), EMPTY)}>Clear ✕</button>
        <button class={`nap-tool${save.value.autoCross ? ' on' : ''}`} onClick={toggleAutoCross}>Auto ✕ {save.value.autoCross ? 'on' : 'off'}</button>
      </div>
      <p class="nap-help">Tap to mark ✕ · drag to mark lots · double-tap to lay a cat down</p>
      {g.status === 'won' && (
        <div class="nap-over">
          <div class="nap-card win">
            <div class="cats">{[0, 1, 2].map(i => <span key={i} dangerouslySetInnerHTML={{ __html: CAT_ART }} />)}</div>
            <h2>Purrfect!</h2>
            <p>Solved in {clock(g.elapsed)}{g.strikes === 0 && ' with no mistakes'}</p>
            <button class="nap-btn go" onClick={next}>{g.mode === 'daily' ? 'Done' : 'Next level ▶'}</button>
            {g.mode !== 'daily' && <button class="nap-btn" onClick={() => { screen.value = 'home'; }}>Home</button>}
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
            <button class="nap-btn" onClick={() => { screen.value = 'home'; }}>Home</button>
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
  const [hover, setHover] = useState<number | null>(null);
  const playing = g.status === 'playing';

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
      lastTap.current = { cell: -1, at: 0 };
      drag.current = null;
      onCat(cell);
      return;
    }
    lastTap.current = { cell, at: now };
    if (g.marks[cell] === CAT) return;
    const mark = g.marks[cell] === CROSS ? EMPTY : CROSS;
    drag.current = { mark, seen: new Set([cell]) };
    paint([cell], mark);
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (e.pointerType === 'mouse' && !d) setHover(playing ? cellAt(e) : null);
    if (!d) return;
    const cell = cellAt(e);
    if (cell < 0 || d.seen.has(cell)) return;
    d.seen.add(cell);
    lastTap.current = { cell: -1, at: 0 }; // a drag is never the first half of a double-tap
    paint([cell], d.mark, false);
  };

  const up = () => { drag.current = null; };

  // with the mouse, hovering a cell shows which cells a cat there would rule out
  const ruledOut = hover !== null && hover >= 0 && g.marks[hover] !== CAT ? new Set(blocked(board, hover)) : null;

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
        onPointerLeave={() => setHover(null)}
      >
        {g.marks.map((mark, i) => {
          const r = Math.floor(i / n), c = i % n, region = board.regions[i]!;
          const edge = (other: number | undefined) => (other === undefined || other !== region ? 'var(--edge)' : 'var(--line)');
          return (
            <div
              key={i}
              class={`nap-cell${ruledOut?.has(i) ? ' ruled' : ''}${i === hover ? ' hover' : ''}`}
              style={{
                background: PATCHES[region],
                borderTop: r > 0 ? edge(board.regions[i - n]) : 'none',
                borderLeft: c > 0 ? edge(board.regions[i - 1]) : 'none',
              }}
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

