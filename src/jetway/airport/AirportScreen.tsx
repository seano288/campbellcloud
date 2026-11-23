// The Airport: his airport from above with his planes at their gates, the Goal (a bar filling toward the thing he's saving for), the big
// Fly button with the Flights he has, "Watch it run", the Routes board, and the tray: Build (the pieces, then the again-and-again
// things), Planes (the Fleet: tap one to fly it, name it and dress it), Paint, Stripes, Tails, Marks (and his airline's name), Trucks,
// Signs (and the runway light colour) and Garden. Tapping something says its name and price; he buys it with Buy when he can, and
// otherwise it becomes his Goal. A dear thing always sits beside cheap ones, since each tab is sorted by price.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { drawAirport, drawVehicle } from '../art/airport';
import { drawPlaneTop, lookOf, planePic } from '../art/plane';
import { JET_CURRENCY } from '../branding';
import { buy, player, updateAirport } from '../game';
import { airportTab, fly, screen, watch } from '../nav';
import { needLine, sayable, sayNum, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import {
  buyable, canFly, flyNeeds, goalOf, has, lightChoices, lightHex, liveryOf, missingNeed, planFlight, priceOf, rankOf, selectGoal, wantKey, wear, type AirportState, type Want,
} from './airport';
import {
  AIRLINE_FIRST, AIRLINE_SECOND, DECOR, itemOf, PLANE_SPECS, MARKS, PAINTS, PIECES, PLANE_NAMES, PLANES, REPEATS, SIGNS, STRIPES, TAILS, VEHICLES, type Item, type PlaneModel, type RepeatId,
} from './catalog';
import { prizeById } from './charter';
import { PLOT_H, PLOT_W } from './plot';
import { stands } from '../watch/traffic';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'build', name: 'Build', icon: '🏗️' }, { id: 'planes', name: 'Planes', icon: '✈️' }, { id: 'paint', name: 'Paint', icon: '🎨' },
  { id: 'stripes', name: 'Stripes', icon: '〰️' }, { id: 'tails', name: 'Tails', icon: '⭐' }, { id: 'marks', name: 'Marks', icon: '🔰' },
  { id: 'trucks', name: 'Trucks', icon: '🚒' }, { id: 'signs', name: 'Signs', icon: '🪧' }, { id: 'garden', name: 'Garden', icon: '🌷' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const itemsFor = (tab: TabId): readonly Item[] => {
  switch (tab) {
    case 'build': return byPrice(PIECES);
    case 'planes': return PLANES;
    case 'paint': return byPrice(PAINTS);
    case 'stripes': return byPrice(STRIPES);
    case 'tails': return byPrice(TAILS);
    case 'marks': return byPrice(MARKS);
    case 'trucks': return byPrice(VEHICLES);
    case 'signs': return byPrice(SIGNS);
    case 'garden': return byPrice(DECOR);
  }
};
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };

/** The airport, drawn to fit, with his planes at their stands. */
export function AirportView({ a, class: c = '' }: { a: AirportState; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
      const k = Math.min(r.width / PLOT_W, r.height / PLOT_H);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      ctx.translate((r.width - PLOT_W * k) / 2, (r.height - PLOT_H * k) / 2); ctx.scale(k, k);
      const t = ms / 1000;
      drawAirport(ctx, a, t);
      const spots = stands(a);
      PLANES.filter(p => has(a, p.id) && p.model !== 'heli').slice(0, spots.length).forEach((p, i) => {
        const s = spots[i]!;
        drawPlaneTop(ctx, lookOf(p.model, liveryOf(a, p.model), a.airline.mark), s.x, s.y, -Math.PI / 2, .55 * PLANE_SPECS[p.model].size, t);
      });
      if (has(a, 'plane:heli') && has(a, 'piece:helipad')) drawPlaneTop(ctx, lookOf('heli', liveryOf(a, 'heli'), a.airline.mark), 65, 740, -Math.PI / 2, .7, t);
      VEHICLES.filter(v => has(a, v.id)).slice(0, 10).forEach((v, i) => drawVehicle(ctx, 320 + (i % 10) * 54, 578, 0, v.hex, v.len));
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [a]);
  return <canvas ref={ref} class={cls('airport-canvas', c)} role="img" aria-label="Your airport from above" />;
}

export function AirportScreen() {
  const voice = useVoice(), state = player.state.value, a = state.airport, balance = state.currency.balance;
  const tab = airportTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null), [trim, setTrim] = useState(false);
  const goal = goalOf(a), plan = useMemo(() => planFlight(a), [a]);
  useEffect(() => { void voice.say('Airport!', ...(a.flights === 1 ? ['You have 1 Flight ready!' as const] : a.flights > 1 ? [...sayNum(a.flights), 'Flights ready!' as const] : [])); }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(a, w);
    setPicked(w);
    if (need) { sNope(); say(nameOf(w) as Phrase, 'Build this first:', itemOf(need).name as Phrase); return; }
    const price = priceOf(a, w);
    if (price > balance) { updateAirport(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const before = player.state.peek().airport.trophies.length;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const after = player.state.peek().airport;
    say('You got', nameOf(w) as Phrase, ...(w.kind === 'more' ? ['You can build more of these!' as const] : []), ...(after.trophies.length > before ? ['You won a Trophy!' as const] : []));
  }
  /** Something he owns in a looks tab goes on the plane he flies. */
  function wearIt(item: Item) {
    if (!voice.active) return;
    const m = a.flying;
    if (item.cat === 'paint') updateAirport(x => wear(x, m, trim ? { trim: item.id } : { base: item.id }));
    if (item.cat === 'stripe') updateAirport(x => wear(x, m, { stripe: item.id }));
    if (item.cat === 'tail') updateAirport(x => wear(x, m, { tail: item.id }));
    if (item.cat === 'mark') updateAirport(x => ({ ...x, airline: { ...x.airline, mark: item.id } }));
    sChime(); say(item.name as Phrase);
  }
  function tapPlane(m: PlaneModel) {
    if (!voice.active) return;
    if (!has(a, `plane:${m}`)) { tapWant({ kind: 'item', id: `plane:${m}` }); return; }
    setPicked(null);
    if (!canFly(a, m)) { sNope(); say('This plane needs', itemOf(flyNeeds(m)).name as Phrase, 'to fly!'); return; }
    updateAirport(x => ({ ...x, flying: m }));
    sChime(); say('You will fly', itemOf(`plane:${m}`).name as Phrase);
  }

  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(a, item.id), need = !owned && missingNeed(a, w), afford = !owned && !need && item.price <= balance;
    const worn = (item.cat === 'paint' && (trim ? liveryOf(a, a.flying).trim : liveryOf(a, a.flying).base) === item.id) || (item.cat === 'stripe' && liveryOf(a, a.flying).stripe === item.id)
      || (item.cat === 'tail' && liveryOf(a, a.flying).tail === item.id) || (item.cat === 'mark' && a.airline.mark === item.id) || (item.cat === 'plane' && a.flying === item.model);
    const looks = item.cat === 'paint' || item.cat === 'stripe' || item.cat === 'tail' || item.cat === 'mark';
    const onTap = () => (item.cat === 'plane' ? tapPlane(item.model) : owned && looks ? wearIt(item) : owned ? say(item.name as Phrase) : tapWant(w));
    const swatch = item.cat === 'paint' ? <span class="swatch-dot" style={{ background: item.hex === 'rainbow' ? 'linear-gradient(90deg,#e63946,#ff7a00,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1)' : item.hex }} />
      : item.cat === 'plane' ? <img src={planePic(lookOf(item.model, liveryOf(a, item.model), a.airline.mark), 160, 80)} alt="" />
      : <span class="tile-icon" aria-hidden="true">{item.cat === 'tail' && !item.glyph ? '▫️' : item.icon}</span>;
    return (
      <button key={item.id} class={cls('jw-tile', owned && 'owned', worn && 'worn', need && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked', item.cat === 'plane' && owned && !canFly(a, item.model) && 'grounded')}
        aria-label={item.name} onClick={onTap}>
        {swatch}
        <span class="tile-name">{item.name}</span>
        {owned ? <span class="tile-tag">{worn ? '✓' : '✔︎'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={JET_CURRENCY} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(a, w), price = priceOf(a, w);
    return (
      <button key={id} class={cls('jw-tile', 'repeat', need && 'locked', !need && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => tapWant(w)}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span><span class="tile-name">{r.name}</span>
        {a.more[id] > 0 && <span class="tile-count">×{a.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={JET_CURRENCY} size={16} />{price}</span>}
      </button>
    );
  };

  const liv = liveryOf(a, a.flying), flyingName = PLANES.find(p => p.model === a.flying)!.name;
  const goalPrice = goal ? priceOf(a, goal) : 0, rank = rankOf(a.passengers);
  return (
    <div class="screen airport-screen">
      <header class="jw-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>My Airport</h1>
        <span class="pax-board" aria-label={`${a.passengers} passengers`}>🧍 {a.passengers.toLocaleString('en-US')} <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={JET_CURRENCY} count={balance} />
      </header>
      <div class="airport-main">
        <div class="airport-view"><AirportView a={a} /></div>
        <div class="airport-side">
          <button class={cls('big-btn', 'go', 'fly-btn', a.flights > 0 && 'pulse')} aria-label={`Fly to ${plan.dest.name}`}
            onClick={() => { if (!voice.active) return; if (a.flights > 0) fly(); else { sNope(); say('Play a Round to earn a Flight!'); } }}>
            <span class="fly-plane" aria-hidden="true">✈️</span><span class="fly-word">Fly</span><span class="race-count">{a.flights}</span>
            <span class="fly-to">{plan.dest.icon} {plan.dest.name}</span>
          </button>
          {goal && (
            <button class="goal-chip jw-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            <button class="big-btn side-btn" aria-label="Watch it run" onClick={() => { if (voice.active) watch(); }}>👀</button>
            <button class="big-btn side-btn" aria-label="Routes" onClick={() => { if (voice.active) screen.value = 'routes'; }}>🗺️</button>
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(a, picked) ? <span class="buy-need">🔒 {itemOf(missingNeed(a, picked)!).name}</span>
            : priceOf(a, picked) <= balance && buyable(a, picked)
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={JET_CURRENCY} size={22} />{priceOf(a, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={JET_CURRENCY} size={18} />{priceOf(a, picked)}</span>}
        </div>
      )}
      <div class="jw-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('jw-tab', tab === t.id && 'on')} onClick={() => { airportTab.value = t.id; setPicked(null); say(t.name as Phrase); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="jw-tray">
        {tab === 'planes' && (
          <div class="fleet-bar">
            <img src={planePic(lookOf(a.flying, liv, a.airline.mark), 200, 100)} alt="" />
            <button class="chip-btn" aria-label="Plane name" onClick={() => { if (!voice.active) return; const next = (liv.name + 1) % PLANE_NAMES.length; updateAirport(x => wear(x, a.flying, { name: next })); say(PLANE_NAMES[next]!); }}>🏷️ {PLANE_NAMES[liv.name]}</button>
            <span class="chip-note">{flyingName}</span>
          </div>
        )}
        {tab === 'paint' && (
          <div class="fleet-bar">
            <img src={planePic(lookOf(a.flying, liv, a.airline.mark), 200, 100)} alt="" />
            <button class={cls('chip-btn', !trim && 'on')} aria-label="Body" onClick={() => { setTrim(false); say('Body'); }}>Body</button>
            <button class={cls('chip-btn', trim && 'on')} aria-label="Trim" onClick={() => { setTrim(true); say('Trim'); }}>Trim</button>
          </div>
        )}
        {(tab === 'stripes' || tab === 'tails') && <div class="fleet-bar"><img src={planePic(lookOf(a.flying, liv, a.airline.mark), 200, 100)} alt="" /></div>}
        {tab === 'marks' && (
          <div class="fleet-bar">
            <button class="chip-btn" aria-label="Airline first name" onClick={() => { if (!voice.active) return; const f = (a.airline.first + 1) % AIRLINE_FIRST.length; updateAirport(x => ({ ...x, airline: { ...x.airline, first: f } })); say(AIRLINE_FIRST[f]!, AIRLINE_SECOND[a.airline.second]!); }}>{AIRLINE_FIRST[a.airline.first]}</button>
            <button class="chip-btn" aria-label="Airline second name" onClick={() => { if (!voice.active) return; const s = (a.airline.second + 1) % AIRLINE_SECOND.length; updateAirport(x => ({ ...x, airline: { ...x.airline, second: s } })); say(AIRLINE_FIRST[a.airline.first]!, AIRLINE_SECOND[s]!); }}>{AIRLINE_SECOND[a.airline.second]}</button>
          </div>
        )}
        {tab === 'signs' && (
          <div class="fleet-bar">
            <span class="chip-note">💡</span>
            {lightChoices(a).map(id => <button key={id} class={cls('chip-btn', 'light-dot', a.lights === id && 'on')} aria-label={id === 'white' ? 'White lights' : (prizeById(id)?.name ?? itemOf(id).name)}
              style={{ '--dot': lightHex(id) === 'rainbow' ? 'conic-gradient(#e63946,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1,#e63946)' : lightHex(id) } as Record<string, string>}
              onClick={() => { if (!voice.active) return; updateAirport(x => ({ ...x, lights: id })); say('Lights'); }}><i /></button>)}
          </div>
        )}
        {tab === 'tails' && a.owned.filter(id => prizeById(id)?.kind === 'tail').length > 0 && (
          <div class="tiles">{a.owned.filter(id => prizeById(id)?.kind === 'tail').map(id => {
            const p = prizeById(id)!;
            return <button key={id} class={cls('jw-tile', 'owned', 'charter', liv.tail === id && 'worn')} aria-label={p.name} onClick={() => { if (!voice.active) return; updateAirport(x => wear(x, a.flying, { tail: id })); sChime(); say(p.name as Phrase); }}>
              <span class="tile-icon" aria-hidden="true">{'glyph' in p ? p.glyph : '🧭'}</span><span class="tile-name">{p.name}{'number' in p ? ` ${p.number}` : ''}</span><span class="tile-tag">🧭</span></button>;
          })}</div>
        )}
        <div class="tiles">
          {itemsFor(tab).filter(i => i.price > 0 || i.cat === 'plane' || has(a, i.id)).map(tile)}
          {tab === 'build' && REPEATS.map(r => repeatTile(r.id))}
        </div>
      </div>
    </div>
  );
}
