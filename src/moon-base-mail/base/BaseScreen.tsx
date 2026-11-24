// The Moon Base: his base from above (tap a module to pick it up, tap a free plot to put it down), the module that has just come waiting
// to be put on a plot, the Goal (a bar filling toward the thing he's saving for), the big Land button with the Landings he has, Walk the
// base, and the tray: Modules (then Land Patch and New Module, again and again), Landers (and their parts), Suits (and helmets), Paint
// (the lander's and the domes'), Garden (plants, and Garden Bed again and again), Things (for the base, and flags), Buggy, Rocks (his
// moon rocks on the workshop shelf) and Badges. Tapping something says its name and price; he buys it with Buy when he can, and
// otherwise it becomes his Goal. Each tab is sorted by price, so a dear thing always sits beside cheap ones.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { Shown } from '../art/pics';
import { CUR } from '../branding';
import { buy, player, updateBase } from '../game';
import { baseTab, land, screen, walk } from '../nav';
import { needLine, said, sayable, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { BADGES, buyable, crewOf, goalOf, GROWN, harvestOf, has, missingNeed, move, place, priceOf, rocksOf, selectGoal, stageOf, wantKey, wear, type Want } from './base';
import { BaseMap, moduleName, moduleWords, ModuleArt } from './BaseMap';
import { BUGGY, DECOR, DOME_PAINTS, FLAGS, HELMETS, itemOf, LANDERS, MODULES, PAINTS, PARTS, PLANTS, REPEATS, SUITS, type Item, type RepeatId } from './catalog';
import { plantFor, specialById, type MoonRock, type Special } from './gen';

/** A special's name as the voice says it: a named prize is one clip; a lucky statue is its colour, its thing and "Statue". */
export const specialWords = (sp: Special): Phrase[] => (sp.lucky ? [said(sp.lucky.colour), said(sp.lucky.word), 'Statue', ...(sp.lucky.number ? ['Number' as const, `${sp.lucky.number}` as Phrase] : [])] : [said(sp.name)]);

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'modules', name: 'Modules', icon: '🏠' }, { id: 'landers', name: 'Landers', icon: '🛸' }, { id: 'suits', name: 'Suits', icon: '🧑‍🚀' },
  { id: 'paint', name: 'Paint', icon: '🎨' }, { id: 'garden', name: 'Garden', icon: '🌱' }, { id: 'things', name: 'Things', icon: '🎡' },
  { id: 'buggy', name: 'Buggy', icon: '🚙' }, { id: 'rocks', name: 'Rocks', icon: '🪨' }, { id: 'badges', name: 'Badges', icon: '🏅' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const itemsFor = (tab: TabId): readonly Item[] => {
  switch (tab) {
    case 'modules': return byPrice(MODULES);
    case 'landers': return [...LANDERS, ...byPrice(PARTS)];
    case 'suits': return [...byPrice(SUITS), ...byPrice(HELMETS)];
    case 'paint': return [...byPrice(PAINTS), ...byPrice(DOME_PAINTS)];
    case 'garden': return byPrice(PLANTS);
    case 'things': return [...byPrice(DECOR), ...byPrice(FLAGS)];
    case 'buggy': return byPrice(BUGGY);
    default: return [];
  }
};
const REPEATS_IN: Partial<Record<TabId, readonly RepeatId[]>> = { modules: ['land', 'module'], garden: ['bed'] };
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const priceLine = (n: number): Phrase[] => { const s = sayable(n); return ['It costs', s.said, 'Bolts.']; };
const rockName = (r: MoonRock) => `${r.colour} ${r.word}`;

export function RockArt({ r, size = 48 }: { r: MoonRock; size?: number }) {
  const pts = r.lumps.map((l, i) => { const a = (i / r.lumps.length) * Math.PI * 2, rad = (8 + r.size * 3) * l * (r.word === 'Crystal' || r.word === 'Gem' ? (i % 2 ? 0.6 : 1.15) : 1); return `${24 + Math.cos(a) * rad},${26 + Math.sin(a) * rad * 0.8}`; }).join(' ');
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <polygon points={pts} fill={r.hex} stroke="#111" stroke-width="2.5" stroke-linejoin="round" />
      {r.sparkle !== 'none' && Array.from({ length: r.sparkle === 'some' ? 2 : 5 }, (_, i) => <circle key={i} cx={16 + ((i * 11) % 18)} cy={18 + ((i * 7) % 14)} r="1.6" fill={r.sparkle === 'rainbow' ? ['#ff4d4d', '#ffd23f', '#5cff7a', '#4da6ff', '#c77dff'][i] : '#fff'} />)}
    </svg>
  );
}

export function BaseScreen() {
  const voice = useVoice(), state = player.state.value, b = state.base, balance = state.currency.balance;
  const tab = baseTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null), [lifted, setLifted] = useState<string | null>(null);
  const goal = goalOf(b);
  useEffect(() => {
    if (b.toPlace) { void voice.say('Your new module is here!', 'Tap a plot to put it there!'); return; }
    void voice.say('Moon Base', ...(b.landings === 1 ? ['You have 1 Landing!' as const] : b.landings > 1 && b.landings <= 100 ? [`${b.landings}` as Phrase, 'Landings!' as const] : []));
  }, []);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const need = missingNeed(b, w);
    setPicked(w);
    if (need === 'land') { sNope(); say(said(nameOf(w)), 'You need more land first!'); return; }
    if (need === 'modules') { sNope(); say(said(nameOf(w)), 'Build more modules first!'); return; }
    if (need) { sNope(); say(said(nameOf(w)), 'Build this first:', said(itemOf(need).name)); return; }
    const price = priceOf(b, w);
    if (price > balance) { updateBase(x => selectGoal(x, w)); say(said(nameOf(w)), ...priceLine(price), ...needLine(price - balance)); return; }
    say(said(nameOf(w)), ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const before = player.state.peek().base.badges.length;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    const after = player.state.peek().base, module = w.kind === 'more' ? w.id === 'module' : itemOf(w.id).cat === 'module';
    say('You got', said(nameOf(w)), ...(module ? ['It will come on the next Landing!' as const] : w.kind === 'more' ? ['You can buy more of these!' as const] : []),
      ...(after.badges.length > before ? ['You won a badge!' as const] : []));
  }
  function useIt(item: Item) {
    if (!voice.active) return;
    if (['lander', 'paint', 'dome', 'suit', 'helmet', 'flag'].includes(item.cat) || (item.cat === 'part' && item.slot === 'lights')) { updateBase(x => wear(x, item.id)); sChime(); }
    say(said(item.name));
  }
  function tapPlot(k: string) {
    if (!voice.active) return;
    const here = b.placed[k];
    if (b.toPlace && !here) { updateBase(x => place(x, k)); sFanfare(); confetti(20, voice.signal); say(...moduleWords(player.state.peek().base.placed[k] ?? 'home').map(said)); return; }
    if (lifted) { if (lifted !== k) { updateBase(x => move(x, lifted, k)); sChime(); } setLifted(null); return; }
    if (here && here !== 'home') { setLifted(k); say(...moduleWords(here).map(said)); return; }
    if (here) say('Moon Base');
  }

  const inUse = (item: Item) => [b.paint, b.domePaint, b.suit, b.helmet, b.flag, b.lights, `lander:${b.lander}`].includes(item.id);
  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(b, item.id), need = !owned && missingNeed(b, w), afford = !owned && !need && item.price <= balance;
    const art = item.hex && ['paint', 'dome', 'suit'].includes(item.cat) ? <span class="swatch-dot" style={{ background: item.hex }} /> : <span class="tile-icon" aria-hidden="true">{item.icon}</span>;
    const used = owned && inUse(item), planted = item.cat === 'plant' && owned ? stageOf(b, b.planted[item.id] ?? b.rounds) : null;
    return (
      <button key={item.id} class={cls('mb-tile', owned && 'owned', used && 'worn', need && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked')}
        aria-label={item.name} onClick={() => (owned ? useIt(item) : tapWant(w))}>
        {art}
        <span class="tile-name">{item.name}</span>
        {planted !== null && <span class="tile-grow" aria-hidden="true">{'🌱'.repeat(Math.max(1, planted))}{planted >= GROWN ? '✨' : ''}</span>}
        {owned ? <span class={cls('tile-tag', used && 'on')}>{used ? '✓ on' : '✓'}</span> : need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, need = missingNeed(b, w), price = priceOf(b, w);
    return (
      <button key={id} class={cls('mb-tile', 'repeat', need && 'locked', !need && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => tapWant(w)}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span><span class="tile-name">{r.name}</span>
        {b.more[id] > 0 && <span class="tile-count">×{b.more[id]}</span>}
        {need ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span>}
      </button>
    );
  };
  const rocks = rocksOf(b), crew = crewOf(b);
  const goalPrice = goal ? priceOf(b, goal) : 0;
  const shown = (i: Item) => i.price > 0 || has(b, i.id);
  return (
    <div class="screen airport-screen mb-base-screen">
      <header class="mb-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Moon Base</h1>
        <span class="pax-board" aria-label={`${crew.length + 5} crew`}>👩‍🚀 {crew.length + 5} <small>🪨 {b.goes}</small></span>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <div class="airport-main">
        <div class={cls('airport-view', 'mb-map-view', b.toPlace && 'placing')}>
          {b.toPlace && <div class="mb-place-tip"><ModuleArt id={b.toPlace} b={b} size={36} /> Tap a plot!</div>}
          {lifted && <div class="mb-place-tip">Tap where it goes</div>}
          <BaseMap b={b} onPlot={tapPlot} selected={lifted} placing={!!b.toPlace || !!lifted} />
        </div>
        <div class="airport-side">
          <button class={cls('big-btn', 'go', 'fly-btn', 'mb-land', b.landings > 0 && !b.toPlace && 'pulse')} aria-label="Land the supply ship"
            onClick={() => { if (!voice.active) return; if (b.landings > 0) land(); else { sNope(); say('Play a Round to earn a Landing!'); } }}>
            <span class="fly-plane" aria-hidden="true">🛬</span><span class="fly-word">Land</span><span class="race-count">{b.landings}</span>
            <span class="fly-to">{b.pending.length ? `📦 ${moduleName(b.pending.at(-1)!)}` : '📦 Supplies'}</span>
          </button>
          {goal && (
            <button class="goal-chip mb-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <div class="side-row">
            <button class="big-btn side-btn" aria-label="Walk the base" onClick={() => { if (voice.active) walk(); }}><span aria-hidden="true">🧑‍🚀</span><span class="side-word">Walk</span></button>
          </div>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(b, picked) ? <span class="buy-need">🔒 {missingNeed(b, picked) === 'land' ? 'Land Patch' : missingNeed(b, picked) === 'modules' ? 'more modules' : itemOf(missingNeed(b, picked)!).name}</span>
            : priceOf(b, picked) <= balance && buyable(b, picked)
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={CUR} size={22} />{priceOf(b, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={CUR} size={18} />{priceOf(b, picked)}</span>}
        </div>
      )}
      <div class="mb-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('mb-tab', tab === t.id && 'on')} onClick={() => { baseTab.value = t.id; setPicked(null); say(said(t.name)); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="mb-tray">
        {tab === 'garden' && <div class="fleet-bar"><span class="chip-note">🧺 {harvestOf(b)}</span>{Object.keys(b.planted).filter(k => k.startsWith('bed:')).slice(-8).map(k => { const pl = plantFor(Number(k.slice(4))); return <span key={k} class="chip-note" style={{ color: pl.hex }}>🌿 {pl.colour} {pl.word} {'•'.repeat(stageOf(b, b.planted[k]!))}</span>; })}</div>}
        {tab === 'rocks' && (
          <div class="tiles mb-rocks">
            {!has(b, 'module:workshop') && <div class="chip-note">🔒 {itemOf('module:workshop').name}</div>}
            {rocks.map(r => <button key={r.n} class={cls('mb-tile', 'rock', r.rare && 'rare')} aria-label={rockName(r)} onClick={() => say(said(r.colour), said(r.word))}><RockArt r={r} /><span class="tile-name">{rockName(r)}</span><span class="tile-tag">#{r.n}</span></button>)}
          </div>
        )}
        {tab === 'badges' && (
          <div class="tiles">{BADGES.map(t => <button key={t.id} class={cls('mb-tile', b.badges.includes(t.id) ? 'owned' : 'locked')} aria-label={t.name} onClick={() => say(said(t.name))}><span class="tile-icon" aria-hidden="true">{b.badges.includes(t.id) ? t.icon : '❔'}</span><span class="tile-name">{t.name}</span></button>)}
            {b.owned.map(id => specialById(id)).filter(x => x !== null).map(sp => <button key={sp!.id} class="mb-tile owned special" aria-label={sp!.name} onClick={() => say(...specialWords(sp!))}><Shown show={sp!.icon} size={36} /><span class="tile-name">{sp!.name}</span></button>)}
          </div>
        )}
        {tab !== 'rocks' && tab !== 'badges' && (
          <div class="tiles">
            {(REPEATS_IN[tab] ?? []).map(repeatTile)}
            {itemsFor(tab).filter(shown).map(tile)}
          </div>
        )}
      </div>
    </div>
  );
}
