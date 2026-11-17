// The Garage: his car from the side and from above, its three numbers (Speed, Grip, Boost) as bars with the number on each, the big
// Race button with the track it goes to, and the parts tray. He picks a slot from the tabs and taps a part: one he owns goes on, one he
// doesn't goes on the car to try, with its numbers beside the old ones and Buy, so he sees it before he spends. The numbers are real
// (the Race uses them) and change as he fits parts, so the Garage quietly practises Faster Car. A Rival's part shows who to beat for
// it. The # tab is his race number, picked on two wheels, tens and ones, free.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { CarView, carPic } from '../art/Art';
import { TALLY_CURRENCY } from '../branding';
import { buy, player, updateGarage } from '../game';
import { race, screen, watch } from '../nav';
import { gotLine, NUMBERS_TO, type Phrase } from '../phrases';
import { RIVALS } from '../race/rivals';
import { honk } from '../race/sounds';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { allBought, allowed, fitOwned, goalOf, isOwned, nextTrack, selectGoal, setNumber } from './garage';
import { fit, forSale, keysIn, nameOf, partOf, priceOf, SLOT_NAMES, slotOf, statsOf, type HornPart, type PartKey, type Slot, type Stats, type TyrePart } from './parts';

type Tab = Slot | 'number';
const TABS: readonly Tab[] = ['engine', 'tyres', 'wing', 'booster', 'body', 'paint', 'rims', 'decal', 'flame', 'horn', 'number'];
const TAB_ICONS: Record<Tab, string> = { body: '🚗', engine: '⚙️', tyres: '🛞', wing: '🪽', booster: '🚀', paint: '🎨', rims: '⭕', decal: '⭐', horn: '📯', flame: '🔥', number: '#' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;
const STAT_TOP = { speed: 100, grip: 100, boosts: 5 } as const;

/** What a tyre is good on, said after its name. */
function tyreLine(k: PartKey): Phrase[] {
  if (slotOf(k) !== 'tyres') return [];
  const s = (partOf(k) as TyrePart).suits, good = (['tarmac', 'dirt', 'sand', 'snow'] as const).filter(x => s[x] >= 1);
  if (good.length === 4 || (good.length === 0 && s.tarmac >= .85)) return ['Good everywhere!'];
  return good.length ? [`Good on ${good[0]!}!` as Phrase] : [];
}
const rivalFor = (k: PartKey) => RIVALS.find(r => r.prize === k) ?? null;

function StatBar({ label, value, was, top, onTap }: { label: 'Speed' | 'Grip' | 'Boost'; value: number; was: number; top: number; onTap(): void }) {
  return (
    <button class={`stat ${value > was ? 'up' : value < was ? 'down' : ''}`} aria-label={`${label} ${value}`} onClick={onTap}>
      <span class="stat-name">{label}</span>
      <span class="stat-bar"><i style={{ width: `${Math.min(100, (value / top) * 100)}%` }} />{value !== was && <u style={{ left: `${Math.min(100, (was / top) * 100)}%` }} />}</span>
      <span class="stat-num">{value !== was && <s>{was}</s>}{value}</span>
    </button>
  );
}

export function GarageScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, g = state.garage;
  const [tab, setTab] = useState<Tab>('engine'), [trial, setTrial] = useState<PartKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false), [view, setView] = useState<'side' | 'top'>('side');
  const shown = useMemo(() => (trial ? fit(g.car, trial) : g.car), [g.car, trial]);
  const now: Stats = statsOf(g.car), next: Stats = statsOf(shown), goal = goalOf(g), to = nextTrack(g);

  useEffect(() => {
    const ready: Phrase[] = g.races === 1 ? ['You have 1 Race ready!', 'Tap Race!'] : g.races > 1 ? [n(g.races), 'Races ready!', 'Tap Race!'] : ['Play a Round to earn a Race!'];
    void voice.say('Garage!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function go() {
    if (!voice.active || blocked) return;
    if (g.races <= 0) { nope(); void voice.say('Play a Round to earn a Race!'); return; }
    race();
  }
  function pickTab(t: Tab) {
    if (!voice.active) return;
    setTab(t); setTrial(null);
    void voice.say(t === 'number' ? 'Race number' : SLOT_NAMES[t]);
  }
  function celebrate(k: PartKey, before: Stats, after: Stats) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    const more: Phrase[] = [...(after.speed > before.speed ? ['Your car got faster!' as const] : []), ...(after.grip > before.grip ? ['Your car grips better!' as const] : []), ...(after.boosts > before.boosts ? ['You get more boosts!' as const] : [])];
    void voice.say(gotLine(nameOf(k)), ...more).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  function tap(k: PartKey) {
    if (!voice.active || blocked) return;
    if (slotOf(k) === 'horn') honk((partOf(k) as HornPart).sound);
    if (isOwned(g, k)) {
      setTrial(null);
      if (allowed(g, fit(g.car, k))) updateGarage(x => fitOwned(x, k));
      if (slotOf(k) !== 'horn') sClink();
      void voice.say(nameOf(k), ...tyreLine(k));
      return;
    }
    setTrial(k);
    if (slotOf(k) !== 'horn') sChime();
    const rival = rivalFor(k);
    if (!forSale(k)) { void voice.say(nameOf(k), 'Beat', rival!.name, 'to win it!'); return; }
    const price = priceOf(k)!;
    void voice.say(nameOf(k), ...tyreLine(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (price === null) { nope(); void voice.say('Beat', rivalFor(k)!.name, 'to win it!'); return; }
    if (balance < price) {
      nope();
      updateGarage(x => selectGoal(x, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    const before = statsOf(g.car);
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k, before, statsOf(fit(g.car, k))); }
  }
  function turn(place: 'tens' | 'ones', by: 1 | -1) {
    if (!voice.active) return;
    const t = Math.floor(g.car.number / 10), o = g.car.number % 10;
    const num = place === 'tens' ? ((t + by + 10) % 10) * 10 + o : t * 10 + ((o + by + 10) % 10);
    sClink();
    updateGarage(x => setNumber(x, num));
    void voice.say('Your number is', n(num));
  }

  const keys = tab === 'number' ? [] : keysIn(tab);
  const sayStat = (label: 'Speed' | 'Grip' | 'Boost', v: number) => { if (voice.active) void voice.say(label, n(v)); };
  return (
    <div class="screen tt-garage-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Garage</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal)! && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(slotOf(goal)); tap(goal); } }}>
              <img class="gi" src={carPic(fit(g.car, goal))} alt="" />
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal)!)) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allBought(g)) void voice.say('You built everything!'); }}>🏆</button>}
        <CurrencyPile kind={TALLY_CURRENCY} count={balance} />
      </header>
      <div class="garage-body">
        <section class="car-side">
          <div class={`car-stage ${trial ? 'trying' : ''}`}>
            <CarView car={shown} view={view} live label="Your race car" />
            <button class="view-btn" aria-label={view === 'side' ? 'From above' : 'From the side'} onClick={() => { if (voice.active) { sClink(); setView(view === 'side' ? 'top' : 'side'); } }}>{view === 'side' ? '⬇️' : '➡️'}</button>
          </div>
          <div class="stats">
            <StatBar label="Speed" value={next.speed} was={now.speed} top={STAT_TOP.speed} onTap={() => sayStat('Speed', next.speed)} />
            <StatBar label="Grip" value={next.grip} was={now.grip} top={STAT_TOP.grip} onTap={() => sayStat('Grip', next.grip)} />
            <StatBar label="Boost" value={next.boosts} was={now.boosts} top={STAT_TOP.boosts} onTap={() => sayStat('Boost', next.boosts)} />
          </div>
          <div class="garage-go">
            <button class={`big-btn go race-btn ${wiggle ? 'wiggle' : ''} ${g.races > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label={`Race at ${to.name}`} onClick={go}>
              <span class="race-flag" aria-hidden="true">🏁</span><span class="race-word">Race</span><span class="race-count">{g.races}</span>
            </button>
            <IconButton label="Cups" class="cups-icon" onClick={() => { if (voice.active) screen.value = 'cups'; }}>🏆</IconButton>
            {g.last && <IconButton label="Watch it go" onClick={() => { if (voice.active) watch(); }}>👀</IconButton>}
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="tt-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={t === 'number' ? 'Race number' : SLOT_NAMES[t]} class={`tt-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          {tab === 'number'
            ? <div class="number-wheels" role="group" aria-label="Race number">
                {(['tens', 'ones'] as const).map(p => (
                  <div key={p} class="wheel">
                    <button class="wheel-btn" aria-label={`${p} up`} onClick={() => turn(p, 1)}>▲</button>
                    <span class="wheel-digit">{p === 'tens' ? Math.floor(g.car.number / 10) : g.car.number % 10}</span>
                    <button class="wheel-btn" aria-label={`${p} down`} onClick={() => turn(p, -1)}>▼</button>
                  </div>
                ))}
              </div>
            : <div class="tt-tray">
                {keys.map(k => {
                  const owned = isOwned(g, k), on = owned && g.car[slotOf(k)] === k, price = priceOf(k), rival = rivalFor(k), can = !owned && price !== null && balance >= price;
                  return (
                    <button key={k} class={`tt-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''} ${rival ? 'rival' : ''}`} aria-label={nameOf(k)} aria-pressed={on} onClick={() => tap(k)}>
                      <img class="part-pic" src={carPic(fit(g.car, k), tab === 'wing' || tab === 'booster' ? 'top' : 'side')} alt="" draggable={false} />
                      <span class="mt-name">{nameOf(k)}</span>
                      <span class="mt-tag">{owned ? (on ? '✓' : '') : price === null ? `🏁 ${rival!.name}` : <>{price}<CurrencyIcon kind={TALLY_CURRENCY} size={18} /></>}</span>
                    </button>
                  );
                })}
              </div>}
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{nameOf(trial)}</span>
              {priceOf(trial) === null
                ? <span class="buy-rival">🏁 {rivalFor(trial)!.name}</span>
                : <button class={`big-btn go buy ${balance >= priceOf(trial)! ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={TALLY_CURRENCY} size={30} /></button>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
