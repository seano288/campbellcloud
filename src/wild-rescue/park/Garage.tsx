// The Garage: his rescue truck, the big Rescue! button with his calls, and the parts tray. He picks a slot from the tabs (Tires,
// Winch, Lights, Carrier, Buddy, Paint) and taps a part: one he owns goes on, one he doesn't goes on the truck to try, with Buy beside it, so
// he sees it before he spends. A part that opens new rescues says so ("They can drive in the desert!"). The Goal chip shows what he's
// saving for: the cheapest thing that brings a new animal closer.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { HabitatArt, TruckView } from '../art/Pics';
import { RESCUE_CURRENCY } from '../branding';
import { buy, player, updateRescue } from '../game';
import { goRescue, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { allOwned, allowed, goalOf, isOwned, priceOf, selectGoal } from './rescue';
import { buddyIcon, fit, idOf, item, keysIn, paintOf, partOf, SLOT_NAMES, tabOf, type ItemKey, type Tab, type Truck } from './shop';

const TABS = ['tires', 'winch', 'lights', 'carrier', 'buddy', 'paint'] as const satisfies readonly Tab[];
type GarageTab = (typeof TABS)[number];
const TAB_ICONS: Record<GarageTab, string> = { tires: '🛞', winch: '🪝', lights: '🚨', carrier: '📦', buddy: '🐶', paint: '🎨' };
export const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

/** The goal chip in a header: what he's saving for and how close he is. Tapping it goes to it. */
export function GoalChip({ onGo }: { onGo(k: ItemKey): void }) {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, goal = goalOf(state.rescue);
  if (!goal) return <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(state.rescue)) void voice.say('You built everything!'); }}>🏆</button>;
  const tab = tabOf(goal);
  return (
    <button class={`goalchip ${balance >= priceOf(goal) ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) onGo(goal); }}>
      <span class="gi">{tab === 'habitat' ? <HabitatArt id={idOf(goal) as never} /> : tab === 'extra' || tab === 'deco' ? <span class="pic emo">⭐</span> : <TruckView truck={fit(state.rescue.truck, goal)} label={null} />}</span>
      <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
    </button>
  );
}

export function Garage() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, rescue = state.rescue;
  const [tab, setTab] = useState<GarageTab>('tires'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shown = useMemo(() => (trial ? fit(rescue.truck, trial) : rescue.truck), [rescue.truck, trial]);

  useEffect(() => {
    const ready: Phrase[] = rescue.calls === 1 ? ['You have 1 rescue call!', 'Tap Rescue!'] : rescue.calls > 1 ? [n(rescue.calls), 'rescue calls!', 'Tap Rescue!'] : ['Play a Round to earn a rescue call!'];
    void voice.say('Garage!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function rescueNow() {
    if (!voice.active || blocked) return;
    if (rescue.calls <= 0) { nope(); void voice.say('Play a Round to earn a rescue call!'); return; }
    goRescue();
  }
  function pickTab(t: GarageTab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(SLOT_NAMES[t]); } }
  function celebrate(k: ItemKey) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    const opens = partOf(k);
    void voice.say('You got', item(k).name, ...(opens && 'opens' in opens ? [opens.opens] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3500); // a stalled voice never freezes the screen
  }
  function tap(k: ItemKey) {
    if (!voice.active || blocked) return;
    const p = partOf(k), opens: Phrase[] = p && 'opens' in p ? [p.opens] : [];
    if (isOwned(rescue, k)) {
      setTrial(null);
      const next = fit(rescue.truck, k);
      if (allowed(rescue, next)) updateRescue(r => ({ ...r, truck: next }));
      sClink(); void voice.say(item(k).name, ...opens);
      return;
    }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(item(k).name, ...opens, 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateRescue(r => selectGoal(r, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k); }
  }
  function goTo(k: ItemKey) {
    const t = tabOf(k);
    if ((TABS as readonly string[]).includes(t)) { setTab(t as GarageTab); tap(k); return; }
    screen.value = 'park';
  }

  const keys = keysIn(tab);
  return (
    <div class="screen garage-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Garage</h1>
        <GoalChip onGo={goTo} />
        <CurrencyPile kind={RESCUE_CURRENCY} count={balance} />
      </header>
      <div class="garage-body">
        <section class="bay">
          <div class="bay-truck"><TruckView truck={shown} class={trial ? 'trying' : ''} /></div>
          <div class="bay-go">
            <button class={`big-btn go rescue-btn ${wiggle ? 'wiggle' : ''} ${rescue.calls > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Rescue" onClick={rescueNow}>
              <span class="rescue-radio" aria-hidden="true">📻</span><span class="rescue-word">Rescue!</span><span class="rescue-count">{rescue.calls}</span>
            </button>
            <IconButton label="Park" class="park-btn" onClick={() => { if (voice.active) screen.value = 'park'; }}>🌳</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="wr-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={SLOT_NAMES[t]} class={`wr-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="wr-tray">
            {keys.map(k => {
              const info = item(k), owned = isOwned(rescue, k), on = owned && (tab === 'paint' ? rescue.truck.paint === idOf(k) : rescue.truck[tab as Exclude<GarageTab, 'paint'>] === idOf(k));
              const p = partOf(k), can = !owned && balance >= info.price;
              return (
                <button key={k} class={`wr-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <PartPic truck={fit(rescue.truck, k)} tab={tab} paint={idOf(k)} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : '') : <>{info.price}<CurrencyIcon kind={RESCUE_CURRENCY} size={18} /></>}{p && 'opens' in p && <span class="opens" aria-hidden="true">🗝️</span>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{item(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={RESCUE_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** A part on the truck, for a paint just a swatch, and a buddy big. */
function PartPic({ truck, tab, paint }: { truck: Truck; tab: GarageTab; paint: string }) {
  const b = tab === 'buddy' ? buddyIcon(truck.buddy) : undefined;
  if (b) return <span class="pic emo item-pic" aria-hidden="true">{b.icon}</span>;
  if (tab === 'paint') {
    const p = paintOf(paint);
    return <span class={`swatch-pic ${p.pattern ?? ''}`} style={{ background: p.body, '--trim': p.trim }} aria-hidden="true" />;
  }
  return <TruckView truck={truck} class="part-pic" label={null} />;
}
