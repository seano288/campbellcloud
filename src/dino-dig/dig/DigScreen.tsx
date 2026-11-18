// A Dig, the reward for a Round. A card names the site ("A new Dig! Sandy Creek") and lets him pick another open site; then the patch
// of ground: he rubs the dirt away with his finger, taps rocks to crack them, and drags each bone that comes loose to the crate. Two
// Bolts are hidden in the dirt, and on every other Dig a fossil. When every bone is in the crate the Dig is done: the bones go to the
// Museum, which shows them snapping onto the skeleton.
//
// Drawing (the iPad 9's risk is a big canvas erase): the dirt is its own small canvas at half the world's resolution (500 × 320),
// erased with cached stamp sprites (destination-out), and drawn once a frame scaled up over a cached background; bones, rocks and the
// crate are a handful of cached sprites. A frame is about six drawImage calls plus the rocks, whatever he has rubbed.
//
// Nothing can go wrong (dig.ts). Leaving halfway (🏠 twice) costs nothing and pays nothing. The canvas takes touch directly
// (touch-action: none), and pointer events are used, so a finger, a pencil and a mouse all work.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { noise, sChime, sClink, sCrunch, sFanfare, sPop, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { earnedLine } from '../../currency/kind';
import { seeded } from '../../game/rng';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { drawLooseBone } from '../art/dino';
import { chatter, EMOJI_FONT, layer, useCanvasLoop } from '../art/loop';
import { DINO_CURRENCY } from '../branding';
import { player, settleDig, updateMuseum } from '../game';
import { justFound, screen } from '../nav';
import type { Phrase } from '../phrases';
import { useVoiceScope } from '../voice';
import { BONE_NAMES, dino, fossil, site, SITES, type SiteId } from '../museum/dinos';
import { bestTool, bonesOf, DIG_BOLTS, hasGadget, missingAt, nextDig, openSites, type Dig } from '../museum/state';
import { TOOLS } from '../shop/shop';
import {
  bonesLeft, CELL, COLS, createDig, rocksFor, drag, finished, flyTarget, grab, H, hitRock, release, ROWS, rub, step, tap, W,
  type Buried, type DigEvent, type DigWorld,
} from './dig';

type Phase = 'intro' | 'dig' | 'done';
const DIRT_SCALE = .5;
/** The dirt is a half-resolution layer, so more than about one device pixel per CSS pixel only costs fill rate (the iPad 9's risk). */
const DIG_DPR = 1.25;
const sScrape = () => noise({ dur: .08, vol: .06, type: 'bandpass', f: 1400 });
const sChip = () => { noise({ dur: .07, vol: .3, type: 'bandpass', f: 1800 }); tone(140, .05, 'square', 0, .08); };

/** A world for this Dig, the same every time it's opened (so leaving and coming back is the same patch). */
export function worldFor(dig: Dig, seed: number): DigWorld {
  const tier = site(dig.site).tier, d = dig.dino ? dino(dig.dino) : null;
  return createDig({ bones: dig.bones.map(i => d!.bones[i]!), bolts: DIG_BOLTS, fossil: !!dig.fossil, ...rocksFor(tier) }, seeded(seed));
}

/** The dirt's picture (or the pale rock floor under it): its colour, darker clumps and pebbles. */
function paintDirt(c: CanvasRenderingContext2D, w: number, h: number, a: string, b: string, rng: () => number) {
  c.fillStyle = a; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) { c.fillStyle = i % 3 ? b : '#00000018'; c.beginPath(); c.ellipse(rng() * w, rng() * h, 4 + rng() * 14, 3 + rng() * 9, rng() * 3, 0, Math.PI * 2); c.fill(); }
  for (let i = 0; i < 90; i++) { c.fillStyle = '#ffffff22'; c.beginPath(); c.arc(rng() * w, rng() * h, 1 + rng() * 2, 0, Math.PI * 2); c.fill(); }
}
/** The rock floor's cracks, so cleared ground reads as stone. */
function paintFloor(c: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  c.strokeStyle = '#00000022'; c.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) { let x = rng() * w, y = rng() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rng() - .5) * 50; y += (rng() - .5) * 30; c.lineTo(x, y); } c.stroke(); }
}

export function DigScreen() {
  const voice = useVoiceScope(), say = useRef(chatter<Phrase>((...l) => voice.say(...l))).current;
  const m = player.state.value.museum;
  const [pickSite, setPickSite] = useState<SiteId | null>(null);
  const dig = useMemo(() => nextDig({ ...player.state.peek().museum, site: pickSite ?? player.state.peek().museum.site }), [pickSite]);
  const tool = bestTool(m), radius = tool.radius * 1.15;
  const [phase, setPhase] = useState<Phase>('intro'), [armed, setArmed] = useState(false), [found, setFound] = useState({ bones: 0, bolts: 0, fossil: false });
  const [uses, setUses] = useState({ blower: 3, dynamite: 1, hose: 2 }), [hoseOn, setHoseOn] = useState(0);
  const world = useRef<DigWorld | null>(null), canvas = useRef<HTMLCanvasElement>(null);
  const layers = useRef<{ base: HTMLCanvasElement; dirt: CanvasRenderingContext2D; dirtCanvas: HTMLCanvasElement; sprites: Map<number, HTMLCanvasElement>; stamps: Map<string, HTMLCanvasElement> } | null>(null);
  const view = useRef({ s: 1, ox: 0, oy: 0 }), pointer = useRef<{ id: number; x: number; y: number; held: Buried | null; sx: number; sy: number } | null>(null);
  const puffs = useRef<{ x: number; y: number; t: number; c: string }[]>([]), helpers = useRef({ dog: { x: 80, y: H - 60, t: 0 }, robot: { x: W / 2, y: 80, t: 0 }, drone: { x: 100, y: 60, t: 0 } });
  const lastScrape = useRef(0), frames = useRef(0), paid = useRef(false);
  const s = site(dig.site), d = dig.dino ? dino(dig.dino) : null;
  const finder = hasGadget(m, 'finder'), goldscan = hasGadget(m, 'goldscan'), lamp = hasGadget(m, 'lamp');

  function makeWorld() {
    const w = worldFor(dig, m.done * 31 + SITES.findIndex(x => x.id === dig.site) * 7 + 1);
    world.current = w;
    const rng = seeded(m.done + 5);
    const base = layer(W * DIRT_SCALE, H * DIRT_SCALE), dirt = layer(W * DIRT_SCALE, H * DIRT_SCALE);
    paintDirt(base.ctx, base.canvas.width, base.canvas.height, s.floor, '#00000010', rng);
    paintFloor(base.ctx, base.canvas.width, base.canvas.height, rng);
    paintDirt(dirt.ctx, dirt.canvas.width, dirt.canvas.height, s.dirt, s.dirt2, rng);
    // a dark rim round each clump of dirt, so it reads as a layer on top of the floor
    dirt.ctx.strokeStyle = '#00000030'; dirt.ctx.lineWidth = 3; dirt.ctx.strokeRect(0, 0, dirt.canvas.width, dirt.canvas.height);
    const sprites = new Map<number, HTMLCanvasElement>();
    for (const t of w.things) {
      const sp = layer(t.hw * 2 + 20, t.hh * 2 + 20), c = sp.ctx;
      c.translate(sp.canvas.width / 2, sp.canvas.height / 2);
      if (t.thing === 'bone') { c.rotate(t.angle * .3); drawLooseBone(c, t.kind!, t.hw * 2); }
      else if (t.thing === 'bolt') { c.fillStyle = '#ffd23f'; c.strokeStyle = '#000'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.lineTo(Math.cos(a) * t.hw, Math.sin(a) * t.hw); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#c99a00'; c.beginPath(); c.arc(0, 0, t.hw * .4, 0, Math.PI * 2); c.fill(); }
      else { c.fillStyle = '#d9cfbd'; c.strokeStyle = '#000'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, t.hw, 0, Math.PI * 2); c.fill(); c.stroke(); c.font = `${t.hw * 1.2}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(dig.fossil ? fossil(dig.fossil).pic : '⭐', 0, 2); }
      sprites.set(t.id, sp.canvas);
    }
    layers.current = { base: base.canvas, dirt: dirt.ctx, dirtCanvas: dirt.canvas, sprites, stamps: new Map() };
  }

  useEffect(() => {
    void voice.say('A new Dig!', s.name as Phrase, ...(dig.dino ? [] : dig.deeper ? ['Get a better tool to dig deeper!' as const] : ['Just for fun!' as const]));
  }, [dig.site]);

  // the browser tour reads how the Dig is going (tools/dino-dig/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __dig(): unknown }).__dig = () => {
    const w = world.current;
    return {
      phase, frames: frames.current, view: view.current, radius, things: w?.things.map(t => ({ thing: t.thing, state: t.state, x: t.x, y: t.y, px: t.px, py: t.py, hw: t.hw, hh: t.hh })),
      rocks: w?.rocks.filter(r => !r.gone).map(r => ({ x: r.x, y: r.y, r: r.r, hp: r.hp })), crate: w?.crate, stamps: w?.stamps, site: dig.site,
    };
  };

  /** Erases the dirt picture where a stamp went, the same amount the grid lost. */
  function eraseDirt(x: number, y: number, r: number, k = .24) {
    const L = layers.current!, key = `${Math.round(r)}:${k}`;
    let st = L.stamps.get(key);
    if (!st) {
      const R = r * DIRT_SCALE, sp = layer(R * 2 + 2, R * 2 + 2), g = sp.ctx.createRadialGradient(R + 1, R + 1, 0, R + 1, R + 1, R);
      g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(.8, `rgba(0,0,0,${k * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      sp.ctx.fillStyle = g; sp.ctx.fillRect(0, 0, sp.canvas.width, sp.canvas.height);
      L.stamps.set(key, st = sp.canvas);
    }
    L.dirt.globalCompositeOperation = 'destination-out';
    L.dirt.drawImage(st, x * DIRT_SCALE - st.width / 2, y * DIRT_SCALE - st.height / 2);
    L.dirt.globalCompositeOperation = 'source-over';
  }
  /** A loose thing's dirt goes all at once, so it shows clean. */
  function clearOver(t: Buried) {
    const L = layers.current!;
    L.dirt.globalCompositeOperation = 'destination-out';
    L.dirt.beginPath(); L.dirt.ellipse(t.x * DIRT_SCALE, t.y * DIRT_SCALE, (t.hw + 14) * DIRT_SCALE, (t.hh + 14) * DIRT_SCALE, t.angle, 0, Math.PI * 2); L.dirt.fill();
    L.dirt.globalCompositeOperation = 'source-over';
    const w = world.current!;
    for (let cy = Math.max(0, Math.floor((t.y - t.hh) / CELL)); cy <= Math.min(ROWS - 1, Math.floor((t.y + t.hh) / CELL)); cy++)
      for (let cx = Math.max(0, Math.floor((t.x - t.hw) / CELL)); cx <= Math.min(COLS - 1, Math.floor((t.x + t.hw) / CELL)); cx++) w.dirt[cy * COLS + cx] = 0;
  }

  function handle(events: DigEvent[]) {
    for (const e of events) {
      if (e.kind === 'stamp') { eraseDirt(e.x, e.y, e.r, e.r === 36 ? .3 : .24); if (puffs.current.length < 40 && Math.random() < .25) puffs.current.push({ x: e.x, y: e.y, t: 0, c: s.dirt2 }); continue; }
      if (e.kind === 'loose') {
        clearOver(e.thing);
        if (e.thing.thing === 'bone') { sPop(); say('A bone!', 'Drag it to the crate!'); }
        else if (e.thing.thing === 'bolt') { sClink(); say('A Bolt!'); }
        else { sChime(); say('A fossil!'); }
      }
      if (e.kind === 'crack') { sChip(); say('Crack!'); }
      if (e.kind === 'smash') { sCrunch(); say('Smash!'); for (let i = 0; i < 6; i++) puffs.current.push({ x: e.rock.x + (Math.random() - .5) * e.rock.r, y: e.rock.y + (Math.random() - .5) * e.rock.r, t: 0, c: s.rock }); }
      if (e.kind === 'tapLoose') { sPop(); say('Drag it to the crate!'); }
      if (e.kind === 'hint') say(e.drag ? 'Drag it to the crate!' : dig.dino ? 'Dig here!' : 'Keep digging!');
      if (e.kind === 'crated') {
        sClink();
        if (e.thing.thing === 'bone') { setFound(f => ({ ...f, bones: f.bones + 1 })); sChime(); }
        if (e.thing.thing === 'bolt') setFound(f => ({ ...f, bolts: f.bolts + 1 }));
        if (e.thing.thing === 'fossil') setFound(f => ({ ...f, fossil: true }));
      }
    }
    const w = world.current!;
    if (finished(w) && phase === 'dig') finish();
  }

  function finish() {
    if (paid.current) return;
    paid.current = true;
    setPhase('done');
    sFanfare(); confetti(40, voice.signal);
    const had = dig.dino ? bonesOf(player.state.peek().museum, dig.dino) : 0;
    if (!settleDig(player, dig)) return;
    if (dig.dino) justFound.value = { dino: dig.dino, had };
    const now = player.state.peek().museum, done = dig.dino && bonesOf(now, dig.dino) >= dino(dig.dino).bones.length;
    void voice.say(...(dig.bones.length ? ['Every bone is in the crate!' as const] : []), 'You found', ...dig.bones.map(i => BONE_NAMES[d!.bones[i]!]),
      ...(dig.fossil ? ['A fossil!' as const, fossil(dig.fossil).name as Phrase] : []), earnedLine(DINO_CURRENCY, DIG_BOLTS), ...(done ? ['The skeleton is done!' as const] : []));
  }

  // ---------- the loop ----------
  useCanvasLoop(canvas, phase !== 'intro', dt => {
    const w = world.current;
    if (!w || phase !== 'dig') return;
    frames.current++;
    handle(step(w, dt, { magnet: hasGadget(m, 'magnet') }));
    if (hoseOn > 0) setHoseOn(x => Math.max(0, x - dt));
    // the helpers he has bought
    const hp = helpers.current, next = w.things.find(t => t.state === 'buried');
    if (hasGadget(m, 'dog') && next) {
      const dog = hp.dog; dog.x += Math.sign(next.x - dog.x) * Math.min(Math.abs(next.x - dog.x), 160 * dt); dog.y += Math.sign(next.y - dog.y) * Math.min(Math.abs(next.y - dog.y), 120 * dt);
      dog.t += dt;
      if (dog.t > 1.1 && Math.hypot(next.x - dog.x, next.y - dog.y) < 40) { dog.t = 0; handle(rub(w, dog.x - 10, dog.y, dog.x + 10, dog.y + 8, 30)); say('Woof!'); }
    }
    if (hasGadget(m, 'robot')) {
      const rb = hp.robot; rb.t += dt;
      if (rb.t > .8) { rb.t = 0; const cx = Math.floor(Math.random() * COLS), cy = Math.floor(Math.random() * ROWS); if (w.dirt[cy * COLS + cx]! > .3) { rb.x = cx * CELL; rb.y = cy * CELL; handle(rub(w, rb.x - 15, rb.y, rb.x + 15, rb.y, 40)); } }
    }
    if (hasGadget(m, 'drone')) {
      const dr = hp.drone, rock = w.rocks.find(r => !r.gone);
      if (rock) { dr.x += (rock.x - dr.x) * Math.min(1, dt * 2); dr.y += (rock.y - 70 - dr.y) * Math.min(1, dt * 2); dr.t += dt; if (dr.t > 2.5) { dr.t = 0; handle(hitRock(w, rock, 3)); } }
    }
    for (const p of puffs.current) p.t += dt;
    puffs.current = puffs.current.filter(p => p.t < .6);
  }, (c, cw, ch) => {
    const w = world.current, L = layers.current;
    if (!w || !L) return;
    // the patch sits at the bottom of the field; above it the sky over the site (on a tall screen), below it the deeper layers
    const sc = Math.min(cw / W, ch / H), ox = (cw - W * sc) / 2, oy = Math.max(0, ch - H * sc - Math.min(ch * .12, (ch - H * sc) * .25));
    view.current = { s: sc, ox, oy };
    const sky = c.createLinearGradient(0, 0, 0, oy); sky.addColorStop(0, '#7fc4ea'); sky.addColorStop(1, '#d9f0f8');
    c.fillStyle = sky; c.fillRect(0, 0, cw, oy);
    c.fillStyle = s.deep; c.fillRect(0, oy, cw, ch - oy);
    if (oy > 40) {
      c.fillStyle = '#4f8a3c'; c.fillRect(0, oy - 14 * sc, cw, 18 * sc);
      c.font = `${Math.min(oy * .6, 120 * sc)}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText('🌿', cw * .1, oy - 4); c.fillText(s.id === 'cliffs' ? '🏔️' : s.id === 'volcano' ? '🌋' : s.id === 'creek' ? '🌴' : '🌳', cw * .82, oy - 4); c.fillText('⛺', cw * .58, oy - 4);
    }
    c.fillStyle = '#00000040'; c.fillRect(ox + 6 * sc, oy + 8 * sc, W * sc, H * sc);
    c.setTransform(sc, 0, 0, sc, ox, oy);
    c.imageSmoothingEnabled = true;
    c.drawImage(L.base, 0, 0, W, H);
    const sprite = (t: Buried, alpha = 1) => { const sp = L.sprites.get(t.id)!; c.globalAlpha = alpha; c.drawImage(sp, t.px - sp.width / 2, t.py - sp.height / 2); c.globalAlpha = 1; };
    for (const t of w.things) if (t.state === 'buried') sprite(t);
    c.drawImage(L.dirtCanvas, 0, 0, W, H);
    // gadgets that see through the dirt
    for (const t of w.things) if (t.state === 'buried' && ((finder && t.thing === 'bone') || (goldscan && t.thing === 'bolt'))) sprite(t, .28 + Math.sin(w.t * 4) * .08);
    // the crate
    const cr = w.crate;
    c.fillStyle = '#9a6a3a'; c.strokeStyle = '#1b1410'; c.lineWidth = 5;
    c.fillRect(cr.x, cr.y, cr.w, cr.h); c.strokeRect(cr.x, cr.y, cr.w, cr.h);
    c.strokeStyle = '#6b4523'; c.lineWidth = 4; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cr.x, cr.y + i * cr.h / 4); c.lineTo(cr.x + cr.w, cr.y + i * cr.h / 4); c.stroke(); }
    c.font = `40px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🦴', cr.x + cr.w / 2, cr.y - 22);
    // rocks
    for (const r of w.rocks) {
      if (r.gone) continue;
      const sx = r.shake > 0 ? Math.sin(r.shake * 80) * 5 : 0;
      c.save(); c.translate(r.x + sx, r.y);
      const g = c.createRadialGradient(-r.r * .3, -r.r * .35, r.r * .1, 0, 0, r.r); g.addColorStop(0, '#ffffff55'); g.addColorStop(.3, s.rock); g.addColorStop(1, '#00000066');
      c.fillStyle = s.rock; c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, k = r.r * (.86 + ((i * 37) % 7) / 40); c.lineTo(Math.cos(a) * k, Math.sin(a) * k * .82); } c.closePath(); c.fill();
      c.fillStyle = g; c.fill(); c.strokeStyle = '#1b1410'; c.lineWidth = 4; c.stroke();
      const cracks = Math.round((1 - r.hp / r.max) * 5);
      c.strokeStyle = '#1b1410'; c.lineWidth = 3;
      for (let i = 0; i < cracks; i++) { const a = i * 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r.r * .5, Math.sin(a) * r.r * .4); c.lineTo(Math.cos(a + .4) * r.r * .85, Math.sin(a + .4) * r.r * .7); c.stroke(); }
      c.restore();
    }
    // loose, held, flying and crated things on top
    for (const t of w.things) if (t.state === 'crated' && t.thing === 'bone') sprite({ ...t, px: cr.x + cr.w / 2 + (t.id % 2 ? 22 : -22), py: cr.y + cr.h * .35 });
    for (const t of w.things) if (t.state === 'loose') { sprite({ ...t, py: t.py + Math.sin(w.t * 6 + t.id) * 3 }); }
    for (const t of w.things) if (t.state === 'flying' || t.state === 'held') sprite(t);
    // dust, helpers, the hint
    for (const p of puffs.current) { c.globalAlpha = 1 - p.t / .6; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y - p.t * 40, 8 + p.t * 30, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    c.font = `56px ${EMOJI_FONT}`;
    if (hasGadget(m, 'dog')) c.fillText('🐕', helpers.current.dog.x, helpers.current.dog.y);
    if (hasGadget(m, 'robot')) c.fillText('🤖', helpers.current.robot.x, helpers.current.robot.y);
    if (hasGadget(m, 'drone') && w.rocks.some(r => !r.gone)) c.fillText('🛸', helpers.current.drone.x, helpers.current.drone.y);
    if (w.hint) { c.font = `${64 + Math.sin(w.t * 8) * 8}px ${EMOJI_FONT}`; c.fillText('👇', w.hint.x, w.hint.y - 50); }
    const pt = pointer.current;
    if (lamp && pt) { const g = c.createRadialGradient(pt.x, pt.y, 10, pt.x, pt.y, 160); g.addColorStop(0, '#fff8c055'); g.addColorStop(1, '#fff8c000'); c.fillStyle = g; c.fillRect(pt.x - 160, pt.y - 160, 320, 320); }
    if (pt && !pt.held) { c.font = `48px ${EMOJI_FONT}`; c.fillText(tool.pic, pt.x + 22, pt.y - 26); }
  }, DIG_DPR);

  // ---------- touch ----------
  const toWorld = (e: PointerEvent) => {
    const box = canvas.current!.getBoundingClientRect(), dpr = canvas.current!.width / box.width, v = view.current;
    return { x: ((e.clientX - box.left) * dpr - v.ox) / v.s, y: ((e.clientY - box.top) * dpr - v.oy) / v.s };
  };
  function down(e: PointerEvent) {
    const w = world.current;
    if (!w || phase !== 'dig' || pointer.current) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toWorld(e), held = grab(w, p.x, p.y);
    pointer.current = { id: e.pointerId, x: p.x, y: p.y, held, sx: p.x, sy: p.y };
    if (held) { sPop(); return; }
    const before = w.rocks.filter(r => !r.gone).length, events = tap(w, p.x, p.y, tool.crack);
    if (events.length) { handle(events); if (w.rocks.filter(r => !r.gone).length !== before || events.some(x => x.kind === 'crack')) pointer.current = null; return; }
    handle(rub(w, p.x - 1, p.y, p.x + 1, p.y, radius * (hoseOn > 0 ? 1.7 : 1)));
  }
  function move(e: PointerEvent) {
    const pt = pointer.current, w = world.current;
    if (!pt || !w || e.pointerId !== pt.id) return;
    const p = toWorld(e);
    if (pt.held) drag(w, pt.held, p.x, p.y);
    else {
      handle(rub(w, pt.x, pt.y, p.x, p.y, radius * (hoseOn > 0 ? 1.7 : 1)));
      if (performance.now() - lastScrape.current > 90) { lastScrape.current = performance.now(); sScrape(); }
    }
    pt.x = p.x; pt.y = p.y;
  }
  function up(e: PointerEvent) {
    const pt = pointer.current, w = world.current;
    if (!pt || e.pointerId !== pt.id) return;
    if (pt.held && w) handle(release(w, pt.held, pt.sx, pt.sy));
    pointer.current = null;
  }

  // ---------- the gadget buttons ----------
  function blow() {
    const w = world.current;
    if (!w || uses.blower < 1) return;
    setUses(u => ({ ...u, blower: u.blower - 1 }));
    say('Whoosh!');
    const y = (w.things.find(t => t.state === 'buried')?.y ?? H / 2);
    for (let x = 0; x <= W; x += 40) handle(rub(w, x, y - 20, x + 40, y + 20, 70));
  }
  function blast() {
    const w = world.current;
    if (!w || uses.dynamite < 1) return;
    setUses(u => ({ ...u, dynamite: 0 }));
    say('Boom!');
    noise({ dur: .9, vol: .7, f: 600, f2: 120 }); tone(70, .9, 'sine', 0, .5, 30);
    for (const r of w.rocks) if (!r.gone) handle(hitRock(w, r, 999));
  }
  function spray() {
    if (uses.hose < 1) return;
    setUses(u => ({ ...u, hose: u.hose - 1 }));
    setHoseOn(6);
    say('Splash!');
  }

  function home() {
    if (!voice.active) return;
    if (phase === 'done' || armed) { screen.value = phase === 'done' ? 'museum' : 'home'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 4000);
  }
  function start() {
    makeWorld();
    setPhase('dig');
    void voice.say('Rub the dirt away!');
  }

  const w = world.current, left = w ? bonesLeft(w) : dig.bones.length;
  const sites = SITES.filter(x => openSites(m).includes(x.id)), next = TOOLS.find(t => t.tier === Math.max(...sites.map(x => x.tier)) + 1);
  return (
    <div class="screen dig-screen" style={{ '--dirt': s.dirt, '--deep': s.deep }}>
      <div class="dig-hud">
        <IconButton label={armed ? 'Tap again to leave' : 'Home'} class={armed ? 'armed' : ''} onClick={home}>🏠</IconButton>
        <span class="dig-site">{s.name}</span>
        <span class="dig-count" aria-label={`${dig.bones.length - left} of ${dig.bones.length} bones`}>🦴 {dig.bones.length - left}/{dig.bones.length}</span>
        <span class="pilebox"><CurrencyIcon kind={DINO_CURRENCY} size={28} /> {found.bolts}</span>
      </div>
      <div class="dig-field">
        <canvas ref={canvas} class="dig-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        {phase === 'dig' && (
          <div class="dig-tools">
            {hasGadget(m, 'blower') && <button class="dig-gadget" aria-label="Leaf Blower" disabled={uses.blower < 1} onClick={blow}>💨<i>{uses.blower}</i></button>}
            {hasGadget(m, 'hose') && <button class={`dig-gadget ${hoseOn > 0 ? 'on' : ''}`} aria-label="Water Hose" disabled={uses.hose < 1} onClick={spray}>🚿<i>{uses.hose}</i></button>}
            {hasGadget(m, 'dynamite') && w?.rocks.some(r => !r.gone) && <button class="dig-gadget" aria-label="Dynamite" disabled={uses.dynamite < 1} onClick={blast}>🧨</button>}
          </div>
        )}
      </div>
      {phase === 'intro' && (
        <div class="dig-card-wrap">
          <div class="dig-card">
            <h2>A new Dig!</h2>
            <div class="dig-sites" role="group" aria-label="Dig sites">
              {sites.map(x => {
                const at = missingAt(m, x.id);
                return (
                  <button key={x.id} class={`dig-sitebtn ${x.id === dig.site ? 'on' : ''}`} style={{ '--dirt': x.dirt }} aria-label={x.name}
                    onClick={() => { setPickSite(x.id); updateMuseum(mm => ({ ...mm, site: x.id })); void voice.say(x.name as Phrase); }}>
                    <span class="nm">{x.name}</span><span class="sub">{at ? '🦴' : '✓'}</span>
                  </button>
                );
              })}
              {next && <button class="dig-sitebtn locked" aria-label={`Locked: ${SITES[sites.length]?.name}`} onClick={() => void voice.say('You need the', next.name as Phrase, 'to dig here!')}>
                <span class="nm">🔒 {SITES[sites.length]?.name}</span><span class="sub">{next.pic}</span></button>}
            </div>
            <p class="dig-what">{d ? `${d.name}` : dig.deeper ? 'Get a better tool to dig deeper!' : 'Just for fun!'}</p>
            <button class="big-btn go dig-go pulse" aria-label="Dig" onClick={start}>{tool.pic} Dig!</button>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div class="dig-card-wrap">
          <div class="dig-card done">
            <h2>{dig.bones.length ? 'Every bone is in the crate!' : 'Just for fun!'}</h2>
            <div class="dig-finds">
              {dig.bones.map(i => <span key={i} class="dig-find">🦴<small>{BONE_NAMES[d!.bones[i]!]}</small></span>)}
              {dig.fossil && <span class="dig-find">{fossil(dig.fossil).pic}<small>{fossil(dig.fossil).name}</small></span>}
              <span class="dig-find"><CurrencyIcon kind={DINO_CURRENCY} size={40} /><small>+{DIG_BOLTS}</small></span>
            </div>
            <button class="big-btn go dig-go pulse" aria-label="Off to the Museum" onClick={() => { void voice.say('Off to the Museum!'); screen.value = 'museum'; }}>🏛️ Museum!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export const flyTo = flyTarget;
