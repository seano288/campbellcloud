// The Coaster Yard: the Goal (a bar filling toward what he's saving for), and the tabs: Build (the builder), Track (pieces, track styles,
// more track, another coaster), Train (bodies, fronts, paints, stripes, riders, another car), Park (his park from above: tap a spot, then
// a ride or stand to put there; rides, stands and more land to buy), Looks (station themes, hats, balloons) and Records (his Thrill bests,
// riders, rank, Trophies and prizes). Tapping something says its name and price; he buys it with Buy when he can, and otherwise it
// becomes his Goal. A dear thing always sits beside cheap ones: each tab is by price.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { CUR } from '../branding';
import { guestPaint } from '../coaster/guest';
import { PIECES } from '../coaster/pieces';
import { buy, player, updateYard } from '../game';
import { screen, yardTab, watch } from '../nav';
import { needLine, sayable, type Phrase } from '../phrases';
import {
  BALLOONS, BODIES, FRONTS, HATS, itemOf, PAINTS, PRIZE_BODIES, REPEATS, RIDERS, RIDES, STANDS, STRIPES, STYLES, THEMES, type Item, type RepeatId,
} from '../park/catalog';
import {
  canRideMine, canUse, coasterOf, does, goalOf, has, LEGEND_EVERY, plotsOf, priceOf, putOnSpot, rankOf, RANKS, selectGoal, toggleNight, TROPHIES, unplaced, wantKey, wear,
  type Want, type YardState,
} from '../park/yard';
import { PRIZE_PIECES } from '../coaster/pieces';
import { useVoice } from '../voice';
import { Builder } from './Builder';
import { ParkMap } from './ParkMap';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'build', name: 'Build', icon: '🎢' }, { id: 'track', name: 'Track', icon: '🛤️' }, { id: 'train', name: 'Train', icon: '🚃' },
  { id: 'park', name: 'Park', icon: '🎡' }, { id: 'looks', name: 'Looks', icon: '🎪' }, { id: 'records', name: 'Records', icon: '🏆' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => ['It costs', sayable(n).said, n === 1 ? 'Token.' : 'Tokens.'];
const said = (x: string | number) => `${x}` as Phrase;

/** The bar toward his Goal: filling as Tokens come in, so saving up looks like progress. */
function GoalBar({ y, balance, onTap }: { y: YardState; balance: number; onTap(w: Want): void }) {
  const g = goalOf(y, balance);
  if (!g) return null;
  const price = priceOf(y, g), fill = Math.min(1, balance / Math.max(1, price));
  return (
    <button class="cc-goal" aria-label={`Goal: ${nameOf(g)}`} onClick={() => onTap(g)}>
      <span class="cc-goal-icon" aria-hidden="true">{iconOf(g)}</span>
      <span class="cc-goal-bar"><i style={{ width: `${fill * 100}%` }} /></span>
      <span class="tile-cost"><CurrencyIcon kind={CUR} size={18} />{balance}/{price}</span>
    </button>
  );
}

export function YardScreen() {
  const voice = useVoice(), state = player.state.value, y = state.yard, balance = state.currency.balance;
  const tab = yardTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null), [spot, setSpot] = useState<number | null>(null);
  useEffect(() => { void voice.say('Coaster Yard', ...(y.rides === 1 ? ['You have 1 Ride!' as const] : y.rides > 1 ? [said(Math.min(99, y.rides)), 'Rides!' as const] : [])); }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    setPicked(w);
    const price = priceOf(y, w);
    if (price > balance) { updateYard(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const extra: Phrase[] = w.kind === 'more' ? ['You can get more of these!'] : [];
    if (w.kind === 'item' && (w.id.startsWith('rk:') || w.id.startsWith('sd:'))) { const ny = player.state.peek().yard; extra.push(ny.spots.includes(w.id) ? 'It is in your park!' : 'Buy more land to make room for it!'); }
    if (w.kind === 'item' && w.id.startsWith('pc:')) extra.push('It is in your tray!');
    say('You got', nameOf(w) as Phrase, ...extra);
  }
  function tapOwned(item: Item) {
    if (!voice.active) return;
    setPicked(null);
    const next = wear(y, item.id);
    if (next) { updateYard(() => next); sChime(); }
    say(item.name as Phrase);
  }
  function tapSpot(i: number) {
    if (!voice.active) return;
    if (spot === i) { setSpot(null); return; }
    setSpot(i); sChime();
    const id = y.spots[i];
    say(id ? itemOf(id).name as Phrase : 'Pick something to put here!');
  }
  function place(id: string) {
    if (!voice.active || spot === null) return;
    const next = putOnSpot(y, spot, id);
    if (!next) { sNope(); return; }
    updateYard(() => next); sChime(); setSpot(null);
    say(id ? itemOf(id).name as Phrase : 'Took it off.');
  }

  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = canUse(y, item.id), afford = !owned && item.price <= balance;
    const on = owned && (y.train.body === item.id || y.train.front === item.id || y.train.paint === item.id || y.train.stripe === item.id || y.train.riders === item.id || y.style === item.id || y.theme === item.id);
    const pic = item.cat === 'paint' ? <span class="swatch-dot" style={{ background: item.hex === 'rainbow' ? 'linear-gradient(90deg,#e63946,#ffd23f,#2fa84f,#2f80ed,#7b4bd1)' : item.hex }} />
      : item.cat === 'style' ? <span class="swatch-dot rails" style={{ background: item.rail === 'rainbow' ? 'linear-gradient(90deg,#e63946,#ffd23f,#2fa84f,#2f80ed)' : item.rail, borderColor: item.support }} />
      : <span class="tile-icon" aria-hidden="true">{item.icon}</span>;
    const extra = item.cat === 'body' ? <span class="tile-lift">🧑×{item.seats}</span> : null;
    return (
      <button key={item.id} class={cls('cc-tile', owned && 'owned', on && 'worn', afford && 'afford', picked && wantKey(picked) === item.id && 'picked', 'prize' in item && item.prize && 'prize')}
        aria-label={item.name} onClick={() => (owned ? tapOwned(item) : tapWant(w))}>
        {pic}<span class="tile-name">{item.name}</span>{extra}
        {owned ? <span class="tile-tag">{on ? '✓' : '✔︎'}</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, price = priceOf(y, w), open = y.more[id] < r.most;
    return (
      <button key={id} class={cls('cc-tile', 'repeat', open && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => (open ? tapWant(w) : say(r.name as Phrase))}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span><span class="tile-name">{r.name}</span>
        {y.more[id] > 0 && <span class="tile-count">×{y.more[id]}</span>}
        {open ? <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span> : <span class="tile-tag">✔︎</span>}
      </button>
    );
  };
  const section = (title: string, items: readonly Item[], extra?: preact.ComponentChildren) => (
    <section class="cc-sec" key={title}><h3>{title}</h3><div class="cc-tiles">{extra}{byPrice(items).map(tile)}</div></section>
  );
  const guestPaints = useMemo(() => Array.from({ length: y.guestPaints }, (_, i) => i + 1), [y.guestPaints]);
  const prizePieces = PRIZE_PIECES.filter(p => y.prizes.includes(p.id));

  let body: preact.ComponentChildren = null;
  if (tab === 'build') body = <Builder />;
  if (tab === 'track') body = <>
    {section('Pieces', PIECES.map(p => ({ ...p, cat: 'piece' as const })), <>{repeatTile('track')}{repeatTile('coaster')}</>)}
    {prizePieces.length > 0 && <section class="cc-sec"><h3>Prizes</h3><div class="cc-tiles">{prizePieces.map(p => <button key={p.id} class="cc-tile owned prize" aria-label={p.name} onClick={() => say(p.name as Phrase)}><span class="tile-icon">{p.icon}</span><span class="tile-name">{p.name}</span><span class="tile-tag">🏅</span></button>)}</div></section>}
    {section('Track Style', STYLES)}
  </>;
  if (tab === 'train') body = <>
    {section('Cars', [...BODIES, ...PRIZE_BODIES.filter(b => y.prizes.includes(b.id))], repeatTile('car'))}
    {section('Fronts', FRONTS)}
    {section('Paint', PAINTS, guestPaints.map(k => { const g = guestPaint(k), id = `gp:${k}`; return (
      <button key={id} class={cls('cc-tile', 'owned', 'prize', y.train.paint === id && 'worn')} aria-label="Guest Paint" onClick={() => { if (!voice.active) return; updateYard(x => wear(x, id)); sChime(); say('Guest Paint'); }}>
        <span class="swatch-dot" style={{ background: `linear-gradient(135deg,${g.body} 60%,${g.stripe} 60%)` }} /><span class="tile-name">Guest Paint {k}</span><span class="tile-tag">🏅</span>
      </button>); }))}
    {section('Stripes', STRIPES)}
    {section('Riders', RIDERS)}
  </>;
  if (tab === 'park') {
    const loose = unplaced(y);
    body = <>
      <div class="cc-park-top">
        <ParkMap y={y} picked={spot} onSpot={tapSpot} onMore={() => { setSpot(null); tapWant({ kind: 'more', id: 'plot' }); }} />
        {spot !== null && (
          <div class="cc-tray cc-place" role="group" aria-label="Put here">
            {y.spots[spot] && <button class="cc-tile" aria-label="Take it off" onClick={() => place('')}><span class="tile-icon">🧺</span><span class="tile-name">Take off</span></button>}
            {loose.map(id => <button key={id} class="cc-tile owned" aria-label={itemOf(id).name} onClick={() => place(id)}><span class="tile-icon">{itemOf(id).icon}</span><span class="tile-name">{itemOf(id).name}</span></button>)}
            {!loose.length && !y.spots[spot] && <span class="cc-tray-empty cc-place-empty" aria-hidden="true">🛒 👇</span>}
          </div>
        )}
        {does(y, 'night') && <button class={cls('cc-night', y.night && 'on')} aria-label={y.night ? 'Day rides' : 'Night rides'} onClick={() => { if (!voice.active) return; updateYard(toggleNight); say(y.night ? 'Day rides!' : 'Night rides!'); }}>{y.night ? '🌙' : '☀️'}</button>}
        <span class="cc-plots">🟩 {plotsOf(y)}</span>
      </div>
      {section('Rides', RIDES, repeatTile('plot'))}
      {section('Stands and Scenery', STANDS)}
    </>;
  }
  if (tab === 'looks') body = <>{section('Station', THEMES)}{section('Hats', HATS)}{section('Balloons', BALLOONS)}</>;
  if (tab === 'records') {
    const rank = rankOf(y.riders);
    body = (
      <div class="cc-records">
        <div class="cc-rec-grid">
          <div class="cc-rec"><b>⚡ {y.bests.thrill}</b><span>Best Thrill</span></div>
          <div class="cc-rec"><b>⏱️ {y.bests.speed}</b><span>Top speed</span></div>
          <div class="cc-rec"><b>⬇️ {y.bests.drop}</b><span>Tallest drop</span></div>
          <div class="cc-rec"><b>🔄 {y.bests.inversions}</b><span>Upside down</span></div>
          <div class="cc-rec"><b>🧑‍🤝‍🧑 {y.riders}</b><span>Riders</span></div>
          <div class="cc-rec"><b>🎟️ {y.guest - 1}</b><span>Guest Coasters</span></div>
        </div>
        <div class="cc-rank">🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''} <small>→ {rank.next} riders</small></div>
        <div class="cc-ranks">{RANKS.map(r => <span key={r.name} class={cls('cc-badge', y.riders >= r.at && 'got')}>{r.name}</span>)}<span class="cc-badge">+ every {LEGEND_EVERY}</span></div>
        <h3>Trophies</h3>
        <div class="cc-ranks">{TROPHIES.map(t => <button key={t.id} class={cls('cc-badge', 'trophy', y.trophies.includes(t.id) && 'got')} aria-label={t.name} onClick={() => say(t.name as Phrase)}>🏆 {t.name.replace(' Trophy', '')}</button>)}</div>
        {canRideMine(y) && <button class="big-btn cc-watch-big" aria-label="Watch it run" onClick={() => { if (voice.active) watch(); }}><span class="e">👀</span><span class="btn-word">Watch it run</span></button>}
      </div>
    );
  }
  const pick = picked && (picked.kind === 'more' || !has(y, picked.id)) ? picked : null;
  const pickPrice = pick ? priceOf(y, pick) : 0;
  return (
    <div class="screen cc-yard">
      <header class="cc-yard-head">
        <IconButton label="Home" onClick={() => { screen.value = 'home'; }}>🏠</IconButton>
        <h1>Coaster Yard</h1>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <GoalBar y={y} balance={balance} onTap={tapWant} />
      <nav class="cc-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('cc-tab', tab === t.id && 'on')}
          onClick={() => { if (!voice.active) return; yardTab.value = t.id; setPicked(null); setSpot(null); say(t.name as Phrase); }}><span class="e">{t.icon}</span><span class="tab-word">{t.name}</span></button>)}
      </nav>
      <main class={cls('cc-yard-body', `tab-${tab}`)}>{body}</main>
      {pick && (
        <div class="cc-buybar">
          <span class="tile-icon">{iconOf(pick)}</span><span class="tile-name">{nameOf(pick)}</span>
          <span class="tile-cost"><CurrencyIcon kind={CUR} size={18} />{pickPrice}</span>
          <button class={cls('big-btn', 'go', 'cc-buy', pickPrice > balance && 'locked')} aria-label="Buy" onClick={() => (pickPrice > balance ? tapWant(pick) : buyIt(pick))}>Buy</button>
        </div>
      )}
    </div>
  );
}
void coasterOf;
