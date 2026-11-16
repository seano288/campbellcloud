// The Town, the screen he shows off: his streets from the side, every building he has put up standing on its lot (gold ones shining),
// his decorations along the pavement and in the sky. He drives any of his machines along the road (hold ◀ or ▶) and honks (📯).
// Tapping a building says its name and it bounces; an empty lot says a Job will fill it; the next street, still fenced off, says what
// it costs. Nothing here can be lost.
//
// Controls act on pointerdown and are big; the canvas takes touch directly (touch-action: none).
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sHonk, sPop } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { CurrencyPile } from '../../ui/currency';
import { buildingSvg, LOT_W } from '../art/buildings';
import { lookOf, MachineView } from '../art/Pics';
import { WRECKERS_CURRENCY } from '../branding';
import { player, updateYard } from '../game';
import { drawBolt, drawMachine, drawSvg } from '../job/draw';
import { eatNextClick, goJob, justBuilt, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { useVoiceScope, type VoiceScope } from '../voice';
import { building, DECOS, keyOf, LOTS_PER_STREET, MACHINES, STREETS, type MachineId } from '../yard/shop';
import { isOwned, ownsMachine, type YardState } from '../yard/yard';

export const T_VIEW_H = 640, T_GROUND = 520, LOT_GAP = 250, STREET_PAD = 160, M_SCALE_T = .62;
const SKY_DECOS = new Set(['helicopter', 'ufo', 'rainbow', 'fireworks', 'balloons', 'kites']);

interface Spot { kind: 'lot'; x: number; i: number }
interface StreetSpan { id: string; name: string; x0: number; x1: number; owned: boolean; price: number; ground: string; sky: string }

/** Where everything stands along the road: each owned street's lots, then the next street, fenced off. */
export function layout(yard: Pick<YardState, 'owned'>) {
  const streets: StreetSpan[] = [], lots: Spot[] = [];
  let x = 60, lot = 0;
  for (const st of STREETS) {
    const owned = isOwned(yard, keyOf('street', st.id));
    if (!owned && streets.some(s => !s.owned)) break;
    const x0 = x;
    x += STREET_PAD;
    if (owned) for (let k = 0; k < LOTS_PER_STREET; k++, lot++) { lots.push({ kind: 'lot', x: x + LOT_GAP / 2, i: lot }); x += LOT_GAP; }
    else x += LOT_GAP * 2;
    streets.push({ id: st.id, name: st.name, x0, x1: x, owned, price: st.price, ground: st.ground, sky: st.sky });
  }
  return { streets, lots, width: x + 120 };
}

function chatter(voice: VoiceScope) {
  let talking = false;
  return (...line: Phrase[]) => { if (talking) return; talking = true; void voice.say(...line).then(() => { talking = false; }); };
}

export function TownScreen() {
  const voice = useVoiceScope(), yard = player.state.value.yard, say = useRef(chatter(voice)).current;
  const { streets, lots, width } = useMemo(() => layout(yard), [yard.owned]);
  const mine = MACHINES.map(m => m.id).filter(m => ownsMachine(yard, m)) as MachineId[];
  const canvas = useRef<HTMLCanvasElement>(null), drive = useRef<-1 | 0 | 1>(0), keys = useRef(new Set<string>());
  const shown = justBuilt.peek(), startLot = shown ? yard.town.findIndex(l => l.b === shown) : -1;
  const pos = useRef({ x: startLot >= 0 ? lots[startLot]!.x - 300 : 80, flip: false, bounce: new Map<number, number>(), honk: 0, t: 0 });
  const toWorld = useRef<(x: number, y: number) => { x: number; y: number }>(() => ({ x: 0, y: 0 }));
  const [, redraw] = useState(0);

  useEffect(() => {
    void voice.say('Your Town!', ...(shown && startLot >= 0 ? [building(yard.town[startLot]!.b).name] as Phrase[] : ['Hold the arrows to drive!'] as Phrase[]));
    if (startLot >= 0) pos.current.bounce.set(startLot, 0);
    justBuilt.value = null;
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') { keys.current.add(k); if (k === ' ' && !e.repeat) honk(); } else keys.current.delete(k);
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    return () => { removeEventListener('keydown', key); removeEventListener('keyup', key); };
  }, []);
  if (import.meta.env.DEV) (window as unknown as { __town(): unknown }).__town = () => ({ x: pos.current.x, width, lots: lots.length, built: yard.town.length });

  // the loop
  useEffect(() => {
    const cv = canvas.current!, c = cv.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(.05, (ms - last) / 1000) : 0;
      last = ms;
      if (document.hidden) return;
      const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const p = pos.current, dir = drive.current || (keys.current.has('arrowright') ? 1 : keys.current.has('arrowleft') ? -1 : 0);
      p.t += dt;
      p.x = Math.max(20, Math.min(width - 300, p.x + dir * 300 * dt));
      if (dir) p.flip = dir < 0;
      for (const [k, v] of p.bounce) { if (v > 1.2) p.bounce.delete(k); else p.bounce.set(k, v + dt); }
      p.honk = Math.max(0, p.honk - dt);
      c.setTransform(1, 0, 0, 1, 0, 0);
      draw(c, w, h);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [yard]);

  function draw(c: CanvasRenderingContext2D, cw: number, ch: number) {
    const s = ch / T_VIEW_H, vw = cw / s, p = pos.current;
    const x0 = Math.max(0, Math.min(width - vw, p.x + 80 - vw / 2));
    c.setTransform(s, 0, 0, s, -x0 * s, 0);
    toWorld.current = (px, py) => { const r = canvas.current!.getBoundingClientRect(), k = cw / r.width; return { x: ((px - r.left) * k) / s + x0, y: ((py - r.top) * k) / s }; };
    // each street's own sky and grass
    for (const st of streets) {
      c.fillStyle = st.sky; c.fillRect(st.x0, -10, st.x1 - st.x0 + 1, T_VIEW_H);
      c.fillStyle = st.ground; c.fillRect(st.x0, T_GROUND - 40, st.x1 - st.x0 + 1, 40);
    }
    c.fillStyle = '#9fd8f5'; c.fillRect(-10, -10, 70, T_VIEW_H); c.fillRect(width - 130, -10, 140, T_VIEW_H);
    if (streets.at(-1)?.id === 'rocket' && streets.at(-1)!.owned) { c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect(streets.at(-1)!.x0 + ((i * 97) % (streets.at(-1)!.x1 - streets.at(-1)!.x0)), 20 + ((i * 53) % 200), 3, 3); }
    // the road
    c.fillStyle = '#c9c3b8'; c.fillRect(x0 - 10, T_GROUND, vw + 20, 22);
    c.fillStyle = '#4a4d52'; c.fillRect(x0 - 10, T_GROUND + 22, vw + 20, T_VIEW_H);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.setLineDash([30, 22]); c.beginPath(); c.moveTo(x0 - 10, T_GROUND + 75); c.lineTo(x0 + vw + 10, T_GROUND + 75); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#1d1d1f'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 - 10, T_GROUND); c.lineTo(x0 + vw + 10, T_GROUND); c.stroke();
    // street signs and the fence round the street for sale
    for (const st of streets) {
      const sx = st.x0 + 70;
      c.fillStyle = '#1d1d1f'; c.fillRect(sx - 3, T_GROUND - 120, 6, 120);
      c.fillStyle = st.owned ? '#2f8a4a' : '#8a929b'; c.strokeStyle = '#1d1d1f'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(sx - 64, T_GROUND - 150, 128, 36, 6); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.font = '900 17px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.name, sx, T_GROUND - 131);
      if (!st.owned) {
        const fx = st.x0 + STREET_PAD;
        c.fillStyle = '#ffd23f'; c.fillRect(fx, T_GROUND - 70, st.x1 - fx, 40);
        c.fillStyle = '#1d1d1f'; for (let x = fx; x < st.x1 - 20; x += 36) { c.beginPath(); c.moveTo(x, T_GROUND - 30); c.lineTo(x + 18, T_GROUND - 70); c.lineTo(x + 30, T_GROUND - 70); c.lineTo(x + 12, T_GROUND - 30); c.fill(); }
        c.strokeRect(fx, T_GROUND - 70, st.x1 - fx, 40);
        c.fillStyle = '#fff'; c.beginPath(); c.roundRect(fx + LOT_GAP - 80, T_GROUND - 160, 160, 64, 10); c.fill(); c.stroke();
        c.fillStyle = '#1d1d1f'; c.font = '900 22px Nunito, sans-serif'; c.fillText('For sale', fx + LOT_GAP, T_GROUND - 140);
        c.fillText(`${st.price}`, fx + LOT_GAP - 12, T_GROUND - 114); drawBolt(c, fx + LOT_GAP + 22, T_GROUND - 114, 11);
      }
    }
    // the lots and the buildings on them
    for (const lot of lots) {
      if (lot.x + LOT_W < x0 || lot.x - LOT_W > x0 + vw) continue;
      const l = yard.town[lot.i];
      if (!l) { c.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('🚧', lot.x, T_GROUND - 6); continue; }
      const { svg, h } = buildingSvg(l.b, l.gold);
      const b = p.bounce.get(lot.i), k = b === undefined ? 1 : 1 + Math.sin(Math.min(1, b) * Math.PI * 3) * .06 * (1 - Math.min(1, b));
      const dw = (LOT_W + 20) * k, dh = (h + 16) * k;
      drawSvg(c, svg, lot.x - dw / 2, T_GROUND - dh, dw, dh);
      if (l.gold && Math.floor(p.t * 2 + lot.i) % 3 === 0) { c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(lot.x + 60, T_GROUND - h * .7, 5, 0, 7); c.fill(); }
    }
    // decorations: along the pavement, or up in the sky
    const decos = DECOS.filter(d => isOwned(yard, keyOf('deco', d.id))), spots = Math.max(1, lots.length);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    decos.forEach((d, j) => {
      const at = lots[j % spots], x = (at?.x ?? 300) + LOT_GAP / 2 - 6 + Math.floor(j / spots) * 30;
      const sky = SKY_DECOS.has(d.id);
      c.font = `${sky ? 60 : 48}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      c.fillText(d.icon, x + (sky ? Math.sin(p.t + j) * 30 : 0), sky ? 110 + (j % 3) * 40 : T_GROUND + 14);
    });
    // his machine on the road
    const m = mine.includes(yard.machine) ? yard.machine : 'crane';
    const bob = Math.abs(Math.sin(p.t * 10)) * (drive.current || keys.current.size ? 2 : 0);
    drawMachine(c, m, lookOf(yard, m), p.x, T_GROUND + 56 - bob, M_SCALE_T, true, p.flip);
    if (p.honk > 0) { c.font = '900 34px Nunito, sans-serif'; c.fillStyle = '#1d1d1f'; c.fillText('HONK!', p.x + (p.flip ? -10 : 170), T_GROUND - 50 - (1 - p.honk) * 30); }
  }

  function honk() {
    if (!voice.active) return;
    sHonk(); pos.current.honk = 1;
    say('Honk honk!');
  }
  function tap(e: PointerEvent) {
    if (!voice.active) return;
    const w = toWorld.current(e.clientX, e.clientY);
    const lot = lots.find(l => Math.abs(l.x - w.x) < LOT_GAP / 2 && w.y < T_GROUND + 10);
    if (lot) {
      const l = yard.town[lot.i];
      if (l) { sPop(); pos.current.bounce.set(lot.i, 0); say(building(l.b).name); }
      else { sChime(); say('Do a Job to build here!'); }
      return;
    }
    const st = streets.find(s => !s.owned && w.x > s.x0 && w.x < s.x1);
    if (st) say('This street is for sale!', 'It costs', `${Math.min(st.price, NUMBERS_TO)}` as Phrase, 'Bolts.');
  }
  function nextMachine() {
    if (!voice.active || mine.length < 2) return;
    const m = mine[(mine.indexOf(yard.machine) + 1) % mine.length]!;
    updateYard(y => ({ ...y, machine: m }));
    sPop(); say(MACHINES.find(x => x.id === m)!.name);
    redraw(n => n + 1);
  }
  const hold = (dir: -1 | 1) => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId); drive.current = dir; },
    onPointerUp: () => { drive.current = 0; }, onPointerCancel: () => { drive.current = 0; }, onLostPointerCapture: () => { drive.current = 0; },
  });
  const next = mine.length > 1 ? mine[(mine.indexOf(yard.machine) + 1) % mine.length]! : null;

  return (
    <div class="town-screen">
      <canvas ref={canvas} class="town-canvas" aria-label="Your Town" onPointerDown={tap} />
      <header class="job-hud">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <span class="job-title">Town</span>
        <CurrencyPile kind={WRECKERS_CURRENCY} count={player.state.value.currency.balance} />
      </header>
      <div class="town-side">
        {next && <button class="town-swap" aria-label="Switch machine" onPointerDown={e => { e.preventDefault(); nextMachine(); }}><MachineView id={next} label={null} /><span aria-hidden="true">🔄</span></button>}
        <button class="town-swap yard-go" aria-label="Yard" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); screen.value = 'yard'; } }}><span aria-hidden="true">🚜</span></button>
        {yard.jobs > 0 && <button class="town-swap job-go" aria-label="Job" onPointerDown={e => { e.preventDefault(); if (voice.active) { eatNextClick(); goJob(); } }}><span aria-hidden="true">🏗️</span><b>{yard.jobs}</b></button>}
      </div>
      <div class="job-ctl left"><button class="ctl back" aria-label="Drive back" {...hold(-1)}>◀</button></div>
      <div class="job-ctl right town-right">
        <button class="ctl honk" aria-label="Honk" onPointerDown={e => { e.preventDefault(); honk(); }}>📯</button>
        <button class="ctl fwd" aria-label="Drive" {...hold(1)}>▶</button>
      </div>
    </div>
  );
}
