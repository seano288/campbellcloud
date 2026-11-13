// The Workshop: his robot, built from parts. He picks a sort of part from the tabs and taps one to fit it. A part he doesn't own yet goes on
// the robot to try, with what it would do to his numbers, and Buy beside it, so he sees it before he spends. Parts bolt to spots on the
// robot, which he picks by tapping them, and bigger Bodies have more spots. The one big button is the next fight, with the rival on it.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { IconButton } from '../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../ui/currency';
import { BotView, PartPic } from './bot/BotView';
import { barsOf, powerOf, statsOf, type Build } from './bot/build';
import { body, catOf, keyOf, lockSlotOf, nameOf, part, partsIn, type Cat, type Mount, type PartKey } from './bot/parts';
import { MATH_CURRENCY } from './branding';
import { player } from './game';
import { fightTarget, screen } from './nav';
import { beatLine, gotLine, NUMBERS_TO, waitLine, type Phrase } from './phrases';
import { said } from './numbers/say';
import { startRound } from './round';
import { useVoice } from './voice';
import { buyPart, saveBuild } from './workshop/actions';
import { BalanceLock } from './workshop/BalanceLock';
import { allOwned, fitted, goalOf, isOwned, lockWaitsOn, nextRival, priceOf, stripped } from './workshop/workshop';

const TABS: Record<Cat, { name: Extract<Phrase, 'Body' | 'Wheels' | 'Parts' | 'Paint' | 'Face'>; icon: string }> = {
  add: { name: 'Parts', icon: '⚙️' }, body: { name: 'Body', icon: '🤖' }, wheels: { name: 'Wheels', icon: '🛞' }, paint: { name: 'Paint', icon: '🎨' }, face: { name: 'Face', icon: '😀' },
};
const ORDER: Cat[] = ['add', 'body', 'wheels', 'paint', 'face'];
const rankOf = (k: PartKey) => { const how = part(k).how; return how === 'lock' ? 1e4 : how === 'prize' ? 1e3 : how; };
const sayCount = (n: number): Phrase => said(Math.min(n, NUMBERS_TO));

function Meter({ label, icon, now, was }: { label: string; icon: string; now: number; was: number }) {
  return (
    <div class="mb-meter" role="img" aria-label={`${label} ${now} of 10`}>
      <span class="mi" aria-hidden="true">{icon}</span>
      <span class="mbars">{Array.from({ length: 10 }, (_, i) => <i key={i} class={i < Math.min(now, was) ? 'on' : i < now ? 'up' : i < was ? 'down' : ''} />)}</span>
    </div>
  );
}

export function RewardScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, w = state.workshop;
  const [cat, setCat] = useState<Cat>('add'), [spot, setSpot] = useState<Mount>('front'), [trial, setTrial] = useState<PartKey | null>(null);
  const [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState(false), [vault, setVault] = useState<PartKey | null>(null);
  // On a wide, short bench (a phone on its side) the robot faces right, so the spot rings sit beside it rather than on its face.
  const stage = useRef<HTMLDivElement>(null), [wide, setWide] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth > el.clientHeight * 1.45));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const spots = body(w.build.body).mounts as readonly Mount[];
  const mount = spots.includes(spot) ? spot : spots[0]!;
  const shown: Build = useMemo(() => (trial ? fitted(w.build, trial, catOf(trial) === 'add' ? mount : undefined) : w.build), [w.build, trial, mount]);
  const rival = nextRival(w), goal = goalOf(w), done = allOwned(w);
  const now = statsOf(shown), was = statsOf(w.build), bars = barsOf(now), oldBars = barsOf(was), power = powerOf(shown), oldPower = powerOf(w.build);
  const list = useMemo(() => partsIn(cat).map(p => keyOf(cat, p.id)).sort((a, b) => rankOf(a) - rankOf(b)), [cat]);

  useEffect(() => {
    const fights: Phrase[] = w.charges === 1 ? ['You have 1 fight ready!', 'Tap Fight!'] : w.charges > 1 ? [sayCount(w.charges), 'fights ready!', 'Tap Fight!'] : ['Play a Round to earn a fight!'];
    void voice.say('Workshop!', ...fights);
  }, []);

  const nope = () => { sNope(); setWiggle(true); setTimeout(() => setWiggle(false), 450); };
  function fight() {
    if (!voice.active || blocked) return;
    if (w.charges <= 0) { nope(); void voice.say('Play a Round to earn a fight!'); return; }
    fightTarget.value = (rival ?? { id: 'king' }).id as typeof fightTarget.value;
    if (!rival) { screen.value = 'league'; return; }
    screen.value = 'fight';
  }
  function pickSpot(m: Mount) { if (voice.active) { sClink(); setSpot(m); setCat('add'); setTrial(null); } }
  function pickTab(c: Cat) { if (voice.active) { setCat(c); setTrial(null); void voice.say(TABS[c].name, ...(c === 'add' ? ['Tap a spot on your robot!' as const] : [])); } }
  function celebrate(k: PartKey) {
    setBlocked(true); sFanfare(); confetti(36, voice.signal);
    void voice.say(gotLine(nameOf(k))).then(() => { if (voice.active) setBlocked(false); });
    setTimeout(() => { if (voice.active) setBlocked(false); }, 2500); // a stalled voice never freezes the screen
  }
  function tap(k: PartKey) {
    if (!voice.active || blocked) return;
    if (isOwned(w, k)) {
      setTrial(null);
      saveBuild(fitted(w.build, k, catOf(k) === 'add' ? mount : undefined));
      sClink(); void voice.say(nameOf(k));
      return;
    }
    const how = part(k).how;
    if (how === 'lock') {
      const slot = lockSlotOf(k)!, wait = lockWaitsOn(w, slot);
      setTrial(k);
      if (wait) { sNope(); void voice.say(nameOf(k), waitLine(wait)); } else setVault(k);
      return;
    }
    setTrial(k);
    if (how === 'prize') { sChime(); void voice.say(nameOf(k), beatLine(k)); return; }
    sChime();
    void voice.say(nameOf(k), 'It costs', sayCount(how), 'Bolts.', ...(balance < how ? ['You need' as const, sayCount(how - balance), 'more Bolts.' as const] : []));
  }
  function buyTrial() {
    if (!trial || !voice.active || blocked) return;
    const k = trial, result = buyPart(k, catOf(k) === 'add' ? mount : undefined);
    if (result.kind === 'bought') { setTrial(null); celebrate(k); return; }
    if (result.kind === 'need') { nope(); void voice.say('You need', sayCount(result.more), 'more Bolts.', 'Play a Round to earn Bolts!'); }
  }
  function takeOff() { if (voice.active) { setTrial(null); saveBuild(stripped(w.build, mount)); sClink(); void voice.say('Take it off.'); } }

  const price = trial ? priceOf(trial) : null;
  return (
    <div class="screen reward-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Workshop</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal)! && w.charges <= 0 && !trial ? 'ready' : ''}`} aria-label="Goal" onClick={() => { if (voice.active) { setCat(catOf(goal)); tap(goal); } }}>
              <span class="gi"><PartPic k={goal} /></span>
              <span class="track"><i style={{ width: `${Math.min(100, (balance / priceOf(goal)!) * 100)}%` }} /></span>
            </button>
          : <button class="goalchip done" aria-label="Goal" onClick={() => { if (voice.active) void voice.say(done ? 'You built everything!' : 'This one is in the Balance Lock!'); }}>{done ? '🏆' : '🔐'}</button>}
        <CurrencyPile kind={MATH_CURRENCY} count={balance} />
      </header>
      <div class="work-body">
        <section class="mb-bench">
          <div class={`mb-stage ${wide ? 'wide' : ''}`} ref={stage}>
            <BotView build={shown} live turn={wide ? 0 : -Math.PI / 2} class={`mb-canvas ${trial ? 'trying' : ''}`} />
            {spots.map(m => (
              <button key={m} class={`mb-spot ${m} ${cat === 'add' && m === mount ? 'on' : ''} ${shown.adds[m] ? 'full' : ''}`} aria-label={`${m} spot`} aria-pressed={cat === 'add' && m === mount} onClick={() => pickSpot(m)}>
                {shown.adds[m] ? '' : '＋'}
              </button>
            ))}
          </div>
          <div class="readout">
            <button class="mb-power" aria-label={`Power ${power}`} onClick={() => { if (voice.active) void voice.say('Power', sayCount(power)); }}>
              <span class="pw-word">Power</span><span class={`pw-num ${power > oldPower ? 'up' : power < oldPower ? 'down' : ''}`}>{power}</span>
            </button>
            <div class="mb-meters">
              <Meter label="Speed" icon="💨" now={bars.speed} was={oldBars.speed} />
              <Meter label="Armour" icon="🛡️" now={bars.armour} was={oldBars.armour} />
              <Meter label="Hit" icon="💥" now={bars.hit} was={oldBars.hit} />
            </div>
          </div>
          <div class="work-go">
            <button class={`big-btn go fight-btn ${wiggle ? 'wiggle' : ''} ${w.charges > 0 ? (trial ? '' : 'pulse') : 'short'}`} aria-label="Fight" onClick={fight}>
              {rival && <BotView build={rival.build} turn={Math.PI} class="fight-rival" label={rival.name} />}
              <span class="fight-word">Fight</span>
              <span class="fight-price">🥊{w.charges}</span>
            </button>
            <IconButton label="League" class="trophy-btn" onClick={() => { if (voice.active) screen.value = 'league'; }}>🏆</IconButton>
            <IconButton label="Play" class={`go ${w.charges > 0 ? '' : 'armed'}`} onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
          </div>
        </section>
        <section class="mb-parts">
          <div class="mb-tabs" role="tablist">
            {ORDER.map(c => <button key={c} role="tab" aria-selected={c === cat} aria-label={TABS[c].name} class={`mb-tab ${c === cat ? 'on' : ''}`} onClick={() => pickTab(c)}><span aria-hidden="true">{TABS[c].icon}</span></button>)}
          </div>
          <div class="mb-tray">
            {cat === 'add' && <button class="mb-tile off" aria-label="Take it off" onClick={takeOff}><span class="mt-x">✕</span></button>}
            {list.map(k => {
              const p = part(k), owned = isOwned(w, k), on = owned && (catOf(k) === 'add' ? w.build.adds[mount] === k.split(':')[1] : (w.build as unknown as Record<string, unknown>)[catOf(k)] === k.split(':')[1]);
              const can = typeof p.how === 'number' && !owned && balance >= p.how;
              return (
                <button key={k} class={`mb-tile ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${can ? 'can' : ''} ${trial === k ? 'trying' : ''} ${p.how === 'lock' ? 'legend' : ''}`} aria-label={p.name} aria-pressed={on} onClick={() => tap(k)}>
                  <PartPic k={k} />
                  <span class="mt-name">{p.name}</span>
                  <span class="mt-tag">
                    {owned ? (on ? '✓' : p.power > 0 ? `⚡${p.power}` : '')
                      : p.how === 'lock' ? '🔐' : p.how === 'prize' ? '🏆' : <>{p.how}<CurrencyIcon kind={MATH_CURRENCY} size={18} /></>}
                  </span>
                </button>
              );
            })}
          </div>
          {trial && price !== null && (
            <div class="buybar">
              <button class="x" aria-label="Put it back" onClick={() => setTrial(null)}>✕</button>
              <span class="buy-name">{nameOf(trial)}</span>
              <button class={`big-btn go buy ${balance >= price ? 'pulse' : 'short'}`} aria-label="Buy" onClick={buyTrial}>{price}<CurrencyIcon kind={MATH_CURRENCY} size={30} /></button>
            </div>
          )}
        </section>
      </div>
      {vault && <BalanceLock slot={lockSlotOf(vault)!} swatch={<PartPic k={vault} />}
        onOpen={() => { const k = vault; setVault(null); setTrial(null); sChime(); saveBuild(fitted(player.state.peek().workshop.build, k, catOf(k) === 'add' ? mount : undefined)); celebrate(k); }}
        onClose={() => { setVault(null); setTrial(null); }} />}
    </div>
  );
}
