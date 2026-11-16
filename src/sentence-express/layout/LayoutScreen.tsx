// His Layout: the table he lays track on and decorates, and shows off. Three tools, each a big button off the screen's edges:
// ✏️ Track (drag a finger across squares to lay it; a tap on points switches them), 🧽 Rub out (drag across track to take it up),
// and 🌳 Scenery (tap a piece in the tray, then a square; tap a piece on the table to put it back; a station can be picked up and
// moved to another straight). Loose ends close up by themselves. His track squares are counted: when he runs out, more come in Track
// Boxes from the Shed.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sNope, sPop } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { sceneryArt } from '../art/scenery';
import { player, saveLayout, updateTrains } from '../game';
import { goDeliver, screen } from '../nav';
import type { Phrase } from '../phrases';
import { station, TRACK, type ItemName, type StationId } from '../shed/catalogue';
import { canPlace, isOwned, ITEMS, keyOf, liftScenery, placeScenery, sceneryLeft, selectGoal, supplyOf } from '../shed/trainset';
import { useVoice } from '../voice';
import { useTable } from './canvas';
import { drawSpots, drawStroke, drawOver, fromScreen, toScreen } from './draw';
import { cellAt, erase, fillIn, hasPoints, isStraight, lay, switchPoints, TRACK_SCENERY, xyOf, type Layout } from './track';

type Tool = 'track' | 'erase' | 'scenery';
type Held = { kind: 'scenery'; id: string } | { kind: 'station'; id: StationId } | null;

export function LayoutScreen() {
  const voice = useVoice(), t = player.state.value.trains, supply = supplyOf(t);
  const [tool, setTool] = useState<Tool>('track'), [held, setHeld] = useState<Held>(null);
  const canvas = useRef<HTMLCanvasElement>(null), stroke = useRef<number[]>([]), down = useRef(false);
  const layout = () => player.state.peek().trains.layout;

  useEffect(() => { void voice.say('Your Layout!', 'Drag your finger to lay track!'); }, []);

  const view = useTable(canvas, layout, ({ c, v }) => {
    const l = layout();
    if (stroke.current.length) drawStroke(c, v, l, stroke.current, tool === 'erase');
    if (held) drawSpots(c, v, l, cell => (held.kind === 'station' ? isStraight(l.cells[cell]!) && !l.stations.some(s => s.cell === cell) : canPlace(l, held.id, cell)));
    drawOver(c, v, l);
  }, { grid: true, key: () => `${tool}` });

  // the browser tour finds squares on the screen from here (tools/sentence-express/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __layout(): unknown }).__layout = () => {
    const v = view.current, l = layout();
    if (!v) return null;
    const box = canvas.current!.getBoundingClientRect();
    const xy = (cell: number) => { const { x, y } = xyOf(l, cell), p = toScreen(v, l, x + .5, y + .5); return { x: box.left + p.x, y: box.top + p.y }; };
    return { w: l.w, h: l.h, cells: l.cells, stations: l.stations, scenery: l.scenery, supply: supplyOf(player.state.peek().trains), cell: v.cell, xy };
  };

  const cellOf = (e: PointerEvent) => {
    const v = view.current, box = canvas.current!.getBoundingClientRect(), l = layout();
    if (!v) return -1;
    const p = fromScreen(v, l, e.clientX - box.left, e.clientY - box.top);
    return cellAt(l, Math.floor(p.x), Math.floor(p.y));
  };
  const say = (...line: Phrase[]) => { if (voice.active) void voice.say(...line); };

  function onDown(e: PointerEvent) {
    canvas.current?.setPointerCapture?.(e.pointerId);
    const cell = cellOf(e);
    down.current = true;
    stroke.current = cell >= 0 && tool !== 'scenery' ? [cell] : [];
  }
  function onMove(e: PointerEvent) {
    if (!down.current || tool === 'scenery' || !stroke.current.length) return;
    const cell = cellOf(e), last = stroke.current.at(-1)!;
    if (cell < 0 || cell === last) return;
    for (const c of fillIn(layout(), last, cell)) if (c >= 0 && stroke.current.at(-1) !== c) stroke.current.push(c);
  }
  function onUp(e: PointerEvent) {
    if (!down.current) return;
    down.current = false;
    const cells = stroke.current;
    stroke.current = [];
    const l = layout(), t0 = player.state.peek().trains;
    if (tool === 'scenery') { tapScenery(cellOf(e)); return; }
    if (cells.length < 2) {
      const cell = cells[0] ?? -1;
      // a tap on points switches them with the track tool; with the rubber it rubs them out like any other square
      if (tool === 'track' && cell >= 0 && hasPoints(l.cells[cell]!)) { sClink(); saveLayout(switchPoints(l, cell)); return; }
      if (tool === 'erase' && cell >= 0 && l.cells[cell]) { commit(erase(l, [cell], supplyOf(t0)).layout); return; }
      say(tool === 'erase' ? 'Drag to rub out track.' : 'Drag your finger to lay track!');
      return;
    }
    if (tool === 'erase') { commit(erase(l, cells, supplyOf(t0)).layout); return; }
    const laid = lay(l, cells, supplyOf(t0));
    commit(laid.layout);
    if (laid.short) {
      sNope();
      // the next track box he hasn't got becomes his Goal
      const box = TRACK.find(r => 'squares' in r && !isOwned(t0, keyOf('track', r.id)));
      if (box) updateTrains(x => selectGoal(x, keyOf('track', box.id)));
      say('You need more track!');
    }
  }
  function commit(next: Layout) {
    if (next === layout()) return;
    sClink();
    saveLayout(next);
  }
  function tapScenery(cell: number) {
    const l = layout();
    if (cell < 0) return;
    if (held) {
      if (held.kind === 'station') {
        if (!isStraight(l.cells[cell]!) || l.stations.some(s => s.cell === cell) || l.scenery.some(s => s.cell === cell)) { sNope(); say('Put it on a straight track!'); return; }
        sPop(); saveLayout({ ...l, stations: l.stations.map(s => (s.id === held.id ? { ...s, cell } : s)) }); setHeld(null); return;
      }
      if (!canPlace(l, held.id, cell)) { sNope(); say(TRACK_SCENERY.has(held.id) ? 'Put it on a straight track!' : 'Put it on an empty square!'); return; }
      sPop(); saveLayout(placeScenery(l, held.id, cell)); setHeld(null); return;
    }
    const st = l.stations.find(s => s.cell === cell);
    if (st) { sChime(); setHeld({ kind: 'station', id: st.id as StationId }); say('Put it on a straight track!'); return; }
    if (l.scenery.some(s => s.cell === cell)) { sClink(); saveLayout(liftScenery(l, cell)); return; }
    say('Tap a piece, then tap the table.');
  }
  function pickTool(x: Tool) {
    if (!voice.active) return;
    setTool(x); setHeld(null);
    // one line, chained: a second say() would cut the first off before it was heard
    if (x === 'scenery') say('Scenery!', 'Tap a piece, then tap the table.');
    else say(x === 'track' ? 'Track!' : 'Rub out!');
  }
  const left = sceneryLeft(t);
  return (
    <div class="screen layout-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Layout</h1>
        <span class={`supply ${supply ? '' : 'out'}`} aria-label={`${supply} track squares left`}>🛤️ {supply}</span>
        <IconButton label="Shed" class="shed-btn" onClick={() => { if (voice.active) screen.value = 'shed'; }}>🚂</IconButton>
      </header>
      <div class={`layout-body tool-${tool}`}>
        <div class="table-box">
          <canvas ref={canvas} class="table-canvas" aria-label="Your table. Drag to lay track." onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { down.current = false; stroke.current = []; }} />
        </div>
        <div class="layout-side">
          <div class="tools" role="radiogroup" aria-label="Tools">
            <button role="radio" aria-checked={tool === 'track'} aria-label="Lay track" class={`tool ${tool === 'track' ? 'on' : ''}`} onClick={() => pickTool('track')}>✏️</button>
            <button role="radio" aria-checked={tool === 'erase'} aria-label="Rub out" class={`tool ${tool === 'erase' ? 'on' : ''}`} onClick={() => pickTool('erase')}>🧽</button>
            <button role="radio" aria-checked={tool === 'scenery'} aria-label="Scenery" class={`tool ${tool === 'scenery' ? 'on' : ''}`} onClick={() => pickTool('scenery')}>🌳</button>
          </div>
          {tool === 'scenery' && (
            <div class="scenery-tray" role="group" aria-label="Your scenery">
              {held?.kind === 'station' && <span class="held-station" aria-label={`Moving ${station(held.id).name}`}>{station(held.id).icon}</span>}
              {left.map(id => {
                const a = sceneryArt(id), name = sceneryName(id);
                return (
                  <button key={id} class={`scenery-tile ${held?.kind === 'scenery' && held.id === id ? 'on' : ''}`} aria-label={name} onClick={() => { if (!voice.active) return; sClink(); setHeld({ kind: 'scenery', id }); void voice.say(name); }}>
                    {'emoji' in a ? <span class="pic emo">{a.emoji}</span> : <span class="item-svg" dangerouslySetInnerHTML={{ __html: a.svg }} />}
                  </button>
                );
              })}
              {!left.length && !held && <span class="tray-empty">🛒 → 🌳</span>}
            </div>
          )}
          {t.deliveries > 0 && (
            <button class="big-btn go deliver-btn pulse" aria-label="Deliver" onClick={() => { if (voice.active) goDeliver(); }}>
              <span class="deliver-icon" aria-hidden="true">🚂</span><span class="deliver-word">Deliver!</span><span class="deliver-count">{t.deliveries}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** A scenery piece's or a gift's name. */
const sceneryName = (id: string) => ITEMS.find(i => i.id === id && (i.tab === 'scenery' || i.tab === 'gift'))!.name as ItemName;
