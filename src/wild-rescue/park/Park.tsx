// The Park, his to show off: a map of habitat plots he builds with Bolts, each with the animals he has rescued wandering in it, an
// extra or two inside, and decorations along the path. Nothing here can be lost.
//
// When he brings an animal home it waits in his hands (even after a reload) and he carries it to a habitat by tapping one. The right
// one starts to glow faintly after a moment; a wrong one just has the animal shake its head and stay in his hands, so placing it uses
// what he learned without ever being a test. Tapping an animal plays a little sound and its "did you know" line; with 🧺 Feed on, he
// gives it its snack instead.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope, sPop, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { AnimalPic, HabitatArt } from '../art/Pics';
import { RESCUE_CURRENCY } from '../branding';
import { animal, poleOf, RESCUABLE, type RescueId } from '../facts/animals';
import { habitat, type HabitatId } from '../facts/habitats';
import { buy, player, setDown, updateRescue } from '../game';
import { goRescue, screen } from '../nav';
import { homeLine, type Phrase } from '../phrases';
import { useVoice } from '../voice';
import { GoalChip, n } from './Garage';
import { blockers, canRescue, extraOwned, isOwned, ownsHabitat, priceOf, RESCUE_TOTAL, selectGoal } from './rescue';
import { DECOS, EXTRAS, idOf, item, keyOf, keysIn, PARK_HABITATS, tabOf, type ItemKey, type Tab } from './shop';

const TABS = ['habitat', 'extra', 'deco'] as const satisfies readonly Tab[];
type ParkTab = (typeof TABS)[number];
const TAB_NAMES = { habitat: 'Habitats', extra: 'Extras', deco: 'Decorations' } as const;
const TAB_ICONS: Record<ParkTab, string> = { habitat: '🏞️', extra: '🪷', deco: '⛲' };
/** How long he holds an animal before its home starts to glow. */
const HINT_MS = 4000;

/** A little made-up voice for each animal: small ones squeak, big ones rumble. */
function animalSound(id: RescueId) {
  const size = animal(id).size, base = size === 'small' ? 900 : size === 'medium' ? 520 : size === 'large' ? 260 : 150;
  tone(base, .12, 'triangle', 0, .12, base * 1.3); tone(base * 1.2, .14, 'triangle', .1, .1, base * .9);
}

// the browser tour reads which plot is each animal's home, and its name, as a child knows them (tools/wild-rescue/tour.ts)
if (import.meta.env.DEV) Object.assign(window, {
  __homes: Object.fromEntries(RESCUABLE.map(a => [a.id, PARK_HABITATS.find(p => p.id === a.home)!.name])),
  __names: Object.fromEntries(RESCUABLE.map(a => [a.id, a.name])),
});

/** Where each animal stands in its plot: spread over two rows. In the polar plot the north's animals keep to the left floe and the
 *  penguins to the right one, across the water, so they are never neighbours. */
function spotOf(h: HabitatId, here: readonly RescueId[], i: number) {
  const id = here[i]!;
  if (h === 'polar') {
    const south = poleOf(animal(id)) === 'south', side = here.filter(x => (poleOf(animal(x)) === 'south') === south), k = side.indexOf(id);
    const perRow = Math.max(1, Math.ceil(side.length / 2));
    return { x: (south ? 56 : 4) + (k % perRow) * (34 / perRow), y: 8 + Math.floor(k / perRow) * 34 };
  }
  const perRow = here.length > 4 ? Math.ceil(here.length / 2) : here.length;
  return { x: 4 + (i % perRow) * (80 / Math.max(1, perRow)), y: 8 + Math.floor(i / perRow) * 34 };
}

export function Park() {
  const voice = useVoice(), state = player.state.value, rescue = state.rescue, balance = state.currency.balance;
  const [tab, setTab] = useState<ParkTab>('habitat'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false);
  const [feeding, setFeeding] = useState(false), [hint, setHint] = useState(false), [shake, setShake] = useState(0), [hop, setHop] = useState<{ id: RescueId; snack: boolean; n: number } | null>(null);
  const [arrived, setArrived] = useState<RescueId | null>(null);
  const hintTimer = useRef(0);

  useEffect(() => {
    const full = rescue.park.length === RESCUE_TOTAL;
    void voice.say('The Park!', ...(rescue.holding ? ['Carry it to its home!'] as const : full ? ['All the animals are home!'] as const : rescue.calls > 0 ? ['Tap Rescue!'] as const : []));
  }, []);
  useEffect(() => {
    setHint(false);
    clearTimeout(hintTimer.current);
    if (rescue.holding) hintTimer.current = window.setTimeout(() => setHint(true), HINT_MS);
    return () => clearTimeout(hintTimer.current);
  }, [rescue.holding]);

  function placeIn(h: HabitatId) {
    const held = rescue.holding;
    if (!held || blocked) return false;
    if (animal(held).home !== h || !ownsHabitat(rescue, h)) {
      sNope(); setShake(s => s + 1);
      void voice.say('Not here!', 'Carry it to its home!');
      return true;
    }
    if (!setDown(player, h)) return true;
    setBlocked(true); setArrived(held); sFanfare(); confetti(40, voice.signal);
    const a = animal(held);
    void voice.say('Welcome home!', homeLine(a, habitat(h).lives), a.fact as Phrase, ...(player.state.peek().rescue.calls > 0 ? ['Tap Rescue!'] as const : []))
      .then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 6000);
    setTimeout(() => setArrived(null), 2500);
    return true;
  }
  function tapPlot(h: HabitatId) {
    if (!voice.active) return;
    if (placeIn(h)) return;
    const k = keyOf('habitat', h);
    if (!ownsHabitat(rescue, h)) { setTab('habitat'); tryItem(k); return; }
    sClink();
    // a habitat still waiting for animals says so, and if the truck can't reach them yet, what it needs
    const waiting = RESCUABLE.filter(a => a.home === h && !rescue.park.includes(a.id));
    const need = waiting.length && !waiting.some(a => canRescue(rescue, a.id)) ? blockers(rescue, waiting[0]!.id)[0] : undefined;
    void voice.say(habitat(h).about, ...(need ? ['Your truck needs', item(need).name] as const : waiting.length ? ['Rescue animals to fill it!'] as const : []));
  }
  function tapAnimal(id: RescueId) {
    if (!voice.active) return;
    if (rescue.holding) { placeIn(animal(id).home!); return; }
    setHop({ id, snack: feeding, n: Date.now() });
    if (feeding) { sPop(); void voice.say('Yum!'); return; }
    animalSound(id);
    void voice.say(animal(id).fact as Phrase);
  }
  function tryItem(k: ItemKey) {
    if (!voice.active || blocked) return;
    if (isOwned(rescue, k)) { sClink(); setTrial(null); void voice.say(item(k).name); return; }
    const x = EXTRAS.find(e => keyOf('extra', e.id) === k);
    if (x && !ownsHabitat(rescue, x.home)) { sNope(); void voice.say(item(k).name, 'Buy this habitat with Bolts!'); return; }
    setTrial(k); sChime();
    const price = priceOf(k);
    void voice.say(item(k).name, 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) { sNope(); updateRescue(r => selectGoal(r, k)); void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!'); return; }
    if (buy(k).kind !== 'accepted') return;
    setTrial(null); setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say('You got', item(k).name).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000);
  }
  function goTo(k: ItemKey) {
    const t = tabOf(k);
    if ((TABS as readonly string[]).includes(t)) { setTab(t as ParkTab); tryItem(k); } else screen.value = 'garage';
  }

  const held = rescue.holding, trialHabitat = trial && tabOf(trial) === 'habitat' ? idOf(trial) : null;
  return (
    <div class={`screen park-screen ${held ? 'holding' : ''} ${feeding ? 'feeding' : ''}`}>
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>The Park</h1>
        <span class="park-count" aria-label={`${rescue.park.length} of ${RESCUE_TOTAL} animals`}>🐾 {rescue.park.length}/{RESCUE_TOTAL}</span>
        <GoalChip onGo={goTo} />
        <CurrencyPile kind={RESCUE_CURRENCY} count={balance} />
      </header>
      <div class="park-body">
        <section class="park-map" aria-label="Your park">
          <div class="plots">
            {PARK_HABITATS.map(p => {
              const h = p.id as HabitatId, owned = ownsHabitat(rescue, h), here = rescue.park.filter(id => animal(id).home === h);
              const home = held && animal(held).home === h;
              return (
                <div key={h} class={`plot plot-${h} ${owned ? 'owned' : 'for-sale'} ${trialHabitat === h ? 'trying' : ''} ${home && hint ? 'home-hint' : ''}`}>
                  <HabitatArt id={h} />
                  {h === 'polar' && owned && <div class="pole-split" aria-hidden="true"><span>North</span><span>South</span></div>}
                  <button class="plot-base" aria-label={owned ? p.name : `${p.name}, for sale`} onClick={() => tapPlot(h)} />
                  <span class="plot-name" aria-hidden="true">{p.name}</span>
                  {!owned && <span class="for-sale-sign" aria-hidden="true">🔒 {p.price}<CurrencyIcon kind={RESCUE_CURRENCY} size={16} /></span>}
                  {EXTRAS.filter(x => x.home === h && (extraOwned(rescue, x.id) || trial === keyOf('extra', x.id))).map((x, i) => (
                    <span key={x.id} class={`extra x${i} ${trial === keyOf('extra', x.id) ? 'ghost' : ''}`} aria-hidden="true">{x.icon}</span>
                  ))}
                  {here.map((id, i) => {
                    const hopping = hop?.id === id, spot = spotOf(h, here, i);
                    return (
                      <button key={id} class={`resident ${hopping ? 'hop' : ''} ${arrived === id ? 'arrived' : ''}`} aria-label={animal(id).name}
                        style={{ left: `${spot.x}%`, bottom: `${spot.y}%`, animationDelay: `${-i * 1.3}s` }} onClick={() => tapAnimal(id)}>
                        <AnimalPic id={id} />
                        {hopping && hop!.snack && <span key={hop!.n} class="snack" aria-hidden="true">{animal(id).snack}</span>}
                        {hopping && !hop!.snack && <span key={hop!.n} class="heart" aria-hidden="true">💛</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div class="park-path" aria-label="Decorations">
            <span class="gate" aria-hidden="true">🚪</span>
            {DECOS.filter(d => isOwned(rescue, keyOf('deco', d.id)) || trial === keyOf('deco', d.id)).map(d => (
              <span key={d.id} class={`deco ${trial === keyOf('deco', d.id) ? 'ghost' : ''}`} aria-hidden="true">{d.icon}</span>
            ))}
          </div>
        </section>
        <section class="park-side">
          {held ? (
            <div class={`hands ${shake ? 'shook' : ''}`} key={shake}>
              <span class="hands-pic"><AnimalPic id={held} label={animal(held).name} /></span>
              <span class="hands-text">Carry it to its home!</span>
              <span class="hands-icon" aria-hidden="true">🤲</span>
            </div>
          ) : (
            <>
              <div class="park-actions">
                <button class={`big-btn go rescue-btn ${rescue.calls > 0 ? 'pulse' : 'short'}`} aria-label="Rescue" onClick={() => { if (!voice.active) return; if (rescue.calls > 0) goRescue(); else { sNope(); void voice.say('Play a Round to earn a rescue call!'); } }}>
                  <span class="rescue-radio" aria-hidden="true">📻</span><span class="rescue-word">Rescue!</span><span class="rescue-count">{rescue.calls}</span>
                </button>
                <button class={`big-btn feed-btn ${feeding ? 'on' : ''}`} aria-label="Feed" aria-pressed={feeding} onClick={() => { if (!voice.active) return; sClink(); setFeeding(f => !f); if (!feeding) void voice.say('Tap an animal to feed it!'); }}>🧺</button>
                <IconButton label="Garage" class="garage-btn" onClick={() => { if (voice.active) screen.value = 'garage'; }}>🚚</IconButton>
              </div>
              <div class="wr-tabs" role="tablist">
                {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={TAB_NAMES[t]} class={`wr-tab ${t === tab ? 'on' : ''}`} onClick={() => { if (voice.active) { setTab(t); setTrial(null); void voice.say(TAB_NAMES[t]); } }}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
              </div>
              <div class="wr-tray">
                {keysIn(tab).filter(k => item(k).price > 0).map(k => {
                  const info = item(k), owned = isOwned(rescue, k), can = !owned && balance >= info.price;
                  const x = EXTRAS.find(e => keyOf('extra', e.id) === k), d = DECOS.find(e => keyOf('deco', e.id) === k);
                  const waiting = x && !ownsHabitat(rescue, x.home);
                  return (
                    <button key={k} class={`wr-tile ${owned ? 'owned on' : 'locked'} ${can && !waiting ? 'can' : ''} ${waiting ? 'waiting' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={owned} onClick={() => tryItem(k)}>
                      {tab === 'habitat' ? <HabitatArt id={idOf(k) as HabitatId} class="part-pic" /> : <span class="pic emo item-pic" aria-hidden="true">{x?.icon ?? d?.icon}</span>}
                      <span class="mt-name">{info.name}</span>
                      <span class="mt-tag">{owned ? '✓' : waiting ? '🔒' : <>{info.price}<CurrencyIcon kind={RESCUE_CURRENCY} size={18} /></>}</span>
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}
