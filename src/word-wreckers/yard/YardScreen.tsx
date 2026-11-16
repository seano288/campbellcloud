// The Yard: his machines, the big Job! button with his Jobs, and the shop tray. He picks a tab (Machines, Upgrades, Paint, Driver,
// Town) and taps a tile: one he owns goes on (a machine becomes the one he drives), one he doesn't is shown on his machine to try, with
// Buy beside it, so he sees it before he spends. Upgrades are for the machine he's driving. The Goal chip shows what he's saving for.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { MachineView, Swatch } from '../art/Pics';
import { WRECKERS_CURRENCY } from '../branding';
import { buy, player, updateYard } from '../game';
import { goJob, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { DECOS, DRIVERS, idOf, item, ITEMS, keyOf, MACHINES, opensOf, STREETS, tabOf, UPGRADES, upKey, type Boost, type ItemKey, type MachineId, type Tab } from './shop';
import { allOwned, goalOf, isOwned, needsFirst, ownsMachine, paintFor, priceOf, selectGoal } from './yard';

const TABS = ['machine', 'up', 'paint', 'driver', 'town'] as const;
type YardTab = (typeof TABS)[number];
const TAB_NAMES = { machine: 'Machines', up: 'Upgrades', paint: 'Paint', driver: 'Driver', town: 'Town' } as const satisfies Record<YardTab, Phrase>;
const TAB_ICONS: Record<YardTab, string> = { machine: '🚜', up: '🔧', paint: '🎨', driver: '👷', town: '🏙️' };
const BOOSTS: Record<Boost, { icon: string; line: Phrase | null }> = { power: { icon: '💪', line: 'More power!' }, size: { icon: '💥', line: 'Bigger hits!' }, speed: { icon: '⚡', line: 'Faster!' }, look: { icon: '✨', line: null } };
export const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

const tabFor = (k: ItemKey): YardTab => { const t = tabOf(k); return t === 'street' || t === 'deco' ? 'town' : t as YardTab; };
const boostOf = (k: ItemKey) => { const it = item(k); return it.tab === 'up' ? UPGRADES.find(u => u.machine === it.machine && u.id === it.id)!.boost : null; };

/** The goal chip in a header: what he's saving for and how close he is. Tapping it goes to it. */
export function GoalChip({ onGo }: { onGo(k: ItemKey): void }) {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, goal = goalOf(state.yard);
  if (!goal) return <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(state.yard)) void voice.say('You built everything!'); }}>🏆</button>;
  return (
    <button class={`goalchip ${balance >= priceOf(goal) ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) onGo(goal); }}>
      <span class="gi"><ItemPic k={goal} /></span>
      <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
    </button>
  );
}

/** A thing he can buy, as a picture: the machine (or his machine with the upgrade), a swatch, a driver, a street sign, a decoration. */
function ItemPic({ k, machine }: { k: ItemKey; machine?: MachineId }) {
  const it = item(k), yard = player.state.value.yard;
  if (it.tab === 'machine') return <MachineView id={it.id as MachineId} label={null} class="part-pic" />;
  if (it.tab === 'up') return <MachineView id={it.machine!} trying={k} label={null} class="part-pic" />;
  if (it.tab === 'paint') return <Swatch paint={it.id} />;
  if (it.tab === 'driver') return <span class="pic emo item-pic" aria-hidden="true">{DRIVERS.find(d => d.id === it.id)!.icon}</span>;
  if (it.tab === 'street') return <span class="street-pic" aria-hidden="true" style={{ background: STREETS.find(s => s.id === it.id)!.ground }}>🛣️</span>;
  void machine; void yard;
  return <span class="pic emo item-pic" aria-hidden="true">{DECOS.find(d => d.id === it.id)!.icon}</span>;
}

export function YardScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, yard = state.yard;
  const [tab, setTab] = useState<YardTab>('machine'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shownMachine: MachineId = trial && tabOf(trial) === 'machine' ? idOf(trial) as MachineId : yard.machine;

  useEffect(() => {
    const ready: Phrase[] = yard.jobs === 1 ? ['You have 1 Job!', 'Tap Job!'] : yard.jobs > 1 ? [n(yard.jobs), 'Jobs!', 'Tap Job!'] : ['Play a Round to earn a Job!'];
    void voice.say('The Yard!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function jobNow() {
    if (!voice.active || blocked) return;
    if (yard.jobs <= 0) { nope(); void voice.say('Play a Round to earn a Job!'); return; }
    goJob();
  }
  function pickTab(t: YardTab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(TAB_NAMES[t]); } }
  function celebrate(k: ItemKey) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    const opens = opensOf(k), boost = boostOf(k);
    void voice.say('You got', item(k).name, ...(opens ? [opens] : []), ...(boost && BOOSTS[boost].line ? [BOOSTS[boost].line!] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3500); // a stalled voice never freezes the screen
  }
  function tap(k: ItemKey) {
    if (!voice.active || blocked) return;
    const it = item(k), opens = opensOf(k), boost = boostOf(k), extra: Phrase[] = [...(opens ? [opens] : []), ...(boost && BOOSTS[boost].line ? [BOOSTS[boost].line!] : [])];
    if (isOwned(yard, k)) {
      setTrial(null);
      if (it.tab === 'machine') updateYard(y => ({ ...y, machine: it.id as MachineId }));
      if (it.tab === 'paint') updateYard(y => ({ ...y, paints: { ...y.paints, [y.machine]: it.id } }));
      if (it.tab === 'driver') updateYard(y => ({ ...y, driver: it.id as typeof y.driver }));
      sClink(); void voice.say(it.name, ...extra);
      return;
    }
    const first = needsFirst(yard, k);
    if (first) { nope(); void voice.say('First get the', MACHINES.find(m => m.id === first)!.name); return; }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(it.name, ...extra, 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateYard(y => selectGoal(y, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k); }
  }
  function goTo(k: ItemKey) {
    const it = item(k);
    if (it.tab === 'up' && it.machine && it.machine !== yard.machine) updateYard(y => ({ ...y, machine: it.machine! }));
    setTab(tabFor(k));
    setTimeout(() => tap(k), 0);
  }

  const keys = useMemo(() => {
    if (tab === 'up') return UPGRADES.filter(u => u.machine === yard.machine).map(u => upKey(u.machine, u.id));
    if (tab === 'town') return ITEMS.filter(i => i.tab === 'street' || i.tab === 'deco').map(i => i.key);
    return ITEMS.filter(i => i.tab === (tab as Tab)).map(i => i.key);
  }, [tab, yard.machine]);
  const isOn = (k: ItemKey) => {
    const t = tabOf(k), id = idOf(k);
    return t === 'machine' ? yard.machine === id : t === 'paint' ? paintFor(yard, yard.machine) === id : t === 'driver' ? yard.driver === id : false;
  };

  return (
    <div class="screen yard-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Yard</h1>
        <GoalChip onGo={goTo} />
        <CurrencyPile kind={WRECKERS_CURRENCY} count={balance} />
      </header>
      <div class="yard-body">
        <section class="bay">
          <div class="bay-machine"><MachineView id={shownMachine} trying={trial} class={trial ? 'trying' : ''} /></div>
          <div class="bay-go">
            <button class={`big-btn go job-btn ${wiggle ? 'wiggle' : ''} ${yard.jobs > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Job" onClick={jobNow}>
              <span class="job-icon" aria-hidden="true">🏗️</span><span class="job-word">Job!</span><span class="job-count">{yard.jobs}</span>
            </button>
            <IconButton label="Town" class="town-btn" onClick={() => { if (voice.active) screen.value = 'town'; }}>🏙️</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="ww-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={TAB_NAMES[t]} class={`ww-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="ww-tray">
            {keys.map(k => {
              const info = item(k), owned = isOwned(yard, k), on = owned && isOn(k), can = !owned && balance >= info.price && !needsFirst(yard, k), boost = boostOf(k);
              return (
                <button key={k} class={`ww-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <ItemPic k={k} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : '') : <>{info.price}<CurrencyIcon kind={WRECKERS_CURRENCY} size={18} /></>}{boost && <span class="opens" aria-hidden="true">{BOOSTS[boost].icon}</span>}{opensOf(k) && <span class="opens" aria-hidden="true">🗝️</span>}</span>
                </button>
              );
            })}
            {tab === 'up' && !ownsMachine(yard, yard.machine) && <p class="tray-note">🔒</p>}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{item(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={WRECKERS_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
export { keyOf };
