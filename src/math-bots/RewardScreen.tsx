// The Workshop, the reward: TORQUE as he has built it, his Bolts, the big Fight button, and four Slots of Mods to buy. His first fight
// is free and each one after costs Bolts; a Mod he can afford is bought and fitted with one tap, one he can't becomes his Goal and
// the voice says how many more he needs. The fight itself (fight/FightScreen.tsx) loads only when he taps Fight. The word rule
// holds here and in the fight: knocked out, stopped, sent spinning.
import { useEffect, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sNope } from '../audio/sfx';
import { confetti } from '../celebrate/effects';
import { IconButton } from '../ui/bits';
import { CurrencyIcon, CurrencyPile } from '../ui/currency';
import { MATH_CURRENCY } from './branding';
import { player } from './game';
import { screen } from './nav';
import { gotLine, needFight, NUMBERS_TO, type Phrase } from './phrases';
import { startRound } from './round';
import { said } from './numbers/say';
import { useVoice } from './voice';
import { payForFight, tapMod } from './workshop/actions';
import { lookOf, modName, parseMod, RUNGS, SLOT_IDS, SLOTS, type Rung, type SlotId } from './workshop/catalog';
import { TorqueArt } from './workshop/TorqueArt';
import { fightPrice, goalOf, isOwned, PRICES, priceOf } from './workshop/workshop';

/** One Mod's little picture: what it adds, in the colours it adds it. */
function ModSwatch({ slot, rung }: { slot: SlotId; rung: Rung }) {
  const look = lookOf({ paint: 0, drum: 0, armour: 0, wheels: 0, [slot]: rung });
  if (slot === 'paint') return <i class="dab" style={{ background: look.paint.hex }} />;
  if (slot === 'drum') return <i class={`dab round ${look.drum.glow ? 'glow' : ''}`} style={{ background: look.drum.hex }} />;
  if (slot === 'wheels') return <i class={`dab round hub ${look.hub.kind === 'glow' ? 'glow' : ''}`} style={{ background: look.hub.hex }} />;
  return <i class={`dab armour a${rung}`} />;
}

export function RewardScreen() {
  const voice = useVoice(), state = player.state.value, balance = state.currency.balance, w = state.workshop;
  const price = fightPrice(w), goal = goalOf(w), short = price > balance;
  const [hint, setHint] = useState(false), [blocked, setBlocked] = useState(false), [wiggle, setWiggle] = useState<string | null>(null);
  useEffect(() => {
    const invite: Phrase[] = w.ticket ? ['Your fight is ready!', 'Tap Fight!'] : price === 0 ? ['Your first fight is free!', 'Tap Fight!'] : short ? [] : ['Tap Fight!'];
    if (balance === 1) void voice.say('You have 1 Bolt.', ...invite);
    else if (balance <= NUMBERS_TO) void voice.say('You have', said(balance), 'Bolts.', ...invite);
    else void voice.say('Look at all your Bolts!', ...invite);
  }, []);

  const nope = (key: string) => { sNope(); setWiggle(key); setTimeout(() => setWiggle(null), 450); };
  function fight() {
    if (!voice.active || blocked) return;
    const paid = payForFight();
    if (paid.kind === 'go') { screen.value = 'fight'; return; }
    nope('fight');
    setHint(true);
    void voice.say('A fight costs 5 Bolts.', needFight(paid.more), 'Play a Round to earn more Bolts!');
  }
  function mod(slot: SlotId, rung: Rung) {
    if (!voice.active || blocked) return;
    const name = modName(slot, rung), result = tapMod(slot, rung);
    if (result.kind === 'rejected') return;
    if (result.kind === 'fitted') { sClink(); void voice.say(name); }
    else if (result.kind === 'need') { nope(`${slot}:${rung}`); void voice.say(name, needFight(result.more)); }
    else {
      setBlocked(true);
      sFanfare();
      confetti(40, voice.signal);
      void voice.say(gotLine(name)).then(() => { if (voice.active) setBlocked(false); });
      setTimeout(() => { if (voice.active) setBlocked(false); }, 2500); // a stalled voice never freezes the screen
    }
  }
  function goalTap() {
    if (!voice.active || !goal) return;
    const { slot, rung } = parseMod(goal), name = modName(slot, rung);
    sChime();
    void voice.say(name, ...(balance >= priceOf(goal) ? [] : [needFight(priceOf(goal) - balance)]));
  }

  return (
    <div class="screen reward-screen">
      <header class="work-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Workshop</h1>
        {goal
          ? <button class={`goalchip ${balance >= priceOf(goal) ? 'ready' : ''}`} aria-label="Goal" onClick={goalTap}>
              <span class="gi"><ModSwatch {...parseMod(goal)} /></span>
              <span class="track"><i style={{ width: `${Math.min(100, (balance / priceOf(goal)) * 100)}%` }} /></span>
            </button>
          : <span class="goalchip done">🏆</span>}
        <CurrencyPile kind={MATH_CURRENCY} count={balance} />
      </header>
      <div class="work-body">
        <section class="work-bot">
          <TorqueArt gear={w.gear} class="workshop-bot" />
          <button class={`big-btn go fight-btn ${wiggle === 'fight' ? 'wiggle' : ''} ${short ? 'short' : 'pulse'}`} aria-label="Fight" onClick={fight}>
            <span class="e">🥊</span><span class="fight-word">Fight</span>
            <span class="fight-price">{price === 0 ? 'Free' : <>{price}<CurrencyIcon kind={MATH_CURRENCY} size={30} /></>}</span>
          </button>
          <IconButton label="Play" class={`go ${hint ? 'armed' : ''}`} onClick={() => { if (voice.active) startRound(); }}>▶</IconButton>
        </section>
        <section class="work-shop" aria-label="Upgrades">
          {SLOT_IDS.map(slot => (
            <div class="work-slot" key={slot} role="group" aria-label={SLOTS[slot].name}>
              <button class="slot-name" aria-label={SLOTS[slot].name} onClick={() => { if (voice.active) void voice.say(SLOTS[slot].name); }}>{SLOTS[slot].icon}</button>
              {RUNGS.map(rung => {
                const owned = isOwned(w, slot, rung), on = w.gear[slot] === rung, cost = rung === 0 ? 0 : PRICES.rungs[rung];
                return (
                  <button key={rung} aria-label={modName(slot, rung)} aria-pressed={on}
                    class={`mod ${on ? 'on' : ''} ${owned ? 'owned' : 'locked'} ${!owned && balance >= cost ? 'can' : ''} ${wiggle === `${slot}:${rung}` ? 'wiggle' : ''}`}
                    onClick={() => mod(slot, rung)}>
                    <ModSwatch slot={slot} rung={rung} />
                    {owned ? <span class="tag">{on ? '✓' : ''}</span> : <span class="tag">{cost}<CurrencyIcon kind={MATH_CURRENCY} size={18} /></span>}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
