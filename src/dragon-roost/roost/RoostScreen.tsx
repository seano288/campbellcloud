// The Roost: his mountain with its ledges, nests, eggs and dragons, the Goal (a bar filling toward what he's saving for), the big Fly
// button with his Flights, Visit the roost, and the tray: Roost (pieces, then a New Ledge), Eggs (each nest and its egg; the eggs to
// buy, then Wild Eggs), Dragons (tap one to fly it), Tricks (tap to put on a button), Gear, Colours, Toys, Places (fly one again to beat
// his best) and Trophies. Tapping something says its name and price; he buys it with Buy when he can, and otherwise it becomes his Goal.
// A dear thing always sits beside cheap ones: each tab is by price.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { dragonPic, eggPic } from '../art/dragon';
import { MyDragon } from '../art/MyDragon';
import { drawRoost } from '../art/roostArt';
import { CUR } from '../branding';
import { course, FIXED_FLIGHTS, PLACES } from '../flight/course';
import { buy, player, updateRoost } from '../game';
import { fly, roostTab, screen } from '../nav';
import { needLine, priceLine, wordPhrase, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { COLOURS, EGGS, GEAR, itemOf, REPEATS, ROOST, TOYS, TRICKS, type Item, type RepeatId } from './catalog';
import { cap, lookOfEgg, marksOf, shownName, stageOf, STAGE_NAMES } from './dragons';
import { NameDragon } from './NameDragon';
import {
  buyable, goalOf, has, hatch, hatchNeed, isReady, lookOf, missingNeed, namedEggs, nestCount, priceOf, rankOf, ride, selectGoal, toggleTrick, trickSlots, TROPHIES, unnamed,
  wantKey, wear, WILD_AFTER, type RoostState, type Want,
} from './roost';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
export const TABS = [
  { id: 'roost', name: 'Roost', icon: '🏔️' }, { id: 'eggs', name: 'Eggs', icon: '🥚' }, { id: 'dragons', name: 'Dragons', icon: '🐉' }, { id: 'tricks', name: 'Tricks', icon: '🌀' },
  { id: 'gear', name: 'Gear', icon: '🪢' }, { id: 'colours', name: 'Colours', icon: '🎨' }, { id: 'toys', name: 'Toys', icon: '🧸' }, { id: 'places', name: 'Places', icon: '🗺️' },
  { id: 'trophies', name: 'Trophies', icon: '🏆' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const byPrice = <T extends { price: number }>(xs: readonly T[]) => [...xs].sort((a, b) => a.price - b.price);
const nameOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).name : REPEATS.find(r => r.id === w.id)!.name);
const iconOf = (w: Want) => (w.kind === 'item' ? itemOf(w.id).icon : REPEATS.find(r => r.id === w.id)!.icon);
const RAINBOW = 'linear-gradient(90deg,#e8483b,#ff8a1f,#f5c518,#2fae5a,#3b82e8,#8a4fd6)';
/** What a thing does, said after its name. */
function doesLine(item: Item): Phrase | null {
  if (item.cat === 'roost') return ({ nest: 'It holds an egg!', warm: 'It warms your eggs!', perch: 'Another dragon can sit here!', lookout: 'It points to the beacons!', calm: 'It stops the wind!', lights: 'It lights the night!', look: null } as const)[item.does];
  if (item.cat === 'gear') return item.slot === 'saddle' ? (item.speed ? 'It flies faster!' : 'It climbs faster!') : item.slot === 'magnet' ? 'It pulls Flames in!' : item.slot === 'breath' ? 'Its breath goes further!' : item.slot === 'belt' ? 'Another trick button!' : null;
  if (item.cat === 'trick') return 'It goes on a trick button!';
  if (item.cat === 'egg') return 'It has a new breath!';
  return null;
}

function RoostView({ a, balance }: { a: RoostState; balance: number }) {
  const ref = useRef<HTMLCanvasElement>(null), st = useRef({ a, balance });
  st.current = { a, balance };
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d');
    if (!ctx) return;
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
    let raf = 0;
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRoost(ctx, st.current.a, st.current.balance, r.width, r.height, ms / 1000, still);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} class="dr-roost-canvas" role="img" aria-label="Your Roost" />;
}

export function RoostScreen() {
  const voice = useVoice(), state = player.state.value, a = state.roost, balance = state.currency.balance;
  const tab = roostTab.value as TabId;
  const [picked, setPicked] = useState<Want | null>(null);
  const [naming, setNaming] = useState<number | null>(null);
  const goal = goalOf(a);
  useEffect(() => {
    void voice.say('The Roost!', ...(a.flights === 1 ? ['You have 1 Flight!'] : a.flights > 1 ? [`${Math.min(100, a.flights)}`, 'Flights!'] : []),
      ...(a.eggs.some(e => isReady(a, e)) ? ['It is warm! Tap it to hatch!'] : []));
  }, []);
  const need = unnamed(a);
  if (naming !== null || need) {
    const d = need ?? a.dragons.find(x => x.id === naming)!;
    return <div class="screen dr-roost-screen naming"><NameDragon dragon={d} onDone={() => setNaming(null)} /></div>;
  }

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function tapWant(w: Want) {
    if (!voice.active) return;
    const why = missingNeed(a, w);
    setPicked(w);
    if (why === 'nest-full') { sNope(); say(nameOf(w), 'Your nests are full!', 'Get a nest or a ledge for another egg!'); return; }
    if (why === 'named-first') { sNope(); say(nameOf(w), 'Wild eggs come after twenty other eggs!'); return; }
    if (why) { sNope(); say(nameOf(w), 'Get this first:', itemOf(why).name); return; }
    const price = priceOf(a, w), does = w.kind === 'item' ? doesLine(itemOf(w.id)) : w.id === 'ledge' ? 'It holds an egg!' : null;
    if (price > balance) { updateRoost(x => selectGoal(x, w)); say(nameOf(w), ...(does ? [does] : []), ...priceLine(price), ...needLine(price - balance)); return; }
    say(nameOf(w), ...(does ? [does] : []), ...priceLine(price));
  }
  function buyIt(w: Want) {
    if (!voice.active) return;
    const done = buy(w);
    if (done.kind !== 'accepted') { sNope(); return; }
    sFanfare(); confetti(30, voice.signal);
    setPicked(null);
    say('You got', nameOf(w), ...(w.kind === 'more' ? ['You can build more of these!'] : []), ...(w.kind === 'more' && w.id === 'wild' || (w.kind === 'item' && itemOf(w.id).cat === 'egg') ? ['Play a Round to warm your eggs!'] : []));
  }
  function tapEgg(i: number) {
    if (!voice.active) return;
    const e = a.eggs[i]!;
    if (isReady(a, e)) {
      const done = hatch(a, i);
      if (!done) return;
      updateRoost(() => done.state);
      setNaming(done.dragon.id);
      return;
    }
    const left = hatchNeed(a, e.egg) - e.warmth;
    sNope(); say(left === 1 ? '1 more Round.' : 'It needs', ...(left === 1 ? [] : [`${left}`, 'more Rounds.']));
  }
  function useItem(item: Item) {
    if (!voice.active) return;
    if (item.cat === 'trick') {
      const next = toggleTrick(a, item.id);
      if (!next) { sNope(); say(item.name); return; }
      updateRoost(() => next); sChime(); say(item.name, next.tricksOn.includes(item.id) ? 'On!' : 'Off!');
      return;
    }
    if (item.cat === 'gear' || item.cat === 'colour') { const next = wear(a, item.id); if (next) { updateRoost(() => next); sChime(); say(item.name, next.worn[slotOf(item)] === item.id ? 'On!' : 'Off!'); } return; }
    say(item.name);
  }
  const slotOf = (item: Item) => (item.cat === 'gear' ? item.slot : item.cat === 'colour' ? (item.part === 'breath' ? 'breath-colour' : 'trail') : 'extra') as keyof RoostState['worn'];

  const tile = (item: Item) => {
    const w: Want = { kind: 'item', id: item.id }, owned = has(a, item.id), why = !owned && missingNeed(a, w), afford = !owned && !why && item.price <= balance && buyable(a, w);
    const on = (item.cat === 'trick' && a.tricksOn.includes(item.id)) || ((item.cat === 'gear' || item.cat === 'colour') && a.worn[slotOf(item)] === item.id);
    const art = item.cat === 'egg' ? <img src={eggPic(item.look, 56)} alt="" />
      : item.cat === 'colour' && item.hex ? <span class="swatch-dot" style={{ background: item.hex === 'rainbow' ? RAINBOW : item.hex }} />
      : <span class="tile-icon" aria-hidden="true">{item.icon}</span>;
    return (
      <button key={item.id} class={cls('dr-tile', owned && 'owned', on && 'worn', why && why !== 'nest-full' && 'locked', afford && 'afford', picked && wantKey(picked) === item.id && 'picked')}
        aria-label={item.name} onClick={() => (owned ? useItem(item) : tapWant(w))}>
        {art}<span class="tile-name">{item.name}</span>
        {owned ? <span class="tile-tag">{on ? '✓' : '✔︎'}</span> : why && why !== 'nest-full' ? <span class="tile-tag">🔒</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{item.price}</span>}
      </button>
    );
  };
  const repeatTile = (id: RepeatId) => {
    const w: Want = { kind: 'more', id }, r = REPEATS.find(x => x.id === id)!, why = missingNeed(a, w), price = priceOf(a, w);
    return (
      <button key={id} class={cls('dr-tile', 'repeat', why === 'named-first' && 'locked', !why && price <= balance && 'afford', picked && wantKey(picked) === `more:${id}` && 'picked')} aria-label={r.name} onClick={() => tapWant(w)}>
        <span class="tile-icon" aria-hidden="true">{r.icon}</span><span class="tile-name">{r.name}</span>
        {a.more[id] > 0 && <span class="tile-count">×{a.more[id]}</span>}
        {why === 'named-first' ? <span class="tile-tag">🔒 {namedEggs(a)}/{WILD_AFTER}</span> : <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{price}</span>}
      </button>
    );
  };
  const goalPrice = goal ? priceOf(a, goal) : 0, rank = rankOf(a.flown);
  return (
    <div class="screen dr-roost-screen">
      <header class="dr-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Roost</h1>
        <span class="rank-chip" aria-label={rank.name}>🎖️ <small>{rank.name}{rank.number ? ` ${rank.number}` : ''}</small></span>
        <CurrencyPile kind={CUR} count={balance} />
      </header>
      <div class="dr-roost-main">
        <div class="dr-roost-view"><RoostView a={a} balance={balance} /></div>
        <div class="dr-roost-side">
          <button class={cls('big-btn', 'go', 'fly-btn', a.flights > 0 && 'pulse')} aria-label="Fly"
            onClick={() => { if (!voice.active) return; if (a.flights > 0) fly(); else { sNope(); say('Play a Round to earn a Flight!'); } }}>
            <span class="fly-plane" aria-hidden="true"><MyDragon /></span><span class="fly-word">Fly</span><span class="race-count">{a.flights}</span>
          </button>
          {goal && (
            <button class="goal-chip dr-goal" aria-label={`Goal: ${nameOf(goal)}`} onClick={() => tapWant(goal)}>
              <span class="goal-icon" aria-hidden="true">{iconOf(goal)}</span>
              <span class="goal-bar"><i style={{ width: `${Math.min(100, (balance / Math.max(1, goalPrice)) * 100)}%` }} /></span>
              <span class="goal-num">{Math.min(balance, goalPrice)}/{goalPrice}</span>
            </button>
          )}
          <button class="big-btn side-btn" aria-label="Visit the roost" onClick={() => { if (voice.active) screen.value = 'visit'; }}><span aria-hidden="true">👀</span><span class="side-word">Visit</span></button>
        </div>
      </div>
      {picked && (
        <div class="buy-bar">
          <span class="buy-icon" aria-hidden="true">{iconOf(picked)}</span><span class="buy-name">{nameOf(picked)}</span>
          {missingNeed(a, picked) ? <span class="buy-need">🔒</span>
            : priceOf(a, picked) <= balance
              ? <button class="big-btn go buy-btn pulse" aria-label="Buy" onClick={() => buyIt(picked)}>Buy <CurrencyIcon kind={CUR} size={22} />{priceOf(a, picked)}</button>
              : <span class="buy-need"><CurrencyIcon kind={CUR} size={18} />{priceOf(a, picked)}</span>}
        </div>
      )}
      <div class="dr-tabs" role="tablist">
        {TABS.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id} aria-label={t.name} class={cls('dr-tab', tab === t.id && 'on', t.id === 'eggs' && a.eggs.some(e => isReady(a, e)) && 'fresh')}
          onClick={() => { roostTab.value = t.id; setPicked(null); say(t.name); }}><span aria-hidden="true">{t.icon}</span><span class="tab-name">{t.name}</span></button>)}
      </div>
      <div class="dr-tray">
        {tab === 'roost' && <div class="tiles">{repeatTile('ledge')}{byPrice(ROOST.filter(r => r.price > 0)).map(tile)}</div>}
        {tab === 'eggs' && <>
          <div class="dr-nests">
            {Array.from({ length: Math.max(a.eggs.length, Math.min(nestCount(a), 40)) }, (_, i) => {
              const e = a.eggs[i];
              if (!e) return <span key={i} class="dr-nest empty" aria-hidden="true">🪺</span>;
              const ready = isReady(a, e), need = hatchNeed(a, e.egg);
              return (
                <button key={i} class={cls('dr-nest', ready && 'ready pulse')} aria-label={ready ? 'Hatch!' : 'An egg warming'} onClick={() => tapEgg(i)}>
                  <img src={eggPic(lookOfEgg(e.egg), 64, Math.min(1, e.warmth / need))} alt="" />
                  <span class="warm"><i style={{ width: `${Math.min(100, (e.warmth / need) * 100)}%` }} /></span>
                </button>
              );
            })}
          </div>
          <div class="tiles">{byPrice(EGGS).map(tile)}{repeatTile('wild')}</div>
        </>}
        {tab === 'dragons' && <div class="tiles">{a.dragons.slice().reverse().slice(0, 200).map(d => (
          <button key={d.id} class={cls('dr-tile', 'owned', a.riding === d.id && 'worn')} aria-label={shownName(d.name)}
            onClick={() => { if (!voice.active) return; const next = ride(a, d.id); if (next) { updateRoost(() => next); sChime(); } if (d.name) say(wordPhrase(d.name[0]), wordPhrase(d.name[1]), ...(next ? ['Your dragon flies next!'] : []), STAGE_NAMES[stageOf(d.flights)]!); }}>
            <img src={dragonPic(lookOf(d), 64, { stage: stageOf(d.flights), marks: marksOf(d.flights) })} alt="" />
            <span class="tile-name">{shownName(d.name)}</span>
            <span class="tile-tag">{'⭐'.repeat(Math.min(3, marksOf(d.flights)))}{marksOf(d.flights) > 3 ? marksOf(d.flights) : ''} {STAGE_NAMES[stageOf(d.flights)]}</span>
          </button>
        ))}</div>}
        {tab === 'tricks' && <>
          <div class="fleet-bar"><span class="chip-note">🎛️ {a.tricksOn.length}/{trickSlots(a)}</span>{a.tricksOn.map(id => <span key={id} class="chip-note">{itemOf(id).icon} {itemOf(id).name}</span>)}</div>
          <div class="tiles">{byPrice(TRICKS).map(tile)}</div>
        </>}
        {tab === 'gear' && <div class="tiles">{byPrice(GEAR).map(tile)}</div>}
        {tab === 'colours' && <div class="tiles">{byPrice(COLOURS).filter(c => c.price > 0 || has(a, c.id)).map(tile)}</div>}
        {tab === 'toys' && <div class="tiles">{byPrice(TOYS).map(tile)}</div>}
        {tab === 'places' && <div class="tiles">{Array.from({ length: Math.max(a.reached, 1) }, (_, i) => a.reached - i).filter(n => n >= 1).slice(0, 120).map(n => {
          const c = course(n), name = c.name ?? `${n}`;
          return (
            <button key={n} class="dr-tile owned" aria-label={name} onClick={() => { if (!voice.active) return; if (a.flights > 0) fly(n); else { sNope(); say(...(c.name ? [c.name] : []), 'Play a Round to earn a Flight!'); } }}>
              <span class="tile-icon" aria-hidden="true">{c.night ? '🌙' : '⛰️'}</span><span class="tile-name">{c.name ?? `Flight ${n}`}</span><span class="tile-tag">🏅 {a.bests[n] ?? 0}</span>
            </button>
          );
        })}{a.reached < FIXED_FLIGHTS && PLACES.slice(a.reached).map(p => <span key={p.name} class="dr-tile locked"><span class="tile-icon" aria-hidden="true">❔</span><span class="tile-name">{p.name}</span></span>)}</div>}
        {tab === 'trophies' && <div class="tiles">{TROPHIES.map(t => { const won = t.done(a); return (
          <button key={t.id} class={cls('dr-tile', won ? 'owned' : 'locked')} aria-label={t.name} onClick={() => say(t.name)}><span class="tile-icon" aria-hidden="true">{won ? t.icon : '❔'}</span><span class="tile-name">{t.name}</span></button>
        ); })}</div>}
      </div>
    </div>
  );
}
export { cap };
