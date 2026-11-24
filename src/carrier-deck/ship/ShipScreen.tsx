// The Carrier: his ship (from the side, from above, or cut away to show the decks inside), the Goal (a bar filling toward what he's
// saving for), the big Fly button with his Missions, "Watch the deck", the Chart, and the tray: Ship (hull sections and fittings, then
// the again-and-again things; and the ship's name), Air Wing (tap one to fly it, and its number), Paint, Tails, Flags (the hull's colour,
// the flag and the deck markings), Fleet (the Fleet ships and the Yard's new ship) and Crew. Tapping something says its name and price;
// he buys it with Buy when he can, and otherwise it becomes his Goal. A dear thing always sits beside cheap ones: each tab is by price.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { airLook, aircraftPic } from '../art/aircraft';
import { Jersey } from '../art/Jersey';
import { drawCarrierSide, drawCarrierTop, drawCutaway, drawFleetShip } from '../art/ship';
import { DECK_CURRENCY } from '../branding';
import { buy, player, updateShip } from '../game';
import { fly, screen, shipTab, shipView, watch } from '../nav';
import { needLine, sayable, said, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import {
  AIRCRAFT, CREW, FLAGS, FLEET, HULL_PAINTS, itemOf, MARKS, PAINTS, PARTS, PLANES, REPEATS, TAILS, type Item, type Model, type RepeatId,
} from './catalog';
import { yardShip } from './fleet';
import { CALLS, prizeById } from './missions';
import {
  airWing, buyable, canFly, capacity, deckLen, goalOf, has, lookOf, missingNeed, planMission, priceOf, rankOf, selectGoal, SHIP_NAMES, wantKey, wear, type ShipState, type Want,
} from './ship';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'ship', name: 'Ship', icon: '🚢' }, { id: 'air', name: 'Air Wing', icon: '🛩️' }, { id: 'paint', name: 'Paint', icon: '🎨' },
  { id: 'tails', name: 'Tails', icon: '⭐' }, { id: 'flags', name: 'Flags', icon: '🚩' }, { id: 'fleet', name: 'Fleet', icon: '⛴️' }, { id: 'crew', name: 'Crew', icon: '🦺' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const itemsFor = (tab: TabId): readonly Item[] => {
  switch (tab) {
    case 'ship': return byPrice(PARTS);
    case 'air': return PLANES;
    case 'paint': return byPrice(PAINTS);
    case 'tails': return byPrice(TAILS);
    case 'flags': return [...byPrice(HULL_PAINTS), ...byPrice(FLAGS), ...byPrice(MARKS)];
    case 'fleet': return byPrice(FLEET);
    case 'crew': return byPrice(CREW);
  }
};
const repeatsFor = (tab: TabId): RepeatId[] => (tab === 'ship' ? ['hull', 'bay'] : tab === 'fleet' ? ['yard'] : []);
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };
const RAINBOW = 'linear-gradient(90deg,#e63946,#ff7a00,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1)';
const swatchBg = (hex: string) => (hex === 'rainbow' ? RAINBOW : hex === 'dazzle' ? 'repeating-linear-gradient(45deg,#2a3038 0 8px,#c9d1da 8px 16px)' : hex);

/** How the ship is framed: big enough to see its aircraft and crew (at least `fill` of the frame's height), and when that is wider than
 *  the frame it drifts slowly from stern to bow and back, pausing at each end, and his finger can drag it along. */
const FRAME = {
  side: { above: 200, fill: .5, horizon: .62 },
  inside: { above: 92, fill: .58, horizon: .52 },
  /** seconds for one drift from end to end, and the pause at each end */
  drift: 10, pause: 1.6,
} as const;
/** His carrier, drawn to fit: from the side on the sea (the aircraft he flies on the catapult, the rest parked, the Fleet sailing
 *  alongside), from above, or cut away. */
export function CarrierView({ a, view = 'side', class: c = '' }: { a: ShipState; view?: 'side' | 'top' | 'inside'; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pan = useRef({ p: 0, dir: 1, hold: 0, drag: null as null | { x: number; p: number; span: number } });
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    let raf = 0, last = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const t = ms / 1000, dt = last ? Math.min(.1, t - last) : 0;
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      if (view === 'top') { ctx.fillStyle = '#1f4f8a'; ctx.fillRect(0, 0, r.width, r.height); drawSeaRipples(ctx, r.width, r.height, t); drawCarrierTop(ctx, a, r.width, r.height, t); return; }
      const f = FRAME[view], len = deckLen(a), wide = len + 60;
      const k = Math.max(Math.min((r.width * .92) / wide, (r.height * f.horizon) / f.above), (r.height * f.fill) / f.above);
      const over = Math.max(0, wide * k - r.width * .96);
      // the drift: from stern to bow and back, unless his finger has it
      const pn = pan.current;
      if (over > 0 && !pn.drag && !reducedMotion()) {
        if (pn.hold > 0) pn.hold -= dt;
        else { pn.p += (pn.dir * dt) / FRAME.drift; if (pn.p >= 1 || pn.p <= 0) { pn.p = Math.max(0, Math.min(1, pn.p)); pn.dir = -pn.dir; pn.hold = FRAME.pause; } }
      }
      if (pn.drag) pn.drag.span = over;
      const ease = (x: number) => .5 - Math.cos(Math.PI * x) / 2;
      const x0 = over > 0 ? r.width * .02 + 30 * k - over * ease(pn.p) : (r.width - (len + 34) * k) / 2;
      const water = r.height * f.horizon + 10 * k;
      const sky = ctx.createLinearGradient(0, 0, 0, water);
      sky.addColorStop(0, '#8fd0ff'); sky.addColorStop(1, '#cdeaff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, r.width, water);
      const sea = ctx.createLinearGradient(0, water, 0, r.height);
      sea.addColorStop(0, '#1f4f8a'); sea.addColorStop(1, '#12233f');
      ctx.fillStyle = sea; ctx.fillRect(0, water, r.width, r.height - water);
      if (view === 'inside') { drawCutaway(ctx, a, x0, water, k, t); return; }
      const fleet = [...FLEET.filter(s => has(a, s.id)).map(s => s.ship), ...a.yard.slice(-6).map(n => yardShip(n).look)];
      drawCarrierSide(ctx, a, x0, water, k, t, { parked: true });
      // the Fleet sails alongside, nearer to him than the carrier, small
      const kf = Math.min(k, (r.width * .92) / wide * 1.6);
      fleet.slice(0, 8).forEach((s, i) => drawFleetShip(ctx, s, r.width * (((i * .16 + t * .006) % 1.1) - .05), water + 46 * kf, kf * .45, t));
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let x = (t * 20) % 60 - 60; x < r.width; x += 60) ctx.fillRect(x, water + 4, 30, 2);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [a, view]);
  // his finger drags a long ship along; it drifts again after a moment
  const down = (e: PointerEvent) => { pan.current.drag = { x: e.clientX, p: pan.current.p, span: 0 }; };
  const move = (e: PointerEvent) => {
    const d = pan.current.drag;
    if (!d || !d.span) return;
    const p = d.p - (e.clientX - d.x) / d.span;
    pan.current.p = Math.max(0, Math.min(1, p));
  };
  const up = () => { if (pan.current.drag) { pan.current.drag = null; pan.current.hold = 3; } };
  return <canvas ref={ref} class={cls('carrier-canvas', c)} role="img" aria-label="Your carrier" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />;
}
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
/** The sea from above: soft white ripples drifting past. */
function drawSeaRipples(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let y = 18; y < h; y += 34) for (let x = ((t * 12 + y * 7) % 90) - 90; x < w; x += 90) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y); ctx.stroke(); }
}

export function ShipScreen() {
  const voice = useVoice(), state = player.state.value, a = state.ship, balance = state.currency.balance;
  const tab = shipTab.value as TabId, view = shipView.value;
  const [picked, setPicked] = useState<Want | null>(null);
  const goal = goalOf(a), plan = useMemo(() => planMission(a), [a]);
  useEffect(() => { void voice.say('Carrier!', ...(a.missions === 1 ? ['You have 1 Mission ready!' as const] : a.missions > 1 ? [said(a.missions), 'Missions ready!' as const] : [])); }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(a, w);
    setPicked(w);
    if (need) { sNope(); say(nameOf(w) as Phrase, 'Build this first:', itemOf(need).name as Phrase); return; }
    if (!buyable(a, w) && w.kind === 'item' && itemOf(w.id).cat === 'aircraft') { sNope(); say(nameOf(w) as Phrase, 'Make room in the hangar first!'); return; }
    const price = priceOf(a, w);
    if (price > balance) { updateShip(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const before = player.state.peek().ship.trophies.length;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const after = player.state.peek().ship, fleet = w.kind === 'more' && w.id === 'yard';
    say('You got', (fleet ? yardShip(after.yard.at(-1)!).kind : nameOf(w)) as Phrase, ...(fleet ? ['A new ship joined your Fleet!' as const, 'The Yard has a new ship!' as const] : w.kind === 'more' ? ['You can build more of these!' as const] : []),
      ...(after.trophies.length > before ? ['You won a medal!' as const] : []));
  }
  /** Something he owns in a looks tab goes on the aircraft he flies, or on the ship. */
  function wearIt(item: Item) {
    if (!voice.active) return;
    const m = a.flying;
    if (item.cat === 'paint') updateShip(x => wear(x, m, { paint: item.id }));
    if (item.cat === 'tail') updateShip(x => wear(x, m, { tail: item.id }));
    if (item.cat === 'hull') updateShip(x => ({ ...x, hullPaint: item.id }));
    if (item.cat === 'flag') updateShip(x => ({ ...x, flag: item.id }));
    if (item.cat === 'mark') updateShip(x => ({ ...x, mark: item.id }));
    sChime(); say(item.name as Phrase);
  }
  function tapAircraft(m: Model) {
    if (!voice.active) return;
    if (!has(a, `air:${m}`)) { tapWant({ kind: 'item', id: `air:${m}` }); return; }
    setPicked(null);
    if (!canFly(a, m)) { sNope(); say(AIRCRAFT[m].name as Phrase, 'This aircraft needs a longer deck!'); return; }
    updateShip(x => ({ ...x, flying: m }));
    sChime(); say('You will fly', AIRCRAFT[m].name as Phrase);
  }

  const look = lookOf(a, a.flying), worn = (item: Item) =>
    (item.cat === 'paint' && look.paint === item.id) || (item.cat === 'tail' && look.tail === item.id) || (item.cat === 'hull' && a.hullPaint === item.id)
    || (item.cat === 'flag' && a.flag === item.id) || (item.cat === 'mark' && a.mark === item.id) || (item.cat === 'aircraft' && a.flying === item.model);
  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(a, item.id), need = !owned && missingNeed(a, w), afford = !owned && !need && item.price <= balance && buyable(a, w);
    const looks = item.cat === 'paint' || item.cat === 'tail' || item.cat === 'hull' || item.cat === 'flag' || item.cat === 'mark';
    const onTap = () => (item.cat === 'aircraft' ? tapAircraft(item.model) : owned && looks ? wearIt(item) : owned ? say(item.name as Phrase) : tapWant(w));
    const swatch = item.cat === 'paint' || item.cat === 'hull' ? <span class="swatch-dot" style={{ background: swatchBg(item.hex) }} />
      : item.cat === 'aircraft' ? <img src={aircraftPic(airLook(item.model, lookOf(a, item.model)), 160, 80)} alt="" />
      : item.cat === 'flag' ? <span class="swatch-flag" style={{ background: item.colors.length > 1 ? `linear-gradient(${item.pattern === 'v' ? 90 : 180}deg,${item.colors.map((c, i) => `${c} ${(i / item.colors.length) * 100}% ${((i + 1) / item.colors.length) * 100}%`).join(',')})` : item.colors[0] }} />
      : item.cat === 'crew' && !item.vehicle ? <Jersey hex={item.hex} class="swatch-jersey" />
      : item.cat === 'mark' ? <span class="swatch-mark" style={{ color: item.hex }}>{({ stripe: '═', dash: '┅', circle: '◯', star: '★', number: '7', arrow: '➤', check: '▦', wave: '〰' } as const)[item.shape]}</span>
      : <span class="tile-icon" aria-hidden="true">{item.cat === 'tail' && !item.glyph ? '▫️' : item.icon}</span>;
    return (
      <button key={item.id} class={cls('cd-tile', owned && 'owned', worn(item) && 'worn', need && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked', item.cat === 'aircraft' && owned && !canFly(a, item.model) && 'grounded')}
        aria-label={item.name} onClick={onTap}>
        {swatch}
        <span class="tile-name">{item.name}</span>
        {owned ? <span class="tile-tag">{worn(item) ? '✓' : '✔︎'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={DECK_CURRENCY} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(a, w), price = priceOf(a, w), open = buyable(a, w) || !!need;
    if (!open && a.more[id] === 0) return null;
    const next = id === 'yard' ? yardShip(a.more.yard + 1) : null;
    return (
      <button key={id} class={cls('cd-tile', 'repeat', need && 'locked', !need && open && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => (open ? tapWant(w) : say(r.name as Phrase))}>
        {next ? <YardPic n={next.n} /> : <span class="tile-icon" aria-hidden="true">{r.icon}</span>}
        <span class="tile-name">{next ? `${r.name}: ${next.kind}` : r.name}</span>
        {a.more[id] > 0 && <span class="tile-count">×{a.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : open ? <span class="tile-cost"><CurrencyIcon kind={DECK_CURRENCY} size={16} />{price}</span> : <span class="tile-tag">✔︎</span>}
      </button>
    );
  };

  const goalPrice = goal ? priceOf(a, goal) : 0, rank = rankOf(a.minutes);
  return (
    <div class="screen ship-screen">
      <header class="cd-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>{SHIP_NAMES[a.name]}</h1>
        <span class="rank-chip" aria-label={rank.name}>🎖️ <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={DECK_CURRENCY} count={balance} />
      </header>
      <div class="ship-main">
        <div class="ship-view">
          <CarrierView a={a} view={view} />
          <div class="view-btns" role="group" aria-label="View">
            {(['side', 'top', 'inside'] as const).map(v => <button key={v} class={cls('chip-btn', view === v && 'on')} aria-label={v === 'side' ? 'Side' : v === 'top' ? 'Top' : 'Inside'}
              onClick={() => { shipView.value = v; say(v === 'side' ? 'Side' : v === 'top' ? 'Top' : 'Inside'); }}>{v === 'side' ? '🚢' : v === 'top' ? '⬆️' : '🔍'}</button>)}
          </div>
        </div>
        <div class="ship-side">
          <button class={cls('big-btn', 'go', 'fly-btn', a.missions > 0 && 'pulse')} aria-label="Fly"
            onClick={() => { if (!voice.active) return; if (a.missions > 0) fly(); else { sNope(); say('Play a Round to earn a Mission!'); } }}>
            <span class="fly-plane" aria-hidden="true">{plan.m.patch.glyph}</span><span class="fly-word">Fly</span><span class="race-count">{a.missions}</span>
            <span class="fly-to">{plan.m.name ?? CALLS[plan.m.job]}</span>
          </button>
          {goal && (
            <button class="goal-chip cd-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            <button class="big-btn side-btn" aria-label="Watch the deck" onClick={() => { if (voice.active) watch(); }}><span aria-hidden="true">👀</span><span class="side-word">Watch</span></button>
            <button class="big-btn side-btn" aria-label="Chart" onClick={() => { if (voice.active) screen.value = 'chart'; }}><span aria-hidden="true">🗺️</span><span class="side-word">Chart</span></button>
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(a, picked) ? <span class="buy-need">🔒 {itemOf(missingNeed(a, picked)!).name}</span>
            : !buyable(a, picked) ? <span class="buy-need">🅿️ {airWing(a).length}/{capacity(a)}</span>
            : priceOf(a, picked) <= balance
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={DECK_CURRENCY} size={22} />{priceOf(a, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={DECK_CURRENCY} size={18} />{priceOf(a, picked)}</span>}
        </div>
      )}
      <div class="cd-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('cd-tab', tab === t.id && 'on')} onClick={() => { shipTab.value = t.id; setPicked(null); say(t.name as Phrase); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="cd-tray">
        {tab === 'ship' && (
          <div class="fleet-bar">
            <button class="chip-btn" aria-label="Ship name" onClick={() => { if (!voice.active) return; const next = (a.name + 1) % SHIP_NAMES.length; updateShip(x => ({ ...x, name: next })); say(SHIP_NAMES[next]!); }}>🏷️ {SHIP_NAMES[a.name]}</button>
            <span class="chip-note">🛩️ {airWing(a).length}/{capacity(a)}</span>
          </div>
        )}
        {(tab === 'air' || tab === 'paint' || tab === 'tails') && (
          <div class="fleet-bar">
            <img src={aircraftPic(airLook(a.flying, look), 200, 100)} alt="" />
            {tab === 'air' && <button class="chip-btn" aria-label="Number" onClick={() => { if (!voice.active) return; const num = look.num % 99 + 1; updateShip(x => wear(x, a.flying, { num })); say(said(num)); }}># {look.num}</button>}
            <span class="chip-note">{AIRCRAFT[a.flying].name}</span>
          </div>
        )}
        {tab === 'flags' && a.owned.some(id => prizeById(id)?.kind === 'mark') && (
          <div class="tiles">{a.owned.filter(id => prizeById(id)?.kind === 'mark').map(id => {
            const p = prizeById(id)!;
            return <button key={id} class={cls('cd-tile', 'owned', 'prize', a.mark === id && 'worn')} aria-label={`Prize marking ${p.number}`} onClick={() => { if (!voice.active) return; updateShip(x => ({ ...x, mark: id })); sChime(); say('A new deck marking!'); }}>
              <span class="swatch-mark" style={{ color: p.kind === 'mark' ? p.hex : '#fff' }}>★</span><span class="tile-name">Prize {p.number}</span><span class="tile-tag">📻</span></button>;
          })}</div>
        )}
        <div class="tiles">
          {itemsFor(tab).filter(i => i.price > 0 || i.cat === 'aircraft' || has(a, i.id)).map(tile)}
          {repeatsFor(tab).map(repeatTile)}
        </div>
        {tab === 'fleet' && a.yard.length > 0 && (
          <div class="tiles yard">{a.yard.map(n => { const y = yardShip(n); return <button key={n} class="cd-tile owned" aria-label={y.kind} onClick={() => say(y.kind as Phrase)}><YardPic n={n} /><span class="tile-name">{y.kind} {n}</span><span class="tile-tag">✔︎</span></button>; })}</div>
        )}
      </div>
    </div>
  );
}

/** A Yard ship, small, for its tile. */
function YardPic({ n }: { n: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    c.width = 160; c.height = 80;
    ctx.clearRect(0, 0, 160, 80);
    drawFleetShip(ctx, yardShip(n).look, 14, 62, .85, 0);
  }, [n]);
  return <canvas ref={ref} class="yard-pic" aria-hidden="true" />;
}
