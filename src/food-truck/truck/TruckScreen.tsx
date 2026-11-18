// The Truck: his truck from the side with everything fitted, the big Open! button (a Service, with how many he has), and the shop tray.
// He picks a tab and taps a thing: one he owns goes on (a Helper switches on or off), one he doesn't goes on the truck to try, with its
// name, its price in Bolts and Buy, so he sees it before he spends. A thing he can't afford yet becomes his Goal, shown as a chip with
// how close he is. Bolts only: nothing here is priced in dollars.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { PartPic } from '../art/PartPic';
import { TruckPic, type TruckLook } from '../art/TruckPic';
import { TRUCK_CURRENCY } from '../branding';
import { buy, player, updateTruck } from '../game';
import { goService, screen } from '../nav';
import { gotLine, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { HELPER_LINES, keysIn, partOf, SLOT_NAMES, TRUCKS, truckOf, type HelperId, type PartKey, type Slot, type TruckId } from './parts';
import { allBought, drive, fitOwned, goalOf, nameOf, owns, priceOf, setGoal, truckKey, type ShopKey } from './state';

type Tab = 'trucks' | Slot | 'helper';
const TABS: readonly Tab[] = ['trucks', 'grill', 'awning', 'speaker', 'lights', 'paint', 'sign', 'mascot', 'wheels', 'helper'];
const TAB_ICONS: Record<Tab, string> = { trucks: '🚚', grill: '🔥', awning: '⛱️', speaker: '📢', lights: '💡', paint: '🎨', sign: '🪧', mascot: '🦄', wheels: '🛞', helper: '🤖' };
const TAB_NAMES: Record<Tab, Phrase> = { ...SLOT_NAMES, trucks: 'Trucks', helper: 'Helpers' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;
/** What a part that changes the Service does, said after its name. */
function powerLine(k: ShopKey): Phrase[] {
  if (k.startsWith('truck:')) return [];
  const p = partOf(k as PartKey);
  if (p.slot === 'helper') return [HELPER_LINES[p.id as HelperId]];
  if (!p.price) return [];
  if (p.slot === 'grill') return ['More orders at once!'];
  if (p.slot === 'awning' && p.power) return ['More customers can wait!'];
  if (p.slot === 'speaker') return ['Customers come faster!'];
  if (p.slot === 'lights') return ['Lights open the night spots!'];
  return [];
}
const keysFor = (tab: Tab): ShopKey[] => (tab === 'trucks' ? TRUCKS.map(k => truckKey(k.id)) : keysIn(tab));
const tabOf = (k: ShopKey): Tab => (k.startsWith('truck:') ? 'trucks' : (partOf(k as PartKey).slot as Tab));
/** The truck as it would look with this on it. */
function lookWith(t: TruckLook, k: ShopKey | null): TruckLook {
  if (!k) return t;
  if (k.startsWith('truck:')) return { ...t, truck: k.slice(6) as TruckId };
  const p = partOf(k as PartKey);
  return p.slot === 'helper' ? t : { ...t, fit: { ...t.fit, [p.slot]: k } };
}

export function TruckScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, t = state.truck;
  const [tab, setTab] = useState<Tab>('trucks'), [trial, setTrial] = useState<ShopKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const goal = goalOf(t);
  useEffect(() => {
    const ready: Phrase[] = t.services === 1 ? ['You have 1 Service ready!', 'Tap Open!'] : t.services > 1 ? [n(t.services), 'Services are ready!', 'Tap Open!'] : ['Play a Round to earn a Service!'];
    void voice.say('Your truck!', ...ready);
  }, []);
  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function open() {
    if (!voice.active || blocked) return;
    if (t.services <= 0) { nope(); void voice.say('Play a Round to earn a Service!'); return; }
    goService();
  }
  function pickTab(x: Tab) { if (voice.active) { setTab(x); setTrial(null); void voice.say(TAB_NAMES[x]); } }
  function tap(k: ShopKey) {
    if (!voice.active || blocked) return;
    if (owns(t, k)) {
      setTrial(null); sClink();
      if (k.startsWith('truck:')) { updateTruck(x => drive(x, k.slice(6) as TruckId)); void voice.say(nameOf(k) as Phrase); return; }
      const helper = partOf(k as PartKey).slot === 'helper', wasOff = t.off.includes(k as PartKey);
      updateTruck(x => fitOwned(x, k as PartKey));
      void voice.say(nameOf(k) as Phrase, ...(helper ? [wasOff ? 'On!' as const : 'Off!' as const] : []));
      return;
    }
    setTrial(k); sChime();
    const price = priceOf(k);
    void voice.say(nameOf(k) as Phrase, ...powerLine(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) { nope(); updateTruck(x => setGoal(x, k)); void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!'); return; }
    if (buy(k).kind !== 'accepted') return;
    setTrial(null); setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say(gotLine(nameOf(k) as never), ...powerLine(k)).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  const keys = keysFor(tab), shown = lookWith(t, trial);
  return (
    <div class="screen ft-truck-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Truck</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(tabOf(goal)); tap(goal); } }}>
              <span class="gi" aria-hidden="true">{goal.startsWith('truck:') ? truckOf(goal.slice(6) as TruckId).food : partOf(goal as PartKey).look[0]?.startsWith('#') ? '🎨' : partOf(goal as PartKey).look[0] || '⭐'}</span>
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allBought(t)) void voice.say('You bought everything!'); }}>🏆</button>}
        <CurrencyPile kind={TRUCK_CURRENCY} count={balance} />
      </header>
      <div class="truck-body">
        <section class="truck-side">
          <div class={`truck-stage ${trial ? 'trying' : ''}`}><TruckPic look={shown} label="Your food truck" /></div>
          <div class="truck-go">
            <button class={`big-btn go open-btn ${wiggle ? 'wiggle' : ''} ${t.services > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Open" onClick={open}>
              <span class="open-word">Open!</span><span class="service-count">🍽️{t.services}</span>
            </button>
            <IconButton label="Sticker Book" onClick={() => { if (voice.active) screen.value = 'book'; }}>📒</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="ft-tabs" role="tablist">
            {TABS.map(x => <button key={x} role="tab" aria-selected={x === tab} aria-label={TAB_NAMES[x]} class={`ft-tab ${x === tab ? 'on' : ''}`} onClick={() => pickTab(x)}><span aria-hidden="true">{TAB_ICONS[x]}</span></button>)}
          </div>
          <div class="ft-tray">
            {keys.map(k => {
              const owned = owns(t, k), truck = k.startsWith('truck:'), helper = !truck && partOf(k as PartKey).slot === 'helper';
              const on = owned && (truck ? t.truck === k.slice(6) : helper ? !t.off.includes(k as PartKey) : t.fit[partOf(k as PartKey).slot as Slot] === k);
              const price = priceOf(k), can = !owned && balance >= price;
              return (
                <button key={k} class={`ft-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={nameOf(k)} aria-pressed={on} onClick={() => tap(k)}>
                  {truck || partOf(k as PartKey).slot === 'paint' ? <TruckPic look={lookWith(t, k)} class="tile-truck" label={nameOf(k)} /> : <PartPic k={k as PartKey} />}
                  <span class="mt-name">{nameOf(k)}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : helper ? 'off' : '') : <>{price}<CurrencyIcon kind={TRUCK_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{nameOf(trial)}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={TRUCK_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
