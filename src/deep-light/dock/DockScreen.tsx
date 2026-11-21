// The Dock: his submarine out of the water (the one he'll dive in), the things he has bought for the Dock along the pier, the map of
// the ten places to dive (each opens when his submarine has the parts it needs), the big Dive button and the parts tray. He picks a
// tab and taps a tile: one he owns goes on his submarine; one he doesn't goes on it to try (the submarine on the Dock shows it), with
// Buy beside it, so he sees it before he spends. As in Hook and Ladder's Station, the Goal is the cheapest part that helps on a Dive,
// or the one he tapped and couldn't afford. The first tab picks which submarine he dives in (each says its trick), and the next four
// build it; each submarine keeps its own build.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../../ui/currency';
import { SubArt, subImage } from '../art/Pics';
import { DEEP_CURRENCY } from '../branding';
import { buy, player, updateDock } from '../game';
import { goDive, screen } from '../nav';
import { BETTER, NEEDS_LINE, NUMBERS_TO, type Phrase } from '../phrases';
import { startRound } from '../round';
import { horn } from '../sounds';
import { useVoice } from '../voice';
import { ZONES, type ZoneId } from '../sea/zones';
import { allOwned, diveZone, fit, goalOf, isFitted, isOwned, lookOf, openZones, pickZone, priceOf, selectGoal, zoneOpen, type DockState } from './dock';
import { isSubId, subDef } from './subs';
import { CATALOGUE, CLAW_REACH, DOCK_THINGS, FLASH_COUNT, idOf, infoOf, keyOf, LIGHT_REACH, MOTOR_SPEED, SONAR_RANGE, TAB_NAMES, TABS, tabOf, type ItemKey, type Tab } from './parts';

export const TAB_ICONS: Record<Tab, string> = { sub: '🚢', nose: '👃', tail: '🌀', fins: '🦈', top: '🎩', hull: '🛡️', lights: '🔦', sonar: '📡', motor: '⚙️', claw: '🦾', flash: '📸', paint: '🎨', stripes: '✨', beam: '💡', horn: '📯', buddy: '🐠', trail: '🫧', dock: '⚓' };
const n = (x: number): Phrase => `${Math.min(x, NUMBERS_TO)}` as Phrase;
/** What a submarine does, said with its name. */
const trickOf = (k: ItemKey): Phrase[] => { const id = idOf(k); return tabOf(k) === 'sub' && isSubId(id) && subDef(id).trick ? [subDef(id).trick!] : []; };
const BUILD_TABS: readonly Tab[] = ['sub', 'nose', 'tail', 'fins', 'top'];
const bars = (rung: number, of: number) => <b class="rung-bars">{Array.from({ length: of }, (_, i) => <i class={i <= rung ? 'on' : ''} />)}</b>;

/** What a tile shows: his submarine wearing it (paint and stripes), a swatch, or the part's icon and how good it is. */
function TilePic({ k, st }: { k: ItemKey; st: DockState }) {
  const tab = tabOf(k), info = infoOf(k), rung = info.rung ?? 0;
  if (tab === 'paint' || tab === 'stripes' || tab === 'sub' || tab === 'nose' || tab === 'tail' || tab === 'fins' || tab === 'top') return <img class="part-pic" src={subImage(lookOf(st, k))} alt="" draggable={false} />;
  if (tab === 'beam') return <span class="swatch beam" style={{ background: info.color, boxShadow: `0 0 16px 6px ${info.color}` }} />;
  if (tab === 'trail') return <span class="swatch trail" style={{ borderColor: info.color }} />;
  if (tab === 'hull') return <span class="tile-emo">🛡️{bars(rung, CATALOGUE.hull.length)}</span>;
  if (tab === 'lights') return <span class="tile-emo">🔦<small>{LIGHT_REACH[rung]}</small></span>;
  if (tab === 'sonar') return <span class="tile-emo">📡<small>{SONAR_RANGE[rung]}</small></span>;
  if (tab === 'motor') return <span class="tile-emo">⚙️<small>{MOTOR_SPEED[rung]}</small></span>;
  if (tab === 'claw') return <span class="tile-emo">🦾<small>{CLAW_REACH[rung]}</small></span>;
  if (tab === 'flash') return <span class="tile-emo">📸<small>×{FLASH_COUNT[rung]}</small></span>;
  if (tab === 'horn') return <span class="tile-emo">📯</span>;
  return <span class="tile-emo">{info.emoji}</span>;
}

export function DockScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, st = state.dock;
  const [tab, setTab] = useState<Tab>('sub'), [trial, setTrial] = useState<ItemKey | null>(null), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false);
  const look = useMemo(() => lookOf(st, trial), [st, trial]), goal = goalOf(st), next = diveZone(st);
  const things = DOCK_THINGS.filter(t => isOwned(st, keyOf('dock', t.id)) || trial === keyOf('dock', t.id));

  useEffect(() => {
    const ready: Phrase[] = st.dives === 1 ? ['You have 1 Dive!', 'Tap Dive!'] : st.dives > 1 ? [n(st.dives), 'Dives!', 'Tap Dive!'] : ['Play a Round to earn a Dive!'];
    void voice.say('The Dock!', ...ready);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function dive() {
    if (!voice.active || blocked) return;
    if (st.dives <= 0) { nope(); void voice.say('Play a Round to earn a Dive!'); return; }
    goDive();
  }
  function pickTab(t: Tab) { if (voice.active) { setTab(t); setTrial(null); void voice.say(TAB_NAMES[t]); } }
  function celebrate(k: ItemKey, before: readonly ZoneId[]) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    const better = BETTER[tabOf(k) as keyof typeof BETTER], opened = openZones(player.state.peek().dock).some(z => !before.includes(z));
    void voice.say('You got', infoOf(k).name as Phrase, ...trickOf(k), ...(better ? [better] : []), ...(opened ? ['A new place to dive!' as const] : [])).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 3500); // a stalled voice never freezes the screen
  }
  function tap(k: ItemKey) {
    if (!voice.active || blocked) return;
    if (tabOf(k) === 'horn') horn(idOf(k) as Parameters<typeof horn>[0]);
    if (isOwned(st, k)) {
      setTrial(null);
      if (!isFitted(st, k)) updateDock(s => fit(s, k));
      if (tabOf(k) !== 'horn') sClink();
      void voice.say(infoOf(k).name as Phrase, ...trickOf(k));
      return;
    }
    setTrial(k);
    if (tabOf(k) !== 'horn') sChime();
    const price = priceOf(k);
    void voice.say(infoOf(k).name as Phrase, ...trickOf(k), 'It costs', n(price), 'Bolts.', ...(balance < price ? ['You need' as const, n(price - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, price = priceOf(k);
    if (balance < price) {
      nope();
      updateDock(s => selectGoal(s, k));
      void voice.say('You need', n(price - balance), 'more Bolts.', 'Play a Round to earn Bolts!');
      return;
    }
    const before = openZones(st);
    if (buy(k).kind === 'accepted') { setTrial(null); celebrate(k, before); }
  }
  function tapZone(z: ZoneId) {
    if (!voice.active) return;
    const def = ZONES.find(x => x.id === z)!;
    if (!zoneOpen(st, z)) {
      sNope();
      const hullOk = st.owned.some(k => tabOf(k) === 'hull' && Number(idOf(k).slice(1)) >= def.hull);
      void voice.say(def.name, hullOk && def.needs ? NEEDS_LINE[def.needs.slot as keyof typeof NEEDS_LINE] : NEEDS_LINE.hull);
      return;
    }
    sClink();
    updateDock(s => pickZone(s, z));
    void voice.say('Next dive:', def.name);
  }

  const keys = CATALOGUE[tab].map(i => keyOf(tab, i.id));
  return (
    <div class="screen dock-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Dock</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setTab(tabOf(goal)); tap(goal); } }}>
              <span class="gi"><TilePic k={goal} st={st} /></span>
              <span class="track"><i style={{ width: `${Math.min(100, (balance / Math.max(1, priceOf(goal))) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active && allOwned(st)) void voice.say('You have everything!'); }}>🏆</button>}
        <CurrencyPile kind={DEEP_CURRENCY} count={balance} />
      </header>
      <div class="dock-body">
        <section class="bay-side">
          <div class="dock-bay">
            {things.length > 0 && <div class="dock-things" aria-hidden="true">{things.map(t => <span key={t.id} class={trial === keyOf('dock', t.id) ? 'trying' : ''}>{t.emoji}</span>)}</div>}
            <SubArt look={look} label="Your submarine" class={trial && tabOf(trial) !== 'dock' ? 'trying' : ''} />
          </div>
          <div class="zone-map" role="group" aria-label="Where to dive">
            {ZONES.map(z => {
              const open = zoneOpen(st, z.id);
              return (
                <button key={z.id} class={`zone ${open ? 'open' : 'locked'} ${next === z.id ? 'next' : ''}`} aria-label={z.name} style={{ background: `linear-gradient(${z.top}, ${z.bottom})` }} onClick={() => tapZone(z.id)}>
                  <span class="zone-icon" aria-hidden="true">{z.icon}</span>{!open && <span class="zone-lock" aria-hidden="true">🔒</span>}
                </button>
              );
            })}
          </div>
          <div class="bay-go">
            <button class={`big-btn go dive-btn ${wiggle ? 'wiggle' : ''} ${st.dives > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label={`Dive to ${ZONES.find(z => z.id === next)!.name}`} onClick={dive}>
              <span class="dive-icon" aria-hidden="true">{ZONES.find(z => z.id === next)!.icon}</span>
              <span class="dive-word">Dive!</span>
              <span class="dive-count">🌊{st.dives}</span>
            </button>
            <IconButton label="Logbook" class="log-btn" onClick={() => { if (voice.active) screen.value = 'logbook'; }}>📖</IconButton>
            <IconButton label="Play" class="go" onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="parts-side">
          <div class="dl-tabs" role="tablist">
            {TABS.map(t => <button key={t} role="tab" aria-selected={t === tab} aria-label={TAB_NAMES[t]} class={`dl-tab ${t === tab ? 'on' : ''} ${BUILD_TABS.includes(t) ? 'build' : ''}`} onClick={() => pickTab(t)}>{t === 'sub' ? <img class="tab-sub" src={subImage(lookOf(st), 96, 64)} alt="" draggable={false} /> : <span aria-hidden="true">{TAB_ICONS[t]}</span>}</button>)}
          </div>
          <div class="dl-tray">
            {keys.map(k => {
              const info = infoOf(k), owned = isOwned(st, k), on = owned && isFitted(st, k), can = !owned && balance >= info.price;
              return (
                <button key={k} class={`dl-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''}`} aria-label={info.name} aria-pressed={on} onClick={() => tap(k)}>
                  <TilePic k={k} st={st} />
                  <span class="mt-name">{info.name}</span>
                  <span class="mt-tag">{owned ? (on ? '✓' : '') : <>{info.price}<CurrencyIcon kind={DEEP_CURRENCY} size={18} /></>}</span>
                </button>
              );
            })}
          </div>
          {trial && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{infoOf(trial).name}</span>
              <button class={`big-btn go buy ${balance >= priceOf(trial) ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{priceOf(trial)}<CurrencyIcon kind={DEEP_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
