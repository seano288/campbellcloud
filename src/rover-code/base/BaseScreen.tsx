// The Space Base: his rocket on the launch pad with his rover parked beside it, the big Launch button with the planet it goes to, the
// row of planets (a flag on each he has explored, the Power each one needs), and the parts tray. He picks a slot from the tabs and taps
// a part: one he owns goes on, one he doesn't goes on the rocket to try, with the Power it would give and Buy beside it, so he sees it
// before he spends.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { GlobeView, RocketView, RoverView, rocketPic } from '../art/Art';
import { ROVER_CURRENCY } from '../branding';
import { buy, player, updateBase } from '../game';
import { launch, screen } from '../nav';
import { gotLine, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { allOwned, allowed, canReach, destinationOf, goalOf, isOwned, pickDestination, priceOf, selectGoal, visited } from './base';
import { fit, infoOf, keysIn, powerOf, SLOT_NAMES, tabOf, TABS, type PartKey, type Tab } from './parts';
import { PLANETS, type Planet, type PlanetId } from './planets';

const TAB_ICONS: Record<Tab, string> = { nose: '🔺', body: '🛢️', fins: '🪽', engine: '🔥', paint: '🎨' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

export function BaseScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, base = state.base;
  const [tab, setTab] = useState<Tab>('engine'), [trial, setTrial] = useState<PartKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shown = useMemo(() => (trial ? fit(base.rocket, trial) : base.rocket), [base.rocket, trial]);
  const power = powerOf(shown), oldPower = powerOf(base.rocket), to = destinationOf(base), goal = goalOf(base);

  useEffect(() => {
    const ready: Phrase[] = base.launches === 1 ? ['You have 1 launch ready!', 'Tap Launch!'] : base.launches > 1 ? [n(base.launches), 'launches ready!', 'Tap Launch!'] : ['Play a Round to earn a launch!'];
    void voice.say('Space Base!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function takeOff() {
    if (!voice.active || blocked) return;
    if (base.launches <= 0) { nope(); void voice.say('Play a Round to earn a launch!'); return; }
    launch();
  }
  function tapPlanet(p: Planet) {
    if (!voice.active || blocked) return;
    if (canReach(base, p)) { sClink(); updateBase(b => pickDestination(b, p.id as PlanetId)); void voice.say('Next stop', p.name as Phrase); return; }
    nope();
    void voice.say(p.name as Phrase, 'Build a stronger rocket to get there!');
  }
  function pickTab(t: Tab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(SLOT_NAMES[t]); } }
  function celebrate(k: PartKey, stronger: boolean) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say(gotLine(infoOf(k).name), ...(stronger ? ['Your rocket got stronger!' as const] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  function tap(k: PartKey) {
    if (!voice.active || blocked) return;
    if (isOwned(base, k)) {
      setTrial(null);
      const next = fit(base.rocket, k);
      if (allowed(base, next)) updateBase(b => ({ ...b, rocket: next }));
      sClink(); void voice.say(infoOf(k).name);
      return;
    }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(infoOf(k).name, 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateBase(b => selectGoal(b, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k, infoOf(k).power > 0); }
  }

  const keys = keysIn(tab);
  return (
    <div class="screen base-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Space Base</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(tabOf(goal)); tap(goal); } }}>
              <img class="gi" src={rocketPic(fit(base.rocket, goal))} alt="" />
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(base)) void voice.say('You built everything!'); }}>🏆</button>}
        <CurrencyPile kind={ROVER_CURRENCY} count={balance} />
      </header>
      <div class="base-body">
        <section class="pad-side">
          <div class="launch-pad">
            <div class="pad-sky" aria-hidden="true" />
            <RocketView rocket={shown} live flame={0} class={trial ? 'trying' : ''} />
            <RoverView gadgets={base.gadgets} class="parked" />
            <button class="power" aria-label={`Power ${power}`} onClick={() => { if (voice.active) void voice.say('Power', n(power)); }}>
              <span class="pw-word">Power</span><span class={`pw-num ${power > oldPower ? 'up' : power < oldPower ? 'down' : ''}`}>⚡{power}</span>
            </button>
          </div>
          <div class="planets" role="group" aria-label="Planets">
            {PLANETS.map(p => {
              const reach = canReach({ rocket: shown }, p), been = visited(base, p.id);
              return (
                <button key={p.id} class={`planet-btn ${reach ? 'reach' : 'far'} ${been ? 'been' : ''} ${p.id === to.id ? 'dest' : ''}`} aria-label={p.name} onClick={() => tapPlanet(p)}>
                  <GlobeView planet={p} />
                  {been ? <span class="flag-mark" aria-hidden="true">🚩</span> : !reach && <span class="need" aria-hidden="true">⚡{p.power}</span>}
                </button>
              );
            })}
          </div>
          <div class="base-go">
            <button class={`big-btn go launch-btn ${wiggle ? 'wiggle' : ''} ${base.launches > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label={`Launch to ${to.name}`} onClick={takeOff}>
              <GlobeView planet={to} class="launch-globe" />
              <span class="launch-word">Launch</span>
              <span class="launch-count">🚀{base.launches}</span>
            </button>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="rc-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={SLOT_NAMES[t]} class={`rc-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="rc-tray">
            {keys.map(k => {
              const info = infoOf(k), owned = isOwned(base, k), on = owned && (tab === 'paint' ? base.rocket.paint === k.split(':')[1] : base.rocket[tab] === k.split(':')[1]);
              const can = !owned && balance >= info.price;
              return (
                <button key={k} class={`rc-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <img class="part-pic" src={rocketPic(fit(base.rocket, k), tab === 'nose' ? 'top' : tab === 'fins' || tab === 'engine' ? 'bottom' : 'whole')} alt="" draggable={false} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : info.power ? `⚡${info.power}` : '') : <>{info.price}<CurrencyIcon kind={ROVER_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{infoOf(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={ROVER_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
