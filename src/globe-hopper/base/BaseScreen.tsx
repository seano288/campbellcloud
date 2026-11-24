// The Rocket Base: his base with his rockets on their pads (or his Station in orbit, or his photo wall), the Goal (a bar filling toward
// what he's saving for), the big Launch button with his Launches, "Watch the launch", and the tray: Base (buildings, then more pads,
// hangars and dishes), Rockets (tap one to fly it), Parts (each slot of the rocket that flies), Paint (paints, decals, flames), Payloads
// (and new Station modules he designs), Station (put each new module where he likes), Photos and Logbook. Tapping something says its
// name and price; he buys it with Buy when he can, and otherwise it becomes his Goal. A dear thing always sits beside cheap ones: each
// tab is by price.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { rocketPic } from '../art/rocket';
import { drawModule, drawStation, iconOfModule } from '../art/station';
import { CUR } from '../branding';
import { buy, player, updateBase } from '../game';
import { baseTab, launch, screen, watch } from '../nav';
import { needLine, sayable, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { CONTINENTS } from '../world/continents';
import { OCEANS } from '../world/oceans';
import { PLACES } from '../world/places';
import {
  BUILDINGS, DECALS, FLAMES, itemOf, KINDS, PAINTS, PAYLOADS, partsFor, REPEATS, ROCKET_KINDS, ROCKETS, SLOTS, type Item, type PayloadItem, type RepeatId, type RocketKind, type Slot,
} from './catalog';
import {
  bestLift, buyable, canStand, dishes, fit, flyingKind, goalOf, has, liftOf, lookOf, massOf, missingNeed, myRockets, nameOfPayload, pads, pick, planLaunch, priceOf, putModule,
  rankOf, RANKS, selectGoal, towerLevel, wantKey, type BaseState, type Want,
} from './base';
import { freeSpots, MODULE_COLOURS, PANELS_MAX, SHAPES, suggestModule, WINDOWS_MAX, type ModuleLook } from './station';
import { patchFor } from './missions';
import { PatchBadge } from './PatchBadge';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'base', name: 'Build', icon: '🏗️' }, { id: 'rockets', name: 'Rockets', icon: '🚀' }, { id: 'parts', name: 'Parts', icon: '🔩' }, { id: 'paint', name: 'Paint', icon: '🎨' },
  { id: 'payloads', name: 'Payloads', icon: '🛰️' }, { id: 'station', name: 'Station', icon: '🧩' }, { id: 'photos', name: 'Photos', icon: '📷' }, { id: 'log', name: 'Logbook', icon: '📒' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const SLOT_NAMES: Record<Slot, string> = { nose: 'Nose', capsule: 'Capsule', upper: 'Upper Stage', main: 'Main Stage', boosters: 'Boosters', engines: 'Engines', fins: 'Fins' };
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };
const RAINBOW = 'linear-gradient(90deg,#e63946,#ff7a00,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1)';
const swatchBg = (hex: string) => (hex === 'rainbow' ? RAINBOW : hex);
const said = (x: string | number) => `${x}` as Phrase;

/** His base from the side: the rockets on their pads, the tower, and every building he owns. */
function BaseView({ a }: { a: BaseState }) {
  const rockets = myRockets(a).filter(k => canStand(a, k)).sort(k => (k === flyingKind(a) ? -1 : 1)).slice(0, pads(a));
  const built = BUILDINGS.filter(b => has(a, b.id) && b.does !== 'tower');
  return (
    <div class={cls('gh-base-view', a.night && 'night')} aria-label="Your Rocket Base" role="img">
      <div class="gh-sky" />
      <div class="gh-pads">
        {rockets.map((k, i) => (
          <div key={k} class={cls('gh-pad', i === 0 && 'flying')}>
            {i === 0 && <i class={`gh-tower t${towerLevel(a)}`} aria-hidden="true" />}
            <img src={rocketPic(lookOf(a, k), 170)} alt="" />
            <span class="gh-pad-slab" />
          </div>
        ))}
        {Array.from({ length: Math.max(0, pads(a) - rockets.length) }, (_, i) => <div key={`e${i}`} class="gh-pad empty"><span class="gh-pad-slab" /></div>)}
      </div>
      <div class="gh-buildings" aria-hidden="true">
        <span title="Hut">🛖</span>
        {built.map(b => <span key={b.id}>{b.icon}</span>)}
        {Array.from({ length: Math.min(12, a.more.hangar) }, (_, i) => <span key={`h${i}`}>🏠</span>)}
        {Array.from({ length: Math.min(12, a.more.dish) }, (_, i) => <span key={`d${i}`}>📡</span>)}
      </div>
    </div>
  );
}

/** The Station in orbit; while he has a module to put on, the free spots glow and a tap puts it there. */
function StationView({ a, placing, onPlace }: { a: BaseState; placing: string | null; onPlace(x: number, y: number): void }) {
  const ref = useRef<HTMLCanvasElement>(null), geo = useRef<ReturnType<typeof drawStation> | null>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    let raf = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, r.height); g.addColorStop(0, '#03040c'); g.addColorStop(1, '#0d1f45');
      ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = '#2f7fd6'; ctx.beginPath(); ctx.arc(r.width / 2, r.height * 1.9, r.height * 1.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97.3) % r.width, (i * 41.7) % (r.height * .7), 1.5, 1.5);
      geo.current = drawStation(ctx, a.station, a.designs, r.width, r.height, ms / 1000, placing ? freeSpots(a.station) : []);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [a, placing]);
  const tap = (e: PointerEvent) => {
    if (!placing || !geo.current) return;
    const b = ref.current!.getBoundingClientRect(), g = geo.current.toGrid(e.clientX - b.left, e.clientY - b.top);
    onPlace(g.x, g.y);
  };
  return <canvas ref={ref} class="gh-station" role="img" aria-label={placing ? 'Tap a glowing spot' : 'Your Station'} onPointerDown={tap} />;
}

function ModulePreview({ l }: { l: ModuleLook }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!, dpr = Math.min(2, devicePixelRatio || 1);
    c.width = 120 * dpr; c.height = 120 * dpr; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, 120, 120);
    drawModule(ctx, l, 60, 60, 100);
  }, [l]);
  return <canvas ref={ref} class="gh-module-preview" aria-hidden="true" />;
}

export function BaseScreen() {
  const voice = useVoice(), state = player.state.value, a = state.base, balance = state.currency.balance;
  const tab = baseTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null);
  const [design, setDesign] = useState<ModuleLook>(() => suggestModule(a.more.module + 1));
  const goal = goalOf(a), plan = useMemo(() => planLaunch(a), [a]);
  const placing = a.unplaced[0] ?? null;
  useEffect(() => {
    void voice.say('Rocket Base', ...(a.launches === 1 ? ['You have 1 Launch!' as const] : a.launches > 1 ? [said(a.launches), 'Launches!' as const] : []),
      ...(a.unplaced.length ? ['Put it on your Station!' as const] : []));
  }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(a, w);
    setPicked(w);
    if (need) { sNope(); say(nameOf(w) as Phrase, need.startsWith('pl:') ? 'Fly this first:' : 'Build this first:', itemOf(need).name as Phrase); return; }
    if (w.kind === 'item' && itemOf(w.id).cat === 'payload' && !buyable(a, w) && !has(a, w.id)) { sNope(); say(nameOf(w) as Phrase, 'You need a bigger rocket to lift this!'); return; }
    const price = priceOf(a, w);
    if (price > balance) { updateBase(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const done = buy(w.kind === 'more' && w.id === 'module' ? { ...w, design } : w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const item = w.kind === 'item' ? itemOf(w.id) : null;
    say('You got', nameOf(w) as Phrase, ...(w.kind === 'more' ? ['You can build more of these!' as const] : []),
      ...(item?.cat === 'payload' || (w.kind === 'more' && w.id === 'module') ? ['It waits for the next Launch.' as const] : []),
      ...(item?.cat === 'rocket' ? ['Your rocket flies next!' as const] : []));
    if (w.kind === 'more' && w.id === 'module') setDesign(suggestModule(a.more.module + 2));
  }
  function fitIt(item: Item) {
    if (!voice.active) return;
    const k = flyingKind(a);
    updateBase(x => fit(x, k, item.id));
    sChime(); say(item.name as Phrase);
  }
  function tapRocket(k: RocketKind) {
    if (!voice.active) return;
    if (!has(a, `r:${k}`)) { tapWant({ kind: 'item', id: `r:${k}` }); return; }
    setPicked(null);
    if (!canStand(a, k)) { sNope(); say(ROCKET_KINDS[k].name as Phrase, 'This rocket is too tall for your tower.'); return; }
    updateBase(x => pick(x, k));
    sChime(); say(ROCKET_KINDS[k].name as Phrase, 'Your rocket flies next!', 'This rocket can lift', said(liftOf(lookOf(a, k))));
  }
  function place(x: number, y: number) {
    if (!voice.active || !placing) return;
    const next = putModule(a, placing, x, y);
    if (!next) { sNope(); say('Tap a glowing spot to put it there.'); return; }
    updateBase(() => next);
    sFanfare(); confetti(20, voice.signal);
    say('It joined your Station!');
  }

  const look = lookOf(a, flyingKind(a));
  const worn = (item: Item) => (item.cat === 'part' && look[item.slot] === item.id) || (item.cat === 'paint' && look.paint === item.id) || (item.cat === 'decal' && look.decal === item.id) || (item.cat === 'flame' && look.flame === item.id);
  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(a, item.id), need = !owned && missingNeed(a, w), afford = !owned && !need && item.price <= balance && buyable(a, w);
    const wearable = item.cat === 'part' || item.cat === 'paint' || item.cat === 'decal' || item.cat === 'flame';
    const onTap = () => (item.cat === 'rocket' ? tapRocket(item.kind) : owned && wearable ? fitIt(item) : owned ? say(item.name as Phrase) : tapWant(w));
    const swatch = item.cat === 'paint' || item.cat === 'flame' ? <span class="swatch-dot" style={{ background: swatchBg(item.hex) }} />
      : item.cat === 'rocket' ? <img src={rocketPic(has(a, item.id) ? lookOf(a, item.kind) : { ...lookOf(a, 'sounding'), kind: item.kind }, 90)} alt="" />
      : <span class="tile-icon" aria-hidden="true">{item.icon}</span>;
    const extra = item.cat === 'part' && item.lift ? <span class="tile-lift">💪{item.lift}</span> : item.cat === 'payload' ? <span class="tile-lift">⚖️{item.mass}</span> : null;
    const flying = item.cat === 'rocket' && flyingKind(a) === item.kind;
    return (
      <button key={item.id} class={cls('gh-tile', owned && 'owned', (worn(item) || flying) && 'worn', need && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked',
        item.cat === 'payload' && a.flownPayloads.includes(item.id) && 'flown')} aria-label={item.name} onClick={onTap}>
        {swatch}
        <span class="tile-name">{item.name}</span>{extra}
        {owned ? <span class="tile-tag">{worn(item) || flying ? '✓' : '✔︎'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(a, w), price = priceOf(a, w), open = buyable(a, w) || !!need;
    if (!open && a.more[id] === 0) return null;
    return (
      <button key={id} class={cls('gh-tile', 'repeat', need && 'locked', !need && open && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => (open ? tapWant(w) : say(r.name as Phrase))}>
        {id === 'module' ? <ModulePreview l={design} /> : <span class="tile-icon" aria-hidden="true">{r.icon}</span>}
        <span class="tile-name">{r.name}</span>
        {a.more[id] > 0 && <span class="tile-count">×{a.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : open ? <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span> : <span class="tile-tag">✔︎</span>}
      </button>
    );
  };
  const cycle = (key: keyof ModuleLook, label: Phrase) => {
    if (!voice.active) return;
    setDesign(d => {
      const max = key === 'shape' ? SHAPES.length : key === 'colour' ? MODULE_COLOURS.length : key === 'windows' ? WINDOWS_MAX + 1 : key === 'panels' ? PANELS_MAX + 1 : 2;
      const next = key === 'dish' ? { ...d, dish: !d.dish } : { ...d, [key]: ((d[key] as number) + 1) % max };
      say(key === 'shape' ? SHAPES[next.shape]! as Phrase : label);
      return next;
    });
  };

  const goalPrice = goal ? priceOf(a, goal) : 0, rank = rankOf(a.flown);
  const view = tab === 'station' ? <StationView a={a} placing={placing} onPlace={place} /> : tab === 'photos' ? <PhotoWall a={a} /> : <BaseView a={a} />;
  return (
    <div class="screen base-screen">
      <header class="gh-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Rocket Base</h1>
        <span class="rank-chip" aria-label={rank.name}>🎖️ <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <div class="base-main">
        <div class="base-view">{view}</div>
        <div class="base-side">
          <button class={cls('big-btn', 'go', 'fly-btn', a.launches > 0 && 'pulse')} aria-label="Launch"
            onClick={() => { if (!voice.active) return; if (a.launches > 0) launch(); else { sNope(); say('Play a Round to earn a Launch!'); } }}>
            <span class="fly-plane" aria-hidden="true">🚀</span><span class="fly-word">Launch</span><span class="race-count">{a.launches}</span>
            <span class="fly-to">{plan.payloadName}</span>
          </button>
          {goal && (
            <button class="goal-chip gh-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            {has(a, 'b:camera') && a.flown > 0 && <button class="big-btn side-btn" aria-label="Watch the launch" onClick={() => { if (voice.active) watch(); }}><span aria-hidden="true">🎥</span><span class="side-word">Watch</span></button>}
            {has(a, 'b:lights') && <button class="big-btn side-btn" aria-label={a.night ? 'Day launches' : 'Night launches'} onClick={() => { if (!voice.active) return; updateBase(x => ({ ...x, night: !x.night })); say(a.night ? 'Day launches!' : 'Night launches!'); }}><span aria-hidden="true">{a.night ? '☀️' : '🌙'}</span><span class="side-word">{a.night ? 'Day' : 'Night'}</span></button>}
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(a, picked) ? <span class="buy-need">🔒 {itemOf(missingNeed(a, picked)!).name}</span>
            : !buyable(a, picked) ? <span class="buy-need">💪 {bestLift(a)}</span>
            : priceOf(a, picked) <= balance
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={CUR} size={22} />{priceOf(a, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={CUR} size={18} />{priceOf(a, picked)}</span>}
        </div>
      )}
      <div class="gh-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('gh-tab', tab === t.id && 'on', t.id === 'station' && placing && 'fresh')}
          onClick={() => { baseTab.value = t.id; setPicked(null); say((t.id === 'base' ? 'Build' : t.id === 'log' ? 'Logbook' : t.name) as Phrase); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="gh-tray">
        {tab === 'base' && <div class="tiles">{byPrice(BUILDINGS).map(tile)}{(['pad', 'hangar', 'dish'] as const).map(repeatTile)}</div>}
        {tab === 'rockets' && <>
          <div class="fleet-bar"><span class="chip-note">🗼 {towerLevel(a)}</span><span class="chip-note">💪 {liftOf(look)}</span><span class="chip-note">🅿️ {pads(a)}</span></div>
          <div class="tiles">{KINDS.map(k => ROCKETS.find(r => r.kind === k)!).map(tile)}</div>
        </>}
        {tab === 'parts' && <>
          <div class="fleet-bar"><img src={rocketPic(look, 110)} alt="" /><span class="chip-note">{ROCKET_KINDS[flyingKind(a)].name}</span><span class="chip-note">💪 {liftOf(look)}</span></div>
          {SLOTS.filter(sl => sl !== 'upper' || ROCKET_KINDS[flyingKind(a)].upper).map(sl => (
            <div key={sl} class="slot-row"><h3>{SLOT_NAMES[sl]}</h3><div class="tiles">{byPrice(partsFor(sl)).map(tile)}</div></div>
          ))}
        </>}
        {tab === 'paint' && <>
          <div class="fleet-bar"><img src={rocketPic(look, 110)} alt="" /></div>
          <div class="tiles">{byPrice(PAINTS).map(tile)}</div>
          <div class="tiles">{byPrice(DECALS).map(tile)}</div>
          <div class="tiles">{byPrice(FLAMES).map(tile)}</div>
        </>}
        {tab === 'payloads' && <>
          <div class="fleet-bar"><span class="chip-note">💪 {liftOf(look)}</span>{a.waiting.map(id => <span key={id} class="chip-note">{id.startsWith('m:') ? '🧩' : PAYLOADS.find(p => p.id === id)?.icon} ⚖️{massOf(id)}</span>)}</div>
          {has(a, 'b:factory') && a.flownPayloads.includes('pl:core') && (
            <div class="gh-designer" role="group" aria-label="Design your module">
              <ModulePreview l={design} />
              <button class="chip-btn" aria-label="Shape" onClick={() => cycle('shape', 'Shape')}>🔷 {SHAPES[design.shape]}</button>
              <button class="chip-btn" aria-label="Colour" onClick={() => cycle('colour', 'Colour')}><span class="swatch-dot" style={{ background: MODULE_COLOURS[design.colour] }} /></button>
              <button class="chip-btn" aria-label="Windows" onClick={() => cycle('windows', 'Windows')}>🪟 {design.windows}</button>
              <button class="chip-btn" aria-label="Solar panels" onClick={() => cycle('panels', 'Solar panels')}>🔋 {design.panels}</button>
              <button class="chip-btn" aria-label="Dish" onClick={() => cycle('dish', 'Dish')}>📡 {design.dish ? '✓' : '–'}</button>
            </div>
          )}
          <div class="tiles">{repeatTile('module')}{byPrice(PAYLOADS as readonly PayloadItem[]).map(tile)}</div>
        </>}
        {tab === 'station' && (
          <div class="fleet-bar">
            {placing ? <span class="chip-note pulse">{iconOfModule(placing)} {nameOfPayload(placing)} → ✨</span> : <span class="chip-note">🧩 {a.station.length}</span>}
            {a.unplaced.length > 1 && <span class="chip-note">+{a.unplaced.length - 1}</span>}
          </div>
        )}
        {tab === 'photos' && <PhotoList a={a} />}
        {tab === 'log' && <Logbook a={a} dishes={dishes(a)} />}
      </div>
    </div>
  );
}

/** The photo wall: every continent and ocean from orbit (grey until he has photographed it), and the patches he has won. */
function PhotoWall({ a }: { a: BaseState }) {
  const got = new Set(a.photos);
  return (
    <div class="gh-wall">
      {CONTINENTS.map(c => <span key={c.id} class={cls('gh-photo', got.has(`c:${c.id}`) && 'got')} style={{ '--c': c.colour } as Record<string, string>}><i aria-hidden="true">🗺️</i>{c.name}</span>)}
      {OCEANS.map(o => <span key={o.id} class={cls('gh-photo', 'sea', got.has(`o:${o.id}`) && 'got')} style={{ '--c': o.tint } as Record<string, string>}><i aria-hidden="true">🌊</i>{o.name}</span>)}
    </div>
  );
}
function PhotoList({ a }: { a: BaseState }) {
  const places = a.photos.filter(id => id.startsWith('p:')).map(id => PLACES.find(p => p.id === id.slice(2))!).filter(Boolean);
  const patches = Array.from({ length: Math.floor(a.flown / 5) }, (_, i) => patchFor((i + 1) * 5)!);
  return <>
    <div class="fleet-bar"><span class="chip-note">📷 {a.photos.length} / {PLACES.length + 12}</span><span class="chip-note">🎖️ {patches.length}</span></div>
    <div class="tiles patches">{patches.slice(-60).map(p => <span key={p.n} class="gh-tile owned"><PatchBadge patch={p} size={44} /><span class="tile-name">{p.n / 5}</span></span>)}</div>
    <div class="tiles">{places.slice(-120).map(p => <span key={p.id} class="gh-tile owned"><span class="tile-icon" aria-hidden="true">{p.emoji}</span><span class="tile-name">{p.name}</span></span>)}</div>
  </>;
}
function Logbook({ a, dishes: d }: { a: BaseState; dishes: number }) {
  const rank = rankOf(a.flown);
  return (
    <div class="gh-log">
      <div class="log-row">🚀 <b>{a.flown}</b> <small>→ {rank.next}</small></div>
      <div class="log-row">🎖️ <b>{rank.name}{rank.number ? ` ${rank.number}` : ''}</b></div>
      <div class="log-row">🏅 <b>{a.bests.smooth}%</b> · 📷 <b>{a.bests.caught}</b></div>
      <div class="log-row">🧩 <b>{a.station.length}</b> · 📡 <b>{d}</b> · 🛰️ <b>{a.flownPayloads.length}</b></div>
      <div class="tiles ranks">{RANKS.map(r => <span key={r.name} class={cls('gh-tile', a.flown >= r.at && 'owned')}><span class="tile-name">{r.name}</span><span class="tile-tag">{r.at}</span></span>)}</div>
    </div>
  );
}
