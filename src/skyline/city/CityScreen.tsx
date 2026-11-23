// The City: his city from above, the big Job button, and the shop. He taps a plot to choose it: an empty one shows what he owns that
// fits there (standing it there is free), a built one lets him move it, swap it or, for a tower, buy another floor. The shop's tabs
// sell buildings, vehicles, paint, street things and building parts, more land, a fresh street of buildings made from parts, and a
// building he designs himself. A thing he can't afford goes in the buy bar to look at, with its price, and tapping Buy anyway makes
// it his Goal: the bar at the top fills toward it as he saves. Nothing here is ever taken away.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { SKYLINE_CURRENCY } from '../branding';
import { buy, player, updateCity } from '../game';
import { job, screen } from '../nav';
import { canSay, n, named, needLine, sayable, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import {
  BUILDINGS, buildingOf, DISTRICTS, itemOf, JOB_NAMES, PAINTS, PARTS, STREET_THINGS, TROPHIES, VEHICLES, vehicleOf,
  type BuildPart, type Item, type ItemKey, type PartSlot, type RoofStyle, type WindowStyle,
} from './catalog';
import {
  allPlots, available, canGrow, designOf, designsFor, districtsOpen, floorPrice, freshStreet, goalOf, isDistrictOpen, landPrice, MAX_FLOORS, nextBlock,
  owns, ownsVehicle, paintVehicle, place, population, rankOf, ride, rideFor, selectGoal, swap, tallest, type CityState, type DesignKey, type Request,
} from './city';
import { CityMap, type MapControl } from './CityMap';
import { CUSTOM_FLOORS, CUSTOM_PRICE, genDesign, type Custom } from './gen';
import { blockRect, plotById } from './grid';
import { SkylineView } from './SkylineView';
import { buildingThumb, emojiThumb, vehicleThumb } from './thumbs';

type Tab = 'build' | 'vehicles' | 'paint' | 'street' | 'parts' | 'land' | 'fresh' | 'design' | 'bests';
const TABS: readonly Tab[] = ['build', 'fresh', 'land', 'vehicles', 'paint', 'street', 'parts', 'design', 'bests'];
const TAB_ICONS: Record<Tab, string> = { build: '🏠', fresh: '🏘️', land: '🗺️', vehicles: '🚌', paint: '🎨', street: '🌳', parts: '🧱', design: '✏️', bests: '🏆' };
const TAB_NAMES = { build: 'Buildings', fresh: 'New Street', land: 'Land', vehicles: 'Vehicles', paint: 'Paint', street: 'Street', parts: 'Parts', design: 'Design', bests: 'Trophies' } as const satisfies Record<Tab, Phrase>;
const price$ = (x: number): Phrase => sayable(x).said;

/** What a tile or the buy bar is showing: something to buy, with its picture and how it's said. */
interface Offer { request: Request; name: string; said: Phrase[]; pic: string; price: number }

function itemPic(i: Item, city: CityState): string {
  if (i.key.startsWith('b:')) { const b = buildingOf(i.key)!; return buildingThumb(b.key, b.look, b.look.floors, b.size); }
  if (i.key.startsWith('v:')) { const v = vehicleOf(i.key)!; return vehicleThumb(v, v.colour); }
  if (i.key.startsWith('p:')) { const v = rideFor(city, 'bus'); return vehicleThumb(v, (i as { colour: string }).colour); }
  if (i.key.startsWith('f:')) return emojiThumb((i as { emoji: string }).emoji, '#dff3d4');
  const p = i as BuildPart;
  if (p.slot === 'wall') return buildingThumb(`m${p.value}`, { wall: p.value, trim: '#3a3f4b', floors: 2, window: 'square', roof: 'flat' }, 2, 's');
  if (p.slot === 'roof') return buildingThumb(`r${p.value}`, { wall: '#f4d8a8', trim: '#b5523b', floors: 1, window: 'square', roof: p.value as RoofStyle }, 1, 's');
  if (p.slot === 'window') return buildingThumb(`w${p.value}`, { wall: '#e9e2d0', trim: '#2b5d8a', floors: 2, window: p.value as WindowStyle, roof: 'flat' }, 2, 's');
  return emojiThumb(p.value || '▫️', '#fff6dc');
}
const itemOffer = (i: Item, city: CityState): Offer => ({ request: { t: 'item', key: i.key }, name: i.name, said: [named(i.name), ...vehicleTraits(i)], pic: itemPic(i, city), price: i.price });
/** What a vehicle does better than the one its Job comes with, said when he looks at it: it changes how the Job plays. */
function vehicleTraits(i: Item): Phrase[] {
  const v = vehicleOf(i.key), base = v && VEHICLES.find(x => x.job === v.job && x.free);
  if (!v || !base || v === base) return [];
  return [...(v.speed > base.speed ? ['It goes faster!' as const] : []), ...(v.extra ? ['It carries more!' as const] : []), ...(v.fly ? ['It flies!' as const] : [])];
}
function designPic(city: CityState, d: DesignKey, floors?: number) {
  const design = designOf(city, d)!;
  return buildingThumb(d, design.look, floors ?? design.look.floors, design.size);
}
const designSaid = (city: CityState, d: DesignKey): Phrase[] => (designOf(city, d)?.said ?? []).map(named);

export function CityScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, city = state.city;
  const [tab, setTab] = useState<Tab>('build'), [selected, setSelected] = useState<string | null>(null), [moving, setMoving] = useState<string | null>(null);
  const [trial, setTrial] = useState<Offer | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const [skyline, setSkyline] = useState(false), [night, setNight] = useState(false), [flying, setFlying] = useState(false), [swapping, setSwapping] = useState(false);
  const [paintFor, setPaintFor] = useState<ItemKey>(rideFor(city, 'bus').key);
  const map = useRef<MapControl | null>(null);
  const goal = goalOf(city), rank = rankOf(population(city));

  useEffect(() => {
    const ready: Phrase[] = city.jobs === 1 ? ['You have 1 Job ready!', 'Tap Job!'] : city.jobs > 1 ? [n(Math.min(city.jobs, 200)), 'Jobs ready!', 'Tap Job!'] : ['Play a Round to earn a Job!'];
    void voice.say('City!', ...ready);
    if (import.meta.env.DEV) (window as unknown as { __city?: unknown }).__city = { plot: (id: string) => map.current?.plotOnScreen(id) ?? null };
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  const celebrate = (said: Phrase[]) => {
    setBlocked(true); sFanfare(); confetti(30, voice.signal);
    void voice.say(...said).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  };

  function goJob() {
    if (!voice.active || blocked) return;
    if (city.jobs <= 0) { nope(); void voice.say('Play a Round to earn a Job!'); return; }
    job();
  }
  function pickTab(t: Tab) {
    if (!voice.active) return;
    setTab(t); setTrial(null); setSelected(null); setMoving(null); setSwapping(false);
    sClink();
    void voice.say(TAB_NAMES[t]);
  }

  // ---------- plots ----------
  function tapPlot(id: string | 'land' | null) {
    if (!voice.active || blocked || flying) return;
    if (id === 'land') { setSelected(null); setTab('land'); void voice.say('Another block of land!', 'It costs', price$(landPrice(city.landBought)), 'Bolts.'); return; }
    if (!id) { setSelected(null); setMoving(null); return; }
    if (moving) {
      const from = moving;
      if (from === id) { setMoving(null); return; }
      if (plotById(from)?.size !== plotById(id)?.size) { nope(); void voice.say(sizeLine(plotById(from)!.size)); return; }
      updateCity(c => swap(c, from, id)); sClink(); setMoving(null); setSelected(id); void voice.say('Moved!');
      return;
    }
    sClink(); setSelected(id); setTrial(null); setSwapping(false);
    const placed = city.plots[id];
    if (!placed) { void voice.say('Pick a building.'); return; }
    const d = designOf(city, placed.d);
    void voice.say(...designSaid(city, placed.d), ...(d?.tower ? [n(placed.floors), 'floors high!'] as Phrase[] : []));
  }
  function standHere(d: DesignKey) {
    if (!selected || !voice.active || blocked) return;
    const next = place(city, selected, d);
    if (!next) { nope(); return; }
    updateCity(() => next); sClink(); setSwapping(false);
    void voice.say(...designSaid(city, d));
  }
  function growTower() {
    if (!selected || !voice.active || blocked) return;
    const p = city.plots[selected];
    if (!p) return;
    if (!canGrow(city, selected)) { nope(); void voice.say('It is the top floor!'); return; }
    const price = floorPrice(p.floors);
    if (balance < price) { nope(); void voice.say(...needLine(price - balance), 'Play a Round to earn Bolts!'); return; }
    const was = player.state.peek().city, done = buy({ t: 'floor', plot: selected });
    if (done.kind !== 'accepted') { nope(); return; }
    const top = tallest(player.state.peek().city) === p.floors + 1;
    celebrate(['Another floor!', n(p.floors + 1), 'floors high!', ...(top ? ['This is your tallest tower!' as const] : []), ...trophyLines(done.trophies), ...rankUp(was)]);
  }

  // ---------- buying ----------
  function tryOffer(o: Offer) {
    if (!voice.active || blocked) return;
    setTrial(o); sChime();
    void voice.say(...o.said, 'It costs', price$(o.price), 'Bolts.', ...(balance < o.price ? needLine(o.price - balance) : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    if (balance < trial.price) {
      nope();
      if (trial.request.t === 'item') updateCity(c => selectGoal(c, (trial.request as { key: ItemKey }).key));
      void voice.say(...needLine(trial.price - balance), 'Play a Round to earn Bolts!');
      return;
    }
    const r = trial.request, before = player.state.peek().city;
    const done = buy(r);
    if (done.kind !== 'accepted') { nope(); return; }
    setTrial(null);
    const after = player.state.peek().city;
    const lines: Phrase[] = [];
    if (r.t === 'land') {
      lines.push('New land!', 'Your city grew!');
      const id = after.blocks.find(b => !before.blocks.includes(b));
      if (id !== undefined) { const rect = blockRect(id); map.current?.look({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }); }
    } else {
      lines.push('You got', ...trial.said);
      const placedAt = Object.keys(after.plots).find(id => !before.plots[id] || before.plots[id]!.d !== after.plots[id]!.d);
      if (placedAt) { const p = plotById(placedAt)!; map.current?.look({ x: p.rect.x + p.rect.w / 2, y: p.rect.y }); setSelected(placedAt); }
      else if (r.t !== 'item' || r.key.startsWith('b:')) lines.push('Buy more land to build more!');
      const v = r.t === 'item' ? vehicleOf(r.key) : null;
      if (v) { lines.push('It drives', named(JOB_NAMES[v.job]), 'Jobs.'); setPaintFor(v.key); }
    }
    celebrate([...lines, ...trophyLines(done.trophies), ...rankUp(before)]);
  }
  const trophyLines = (keys: readonly string[]): Phrase[] => keys.flatMap(k => { const t = TROPHIES.find(x => x.key === k); return t ? ['You won' as const, named(t.name)] : []; });

  function tapItem(i: Item) {
    if (!voice.active || blocked) return;
    if (owns(city, i.key) || (i.key.startsWith('v:') && ownsVehicle(city, i.key))) {
      setTrial(null); sClink();
      if (i.key.startsWith('v:')) { updateCity(c => ride(c, i.key)); setPaintFor(i.key); void voice.say(named(i.name), 'It drives', named(JOB_NAMES[vehicleOf(i.key)!.job]), 'Jobs.'); return; }
      if (i.key.startsWith('p:')) { updateCity(c => paintVehicle(c, paintFor, i.key)); void voice.say(named(i.name)); return; }
      if (i.key.startsWith('b:')) {
        const free = allPlots(city).find(p => !city.plots[p.id] && p.size === buildingOf(i.key)!.size);
        if (free) { setSelected(free.id); const p = plotById(free.id)!; map.current?.look({ x: p.rect.x + p.rect.w / 2, y: p.rect.y }); }
        void voice.say(named(i.name), ...(free ? ['Tap an empty plot to build on it.' as const] : [sizeLine(buildingOf(i.key)!.size)]));
        return;
      }
      void voice.say(named(i.name));
      return;
    }
    if (!isDistrictOpen(city, i.district)) { nope(); void voice.say(named(i.name), 'Open', named(DISTRICTS[i.district]!.name), 'to get it.', 'Do more Jobs to open it!'); return; }
    if (!available(city, i)) {
      nope();
      const v = vehicleOf(i.key), b = v && BUILDINGS.find(x => x.job === v.job);
      void voice.say(named(i.name), ...(b ? ['You can buy this when you have' as const, named(b.name)] : []));
      return;
    }
    tryOffer(itemOffer(i, city));
  }

  // ---------- the designer ----------
  const ownedParts = (slot: PartSlot) => PARTS.filter(p => p.slot === slot && owns(city, p.key));
  const [custom, setCustom] = useState<Custom>(() => ({ wall: '#f4d8a8', trim: '#3a3f4b', roof: 'flat', window: 'square', sign: '', floors: 3, size: 's' }));
  const cycle = (slot: PartSlot) => {
    if (!voice.active) return;
    const parts = ownedParts(slot), key = slot === 'wall' ? custom.wall : slot === 'roof' ? custom.roof : slot === 'window' ? custom.window : custom.sign;
    const i = parts.findIndex(p => p.value === key), next = parts[(i + 1) % parts.length]!;
    sClink();
    setCustom(c => ({ ...c, ...(slot === 'wall' ? { wall: next.value } : slot === 'roof' ? { roof: next.value as RoofStyle } : slot === 'window' ? { window: next.value as WindowStyle } : { sign: next.value }) }));
    void voice.say(named(next.name));
  };
  const customPic = useMemo(() => buildingThumb(`custom|${JSON.stringify(custom)}`, { wall: custom.wall, trim: custom.trim, floors: custom.floors, window: custom.window, roof: custom.roof, ...(custom.sign && { sign: custom.sign }) }, custom.floors, custom.size), [custom]);

  // ---------- what the panel shows ----------
  const sel = selected ? plotById(selected) : null, selPlaced = selected ? city.plots[selected] : undefined;
  const open = districtsOpen(city.done);
  let panel;
  if (sel) {
    const fits = designsFor(city, sel.size);
    panel = (
      <div class="plot-panel">
        <div class="plot-head">
          <button class="x" aria-label="Close" onClick={() => { setSelected(null); setMoving(null); setSwapping(false); }}>✕</button>
          {selPlaced ? <img class="plot-pic" src={designPic(city, selPlaced.d, selPlaced.floors)} alt="" /> : <span class={`plot-empty ${sel.size}`} aria-hidden="true" />}
          {selPlaced && designOf(city, selPlaced.d)?.tower && <span class="floors-chip">🏢 {selPlaced.floors}</span>}
        </div>
        {selPlaced && !swapping
          ? <div class="plot-actions">
              {designOf(city, selPlaced.d)?.tower && (canGrow(city, selected!)
                ? <button class={`big-btn go floor-btn ${balance >= floorPrice(selPlaced.floors) ? 'pulse' : 'short'}`} aria-label="Another floor" onClick={growTower}>＋🏢 {floorPrice(selPlaced.floors)}<CurrencyIcon kind={SKYLINE_CURRENCY} size={24} /></button>
                : <span class="top-floor">🏁 {MAX_FLOORS}</span>)}
              <button class={`big-btn ${moving ? 'on' : ''}`} aria-label="Move" onClick={() => { if (!voice.active) return; sClink(); setMoving(moving ? null : selected); void voice.say('Tap where it goes.'); }}>↔️</button>
              <button class="big-btn" aria-label="Swap" onClick={() => { if (!voice.active) return; sClink(); setSwapping(true); void voice.say('Pick a building.'); }}>🔁</button>
              <button class="big-btn" aria-label="Clear" onClick={() => { if (!voice.active) return; sClink(); updateCity(c => place(c, selected!, null)); }}>🧹</button>
            </div>
          : <div class="sl-tray">
              {fits.length ? fits.map(d => (
                <button key={d} class={`sl-tile owned ${selPlaced?.d === d ? 'on' : ''}`} aria-label={designOf(city, d)!.said.join(' ')} onClick={() => standHere(d)}>
                  <img class="tile-pic" src={designPic(city, d)} alt="" draggable={false} />
                  <span class="mt-name">{designOf(city, d)!.said.join(' ')}</span>
                </button>
              )) : <p class="tray-note">🛒 {sel.size === 'l' ? '⬜' : sel.size === 'w' ? '▭' : '▫️'}</p>}
            </div>}
      </div>
    );
  } else if (tab === 'build' || tab === 'vehicles' || tab === 'paint' || tab === 'street' || tab === 'parts') {
    const items: readonly Item[] = tab === 'build' ? BUILDINGS : tab === 'vehicles' ? VEHICLES : tab === 'paint' ? PAINTS : tab === 'street' ? STREET_THINGS : PARTS;
    const sorted = [...items].sort((a, b) => a.district - b.district || a.price - b.price);
    panel = (
      <>
        {tab === 'paint' && <div class="paint-for"><img src={vehicleThumb(vehicleOf(paintFor)!, (itemOf(city.paint[paintFor] ?? '') as { colour?: string } | null)?.colour ?? vehicleOf(paintFor)!.colour)} alt="" /><span>{vehicleOf(paintFor)!.name}</span></div>}
        <div class="sl-tray">
          {sorted.map(i => {
            const had = owns(city, i.key) || (i.key.startsWith('v:') && ownsVehicle(city, i.key)), locked = !isDistrictOpen(city, i.district), can = !had && available(city, i) && balance >= i.price;
            const on = (i.key.startsWith('v:') && rideFor(city, vehicleOf(i.key)!.job).key === i.key) || (i.key.startsWith('p:') && city.paint[paintFor] === i.key);
            const tag = had ? (on ? '✓' : '') : locked ? `🔒` : !available(city, i) ? '🔑' : <>{i.price}<CurrencyIcon kind={SKYLINE_CURRENCY} size={16} /></>;
            return (
              <button key={i.key} class={`sl-tile ${had ? 'owned' : 'locked'} ${locked ? 'district-locked' : ''} ${can ? 'can' : ''} ${on ? 'on' : ''} ${trial?.request.t === 'item' && trial.request.key === i.key ? 'trying' : ''}`} aria-label={i.name} onClick={() => tapItem(i)}>
                <img class="tile-pic" src={itemPic(i, city)} alt="" draggable={false} loading="lazy" />
                <span class="mt-name">{i.name}</span>
                <span class="mt-tag">{tag}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  } else if (tab === 'land') {
    const next = nextBlock(city), price = landPrice(city.landBought), d = next < 24 ? DISTRICTS[Math.floor(next / 4)]! : null;
    panel = (
      <div class="land-panel">
        <p class="land-count">🗺️ {city.blocks.length}</p>
        <button class="sl-tile big" aria-label="Another block of land" onClick={() => tryOffer({ request: { t: 'land' }, name: 'Land', said: ['Another block of land!'], pic: emojiThumb('🪧', '#cfe8b8'), price })}>
          <img class="tile-pic" src={emojiThumb('🪧', '#cfe8b8')} alt="" />
          <span class="mt-name">{d ? d.name : 'New Town'}</span>
          <span class="mt-tag">{price}<CurrencyIcon kind={SKYLINE_CURRENCY} size={16} /></span>
        </button>
        <div class="districts">{DISTRICTS.map(x => <span key={x.id} class={`district ${x.id < open ? 'open' : ''}`} style={{ background: x.pave }}>{x.id < open ? '✓' : '🔒'} {x.name}</span>)}</div>
      </div>
    );
  } else if (tab === 'fresh') {
    panel = (
      <div class="sl-tray">
        {freshStreet(city).map(seed => {
          const g = genDesign(seed), pic = buildingThumb(`g:${seed}`, g.look, g.look.floors, g.size), offer: Offer = { request: { t: 'gen', seed }, name: `${g.colour} ${g.kind}`, said: [named(g.colour), named(g.kind)], pic, price: g.price };
          return (
            <button key={seed} class={`sl-tile locked ${balance >= g.price ? 'can' : ''} ${trial?.request.t === 'gen' && trial.request.seed === seed ? 'trying' : ''}`} aria-label={offer.name} onClick={() => tryOffer(offer)}>
              <img class="tile-pic" src={pic} alt="" draggable={false} />
              <span class="mt-name">{offer.name}</span>
              <span class="mt-tag">{g.price}<CurrencyIcon kind={SKYLINE_CURRENCY} size={16} /></span>
            </button>
          );
        })}
      </div>
    );
  } else if (tab === 'design') {
    const slots: [PartSlot, Phrase][] = [['wall', 'Walls'], ['roof', 'Roof'], ['window', 'Windows'], ['sign', 'Sign']];
    panel = (
      <div class="design-panel">
        <img class="design-pic" src={customPic} alt="Your building" />
        <div class="design-controls">
          {slots.map(([slot, word]) => <button key={slot} class="big-btn part-btn" aria-label={word} onClick={() => cycle(slot)}>{slot === 'wall' ? '🧱' : slot === 'roof' ? '🏠' : slot === 'window' ? '🪟' : '🪧'}</button>)}
          <div class="floors-pick">
            <button class="big-btn" aria-label="Fewer floors" onClick={() => { if (voice.active && custom.floors > 1) { sClink(); setCustom(c => ({ ...c, floors: c.floors - 1 })); } }}>－</button>
            <span>🏢 {custom.floors}</span>
            <button class="big-btn" aria-label="More floors" onClick={() => { if (voice.active && custom.floors < CUSTOM_FLOORS) { sClink(); setCustom(c => ({ ...c, floors: c.floors + 1 })); } }}>＋</button>
          </div>
          <button class="big-btn" aria-label={custom.size === 's' ? 'Make it wide' : 'Make it small'} onClick={() => { if (voice.active) { sClink(); setCustom(c => ({ ...c, size: c.size === 's' ? 'w' : 's' })); } }}>{custom.size === 's' ? '▫️' : '▭'}</button>
          <button class="big-btn go build-btn" aria-label="Build it" onClick={() => tryOffer({ request: { t: 'custom', custom }, name: 'Your building', said: ['Your building'], pic: customPic, price: CUSTOM_PRICE })}>Build it! {CUSTOM_PRICE}<CurrencyIcon kind={SKYLINE_CURRENCY} size={20} /></button>
        </div>
      </div>
    );
  } else {
    panel = (
      <div class="bests-panel">
        <div class="bests">
          <button class="best" aria-label="Biggest city" onClick={() => void voice.say('Your city is a', ...rankSaid(rank))}>👥 {population(city)}<small>{rank.name}{rank.n ? ` ${rank.n}` : ''}</small></button>
          <button class="best" aria-label="Tallest tower" onClick={() => void voice.say('Tallest tower', n(Math.min(200, Math.max(city.best.floors, tallest(city)))), 'floors high!')}>🏢 {Math.max(city.best.floors, tallest(city))}<small>🏁</small></button>
          <button class="best" aria-label="Most in one Job" onClick={() => void voice.say('Most in one Job', n(Math.min(200, city.best.most)))}>🚌 {city.best.most}<small>⭐</small></button>
          <button class="best" aria-label="Jobs done" onClick={() => void voice.say(...(canSay(city.done) ? [n(city.done)] : []), 'Jobs.')}>✅ {city.done}<small>Jobs</small></button>
        </div>
        <div class="trophy-shelf">{TROPHIES.map(t => {
          const won = city.trophies.includes(t.key);
          return <button key={t.key} class={`trophy ${won ? 'won' : ''}`} aria-label={t.name} onClick={() => void voice.say(named(t.name), ...(won ? [] : ['Win it by doing Jobs!'] as const))}><span>{won ? t.emoji : '❔'}</span></button>;
        })}</div>
      </div>
    );
  }

  return (
    <div class={`screen sl-city-screen ${night ? 'night' : ''}`}>
      <header class="work-head sl-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <button class="rank-chip" aria-label="Population" onClick={() => void voice.say('Your city is a', ...rankSaid(rank))}><span>👥 {population(city)}</span><small>{rank.name}{rank.n ? ` ${rank.n}` : ''}</small></button>
        {goal && <button class={`goalchip ${balance >= goal.price && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => {
          if (!voice.active) return;
          const t: Tab = goal.key.startsWith('b:') ? 'build' : goal.key.startsWith('v:') ? 'vehicles' : goal.key.startsWith('p:') ? 'paint' : goal.key.startsWith('f:') ? 'street' : 'parts';
          setTab(t); setSelected(null); tryOffer(itemOffer(goal, city));
        }}>
          <img class="gi" src={itemPic(goal, city)} alt="" />
          <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goal.price)) * 100)}%` }} /></span>
        </button>}
        <CurrencyPile kind={SKYLINE_CURRENCY} count={balance} />
      </header>
      <div class="city-body">
        <section class="map-side">
          <CityMap city={city} selected={selected} onTap={tapPlot} control={map} onNight={setNight} />
          <div class="map-tools">
            <IconButton label="Zoom in" onClick={() => map.current?.zoom(1)}>➕</IconButton>
            <IconButton label="Zoom out" onClick={() => map.current?.zoom(-1)}>➖</IconButton>
            <IconButton label={night ? 'Day' : 'Night'} onClick={() => { if (!voice.active) return; const nn = !night; setNight(nn); map.current?.setNight(nn); void voice.say(nn ? 'Good night!' : 'Good morning!'); }}>{night ? '☀️' : '🌙'}</IconButton>
            <IconButton label="Fly over" class={flying ? 'on' : ''} onClick={() => { if (!voice.active) return; if (flying) { map.current?.stopFlying(); return; } setFlying(true); setSelected(null); void voice.say('Fly over!'); map.current?.fly(() => setFlying(false)); }}>🚁</IconButton>
            <IconButton label="Skyline" onClick={() => { if (!voice.active) return; sClink(); setSkyline(true); void voice.say('Skyline'); }}>🏙️</IconButton>
          </div>
          <div class="map-go">
            <button class={`big-btn go job-btn ${wiggle ? 'wiggle' : ''} ${city.jobs > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Job" onClick={goJob}>
              <span class="job-icon" aria-hidden="true">🚌</span><span class="job-word">Job</span><span class="job-count">{city.jobs}</span>
            </button>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
          {moving && <div class="map-note">↔️ 👆</div>}
        </section>
        <section class="shop-side">
          <div class="sl-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab && !sel} aria-label={TAB_NAMES[t]} class={`sl-tab ${t === tab && !sel ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          {panel}
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <img class="buy-pic" src={trial.pic} alt="" />
              <span class="buy-name">{trial.name}</span>
              <button class={`big-btn go buy ${balance >= trial.price ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{trial.price}<CurrencyIcon kind={SKYLINE_CURRENCY} size={28} /></button>
            </div>
          )}
        </section>
      </div>
      {skyline && (
        <div class="skyline-overlay" role="dialog" aria-label="Skyline">
          <SkylineView city={city} night={night} near={0} />
          <IconButton label="Close the Skyline" class="skyline-close" onClick={() => setSkyline(false)}>✕</IconButton>
        </div>
      )}
    </div>
  );
}

/** A purchase that takes the city to a new rank, past any it has had (the ranks go on for ever: Super City 1, 2, 3...), is cheered. */
function rankUp(before: CityState): Phrase[] {
  const was = rankOf(Math.max(before.best.population, population(before))).at, now = rankOf(population(player.state.peek().city));
  return now.at > was ? ['Your city is a', ...rankSaid(now)] : [];
}
function sizeLine(size: 's' | 'w' | 'l'): Phrase { return size === 'l' ? 'It needs a big plot.' : size === 'w' ? 'It needs a wide plot.' : 'It needs a small plot.'; }
function rankSaid(rank: ReturnType<typeof rankOf>): Phrase[] { return rank.name === 'Super City' ? ['Super City', sayable(rank.n).said] : [named(rank.name)]; }
