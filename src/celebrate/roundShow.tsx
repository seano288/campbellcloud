// The "Truck show" at the end of a Round: his Truck acts out each moment on a small road, bigger for bigger
// events, smallest first. Ported from the "Celebrations" prototype (prototype/celebrations @ 6175229, variant C).
import { render } from 'preact';
import { sBigFanfare, sChime, sClink, sCrunch, sDrumroll, sEngine, sFanfare, sHonk, sThud, sWhoosh } from '../audio/sfx';
import { modeById } from '../modes/modes';
import { eventLines, smallestFirst } from '../round/events';
import type { RoundEvent } from '../round/round';
import { trophyOf } from '../trophies/trophies';
import { cupColor, TrophyArt } from '../trophies/TrophyArt';
import { Money } from '../ui/Money';
import type { Phrase } from '../voice/phrases';
import { earnedBolts } from '../app/presentationPhrases';
import { createVoiceScope, type VoiceScope } from '../voice/say';
import { effectsFor } from './effects';
import { playMoments, type Moment } from './sequence';

export interface ShowStage {
  voice: VoiceScope;
  reward: HTMLElement;
  moment: HTMLElement;
  truck: HTMLElement;
  load: HTMLElement;
  pile: HTMLElement;
  /** Show the pile count going up as each Bolt lands. */
  bump(n: number): void;
  /** Show a line as it's spoken. */
  line(p: readonly Phrase[]): void;
  alive(): boolean;
}

export interface RoundShowFacts {
  readonly earned: number;
  readonly events: readonly RoundEvent[];
  readonly canBuild: boolean;
}

function prop(st: ShowStage, css: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'cprop';
  d.style.cssText = css;
  st.moment.appendChild(d);
  st.voice.signal.addEventListener('abort', () => { render(null, d); d.remove(); }, { once: true });
  return d;
}

function speak(st: ShowStage, lines: Phrase[]) {
  if (!st.alive()) return;
  st.line(lines);
  return st.voice.sayMore(...lines);
}

/** Round done (~2.3 s): the Truck drives in with the Bolts he earned in its bed, and they fly onto the pile with a clink each. */
async function roundDone(st: ShowStage, bolts: number, earned: number) {
  const { animate, flyBolt, sound } = effectsFor(st.voice.signal);
  sound(sEngine, 0.9);
  await animate(st.truck, [{ transform: 'translateX(-80vw)' }, { transform: 'translateX(0)' }], 900, 'cubic-bezier(.2,.8,.3,1)');
  if (!st.alive()) return;
  await animate(st.truck, [{ transform: 'rotate(0)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0)' }], 250); // stop and rock
  if (!st.alive()) return;
  sound(sFanfare);
  const line = earnedBolts(earned);
  st.line([line]);
  void st.voice.say(line);
  const loaded = [...st.load.children].map(b => b.getBoundingClientRect());
  st.load.style.visibility = 'hidden';
  let n = bolts - earned;
  await Promise.all(loaded.map((b, i) => st.voice.wait(i * 200)
    .then(() => (st.alive() ? flyBolt({ x: b.left + b.width / 2, y: b.top + b.height / 2 }, st.pile) : undefined))
    .then(() => { if (st.alive()) { sound(sClink); st.bump(++n); } })));
}

/** Level up (+~2 s): a wheelie with a honk, and the new money pops up with a chime and confetti. */
async function levelUp(st: ShowStage, e: Extract<RoundEvent, { kind: 'levelUp' }>) {
  const { animate, confetti, sound } = effectsFor(st.voice.signal);
  const sign = prop(st, 'right:4%;bottom:30px');
  render(<>{modeById(e.mode).introMoney[e.level].map(k => <Money key={k} k={k} caption={false} scale={0.8} />)}</>, sign);
  sign.style.transform = 'scale(0)';
  sound(sHonk); sound(sEngine, 1);
  speak(st, eventLines(e));
  await Promise.all([
    animate(st.truck, [{ transform: 'rotate(0)' }, { transform: 'rotate(-28deg)', offset: 0.3 }, { transform: 'rotate(-24deg)', offset: 0.75 }, { transform: 'rotate(0)' }], 1500),
    (async () => {
      await st.voice.wait(350);
      if (!st.alive()) return;
      const pop = animate(sign, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], 400);
      sound(sChime); confetti(40);
      await pop;
    })(),
  ]);
  if (!st.alive()) return;
  await st.voice.wait(300);
  if (!st.alive()) return;
  render(null, sign);
  sign.remove();
}

/** Mode opens (+~2.9 s): the Truck crushes the mode's padlock with a crunch, a shake and flying bits. */
async function modeOpens(st: ShowStage, e: Extract<RoundEvent, { kind: 'open' }>) {
  const { animate, shake, shatter, confetti, sound } = effectsFor(st.voice.signal);
  const p = prop(st, 'right:6%');
  p.innerHTML = `${modeById(e.mode).icon}<span style="position:absolute;left:30%;top:-40%">🔒</span>`;
  await animate(p, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 300);
  if (!st.alive()) return;
  const dx = p.getBoundingClientRect().left - st.truck.getBoundingClientRect().left - 20;
  sound(sEngine, 0.8);
  await animate(st.truck, [{ transform: 'translate(0,0)' }, { transform: `translate(${dx * 0.6}px,-90px) rotate(-10deg)`, offset: 0.6 }, { transform: `translate(${dx}px,-30px)` }], 800, 'ease-in');
  if (!st.alive()) return;
  sound(sCrunch); shake(st.reward);
  p.querySelector('span')?.remove();
  const pr = p.getBoundingClientRect(), mr = st.moment.getBoundingClientRect();
  shatter(st.moment, '🔩', pr.left - mr.left + 20, pr.top - mr.top, 5);
  speak(st, eventLines(e));
  confetti(50);
  await animate(st.truck, [{ transform: `translate(${dx}px,-30px)` }, { transform: `translate(${dx}px,-60px)` }, { transform: `translate(${dx}px,-30px)` }], 300);
  if (!st.alive()) return;
  await st.voice.wait(600);
  if (!st.alive()) return;
  await animate(st.truck, [{ transform: `translate(${dx}px,-30px)` }, { transform: 'translate(0,0)' }], 600);
  if (!st.alive()) return;
  p.remove();
}

/** ⭐ (+~4.3 s): a ramp flip through a giant star, with fireworks and the long fanfare. */
async function star(st: ShowStage, e: RoundEvent) {
  const { animate, firework, shake, confetti, sound } = effectsFor(st.voice.signal);
  const u = +getComputedStyle(document.documentElement).getPropertyValue('--u') || 1;
  const ramp = prop(st, 'left:58%');
  ramp.innerHTML = `<svg width="${110 * u}" viewBox="0 0 110 50"><path d="M0 50 L110 50 L110 0 Z" fill="#ffd23f" stroke="#000" stroke-width="4"/></svg>`;
  sound(sEngine, 1.4);
  await animate(st.truck, [{ transform: 'translateX(0)' }, { transform: 'translateX(-30vw)' }], 500);
  if (!st.alive()) return;
  sound(sDrumroll, 0.9);
  await animate(st.truck, [{ transform: 'translateX(-30vw)' }, { transform: 'translateX(10vw)' }], 900, 'ease-in');
  if (!st.alive()) return;
  const big = prop(st, 'position:fixed;left:50%;top:6%;bottom:auto;translate:-50% 0;font-size:calc(150px*var(--u));z-index:41');
  big.textContent = '⭐';
  sound(sWhoosh, 0.9); sound(sBigFanfare);
  speak(st, eventLines(e));
  await Promise.all([
    animate(big, [{ transform: 'scale(0) rotate(-180deg)' }, { transform: 'scale(1) rotate(0)' }], 600, 'cubic-bezier(.3,1.7,.5,1)'),
    ...[0, 350, 700, 1100].map(ms => st.voice.wait(ms).then(() => { if (st.alive()) firework(); })),
    animate(st.truck, [{ transform: 'translate(10vw,0) rotate(0)' }, { transform: 'translate(22vw,-42vh) rotate(-200deg)', offset: 0.5 }, { transform: 'translate(34vw,0) rotate(-360deg)' }], 1300, 'linear'),
  ]);
  if (!st.alive()) return;
  sound(sThud); shake(st.reward); confetti(120);
  await animate(st.truck, [{ transform: 'translate(34vw,0)' }, { transform: 'translate(0,0)' }], 700);
  if (!st.alive()) return;
  ramp.remove();
  await st.voice.wait(600);
  if (!st.alive()) return;
  big.remove();
}

/** A new trophy (+~2.2 s): it drops in from the top with a bounce and a chime, and the Truck hops for it. */
async function trophy(st: ShowStage, e: Extract<RoundEvent, { kind: 'trophy' }>) {
  const { animate, confetti, sound } = effectsFor(st.voice.signal);
  const { trophy: t, earned } = trophyOf(e.step);
  const cup = prop(st, 'right:10%;bottom:20px;z-index:1');
  render(<TrophyArt color={cupColor(t, earned)} step={e.step} size={80} />, cup);
  sound(sWhoosh, 0.4);
  await animate(cup, [{ transform: 'translateY(-70vh)' }, { transform: 'translateY(0)', offset: 0.7 }, { transform: 'translateY(-24px)', offset: 0.85 }, { transform: 'translateY(0)' }], 800, 'ease-in');
  if (!st.alive()) return;
  sound(sChime); confetti(40);
  speak(st, eventLines(e));
  await animate(st.truck, [{ transform: 'translateY(0)' }, { transform: 'translateY(-40px)' }, { transform: 'translateY(0)' }], 450);
  if (!st.alive()) return;
  await st.voice.wait(950);
  if (!st.alive()) return;
  render(null, cup);
  cup.remove();
}

/** Plays every moment of the Round, smallest first. Resolves when the last one is done. */
export async function playRoundShow(st: ShowStage, r: RoundShowFacts, bolts: number) {
  return playMoments(roundShowPlan(st, r, bolts), st.voice.signal);
}

export function roundShowPlan(st: ShowStage, r: RoundShowFacts, bolts: number): readonly Moment[] {
  const stages = new WeakMap<AbortSignal, ShowStage>();
  function stage(signal: AbortSignal) {
    let active = stages.get(signal);
    if (!active) {
      active = { ...st, voice: createVoiceScope(signal), alive: () => !signal.aborted && st.alive() };
      stages.set(signal, active);
      signal.addEventListener('abort', () => { st.truck.style.transform = ''; }, { once: true });
    }
    return active;
  }
  return [
    signal => roundDone(stage(signal), bolts, r.earned),
    ...smallestFirst(r.events).map((e): Moment => async signal => {
      const st = stage(signal);
      await st.voice.wait(250);
      if (!st.alive()) return;
      if (e.kind === 'levelUp') await levelUp(st, e);
      else if (e.kind === 'open') await modeOpens(st, e);
      else if (e.kind === 'trophy') await trophy(st, e);
      else await star(st, e);
      if (st.alive()) st.truck.style.transform = '';
    }),
    async signal => {
      const st = stage(signal);
      if (!st.alive()) return;
      if (r.canBuild) {
        effectsFor(signal).sound(sHonk);
        await speak(st, ['You can build something new!']);
      } else await st.voice.sayMore();
    },
  ];
}
