// The Station: his fire engine in its bay (the one he'll drive to the Call), the wall of badges from the Calls he has answered, the
// things he has bought for the Station, the big Call button and the parts tray. He picks a tab and taps a tile: one he owns goes on
// his truck; one he doesn't goes on it to try (the truck in the bay shows it), with Buy beside it, so he sees it before he spends.
// As in Rover Code's Space Base, the Goal is the cheapest part that helps at the Call, or the one he tapped and couldn't afford.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { TruckArt } from '../art/TruckArt';
import { truckPic } from '../art/truck';
import { LADDER_CURRENCY } from '../branding';
import { SCENES } from '../call/scenes';
import { siren } from '../call/sounds';
import { buy, player, updateStation } from '../game';
import { goCall, screen } from '../nav';
import { NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoice } from '../voice';
import { CATALOGUE, LADDER_FLOORS, PUMP_FLOORS, TAB_NAMES, TABS, TANK_SECONDS, idOf, infoOf, keyOf, tabOf, type ItemKey, type SirenId, type Tab } from './parts';
import { allOwned, callOf, fit, goalOf, isFitted, isOwned, lookOf, priceOf, selectGoal, type StationState } from './station';

export const TAB_ICONS: Record<Tab, string> = { truck: '🚒', pump: '⛲', hose: '🌀', ladder: '🪜', tank: '🛢️', nozzle: '💦', siren: '🚨', lights: '💡', paint: '🎨', buddy: '🐶', station: '🏠', town: '🏙️' };
const NOZZLE_ICONS: Record<string, string> = { straight: '💧', fan: '🌬️', foam: '☁️', bubbles: '🫧', rainbow: '🌈', glitter: '✨', snow: '❄️', twin: '💧💧' };
const BETTER: Partial<Record<Tab, Phrase>> = { pump: 'Your water reaches higher!', hose: 'Your spray is wider!', ladder: 'Your ladder reaches higher!', tank: 'Your tank holds more!' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;

/** What a tile shows: his truck wearing it (trucks and paint), or its emoji and what it does. */
function TilePic({ k, st }: { k: ItemKey; st: StationState }) {
  const tab = tabOf(k), id = idOf(k), info = infoOf(k);
  if (tab === 'truck' || tab === 'paint') return <img class="part-pic" src={truckPic(lookOf(st, k), 200, 120)} alt="" draggable={false} />;
  if (tab === 'lights') return <span class="swatch lights" style={{ background: info.color, boxShadow: `0 0 14px 4px ${info.color}` }} />;
  const rung = info.rung ?? 0;
  if (tab === 'pump') return <span class="tile-emo">⛲<b>⬆{PUMP_FLOORS[rung]}</b></span>;
  if (tab === 'ladder') return <span class="tile-emo">🪜<b>⬆{LADDER_FLOORS[rung]}</b></span>;
  if (tab === 'tank') return <span class="tile-emo">🛢️<b>{TANK_SECONDS[rung]}s</b></span>;
  if (tab === 'hose') return <span class="tile-emo">🌀<b>{'•'.repeat(rung + 1)}</b></span>;
  if (tab === 'nozzle') return <span class="tile-emo">{NOZZLE_ICONS[id]}</span>;
  if (tab === 'siren') return <span class="tile-emo">🚨</span>;
  if (tab === 'buddy') return <span class="tile-emo">{info.emoji ?? '🐕'}</span>;
  return <span class="tile-emo">{info.emoji}</span>;
}

export function StationScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, st = state.station;
  const [tab, setTab] = useState<Tab>('truck'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const look = useMemo(() => lookOf(st, trial), [st, trial]), goal = goalOf(st), next = callOf(st);
  const things = CATALOGUE.station.filter(t => isOwned(st, keyOf('station', t.id)) || trial === keyOf('station', t.id));

  useEffect(() => {
    const ready: Phrase[] = st.calls === 1 ? ['You have 1 Call!', 'Tap Call!'] : st.calls > 1 ? [n(st.calls), 'Calls!', 'Tap Call!'] : ['Play a Round to earn a Call!'];
    void voice.say('The Station!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function call() {
    if (!voice.active || blocked) return;
    if (st.calls <= 0) { nope(); void voice.say('Play a Round to earn a Call!'); return; }
    goCall();
  }
  function pickTab(t: Tab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(TAB_NAMES[t]); } }
  const trickOf = (k: ItemKey): Phrase[] => { const t = infoOf(k).trick; return t ? [t as Phrase] : []; };
  function celebrate(k: ItemKey) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    const better = BETTER[tabOf(k)];
    void voice.say('You got', infoOf(k).name as Phrase, ...(better ? [better] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3000); // a stalled voice never freezes the screen
  }
  function tap(k: ItemKey) {
    if (!voice.active || blocked) return;
    if (tabOf(k) === 'siren') siren(idOf(k) as SirenId);
    if (isOwned(st, k)) {
      setTrial(null);
      if (!isFitted(st, k)) updateStation(s => fit(s, k));
      if (tabOf(k) !== 'siren') sClink();
      void voice.say(infoOf(k).name as Phrase, ...trickOf(k));
      return;
    }
    setTrial(k);
    if (tabOf(k) !== 'siren') sChime();
    const price = priceOf(k);
    void voice.say(infoOf(k).name as Phrase, ...trickOf(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateStation(s => selectGoal(s, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k); }
  }
  function tapBadge(id: string | null) {
    if (!voice.active) return;
    if (!id) { sNope(); void voice.say('Answer more Calls to fill your wall!'); return; }
    sClink();
    void voice.say(SCENES.find(s => s.id === id)!.name as Phrase);
  }

  const keys = CATALOGUE[tab].map(i => keyOf(tab, i.id));
  return (
    <div class="screen station-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Station</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(tabOf(goal)); tap(goal); } }}>
              <span class="gi"><TilePic k={goal} st={st} /></span>
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(st)) void voice.say('You have everything!'); }}>🏆</button>}
        <CurrencyPile kind={LADDER_CURRENCY} count={balance} />
      </header>
      <div class="station-body">
        <section class="bay-side">
          <div class="bay">
            <div class="badge-wall" role="group" aria-label="Badges">
              {SCENES.map(s => {
                const got = st.answered.includes(s.id);
                return <button key={s.id} class={`badge ${got ? 'got' : ''}`} aria-label={got ? s.name : 'Empty badge'} onClick={() => tapBadge(got ? s.id : null)}>{got ? s.badge : ''}</button>;
              })}
            </div>
            <div class="bay-floor">
              <span class="hl-pole" aria-hidden="true" />
              {/* the things he bought for his Station stand on its shelves, the one he's trying lit up */}
              {things.length > 0 && <div class="station-things hl-shelf" aria-hidden="true">{things.map(t => <span key={t.id} class={trial === keyOf('station', t.id) ? 'trying' : ''}>{t.emoji}</span>)}</div>}
              <TruckArt look={look} label="Your fire engine" class={trial && tabOf(trial) !== 'station' && tabOf(trial) !== 'town' ? 'trying' : ''} />
            </div>
          </div>
          <div class="bay-go">
            <button class={`big-btn go call-btn ${wiggle ? 'wiggle' : ''} ${st.calls > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label={`Call to ${next.name}`} onClick={call}>
              <span class="call-badge-next" aria-hidden="true">{next.badge}</span>
              <span class="call-word">Call!</span>
              <span class="call-count">🚒{st.calls}</span>
            </button>
            <IconButton label="Town" class="town-btn" onClick={() => { if (voice.active) screen.value = 'town'; }}>🏙️</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="hl-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={TAB_NAMES[t]} class={`hl-tab ${t === tab ? 'on' : ''}`} onClick={() => pickTab(t)}><span aria-hidden="true">{TAB_ICONS[t]}</span></button>)}
          </div>
          <div class="hl-tray">
            {keys.map(k => {
              const info = infoOf(k), owned = isOwned(st, k), on = owned && isFitted(st, k), can = !owned && balance >= info.price;
              return (
                <button key={k} class={`hl-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <TilePic k={k} st={st} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : '') : <>{info.price}<CurrencyIcon kind={LADDER_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{infoOf(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={LADDER_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
