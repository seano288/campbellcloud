// The fight: a card showing who's fighting and what's at stake, then he drives. A fixed steering disc under his left thumb and two buttons
// under his right sit beside the square arena in landscape and below it upright, so a thumb never covers the action. He presses the disc on
// the side he wants to go, with no need to drag, and every control stays clear of the screen's edges: a swipe that starts at an edge belongs
// to iPadOS (the Dock, the app switcher, the menu bar) and a web page can't stop it. Then the result, with the prize
// in a crate to open, or after a loss one line of advice and a rematch. Keys work too on a computer: arrows or WASD, space, shift.
// Leaving mid-fight costs nothing and pays nothing. The word rule holds: knocked out, stopped, sent spinning.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sFanfare, sNope } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { seeded } from '../../game/rng';
import { BotView, PartPic } from '../bot/BotView';
import { powerOf } from '../bot/build';
import { nameOf, type PartKey } from '../bot/parts';
import { MATH_CURRENCY } from '../branding';
import { player } from '../game';
import { rival as rivalBy, type RivalTip } from '../league/rivals';
import { fightTarget, screen } from '../nav';
import { beatLine, gotLine, koLine, type Phrase } from '../phrases';
import { startRound } from '../round';
import { useVoiceScope, type VoiceScope } from '../voice';
import { settleFight } from '../workshop/actions';
import { mercy, nextRival, type Payout } from '../workshop/workshop';
import { createBrain, think } from './ai';
import { createStage } from './render';
import { createFight, finished, FIGHT_SECONDS, starsFor, STEP, stepFight, type Fight, type Input } from './sim';
import { createFightSound } from './sounds';

type Phase = 'vs' | 'live' | 'end';
interface Result { won: boolean; ko: boolean; stars: number; pay: Payout; tip: RivalTip }

/** Keeps the commentator from talking over himself: a line that doesn't matter is dropped if he's mid-sentence. */
function commentator(voice: VoiceScope) {
  let talking = false, lastAt = 0;
  return (line: Phrase, must = false) => {
    const now = performance.now();
    if (!must && (talking || now - lastAt < 2600)) return;
    talking = true; lastAt = now;
    void voice.say(line).then(() => { talking = false; });
  };
}

function Prize({ k, onOpened }: { k: PartKey; onOpened(): void }) {
  const [open, setOpen] = useState(false);
  return (
    <button class={`crate ${open ? 'open' : ''}`} aria-label={open ? nameOf(k) : 'Open the crate'} onClick={() => { if (!open) { setOpen(true); onOpened(); } }}>
      {open ? <PartPic k={k} /> : <span class="crate-box" aria-hidden="true">📦</span>}
      {open && <span class="crate-name">{nameOf(k)}</span>}
    </button>
  );
}

export function FightScreen() {
  const voice = useVoiceScope();
  const r = rivalBy(fightTarget.value), w = player.state.value.workshop;
  const [phase, setPhase] = useState<Phase>('vs'), [armed, setArmed] = useState(false), [result, setResult] = useState<Result | null>(null), [round, setRound] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null), barYou = useRef<HTMLElement>(null), barFoe = useRef<HTMLElement>(null), clock = useRef<HTMLSpanElement>(null), picked = useRef<HTMLSpanElement>(null);
  const hitBtn = useRef<HTMLButtonElement>(null), boostBtn = useRef<HTMLButtonElement>(null), pad = useRef<HTMLDivElement>(null), disc = useRef<HTMLSpanElement>(null), knob = useRef<HTMLElement>(null);
  const input = useRef<Input>({ x: 0, y: 0, hit: false, boost: false });
  const first = w.fights === 0;
  const shown = useRef(false);

  useEffect(() => { if (phase === 'vs') void voice.say('Next up', r.name, ...(w.rivals[r.id] ? [] : [beatLine(r.prize)])); }, [phase, round]);

  useEffect(() => {
    if (phase !== 'live') return;
    const signal = new AbortController(), say = commentator(voice), sound = createFightSound(signal.signal);
    const losses = w.rivals[r.id]?.losses ?? 0, soft = mercy(losses);
    const s: Fight = createFight({ build: w.build }, { build: r.build, hp: r.hp * soft.hp, speed: r.speed * soft.speed, hit: r.hit * soft.hit }, r.arena, seeded((Date.now() ^ (w.fights * 7919)) >>> 0));
    if (import.meta.env.DEV) (window as unknown as { __fight?: Fight; __fightInput?: Input }).__fight = s;
    const brain = createBrain(r.style, r.skill), stage = createStage(canvas.current!, matchMedia('(prefers-reduced-motion:reduce)').matches);
    const keys = new Set<string>();
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        if (k === ' ' && !e.repeat) input.current.hit = true;
        if (k === 'shift' && !e.repeat) input.current.boost = true;
        keys.add(k);
      } else keys.delete(k);
      if (![...'wasd'].includes(k) && !k.startsWith('arrow')) return;
      const x = +(keys.has('arrowright') || keys.has('d')) - +(keys.has('arrowleft') || keys.has('a')), y = +(keys.has('arrowdown') || keys.has('s')) - +(keys.has('arrowup') || keys.has('w'));
      input.current.x = x; input.current.y = y;
      e.preventDefault();
    };
    addEventListener('keydown', key); addEventListener('keyup', key);
    // Safari's own touch handling stays out of it: no toolbar on a slide, and no zoom or callout on a press. Other buttons here still need their tap.
    const hold = (e: TouchEvent) => { if (e.type === 'touchmove' || (e.target as Element).closest('.pad,.act')) e.preventDefault(); };
    const root = canvas.current!.closest('.fight-screen')!;
    for (const type of ['touchstart', 'touchmove'] as const) root.addEventListener(type, hold as EventListener, { passive: false, signal: signal.signal });

    let raf = 0, last = 0, spare = 0, done = false, lastLeft = -1;
    const ended = () => {
      if (done) return;
      done = true;
      const won = s.over?.winner === 0, stars = starsFor(s);
      const pay = settleFight(r, { won, stars, picked: s.bolts });
      setResult({ won, ko: !!s.over?.ko, stars, pay, tip: r.tip });
      setPhase('end');
    };
    const heard = (s: Fight) => {
      for (const ev of s.events) {
        if (ev.t === 'hit') {
          sound.impact(Math.min(1, ev.dmg / 22), ev.big);
          if (ev.blocked) { if (ev.dmg > 1) say('Blocked!'); }
          else if (ev.big) { say(ev.on === 1 ? 'Big hit!' : 'What a hit!'); sound.crowd(.7); sound.clatter(); }
        }
        if (ev.t === 'flip') { sound.crowd(.8); say('Flipped!'); }
        if (ev.t === 'pit') { sound.crowd(1); say('Into the pit!'); }
        if (ev.t === 'grab') say('Got you!');
        if (ev.t === 'boost' && ev.on === 0) sound.impact(.25);
        if (ev.t === 'bolt') { sChime(); if (picked.current) picked.current.textContent = String(s.bolts); }
        if (ev.t === 'heal') { sChime(); say('Repair box!', true); }
        if (ev.t === 'ko') { sound.crowd(1); sound.impact(1, true); say(ev.on === 1 ? koLine(r.name) : 'Your robot is knocked out!', true); }
      }
    };
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const now = ms / 1000, dt = last ? Math.min(.1, now - last) : 0;
      last = now;
      if (document.hidden) return;
      spare += dt;
      while (spare >= STEP) {
        spare -= STEP;
        stepFight(s, [input.current, think(s, s.bots[1], s.bots[0], brain, STEP)]);
        input.current.hit = false; input.current.boost = false; // a press is one press
      }
      heard(s);
      stage.frame(s, now);
      const [you, foe] = s.bots;
      if (barYou.current) barYou.current.style.transform = `scaleX(${you.hp / you.maxHp})`;
      if (barFoe.current) barFoe.current.style.transform = `scaleX(${foe.hp / foe.maxHp})`;
      const left = Math.ceil(Math.max(0, FIGHT_SECONDS - s.t));
      if (left !== lastLeft && clock.current) { lastLeft = left; clock.current.textContent = String(left); if (left === 0 && !s.over?.ko) say('Time is up!', true); }
      const nextCd = Math.max(0, ...you.fitted.filter(a => a.part.dmg > 0).map(a => a.cd / 2.3), you.powerCd / 3.5);
      hitBtn.current?.style.setProperty('--cd', nextCd.toFixed(2));
      boostBtn.current?.style.setProperty('--cd', (you.boostCd / 2.6).toFixed(2));
      sound.drum(Math.min(.4, Math.hypot(you.vx, you.vy) / 900));
      if (finished(s)) ended();
    };
    raf = requestAnimationFrame(loop);
    void voice.say('Go!', ...(first ? ['Drag here to drive!', 'Tap here to hit!'] as const : []));
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); signal.abort(); };
  }, [phase, round]);

  // the disc stays put and steers by where he presses it, so a press alone is enough; sliding round it works too
  const held = useRef<number | null>(null);
  const steer = (e: PointerEvent) => {
    if (e.pointerId !== held.current || !disc.current) return;
    const box = disc.current.getBoundingClientRect(), r = box.width / 2, dx = e.clientX - box.left - r, dy = e.clientY - box.top - r, d = Math.hypot(dx, dy);
    const k = d < r * .12 ? 0 : Math.min(1, d / (r * .6)), out = Math.min(d, r * .56);
    input.current.x = d ? (dx / d) * k : 0; input.current.y = d ? (dy / d) * k : 0;
    if (knob.current) knob.current.style.transform = `translate(${d ? (dx / d) * out : 0}px,${d ? (dy / d) * out : 0}px)`;
  };
  const letGo = (e: PointerEvent) => {
    if (e.pointerId !== held.current) return;
    held.current = null; input.current.x = 0; input.current.y = 0;
    if (knob.current) knob.current.style.transform = '';
    pad.current?.classList.remove('held');
  };
  const press = (e: PointerEvent) => {
    if (held.current !== null) return;
    held.current = e.pointerId;
    pad.current!.setPointerCapture(e.pointerId);
    pad.current!.classList.add('held');
    steer(e);
  };

  useEffect(() => {
    if (phase !== 'end' || !result || shown.current) return;
    shown.current = true;
    const { won, stars, pay, tip } = result;
    if (won) {
      sFanfare(); confetti(46, voice.signal);
      const starLine = (['1 star!', '2 stars!', '3 stars!'] as const)[stars - 1]!;
      void voice.say('You won!', starLine, ...(pay.prize ? ['Tap the crate!'] as const : []));
    } else { sNope(); void voice.say('So close!', tip, ...(player.state.peek().workshop.charges > 0 ? ['Try again!'] as const : ['Play a Round to earn a fight!'] as const)); }
  }, [phase, result]);

  const leave = () => {
    if (!voice.active) return;
    if (phase === 'end' || armed) { screen.value = 'reward'; return; }
    setArmed(true);
    void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 3000);
  };
  const again = () => { shown.current = false; setResult(null); setPhase('live'); setRound(n => n + 1); };
  const after = player.state.value.workshop, next = nextRival(after), fightsLeft = after.charges;

  if (phase === 'vs') {
    return (
      <div class="fight-screen vs" data-phase="vs">
        <header class="vs-head"><IconButton label="Workshop" onClick={() => { if (voice.active) screen.value = 'reward'; }}>🤖</IconButton></header>
        <div class="vs-row">
          <div class="vs-bot you"><BotView build={w.build} live turn={0} /><strong>Torque</strong><span>⚡{powerOf(w.build)}</span></div>
          <div class="vs-mid">VS</div>
          <div class="vs-bot foe"><BotView build={r.build} live turn={Math.PI} label={r.name} /><strong>{r.name}</strong><span>⚡{powerOf(r.build)}</span></div>
        </div>
        <div class="vs-foot">
          {!w.rivals[r.id] && <span class="vs-prize"><PartPic k={r.prize} /><span>{nameOf(r.prize)}</span></span>}
          <button class="big-btn go pulse" aria-label="Go" onClick={() => { if (voice.active) setPhase('live'); }}><span class="e">▶</span></button>
        </div>
      </div>
    );
  }
  return (
    <div class="fight-screen" data-phase={phase}>
      <div class="side">
        <div class="hud you"><b>Torque</b><u><i ref={barYou} /></u></div>
        <div class="hud-mid">
          <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🏠</IconButton>
          <span class="clock" ref={clock}>{FIGHT_SECONDS}</span>
          <span class="picked"><CurrencyIcon kind={MATH_CURRENCY} size={24} /><span ref={picked}>0</span></span>
        </div>
        <div class="pad" ref={pad} aria-label="Drive" onPointerDown={press} onPointerMove={steer} onPointerUp={letGo} onPointerCancel={letGo} onLostPointerCapture={letGo}>
          <span class="stick" ref={disc}><b class="up">▲</b><b class="right">▲</b><b class="down">▲</b><b class="left">▲</b><i ref={knob} /></span>
          {first && <span class="hint">👆</span>}
        </div>
      </div>
      <div class="arena"><canvas ref={canvas} aria-label={`Your robot against ${r.name}`} /></div>
      <div class="side">
        <div class="hud foe"><b>{r.name}</b><u><i ref={barFoe} /></u></div>
        <div class="acts">
          <button class="act boost" ref={boostBtn} aria-label="Boost" onPointerDown={e => { e.preventDefault(); input.current.boost = true; }}><span>💨</span></button>
          <button class="act hit" ref={hitBtn} aria-label="Hit" onPointerDown={e => { e.preventDefault(); input.current.hit = true; }}><span>💥</span></button>
        </div>
      </div>
      {phase === 'end' && result && (
        <div class="fight-result" role="dialog">
          <h2>{result.won ? 'You won!' : 'So close!'}</h2>
          {result.won && <div class="result-stars" aria-label={`${result.stars} stars`}>{'★'.repeat(result.stars)}<i>{'★'.repeat(3 - result.stars)}</i></div>}
          {result.pay.bolts > 0 && <div class="result-bolts"><CurrencyIcon kind={MATH_CURRENCY} size={40} />+{result.pay.bolts}</div>}
          {!result.won && <p class="result-tip">{result.tip}</p>}
          {(result.pay.prize ?? (result.pay.crown ? 'face:crown' as const : null)) && <Prize k={(result.pay.prize ?? 'face:crown')} onOpened={() => { sFanfare(); confetti(40, voice.signal); void voice.say(gotLine(nameOf(result.pay.prize ?? 'face:crown'))); }} />}
          <div class="btns">
            <button class="big-btn garage" aria-label="Workshop" onClick={() => { if (voice.active) screen.value = 'reward'; }}><span class="e">🤖</span></button>
            {fightsLeft > 0
              ? <button class="big-btn go" aria-label={result.won ? 'Next fight' : 'Fight again'} onClick={() => { if (!voice.active) return; if (result.won) { if (next) { fightTarget.value = next.id as typeof fightTarget.value; shown.current = false; setResult(null); setPhase('vs'); setRound(n => n + 1); } else screen.value = 'league'; } else again(); }}><span class="e">🥊</span></button>
              : <button class="big-btn go" aria-label="Play" onClick={() => { if (voice.active) startRound(); }}><span class="e">▶</span></button>}
          </div>
        </div>
      )}
    </div>
  );
}
