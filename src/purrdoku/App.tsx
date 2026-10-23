import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BuildLabel } from '../ui/BuildLabel';
import { catSvg } from './art';
import type { Puzzle } from './puzzle';
import { CAT, CROSS, EMPTY, LIVES, type Hint, canUndo, clock, game, hint, next, paint, placeCat, puzzle, restart, shownHint, shownMistake, tick, undo } from './game';
import { BONUS_SIZE } from './ladder';
import { haptic } from './haptics';
import { sound } from './sounds';
import { muted, newBoard, react, toggleMute } from './voice';

// One colour per patch, picked to stay apart from each other, from the cats' orange and from the white gaps. With no
// outline round the patches, colour is all that tells them apart, so neighbouring patches get the colours furthest from
// each other. On screen a patch is just called a "color".
const PATCHES = ['#ff9aa2', '#ffe066', '#8fdc7a', '#79c3ff', '#bb9cff', '#5fd6c4', '#f5a8e6', '#d4d4d4', '#c8a97e', '#3f9a5a', '#c2e86b', '#e57fa0'];
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

// The tool buttons' line icons (drawn like Lucide's, on a 24-unit grid), in the button's text colour.
const SPEAKER = 'M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z';
const ICONS = {
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  clear: ['m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21', 'M22 21H7', 'm5 11 9 9'],
  hint: ['M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'],
  sound: [SPEAKER, 'M16 9a5 5 0 0 1 0 6', 'M19.4 18.4a9 9 0 0 0 0-12.7'],
  muted: [SPEAKER, 'M22 9l-6 6', 'M16 9l6 6'],
};
const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name].map(d => <path key={d} d={d} />)}</svg>
);

// what the hint asks the player to do, ahead of why
const hintMove = (h: Hint) => (h.kind === 'cat' ? 'Lay a cat in the gold box.' : h.cells.length === 1 ? 'Mark the flashing ✕.' : `Mark the ${h.cells.length} flashing ✕s.`);

/** A ✕, white (or red for a wrong cat) with a dark edge so it shows on every colour. */
const Cross = ({ class: cls = '' }: { class?: string }) => (
  <svg class={`x ${cls}`} viewBox="0 0 10 10" aria-hidden="true"><path class="edge" d="M2 2 8 8M8 2 2 8" /><path d="M2 2 8 8M8 2 2 8" /></svg>
);

export function App() {
  return <Play />;
}

function Play() {
  const g = game.value!;
  const [shake, setShake] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const shown = shownHint.value, mistake = shownMistake.value;

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
    if (result === 'wrong' || result === 'lost') { setShake(s => s + 1); haptic.wrong(); sound.wrong(); }
    if (result === 'cat' || result === 'won') setPop(cell);
    if (result === 'cat') { haptic.cat(); sound.cat(); }
    if (result === 'won') { haptic.won(); sound.won(); }
  };
  // taking the hint makes its move for the player
  const take = (h: Hint) => {
    if (h.kind === 'cat') onCat(h.cells[0]!);
    else { paint(h.cells, CROSS); haptic.mark(); sound.cross(); }
  };

  return (
    <div class="screen nap-play">
      <div class="nap-bar">
        <a class="nap-icon" href="../" aria-label="All games">☁️</a>
        <div class="nap-level">Level {g.level}{g.size === BONUS_SIZE && <span class="nap-bonus"> · Bonus!</span>}</div>
        <div class="nap-time">⏱ {clock(g.elapsed)}</div>
        <div class="nap-fish" aria-label={`${LIVES - g.strikes} fish left`}>
          {Array.from({ length: LIVES }, (_, i) => <span key={i} class={i < LIVES - g.strikes ? '' : 'gone'}>🐟</span>)}
        </div>
      </div>
      <Board key={g.level} shake={shake} pop={pop} onCat={onCat}>
        <div class={`nap-say${shown ? ' hint' : mistake ? ' oops' : ''}`} role="status">
          {shown ? (
            <>
              <p><b>{hintMove(shown)}</b> {shown.why}</p>
              <button class="nap-say-btn go" onClick={() => take(shown)}>{shown.kind === 'cat' ? 'Lay it' : shown.cells.length === 1 ? 'Mark it' : 'Mark them'}</button>
            </>
          ) : mistake ? (
            <p><b>Not there!</b> {mistake.why}</p>
          ) : (
            <p class="help">Tap to mark ✕ · drag to mark lots · double-tap to lay a cat down</p>
          )}
        </div>
      </Board>
      <div class="nap-tools">
        <button class="nap-tool" aria-label="Undo" title="Undo" disabled={!canUndo.value || g.status !== 'playing'} onClick={undo}><Icon name="undo" /></button>
        <button class="nap-tool" aria-label="Clear ✕" title="Clear ✕" disabled={g.status !== 'playing'} onClick={() => paint(g.marks.flatMap((m, i) => (m === CROSS && !g.wrong?.includes(i) ? [i] : [])), EMPTY)}><Icon name="clear" /></button>
        <button class={`nap-tool${shown ? ' on' : ''}`} aria-label="Hint" title="Hint" aria-pressed={!!shown} disabled={g.status !== 'playing'} onClick={hint}><Icon name="hint" /></button>
        <button class="nap-tool" aria-pressed={muted.value} aria-label={muted.value ? 'Sound off' : 'Sound on'} title={muted.value ? 'Sound off' : 'Sound on'} onClick={toggleMute}><Icon name={muted.value ? 'muted' : 'sound'} /></button>
      </div>
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
const SHAKE = [0, -10, 10, -10, 10, 0].map(x => ({ transform: `translateX(${x}px)` }));

/** The board, with `children` (the message line) sat on top of it at its width. */
function Board({ shake, pop, onCat, children }: { shake: number; pop: number | null; onCat: (cell: number) => void; children: ComponentChildren }) {
  const g = game.value!, board = puzzle.value!, n = board.size;
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mark: typeof EMPTY | typeof CROSS; seen: Set<number> } | null>(null);
  const lastTap = useRef({ cell: -1, at: 0 });
  // a lone tap's ✕ waits out the double-tap window, so a double-tap goes straight to a cat with no ✕ flashing first
  const held = useRef<{ cell: number; mark: typeof EMPTY | typeof CROSS; timer: number } | null>(null);
  const drop = () => { if (held.current) clearTimeout(held.current.timer); held.current = null; };
  const flush = () => {
    const h = held.current;
    drop();
    if (!h) return;
    paint([h.cell], h.mark);
    if (h.mark === CROSS) sound.cross();
  };
  useEffect(() => drop, [board]);
  // iOS Safari still double-tap zooms over touch-action:none, so swallow the touches themselves; pointer events fire regardless
  useEffect(() => {
    const el = ref.current!, stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchend', stop, { passive: false });
    return () => el.removeEventListener('touchend', stop);
  }, []);
  // shaken in place rather than remade: a board remade under the finger loses the touchend that iOS haptics wait for
  useEffect(() => {
    if (shake) ref.current!.animate(SHAKE, 400);
  }, [shake]);
  const playing = g.status === 'playing';
  const colours = useMemo(() => patchColours(board), [board]);
  // a hint, or why the last cat was wrong, picks out the cells that matter (a wrong cat with no reason shown doesn't)
  const shown = shownHint.value, mistake = shownMistake.value, focus = shown ?? (mistake?.because.length ? mistake : null);
  const todo = new Set(shown?.cells), because = new Set(focus?.because), wrong = new Set(g.wrong);

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
    haptic.mark(); // now, while the finger's on it, not when the ✕ shows: iOS only buzzes as the touch ends
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
    if (d.mark === CROSS) sound.cross();
    haptic.mark();
  };

  const up = () => { drag.current = null; };

  return (
    <div class="nap-board-wrap">
      {children}
      <div
        ref={ref}
        class={`nap-board${g.status === 'won' ? ' won' : ''}${focus ? ' hinting' : ''}`}
        style={{ '--n': n }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {g.marks.map((mark, i) => {
          // patches show by colour alone, with no outline round them: the same thin white gap runs between every cell
          return (
            <div
              key={i}
              class={`nap-cell${todo.has(i) ? ` hint-${shown!.kind}` : focus && i === mistake?.cell ? ' hint-wrong' : because.has(i) ? ' hint-why' : ''}`}
              style={{ background: colours[board.regions[i]!] }}
            >
              {mark === CROSS && <Cross class={wrong.has(i) ? 'wrong' : ''} />}
              {mark === CAT && <span class={`cat${i === pop ? ' pop' : ''}`} dangerouslySetInnerHTML={{ __html: CAT_ART }} />}
              {todo.has(i) && (shown!.kind === 'cross' ? <Cross class="ghost" /> : <span class="cat ghost" dangerouslySetInnerHTML={{ __html: CAT_ART }} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

