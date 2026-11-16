// The Shed: his train, the big Deliver! button with his Deliveries, and the tray. He picks a tab (Engines, Cars, Paint, Track,
// Scenery) and taps a tile: one he owns goes on (a car is coupled or uncoupled), one he doesn't goes on the train to try, with Buy
// beside it, so he sees it before he spends. The Goal chip shows what he's saving for: the cheapest thing he hasn't got.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { sceneryArt, trackArt } from '../art/scenery';
import { carSvg, engineOf, engineSvg, carOf, paintOf, pieceSvg } from '../art/train';
import { TrainView } from '../art/TrainView';
import { EXPRESS_CURRENCY } from '../branding';
import { buy, player, updateTrains } from '../game';
import { goDeliver, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { MAX_CARS, PAINTS, TAB_NAMES, TABS, type ItemName, type Tab } from './catalogue';
import { allOwned, goalOf, idOf, isOwned, item, keysIn, priceOf, selectGoal, tabOf, use, type ItemKey, type TrainSet } from './trainset';

const TAB_ICONS: Record<Tab, string> = { engine: '🚂', car: '🚃', paint: '🎨', track: '🛤️', scenery: '🌳' };
export const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;
const nameOf = (k: ItemKey) => item(k).name as ItemName;

/** His train with this thing tried on: an engine or paint goes on, a car is coupled on the end. */
function tryOn(t: TrainSet, k: ItemKey): Pick<TrainSet, 'engine' | 'cars' | 'paint'> {
  const tab = tabOf(k), id = idOf(k);
  if (tab === 'engine') return { ...t, engine: id };
  if (tab === 'paint') return { ...t, paint: id };
  if (tab === 'car' && !t.cars.includes(id)) return { ...t, cars: [...t.cars.slice(0, MAX_CARS - 1), id] };
  return t;
}

/** The picture on a tile. */
function TilePic({ k, t }: { k: ItemKey; t: TrainSet }) {
  const tab = tabOf(k), id = idOf(k), p = paintOf(t.paint);
  const svg = useMemo(() => {
    if (tab === 'engine') return pieceSvg(engineSvg(engineOf(id), p, 170), 170);
    if (tab === 'car') return pieceSvg(carSvg(carOf(id), p, 130), 130);
    if (tab === 'track') return trackArt(id);
    if (tab === 'scenery' || tab === 'gift') { const a = sceneryArt(id); return 'svg' in a ? a.svg : null; }
    return null;
  }, [k, t.paint]);
  if (tab === 'paint') {
    const paint = PAINTS.find(x => x.id === id)!;
    return <span class={`swatch-pic ${'pattern' in paint ? paint.pattern : ''}`} style={{ background: paint.body, '--trim': paint.trim }} aria-hidden="true" />;
  }
  if (svg) return <span class="item-svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
  const a = sceneryArt(id);
  return <span class="pic emo item-pic" aria-hidden="true">{'emoji' in a ? a.emoji : ''}</span>;
}

/** The goal chip in a header: what he's saving for and how close he is. Tapping it goes to it. */
export function GoalChip({ onGo }: { onGo(k: ItemKey): void }) {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, goal = goalOf(state.trains);
  if (!goal) return <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(state.trains)) void voice.say('You built everything!'); }}>🏆</button>;
  return (
    <button class={`goalchip ${balance >= priceOf(goal) ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) onGo(goal); }}>
      <span class="gi"><TilePic k={goal} t={state.trains} /></span>
      <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
    </button>
  );
}

export function Shed() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, t = state.trains;
  const [tab, setTab] = useState<Tab>('engine'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shown = useMemo(() => (trial ? tryOn(t, trial) : t), [t, trial]);

  useEffect(() => {
    const ready: Phrase[] = t.deliveries === 1 ? ['You have 1 Delivery!', 'Tap Deliver!'] : t.deliveries > 1 ? [n(t.deliveries), 'Deliveries!', 'Tap Deliver!'] : ['Play a Round to earn a Delivery!'];
    void voice.say('The Shed!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function deliver() {
    if (!voice.active || blocked) return;
    if (t.deliveries <= 0) { nope(); void voice.say('Play a Round to earn a Delivery!'); return; }
    goDeliver();
  }
  function pickTab(x: Tab) { if (voice.active) { setTab(x); setTrial(null); void voice.say(TAB_NAMES[x]); } }
  function after(k: ItemKey): Phrase[] {
    const tab = tabOf(k);
    if (tab === 'track') return [idOf(k).startsWith('table') ? 'A bigger table!' : 'More track to lay!'];
    if (tab === 'scenery') return ['Put it on your table!'];
    return [];
  }
  function celebrate(k: ItemKey) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say('You got', nameOf(k), ...after(k)).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3500); // a stalled voice never freezes the screen
  }
  function tap(k: ItemKey) {
    if (!voice.active || blocked) return;
    if (isOwned(t, k)) {
      setTrial(null);
      const tab = tabOf(k), before = t.cars.length;
      updateTrains(x => use(x, k));
      sClink();
      if (tab === 'car') {
        const now = player.state.peek().trains.cars;
        void voice.say(nameOf(k), now.includes(idOf(k)) ? 'Coupled!' : now.length === before && before >= MAX_CARS ? 'Your engine can pull 6 cars.' : 'Uncoupled!');
      } else void voice.say(nameOf(k), ...after(k));
      return;
    }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(nameOf(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateTrains(x => selectGoal(x, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k); }
  }
  function goTo(k: ItemKey) { const x = tabOf(k); if (x !== 'gift') { setTab(x); tap(k); } }

  const keys = keysIn(tab);
  const on = (k: ItemKey) => {
    const id = idOf(k), x = tabOf(k);
    return x === 'engine' ? t.engine === id : x === 'paint' ? t.paint === id : x === 'car' ? t.cars.includes(id) : false;
  };
  return (
    <div class="screen shed-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Shed</h1>
        <GoalChip onGo={goTo} />
        <CurrencyPile kind={EXPRESS_CURRENCY} count={balance} />
      </header>
      <div class="shed-body">
        <section class="bay">
          <div class="bay-train"><TrainView train={shown} class={trial ? 'trying' : ''} /></div>
          <div class="bay-go">
            <button class={`big-btn go deliver-btn ${wiggle ? 'wiggle' : ''} ${t.deliveries > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Deliver" onClick={deliver}>
              <span class="deliver-icon" aria-hidden="true">🚂</span><span class="deliver-word">Deliver!</span><span class="deliver-count">{t.deliveries}</span>
            </button>
            <IconButton label="Layout" class="layout-btn" onClick={() => { if (voice.active) screen.value = 'layout'; }}>🛤️</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="se-tabs" role="tablist">
            {TABS.map(x => <button key={x} role="tab" aria-selected={x === tab} aria-label={TAB_NAMES[x]} class={`se-tab ${x === tab ? 'on' : ''}`} onClick={() => pickTab(x)}><span aria-hidden="true">{TAB_ICONS[x]}</span></button>)}
          </div>
          <div class="se-tray">
            {keys.map(k => {
              const info = item(k), owned = isOwned(t, k), isOn = on(k), can = !owned && balance >= info.price;
              return (
                <button key={k} class={`se-tile ${isOn ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={isOn} onClick={() => tap(k)}>
                  <TilePic k={k} t={t} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (isOn ? '✓' : '') : <>{info.price}<CurrencyIcon kind={EXPRESS_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{item(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={EXPRESS_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
