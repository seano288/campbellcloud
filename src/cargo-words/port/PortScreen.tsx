// The Port: his harbour with his ships at their berths, the Goal (a bar filling toward the thing he's saving for), the big Load button
// with the Ships he has, "Watch it run", the Sea Chart, and the tray: Build (the pieces, then the again-and-again things), Cranes (the
// five cranes, their parts and paints), Ships (the Fleet: tap one to sail it next, name it), Paint (hull paints and funnel marks for the
// ship he sails next, with the Dry Dock), Containers (colours, stripes and company marks) and Decorations. Tapping something says its name
// and price; he buys it with Buy when he can, and otherwise it becomes his Goal. Each tab is sorted by price, so a dear thing always sits
// beside cheap ones.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { BoxView } from '../art/BoxView';
import { CUR } from '../branding';
import { buy, player, updatePort } from '../game';
import { load, portTab, screen, watch } from '../nav';
import { needLine, sayable, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import {
  BOX_COLOURS, CRANE_PAINTS, CRANES, DECOR, itemOf, LOGOS, MARKS, PAINTS, PARTS, PIECES, REPEATS, SHIP_NAMES, SHIP_SHAPES, SHIPS, STRIPE_ITEMS, type Item, type RepeatId,
} from './catalog';
import { buyable, canLoad, dress, goalOf, has, missingNeed, planGo, priceOf, rankOf, sailNext, selectGoal, wantKey, type Want } from './port';
import { PortView } from './PortView';
import type { ShipKind } from '../art/ship';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'build', name: 'Build', icon: '🏗️' }, { id: 'cranes', name: 'Cranes', icon: '🪝' }, { id: 'ships', name: 'Ships', icon: '🚢' },
  { id: 'paint', name: 'Paint', icon: '🎨' }, { id: 'containers', name: 'Containers', icon: '📦' }, { id: 'decor', name: 'Decorations', icon: '🌷' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const itemsFor = (tab: TabId): readonly Item[] => {
  switch (tab) {
    case 'build': return byPrice(PIECES);
    case 'cranes': return [...CRANES, ...byPrice(PARTS), ...byPrice(CRANE_PAINTS)];
    case 'ships': return SHIPS;
    case 'paint': return [...byPrice(PAINTS), ...byPrice(MARKS)];
    case 'containers': return [...byPrice(BOX_COLOURS), ...byPrice(STRIPE_ITEMS), ...byPrice(LOGOS)];
    case 'decor': return byPrice(DECOR);
  }
};
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };
const needName = (need: string): Phrase => (need === 'berth' ? 'Another Berth' : itemOf(need).name as Phrase);

export function PortScreen() {
  const voice = useVoice(), state = player.state.value, p = state.port, balance = state.currency.balance;
  const tab = portTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null);
  const goal = goalOf(p), plan = useMemo(() => planGo(p), [p]);
  useEffect(() => { void voice.say('Port!', ...(p.ships === 1 ? ['You have 1 Ship to load!' as const] : p.ships > 1 && p.ships <= 100 ? [`${p.ships}` as Phrase, 'Ships to load!' as const] : [])); }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(p, w);
    setPicked(w);
    if (need === 'berth') { sNope(); say(nameOf(w) as Phrase, 'You need another berth first!'); return; }
    if (need) { sNope(); say(nameOf(w) as Phrase, 'Build this first:', needName(need)); return; }
    const price = priceOf(p, w);
    if (price > balance) { updatePort(x => selectGoal(x, w)); say(nameOf(w) as Phrase, ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w) as Phrase, ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const before = player.state.peek().port.trophies.length;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const after = player.state.peek().port;
    say('You got', nameOf(w) as Phrase, ...(w.kind === 'more' ? ['You can build more of these!' as const] : []), ...(after.trophies.length > before ? ['You won a Trophy!' as const] : []));
  }
  /** Something he owns goes to use: a crane is the one he works, a part or a paint goes on, a ship sails next. */
  function useIt(item: Item) {
    if (!voice.active) return;
    const k = plan.own ?? p.next ?? 'tug';
    if (item.cat === 'crane') updatePort(x => ({ ...x, crane: item.id }));
    else if (item.cat === 'cranepaint') updatePort(x => ({ ...x, cranePaint: item.id }));
    else if (item.cat === 'part' && item.slot === 'lights') updatePort(x => ({ ...x, lights: item.id }));
    else if (item.cat === 'part' && item.slot === 'horn') updatePort(x => ({ ...x, horn: item.id }));
    else if (item.cat === 'paint') updatePort(x => dress(x, k, { hull: item.id }));
    else if (item.cat === 'mark') updatePort(x => dress(x, k, { mark: item.id }));
    else { say(item.name as Phrase); return; }
    sChime(); say(item.name as Phrase);
  }
  function tapShip(k: ShipKind) {
    if (!voice.active) return;
    if (!has(p, `ship:${k}`)) { tapWant({ kind: 'item', id: `ship:${k}` }); return; }
    setPicked(null);
    if (!canLoad(p, k)) { sNope(); say('This ship needs a bigger crane!'); return; }
    updatePort(x => sailNext(x, x.next === k ? null : k));
    sChime(); say(SHIPS.find(s => s.kind === k)!.name as Phrase, ...(player.state.peek().port.next === k ? ['sails next!' as const] : ['A visiting ship!' as const]));
  }

  const inUse = (item: Item) => {
    const k = plan.own ?? p.next ?? 'tug', d = p.fleet[k];
    return (item.cat === 'crane' && p.crane === item.id) || (item.cat === 'cranepaint' && p.cranePaint === item.id) || (item.cat === 'part' && (p.lights === item.id || p.horn === item.id))
      || (item.cat === 'paint' && d?.hull === item.id) || (item.cat === 'mark' && d?.mark === item.id) || (item.cat === 'ship' && p.next === item.kind);
  };
  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(p, item.id), need = !owned && missingNeed(p, w), afford = !owned && !need && item.price <= balance;
    const onTap = () => (item.cat === 'ship' ? tapShip(item.kind) : owned ? useIt(item) : tapWant(w));
    const art = item.cat === 'paint' || item.cat === 'cranepaint' ? <span class="swatch-dot" style={{ background: item.hex }} />
      : item.cat === 'box' ? <BoxView text="" hex={item.hex} small />
      : item.cat === 'part' && item.slot === 'lights' && item.hex ? <span class="swatch-dot" style={{ background: item.hex === 'rainbow' ? 'conic-gradient(#e63946,#ffd23f,#2fa84f,#2f8fe8,#7b4bd1,#e63946)' : item.hex }} />
      : <span class="tile-icon" aria-hidden="true">{item.cat === 'mark' || item.cat === 'logo' ? item.glyph || '▫️' : item.icon}</span>;
    const used = owned && inUse(item);
    return (
      <button key={item.id} class={cls('cw-tile', 'cw-tile', owned && 'owned', used && 'worn', need && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked', item.cat === 'ship' && owned && !canLoad(p, item.kind) && 'grounded')}
        aria-label={item.name} onClick={onTap}>
        {art}
        <span class="tile-name">{item.name}</span>
        {item.cat === 'ship' && <span class="tile-size">{SHIP_SHAPES[item.kind].cols * SHIP_SHAPES[item.kind].tiers}📦</span>}
        {owned ? <span class="tile-tag">{used ? '✓' : '✔︎'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(p, w), price = priceOf(p, w);
    return (
      <button key={id} class={cls('cw-tile', 'cw-tile', 'repeat', need && 'locked', !need && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => tapWant(w)}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span><span class="tile-name">{r.name}</span>
        {p.more[id] > 0 && <span class="tile-count">×{p.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span>}
      </button>
    );
  };

  const goalPrice = goal ? priceOf(p, goal) : 0, rank = rankOf(p.tonnes), k = plan.own ?? p.next;
  const shown = (i: Item) => i.price > 0 || has(p, i.id) || i.cat === 'ship' || i.cat === 'crane';
  return (
    <div class="screen airport-screen cw-port-screen">
      <header class="cw-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>My Port</h1>
        <span class="pax-board" aria-label={`${p.tonnes} tonnes`}>⚖️ {p.tonnes.toLocaleString('en-US')}t <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <div class="airport-main">
        <div class="airport-view"><PortView p={p} /></div>
        <div class="airport-side">
          <button class={cls('big-btn', 'go', 'fly-btn', 'cw-load', p.ships > 0 && 'pulse')} aria-label={`Load a ship for ${plan.harbour.name}`}
            onClick={() => { if (!voice.active) return; if (p.ships > 0) load(); else { sNope(); say('Play a Round to earn a Ship!'); } }}>
            <span class="fly-plane" aria-hidden="true">🏗️</span><span class="fly-word">Load</span><span class="race-count">{p.ships}</span>
            <span class="fly-to">{plan.harbour.icon} {plan.harbour.name}</span>
          </button>
          {goal && (
            <button class="goal-chip cw-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            <button class="big-btn side-btn" aria-label="Watch it run" onClick={() => { if (voice.active) watch(); }}><span aria-hidden="true">👀</span><span class="side-word">Watch</span></button>
            <button class="big-btn side-btn" aria-label="Sea Chart" onClick={() => { if (voice.active) screen.value = 'chart'; }}><span aria-hidden="true">🧭</span><span class="side-word">Chart</span></button>
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(p, picked) ? <span class="buy-need">🔒 {needName(missingNeed(p, picked)!)}</span>
            : priceOf(p, picked) <= balance && buyable(p, picked)
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={CUR} size={22} />{priceOf(p, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={CUR} size={18} />{priceOf(p, picked)}</span>}
        </div>
      )}
      <div class="cw-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('cw-tab', tab === t.id && 'on')} onClick={() => { portTab.value = t.id; setPicked(null); say(t.name as Phrase); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="cw-tray">
        {(tab === 'ships' || tab === 'paint') && k && p.fleet[k] && (
          <div class="fleet-bar">
            <span class="chip-note">{SHIPS.find(s => s.kind === k)!.name}</span>
            <button class="chip-btn" aria-label="Ship name" onClick={() => { if (!voice.active) return; const next = (p.fleet[k]!.name + 1) % SHIP_NAMES.length; updatePort(x => dress(x, k, { name: next })); say(SHIP_NAMES[next]!); }}>🏷️ {SHIP_NAMES[p.fleet[k]!.name]}</button>
          </div>
        )}
        {tab === 'paint' && !has(p, 'piece:drydock') && <div class="fleet-bar"><span class="chip-note">🔒 {itemOf('piece:drydock').name}</span></div>}
        <div class="tiles">
          {itemsFor(tab).filter(shown).map(tile)}
          {tab === 'build' && REPEATS.map(r => repeatTile(r.id))}
        </div>
      </div>
    </div>
  );
}
