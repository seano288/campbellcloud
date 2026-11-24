// The Shipyard: his ship at the dock with its Range, the sea chart (a map with a compass rose and a key, the island picker), the big
// Set Sail button, and the parts tray. He picks a slot from the tabs and taps a part: one he owns goes on, one he doesn't goes on the
// ship to try, with Buy beside it, so he sees it before he spends. The flag's colours are free: tap one and it's on.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { IslandArt, IslandBadge } from '../art/IslandBadge';
import { Flag, ShipView } from '../art/ShipView';
import { FLEET_CURRENCY } from '../branding';
import { Rose } from '../map/art';
import { buy, player, updateFleet } from '../game';
import { screen, setSail } from '../nav';
import { gotLine, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { allOwned, allowed, canReach, destinationOf, goalOf, isOwned, pickColour, pickDestination, priceOf, selectGoal, visited, type FleetState } from './fleet';
import { ISLANDS, PORT, type IslandDef } from './islands';
import { COLOURS, fit, infoOf, keysIn, rangeOf, SLOT_NAMES, tabOf, TABS, type ColourId, type PartKey, type Ship, type Tab } from './parts';

const TAB_ICONS: Record<Tab, string> = { hull: '🛶', sails: '⛵', cannons: '💣', figurehead: '🧜', flag: '🏴‍☠️' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

export function Shipyard() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, fleet = state.fleet;
  const [tab, setTab] = useState<Tab>('sails'), [trial, setTrial] = useState<PartKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const shown = useMemo(() => (trial ? fit(fleet.ship, trial) : fleet.ship), [fleet.ship, trial]);
  const range = rangeOf(shown), oldRange = rangeOf(fleet.ship), to = destinationOf(fleet), goal = goalOf(fleet);

  useEffect(() => {
    const ready: Phrase[] = fleet.voyages === 1 ? ['You have 1 voyage ready!', 'Tap Set Sail!'] : fleet.voyages > 1 ? [n(fleet.voyages), 'voyages ready!', 'Tap Set Sail!'] : ['Play a Round to earn a voyage!'];
    void voice.say('Shipyard!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function sail() {
    if (!voice.active || blocked) return;
    if (fleet.voyages <= 0) { nope(); void voice.say('Play a Round to earn a voyage!'); return; }
    setSail();
  }
  function tapIsland(i: IslandDef) {
    if (!voice.active || blocked) return;
    if (canReach(fleet, i)) { sClink(); updateFleet(f => pickDestination(f, i.id)); void voice.say('Next stop', i.name); return; }
    nope();
    void voice.say(i.name, 'Build a faster ship to get there!');
  }
  function pickTab(t: Tab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(SLOT_NAMES[t]); } }
  function celebrate(k: PartKey, further: boolean) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say(gotLine(infoOf(k).name), ...(further ? ['Your ship can sail further!' as const] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  function tap(k: PartKey) {
    if (!voice.active || blocked) return;
    if (isOwned(fleet, k)) {
      setTrial(null);
      const next = fit(fleet.ship, k);
      if (allowed(fleet, next)) updateFleet(f => ({ ...f, ship: next }));
      sClink(); void voice.say(infoOf(k).name);
      return;
    }
    setTrial(k);
    sChime();
    const price = priceOf(k);
    void voice.say(infoOf(k).name, 'It costs', n(price), 'Doubloons.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Doubloons.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateFleet(f => selectGoal(f, k));
      void voice.say('You need', n(price - balance), 'more Doubloons.', 'Play a Round to earn Doubloons!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k, infoOf(k).range > 0); }
  }
  function colour(id: ColourId) {
    if (!voice.active || blocked) return;
    sClink(); setTrial(null);
    updateFleet(f => pickColour(f, id));
    void voice.say(COLOURS.find(c => c.id === id)!.name);
  }

  const keys = keysIn(tab);
  return (
    <div class="screen yard-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Shipyard</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(tabOf(goal)); tap(goal); } }}>
              <ShipView ship={fit(fleet.ship, goal)} class="gi" label={null} sea={false} />
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(fleet)) void voice.say('You built everything!'); }}>🏆</button>}
        <CurrencyPile kind={FLEET_CURRENCY} count={balance} />
      </header>
      <div class="yard-body">
        <section class="dock-side">
          <div class="dock">
            <ShipView ship={shown} class={trial ? 'trying' : ''} label="Your ship" />
            <button class="range" aria-label={`Range ${range}`} onClick={() => { if (voice.active) void voice.say('Range', n(range)); }}>
              <span class="rg-word">Range</span><span class={`rg-num ${range > oldRange ? 'up' : range < oldRange ? 'down' : ''}`}>💨{range}</span>
            </button>
          </div>
          <div class="chart-cell"><SeaChart fleet={fleet} shown={shown} to={to} onIsland={tapIsland} onRose={() => { if (voice.active) void voice.say('This is your sea chart.'); }} /></div>
          <div class="yard-go">
            <button class={`big-btn go sail-btn ${wiggle ? 'wiggle' : ''} ${fleet.voyages > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label={`Set sail to ${to.name}`} onClick={sail}>
              <IslandBadge island={to} class="sail-isle" />
              <span class="sail-word">Set Sail</span>
              <span class="sail-count">⛵{fleet.voyages}</span>
            </button>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="tf-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={SLOT_NAMES[t]} class={`tf-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="tf-tray">
            {keys.map(k => {
              const info = infoOf(k), owned = isOwned(fleet, k), id = k.split(':')[1]!, on = owned && (tab === 'flag' ? fleet.ship.flag === id : fleet.ship[tab as Exclude<Tab, 'flag'>] === id);
              const can = !owned && balance >= info.price;
              return (
                <button key={k} class={`tf-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <PartPic ship={fit(fleet.ship, k)} tab={tab} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : info.range ? `💨${info.range}` : '') : <>{info.price}<CurrencyIcon kind={FLEET_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
            {tab === 'flag' && (
              <div class="swatches-row" role="group" aria-label="Flag colours">
                {COLOURS.map(c => <button key={c.id} class={`flag-swatch ${fleet.ship.colour === c.id ? 'on' : ''}`} aria-label={c.name} aria-pressed={fleet.ship.colour === c.id} style={{ background: c.cloth, color: c.mark }} onClick={() => colour(c.id)}>{fleet.ship.colour === c.id ? '✓' : ''}</button>)}
              </div>
            )}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{infoOf(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={FLEET_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** A part on the ship, or for a flag just the flag. */
function PartPic({ ship, tab }: { ship: Ship; tab: Tab }) {
  if (tab === 'flag') return <svg class="part-pic" viewBox="-10 -10 90 60" aria-hidden="true"><Flag ship={ship} wave={false} /></svg>;
  return <ShipView ship={ship} class="part-pic" label={null} sea={false} />;
}

/**
 * The sea chart: the islands where they lie, north up, with a compass rose and a key. Islands he can reach are bright, the one he's
 * going to is ringed and joined to the port by a dotted line, an X marks where he's dug, and those out of reach say the Range they need.
 */
function SeaChart({ fleet, shown, to, onIsland, onRose }: { fleet: FleetState; shown: Ship; to: IslandDef; onIsland(i: IslandDef): void; onRose(): void }) {
  return (
    <div class="sea-chart">
      <svg class="chart-sea" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect width="100" height="100" class="chart-water" />
        <path d={`M${PORT[0]} ${PORT[1]} Q${(PORT[0] + to.chart[0]) / 2 - 8} ${(PORT[1] + to.chart[1]) / 2 + 8} ${to.chart[0]} ${to.chart[1]}`} class="route" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="chart-port" style={{ left: `${PORT[0]}%`, top: `${PORT[1]}%` }} aria-hidden="true">⚓</div>
      {ISLANDS.map(i => {
        const reach = canReach({ ship: shown }, i), been = visited(fleet, i.id), dest = i.id === to.id;
        return (
          <button key={i.id} class={`chart-isle ${reach ? 'reach' : 'far'} ${dest ? 'dest' : ''}`} style={{ left: `${i.chart[0]}%`, top: `${i.chart[1]}%` }} aria-label={i.name} onClick={() => onIsland(i)}>
            <svg viewBox="-64 -64 128 100" aria-hidden="true"><IslandArt island={i} dug={fleet.hoard.includes(i.id)} /></svg>
            {!reach && <span class="need" aria-hidden="true">💨{i.range}</span>}
            {been && <span class="been" aria-hidden="true" />}
          </button>
        );
      })}
      <button class="chart-rose" aria-label="Sea chart" onClick={onRose}><Rose label="Compass rose" /></button>
      <div class="chart-key" aria-hidden="true">
        <span>⚓ port</span><span><svg viewBox="-64 -64 128 100"><IslandArt island={ISLANDS[0]} /></svg> island</span><span><b class="kx">✕</b> treasure</span>
      </div>
    </div>
  );
}
