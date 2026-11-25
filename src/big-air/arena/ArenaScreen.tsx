// The Arena: his truck on the dirt in front of his stands, the big Jump button with his Jumps and what the next one goes over, the Goal
// (a bar filling toward what he's saving for), "Watch it" (his best jump again), and the tray: Truck (bodies and parts, slot by slot,
// drivers and horns), Paint (a colour, a pattern, a decal and a trim), Ramp (run-ups, kickers, landing ramps, each with its length in
// feet), Rows (what he jumps over, opened one at a time by clearing the one before), Arena (pieces for the arena and more seats), Tune
// (the engine, the springs and the booster, again and again) and Records (his Record Board, trophies, Show Cups and rank). Tapping
// something says its name and price; he buys it with Buy when he can, and otherwise it becomes his Goal. Each tab is by price, so a dear
// thing always sits beside cheap ones.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope, HORNS } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { TruckPic } from '../art/TruckPic';
import { CUR } from '../branding';
import { buy, player, updateArena } from '../game';
import { arenaTab, jump, screen, watch } from '../nav';
import { needLine, sayable, unitSaid, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import {
  ARENA, BODIES, COLOURS, DECALS, DRIVERS, HORNS as HORN_ITEMS, itemOf, partsFor, PATTERNS, rampsFor, REPEATS, ROWS, TRIMS, TUNE_GAIN,
  type HornItem, type Item, type RampSlot, type RepeatId, type Slot,
} from './catalog';
import {
  buyable, courseOf, crowdOf, goalOf, has, LEGEND_EVERY, missingNeed, nextTarget, priceOf, RANKS, rankOf, selectGoal, statsOf, TROPHIES, fit, wantKey,
  type ArenaState, type Want,
} from './arena';
import { cupFor } from './shows';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'truck', name: 'Truck', icon: '🛻' }, { id: 'paint', name: 'Paint', icon: '🎨' }, { id: 'ramp', name: 'Ramp', icon: '📐' }, { id: 'rows', name: 'Rows', icon: '🚌' },
  { id: 'arena', name: 'Arena', icon: '🏟️' }, { id: 'tune', name: 'Tune', icon: '🔧' }, { id: 'records', name: 'Records', icon: '🏆' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const SLOT_NAMES: Record<Slot, string> = { engine: 'Engine', tires: 'Tires', springs: 'Springs', booster: 'Booster', exhaust: 'Exhaust', lights: 'Roof Lights', flag: 'Flag' };
const RAMP_NAMES: Record<RampSlot, string> = { runup: 'Run-Up', kicker: 'Kicker', landing: 'Landing Ramp' };
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };
const said = (x: string | number) => `${x}` as Phrase;
const REPEAT_SAYS: Record<RepeatId, Phrase> = { seats: 'The crowd grows!', engine: 'It goes faster!', springs: 'Softer landings!', booster: 'A bigger push!' };

export function ArenaScreen() {
  const voice = useVoice(), state = player.state.value, a = state.arena, balance = state.currency.balance;
  const tab = arenaTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null);
  const goal = goalOf(a), course = courseOf(nextTarget(a)), stats = statsOf(a);
  useEffect(() => {
    void voice.say('Arena', ...(a.jumps === 1 ? ['You have 1 Jump!' as const] : a.jumps > 1 ? [said(a.jumps), 'Jumps!' as const] : []));
  }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(a, w);
    setPicked(w);
    if (need) { sNope(); say(nameOf(w) as Phrase, need.startsWith('row:') ? 'Clear this first:' : 'Buy this first:', itemOf(need).name as Phrase); return; }
    const price = priceOf(a, w), item = w.kind === 'item' ? itemOf(w.id) : null;
    const length: Phrase[] = item?.cat === 'ramp' && item.feet ? ['It is', ...unitSaid(item.feet, 'ft'), 'long.'] : item?.cat === 'row' ? ['It is', ...unitSaid(item.feet, 'ft'), 'long.'] : [];
    if (price > balance) { updateArena(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...length, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...length, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const item = w.kind === 'item' ? itemOf(w.id) : null;
    if (item?.cat === 'horn') HORNS[(item as HornItem).sound % HORNS.length]!();
    say('You got', nameOf(w) as Phrase, ...(w.kind === 'more' ? [REPEAT_SAYS[w.id], 'You can buy more of these!' as const] : []), ...(item?.cat === 'row' ? ['It is set up for your next Jump!' as const] : []));
  }
  function fitIt(item: Item) {
    if (!voice.active) return;
    updateArena(x => fit(x, item.id));
    sChime();
    if (item.cat === 'horn') HORNS[(item as HornItem).sound % HORNS.length]!();
    say(item.name as Phrase, ...(item.cat === 'ramp' && item.feet ? ['It is' as const, ...unitSaid(item.feet, 'ft'), 'long.' as const] : []));
  }

  const worn = (item: Item) => (item.cat === 'ramp' ? a.ramp[item.slot] === item.id : Object.values(a.truck).includes(item.id));
  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(a, item.id), need = !owned && missingNeed(a, w), afford = !owned && !need && item.price <= balance && buyable(a, w);
    const fits = item.cat !== 'row' && item.cat !== 'arena';
    const cleared = item.cat === 'row' && a.rowsCleared >= item.n;
    const onTap = () => (owned && fits ? fitIt(item) : owned ? say(item.name as Phrase, ...(item.cat === 'row' ? ['It is' as const, ...unitSaid(item.feet, 'ft'), 'long.' as const] : [])) : tapWant(w));
    const pic = item.cat === 'body' ? <TruckPic look={{ ...a.truck, body: item.id }} size={120} />
      : item.cat === 'colour' || item.cat === 'trim' ? <span class="swatch-dot" style={{ background: item.hex }} />
      : item.cat === 'pattern' || item.cat === 'decal' ? <TruckPic look={{ ...a.truck, [item.cat]: item.id }} size={110} />
      : item.cat === 'part' && ['exhaust', 'lights', 'flag', 'tires'].includes(item.slot) ? <TruckPic look={{ ...a.truck, [item.slot]: item.id }} size={110} />
      : <span class="tile-icon" aria-hidden="true">{item.icon}</span>;
    const extra = item.cat === 'ramp' ? <span class="tile-lift">{item.slot === 'kicker' ? `${item.angle}°` : ''} {item.feet ? `${item.feet} ft` : ''}</span>
      : item.cat === 'row' ? <span class="tile-lift">{item.feet} ft</span>
      : item.cat === 'part' && item.power ? <span class="tile-lift">💪{partPower(item.slot, item.power)}</span> : null;
    return (
      <button key={item.id} class={cls('ba-tile', item.cat === 'body' && 'body-tile', owned && 'owned', worn(item) && 'worn', need && 'locked', afford && 'afford', cleared && 'cleared', picked && wantKey(picked) === item.id && 'picked')}
        aria-label={item.name} onClick={onTap}>
        {pic}
        <span class="tile-name">{item.name}</span>{extra}
        {owned ? <span class="tile-tag">{cleared ? '✅' : worn(item) ? '✓' : '✔︎'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(a, w), price = priceOf(a, w);
    return (
      <button key={id} class={cls('ba-tile', 'repeat', need && 'locked', !need && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => tapWant(w)}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span>
        <span class="tile-name">{r.name}</span>
        {a.more[id] > 0 && <span class="tile-count">×{a.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span>}
      </button>
    );
  };

  const goalPrice = goal ? priceOf(a, goal) : 0, rank = rankOf(a.jumped), best = a.records[0]?.feet ?? 0;
  return (
    <div class="screen arena-screen">
      <header class="ba-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Arena</h1>
        <span class="rank-chip" aria-label={rank.name}>🎖️ <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <div class="arena-main">
        <div class="arena-view" aria-label="Your truck in the arena">
          <span class="crowd-chip" aria-label="Crowd">👥 {crowdOf(a).toLocaleString('en-US')}</span>
          <span class="record-chip" aria-label="Your record">🏆 {best} ft</span>
          <TruckPic look={a.truck} size={300} class="arena-truck-big" />
        </div>
        <div class="arena-side">
          <button class={cls('big-btn', 'go', 'fly-btn', a.jumps > 0 && 'pulse')} aria-label="Jump"
            onClick={() => { if (!voice.active) return; if (a.jumps > 0) jump(); else { sNope(); say('Play a Round to earn a Jump!'); } }}>
            <span class="fly-plane" aria-hidden="true">🛻</span><span class="fly-word">Jump</span><span class="race-count">{a.jumps}</span>
            <span class="fly-to">{course.target.kind === 'show' ? `Show ${course.target.n}` : course.name} · {course.feet} ft</span>
          </button>
          {goal && (
            <button class="goal-chip ba-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            {a.best && <button class="big-btn side-btn" aria-label="Watch it" onClick={() => { if (!voice.active) return; void voice.say('Watch it!'); watch(); }}><span aria-hidden="true">🎥</span><span class="side-word">Watch</span></button>}
            {has(a, 'arena:floodlights') && <button class="big-btn side-btn" aria-label={a.night ? 'Day jumps' : 'Night jumps'} onClick={() => { if (!voice.active) return; updateArena(x => ({ ...x, night: !x.night })); say(a.night ? 'Day jumps!' : 'Night jumps!'); }}><span aria-hidden="true">{a.night ? '☀️' : '🌙'}</span><span class="side-word">{a.night ? 'Day' : 'Night'}</span></button>}
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(a, picked) ? <span class="buy-need">🔒 {itemOf(missingNeed(a, picked)!).name}</span>
            : priceOf(a, picked) <= balance
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={CUR} size={22} />{priceOf(a, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={CUR} size={18} />{priceOf(a, picked)}</span>}
        </div>
      )}
      <div class="ba-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('ba-tab', tab === t.id && 'on')}
          onClick={() => { arenaTab.value = t.id; setPicked(null); say(t.name as Phrase); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="ba-tray">
        {tab === 'truck' && <>
          <div class="fleet-bar"><span class="chip-note">⚡ {Math.round(stats.top)}</span><span class="chip-note">🛞 {Math.round(stats.accel)}</span><span class="chip-note">🌀 {Math.round(stats.window)}°</span><span class="chip-note">🔥 {Math.round(stats.boost)}</span></div>
          <div class="slot-row"><h3>Body</h3><div class="tiles">{byPrice(BODIES).map(tile)}</div></div>
          {(['engine', 'tires', 'springs', 'booster', 'exhaust', 'lights', 'flag'] as const).map(sl => (
            <div key={sl} class="slot-row"><h3>{SLOT_NAMES[sl]}</h3><div class="tiles">{byPrice(partsFor(sl)).map(tile)}</div></div>
          ))}
          <div class="slot-row"><h3>Driver</h3><div class="tiles">{byPrice(DRIVERS).map(tile)}</div></div>
          <div class="slot-row"><h3>Horn</h3><div class="tiles">{byPrice(HORN_ITEMS).map(tile)}</div></div>
        </>}
        {tab === 'paint' && <>
          <div class="fleet-bar"><TruckPic look={a.truck} size={140} /></div>
          <div class="slot-row"><h3>Colour</h3><div class="tiles">{byPrice(COLOURS).map(tile)}</div></div>
          <div class="slot-row"><h3>Pattern</h3><div class="tiles">{byPrice(PATTERNS).map(tile)}</div></div>
          <div class="slot-row"><h3>Decal</h3><div class="tiles">{byPrice(DECALS).map(tile)}</div></div>
          <div class="slot-row"><h3>Trim</h3><div class="tiles">{byPrice(TRIMS).map(tile)}</div></div>
        </>}
        {tab === 'ramp' && <>
          <div class="fleet-bar"><span class="chip-note">🛣️ {stats.runUp} ft</span><span class="chip-note">📐 {stats.angle}°</span></div>
          {(['runup', 'kicker', 'landing'] as const).map(sl => <div key={sl} class="slot-row"><h3>{RAMP_NAMES[sl]}</h3><div class="tiles">{byPrice(rampsFor(sl)).map(tile)}</div></div>)}
        </>}
        {tab === 'rows' && <>
          <div class="fleet-bar"><span class="chip-note">✅ {a.rowsCleared} / {ROWS.length}</span><span class="chip-note">🎪 {a.shows}</span></div>
          <div class="tiles">{ROWS.filter(r => r.n <= a.rowsCleared + 2).map(tile)}</div>
        </>}
        {tab === 'arena' && <div class="tiles">{repeatTile('seats')}{byPrice(ARENA).map(tile)}</div>}
        {tab === 'tune' && <>
          <div class="fleet-bar"><span class="chip-note">⚡ +{TUNE_GAIN.engine}</span><span class="chip-note">🌀 +{TUNE_GAIN.springs}</span><span class="chip-note">🔥 +{TUNE_GAIN.booster}</span></div>
          <div class="tiles">{(['engine', 'springs', 'booster'] as const).map(repeatTile)}</div>
        </>}
        {tab === 'records' && <Records a={a} onWatch={() => { if (voice.active) { void voice.say('Watch it!'); watch(); } }} />}
      </div>
    </div>
  );
}
const partPower = (slot: Slot, p: number) => (slot === 'springs' ? `${p}°` : `${p}`);

/** The Record Board: his ten longest jumps in feet, his trophies, his Show Cups and how far to the next rank. */
function Records({ a, onWatch }: { a: ArenaState; onWatch(): void }) {
  const rank = rankOf(a.jumped), at = rank.number ? rank.next - LEGEND_EVERY : RANKS[rank.index]!.at;
  const span = Math.max(1, rank.next - at), done = Math.min(span, a.jumped - at), best = a.records[0]?.feet ?? 0;
  const cups = Array.from({ length: Math.floor(a.shows / 5) }, (_, i) => cupFor((i + 1) * 5)!);
  return (
    <div class="ba-records">
      <div class="log-next">
        <span class="log-rank">🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
        <span class="goal-bar" aria-hidden="true"><i style={{ width: `${(done / span) * 100}%` }} /></span>
        <span class="log-to">🛻 {a.jumped} / {rank.next}</span>
      </div>
      <ol class="record-board" aria-label="Record Board">
        {a.records.length ? a.records.map((r, i) => (
          <li key={`${r.jump}-${r.feet}`} class={cls(i === 0 && 'top')}><span class="rb-place">{i + 1}</span><span class="rb-feet"><b>{r.feet}</b> ft</span><small>#{r.jump}</small>
            {i === 0 && a.best && <button class="chip-btn" aria-label="Watch it" onClick={onWatch}>🎥</button>}</li>
        )) : <li class="empty">🛻 → 🏆</li>}
      </ol>
      <div class="tiles trophies">{TROPHIES.map(t => <span key={t} class={cls('ba-tile', best >= t && 'owned')}><span class="tile-icon" aria-hidden="true">{best >= t ? '🏆' : '🔒'}</span><span class="tile-name">{t} ft</span></span>)}</div>
      {cups.length > 0 && <div class="tiles cups">{cups.slice(-60).map(c => <span key={c.n} class="ba-tile owned"><span class="js-cup" style={{ background: c.bg, borderColor: c.rim }}>{c.glyph}</span><span class="tile-name">{c.n}</span></span>)}</div>}
    </div>
  );
}
