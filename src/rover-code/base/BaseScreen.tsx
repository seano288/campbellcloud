// The Space Base: his rocket on the launch pad with his rover parked beside it, the big Launch button with the planet it goes to, the
// row of planets (a flag on each he has explored, the Power each one needs), and the parts tray. He picks a slot from the tabs and taps
// a part: one he owns goes on, one he doesn't goes on the rocket to try, with the Power it would give and Buy beside it, so he sees it
// before he spends. The last two tabs are his rover's: Rover, where he picks or buys a rover, and Gadgets, where he switches each gadget
// on or off for the rover he drives (and buys the Kit). On those tabs the pad shows his rover big, with the rocket behind it.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sHonk, sNope, sSiren } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { GlobeView, RocketView, RoverView, rocketPic, roverPic } from '../art/Art';
import { ROVER_CURRENCY } from '../branding';
import { buy, player, updateBase } from '../game';
import { launch, screen } from '../nav';
import { gotLine, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { engineTest } from '../trip/sounds';
import { useVoice } from '../voice';
import { allOwned, allowed, canReach, destinationOf, goalOf, hasFeature, isOwned, isWorn, lookOf, pickDestination, pickRover, priceOf, selectGoal, toggleFeature, visited, type BaseState } from './base';
import { fit, idOf, infoOf, isRoverTab, keyOf, keysIn, powerOf, SLOT_NAMES, tabOf, TABS, type PartKey, type Slot, type Tab } from './parts';
import { GADGETS, PLANETS, type Planet, type PlanetId } from './planets';
import { FEATURE_IDS, featureName, featureTrick, isKit, plainLook, roverDef, type FeatureId, type RoverId, type RoverLook } from './rovers';

const TAB_ICONS: Record<Tab, string> = { nose: '🔺', body: '🛢️', fins: '🪽', engine: '🔥', boosters: '🚀', paint: '🎨', rover: '🚙', kit: '🧰' };

/** What a shop picture shows: the rocket with the part on, a rover on its own, or his rover wearing just that gadget. */
function picOf(base: BaseState, k: PartKey) {
  const tab = tabOf(k);
  if (tab === 'rover') return roverPic(plainLook(idOf(k) as RoverId));
  if (tab === 'kit') return roverPic({ kind: base.rover, kit: [idOf(k) as FeatureId] });
  return rocketPic(fit(base.rocket, k), tab === 'nose' ? 'top' : tab === 'fins' || tab === 'engine' ? 'bottom' : 'whole');
}
/** The gadgets tray: the ones he has first (to switch on and off), then the Kit he can buy, then the planets' he hasn't found. */
const featureOrder = (base: BaseState) => {
  const rank = (f: FeatureId) => (hasFeature(base, f) ? 0 : isKit(f) ? 1 : 2);
  return [...FEATURE_IDS].sort((x, y) => rank(x) - rank(y));
};
/** His rover as the pad shows it: another rover he's trying, or his own wearing a gadget he's trying. */
function trialLook(base: BaseState, trial: PartKey | null): RoverLook {
  if (trial && tabOf(trial) === 'rover') return lookOf(base, idOf(trial) as RoverId);
  const look = lookOf(base);
  return trial && tabOf(trial) === 'kit' ? { ...look, kit: [...look.kit, idOf(trial) as FeatureId] } : look;
}
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

export function BaseScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, base = state.base;
  const [tab, setTab] = useState<Tab>('engine'), [trial, setTrial] = useState<PartKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shown = useMemo(() => (trial ? fit(base.rocket, trial) : base.rocket), [base.rocket, trial]);
  const look = useMemo(() => trialLook(base, trial), [base, trial]), garage = isRoverTab(tab);
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
  /** What a rover or a Kit gadget does, said after its name. */
  const trickOf = (k: PartKey) => {
    const tab = tabOf(k), trick = tab === 'rover' ? roverDef(idOf(k) as RoverId).trick : tab === 'kit' ? featureTrick(idOf(k) as FeatureId) : null;
    return trick ? [trick] : [];
  };
  function celebrate(k: PartKey, stronger: boolean) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say(gotLine(infoOf(k).name), ...(stronger ? ['Your rocket got stronger!' as const] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  function tap(k: PartKey) {
    if (!voice.active || blocked) return;
    const engine = tabOf(k) === 'engine' || tabOf(k) === 'boosters'; // an engine or a booster roars when he taps it, louder up the Rungs
    if (engine) engineTest(tabOf(k) === 'boosters' ? Math.min(6, infoOf(k).power) : infoOf(k).power - 1);
    if (isOwned(base, k) && tabOf(k) === 'rover') {
      setTrial(null); sHonk();
      updateBase(b => pickRover(b, idOf(k) as RoverId));
      void voice.say(infoOf(k).name, ...trickOf(k));
      return;
    }
    if (isOwned(base, k) && tabOf(k) === 'kit') { tapFeature(idOf(k) as FeatureId); return; }
    if (isOwned(base, k)) {
      setTrial(null);
      const next = fit(base.rocket, k);
      if (allowed(base, next)) updateBase(b => ({ ...b, rocket: next }));
      if (!engine) sClink();
      void voice.say(infoOf(k).name);
      return;
    }
    setTrial(k);
    if (!engine) sChime();
    const price = priceOf(k);
    void voice.say(infoOf(k).name, ...trickOf(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  /** A gadget tile: one he has goes on or off; a Kit gadget he hasn't got is tried on; a planet's gadget says where it's found. */
  function tapFeature(f: FeatureId) {
    if (!voice.active || blocked) return;
    if (isKit(f) && !hasFeature(base, f)) { tap(keyOf('kit', f)); return; }
    setTrial(null);
    if (!hasFeature(base, f)) { nope(); void voice.say(GADGETS[f as keyof typeof GADGETS], 'Explore a new planet to find it!'); return; }
    const on = !isWorn(base, f);
    updateBase(b => toggleFeature(b, f));
    if (on && f === 'siren') sSiren(); else sClink();
    void voice.say(featureName(f), on ? 'On!' : 'Off!');
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
              <img class="gi" src={isRoverTab(tabOf(goal)) ? picOf(base, goal) : rocketPic(fit(base.rocket, goal))} alt="" />
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(base)) void voice.say('You built everything!'); }}>🏆</button>}
        <CurrencyPile kind={ROVER_CURRENCY} count={balance} />
      </header>
      <div class="base-body">
        <section class="pad-side">
          <div class={`launch-pad ${garage ? 'garage' : ''}`}>
            <div class="pad-sky" aria-hidden="true" />
            <RocketView rocket={shown} live flame={0} class={trial && !garage ? 'trying' : ''} />
            <RoverView look={look} live={garage} class={`parked ${trial && garage ? 'trying' : ''}`} label={roverDef(look.kind).name} />
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
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={SLOT_NAMES[t]} class={`rc-tab ${isRoverTab(t) ? 'rv' : ''} ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="rc-tray">
            {tab === 'kit' && featureOrder(base).map(f => {
              const got = hasFeature(base, f), on = got && isWorn(base, f), k = isKit(f) ? keyOf('kit', f) : null, price = k ? priceOf(k) : 0;
              const found = isKit(f) ? null : PLANETS.find(p => p.gadget === f) ?? null;
              return (
                <button key={f} class={`rc-tile ${on ? 'on' : ''} ${got ? 'owned' : 'locked'} ${k && !got && balance >= price ? 'can' : ''} ${found && !got ? 'unfound' : ''} ${k && trial === k ? 'trying' : ''}`}
                  aria-label={featureName(f)} aria-pressed={on} onClick={() => tapFeature(f)}>
                  <img class="part-pic rover-pic" src={roverPic({ kind: base.rover, kit: [f] })} alt="" draggable={false} />
                  <span class="mt-name">{featureName(f)}</span>
                  <span class="mt-tag">{got ? (on ? '✓' : 'Off') : found ? <GlobeView planet={found} class="tag-globe" /> : <>{price}<CurrencyIcon kind={ROVER_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
            {tab !== 'kit' && keys.map(k => {
              const info = infoOf(k), owned = isOwned(base, k), id = idOf(k);
              const on = owned && (tab === 'rover' ? base.rover === id : tab === 'paint' ? base.rocket.paint === id : base.rocket[tab as Slot] === id);
              const can = !owned && balance >= info.price;
              return (
                <button key={k} class={`rc-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <img class={`part-pic ${tab === 'rover' ? 'rover-pic' : ''}`} src={picOf(base, k)} alt="" draggable={false} />
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
