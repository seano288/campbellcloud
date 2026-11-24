// The Shed: his train, the big Deliver! button with his Deliveries, and the tray. He picks a tab (Engines, Cars, Paint, Track,
// Scenery, Sky) and taps a tile: one he owns goes on (a car is coupled or uncoupled, a weather on or off), one he doesn't goes on the
// train to try, with Buy beside it, so he sees it before he spends. Things he owns are wooden cards, what's on his train is green, and
// the shop's things are blue (gold-edged when he can afford them). A long tab is split into groups, picked with a row of chips (the
// open one shows its name). The Goal chip shows what he's saving for: the cheapest thing he hasn't got. Tapping an engine says its
// trick; a car that does something says what it does. The bay shows his train under the sky he has on: the sun, the sunset or the
// moon and stars.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { sceneryArt, skyArt, trackArt } from '../art/scenery';
import { carSvg, engineOf, engineSvg, carOf, paintOf, pieceSvg } from '../art/train';
import { TrainView } from '../art/TrainView';
import { EXPRESS_CURRENCY } from '../branding';
import { TRACK_SCENERY } from '../layout/track';
import { buy, player, updateTrains } from '../game';
import { goDeliver, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { CARS, ENGINES, GROUPS, MAX_CARS, PAINTS, SCENERY, SKY, TAB_NAMES, TABS, TRICKS, type GroupName, type ItemName, type Tab } from './catalogue';
import { allOwned, goalOf, groupOf, groupsIn, idOf, isOn, isOwned, item, keysIn, priceOf, selectGoal, tabOf, use, type ItemKey, type TrainSet } from './trainset';

const TAB_ICONS: Record<Tab, string> = { engine: '🚂', car: '🚃', paint: '🎨', track: '🛤️', scenery: '🌳', sky: '🌙' };
const groupInfo = (tab: Tab, g: string) => (GROUPS as Record<string, Record<string, { icon: string; name: GroupName }>>)[tab]![g]!;
/** What a thing does, said after its name: an engine's trick, a car's, a light at night, a piece that moves. */
function doesLine(k: ItemKey): Phrase[] {
  const tab = tabOf(k), id = idOf(k);
  if (tab === 'engine') return [TRICKS[ENGINES.find(e => e.id === id)!.trick].word];
  if (tab === 'car') { const c = CARS.find(x => x.id === id)!; return 'does' in c ? [TRICKS[c.does].word] : 'glow' in c ? ['It lights up at night!'] : []; }
  if (tab === 'scenery') { const r = SCENERY.find(x => x.id === id)!; return 'works' in r ? ['It moves when your train runs!'] : []; }
  return [];
}
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
    if (tab === 'sky') return skyArt(id);
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

/** The back of the table in a tall bay: a few of the things on his Layout (not the ones that sit on track), and a piece of scenery
 *  he is trying, in the middle and lit, so he sees it before he buys it. */
function BayProps({ t, trial }: { t: TrainSet; trial: ItemKey | null }) {
  const trying = trial && tabOf(trial) === 'scenery' && !TRACK_SCENERY.has(idOf(trial)) ? idOf(trial) : null;
  const ids = useMemo(() => {
    const own = [...new Set(t.layout.scenery.map(x => x.id))].filter(id => !TRACK_SCENERY.has(id) && id !== trying).slice(0, 6);
    return trying ? [...own.slice(0, 3), trying, ...own.slice(3)] : own;
  }, [t.layout.scenery, trying]);
  if (!ids.length) return null;
  return (
    <span class="bay-props" aria-hidden="true">
      {ids.map(id => { const a = sceneryArt(id); return <span key={id} class={`bay-prop ${id === trying ? 'trying' : ''}`}>{'svg' in a ? <span class="item-svg" dangerouslySetInnerHTML={{ __html: a.svg }} /> : <span class="pic emo">{a.emoji}</span>}</span>; })}
    </span>
  );
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
  const [group, setGroup] = useState<string | null>(null);
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
  function pickTab(x: Tab) { if (voice.active) { setTab(x); setGroup(null); setTrial(null); void voice.say(TAB_NAMES[x]); } }
  function pickGroup(g: string) { if (voice.active) { setGroup(g); setTrial(null); sClink(); void voice.say(groupInfo(tab, g).name); } }
  function after(k: ItemKey): Phrase[] {
    const tab = tabOf(k), g = groupOf(k);
    if (tab === 'track') return [g === 'rails' ? 'Look at your track!' : g === 'tables' ? 'A bigger table!' : 'More track to lay!'];
    if (tab === 'scenery') return ['Put it on your table!'];
    if (tab === 'sky') return ['See it when your train runs!'];
    return doesLine(k);
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
      } else if (tab === 'sky') {
        const on = player.state.peek().trains;
        void voice.say(...(isOn(on, k) ? [nameOf(k), 'See it when your train runs!'] as const : ['Clear sky!'] as const));
      } else void voice.say(nameOf(k), ...after(k));
      return;
    }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(nameOf(k), ...doesLine(k), 'It costs', n(price), 'Tickets.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Tickets.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateTrains(x => selectGoal(x, k));
      void voice.say('You need', n(price - balance), 'more Tickets.', 'Play a Round to earn Tickets!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k); }
  }
  function goTo(k: ItemKey) { const x = tabOf(k); if (x !== 'gift') { setTab(x); setGroup(groupOf(k)); tap(k); } }

  const groups = groupsIn(tab), shownGroup = group && groups.includes(group) ? group : groups[0] ?? null;
  const keys = keysIn(tab).filter(k => !shownGroup || groupOf(k) === shownGroup);
  const on = (k: ItemKey) => isOn(t, k);
  const sky = SKY.find(s => s.id === t.weather);
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
          <div class={`bay-train sky-${trial && tabOf(trial) === 'sky' && SKY.find(s => s.id === idOf(trial))!.kind === 'time' ? idOf(trial) : t.time}`}>
            <BayProps t={t} trial={trial} />
            <TrainView train={shown} class={trial ? 'trying' : ''} />
            {(trial && tabOf(trial) === 'sky' && SKY.find(s => s.id === idOf(trial))!.kind === 'weather' ? SKY.find(s => s.id === idOf(trial)) : sky) && (
              <span class="bay-weather" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i} class="pic emo" style={{ left: `${8 + i * 20}%`, animationDelay: `${i * .4}s` }}>{(trial && tabOf(trial) === 'sky' && SKY.find(s => s.id === idOf(trial))!.kind === 'weather' ? SKY.find(s => s.id === idOf(trial))! : sky!).icon}</span>)}</span>
            )}
          </div>
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
            {TABS.map(x => <button key={x} role="tab" aria-selected={x === tab} aria-label={TAB_NAMES[x]} class={`se-tab ${x === tab ? 'on' : ''}`} onClick={() => pickTab(x)}><span class="tab-icon" aria-hidden="true">{TAB_ICONS[x]}</span><span class="tab-name" aria-hidden="true">{TAB_NAMES[x]}</span></button>)}
          </div>
          {groups.length > 1 && (
            <div class="se-groups" role="tablist" aria-label="Groups">
              {groups.map(g => <button key={g} role="tab" aria-selected={g === shownGroup} aria-label={groupInfo(tab, g).name} class={`group-chip ${g === shownGroup ? 'on' : ''}`} onClick={() => pickGroup(g)}><span aria-hidden="true">{groupInfo(tab, g).icon}</span>{g === shownGroup && <span class="chip-name" aria-hidden="true">{groupInfo(tab, g).name}</span>}</button>)}
            </div>
          )}
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
