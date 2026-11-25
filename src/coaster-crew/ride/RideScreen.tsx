// The Ride: first he picks his own coaster or the next Guest Coaster (a coaster that would roll back can't be picked: the card says why and
// what to add). Then the car leaves the station, the chain clacks it up the lift, and it waits at the top for him to pull the lever. A finger
// held anywhere on the track puts the riders' hands up, which catches the stars; at the big drop the camera comes up for a photo. The view
// follows the car and draws only the pieces on screen. At the station: the results, the Tokens, the riders counted, any new best, prize,
// rank or Trophy (and, with a Photo Booth, the photo from the big drop). `replay` is "Watch it run": the whole coaster on screen with the
// train going round by itself, beside his park from above with its visitors walking about; nothing paid.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sPop, sWhoosh, tone } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { IconButton } from '../../ui/bits';
import { CurrencyIcon } from '../../ui/currency';
import { drawGround, drawSky, drawTrack, drawTrain, toScreen, trainLook, type View } from '../art/coaster';
import { emoji } from '../art/draw';
import { CUR } from '../branding';
import { guest, WEATHER_NAMES, type Weather } from '../coaster/guest';
import { kmh } from '../coaster/track';
import { player, settleRide } from '../game';
import { screen, ride as rideAgain } from '../nav';
import { sayable, type Phrase } from '../phrases';
import { canRideMine, carsOf, coasterOf, does, planRide, rankOf, TROPHIES, type RidePay, type RidePlan, type Which } from '../park/yard';
import { startRide, tick, cameraUp, type RideState } from './ride';
import { pointAt } from '../physics/motion';
import { useVoice } from '../voice';
import { startRound } from '../round';
import { guestLabel, guestSaid } from '../yard/names';
import { ParkMap } from '../yard/ParkMap';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const said = (x: string | number) => `${x}` as Phrase;

export function RideScreen({ replay = false }: { replay?: boolean }) {
  const y = player.state.value.yard;
  const [which, setWhich] = useState<Which | null>(replay ? 'mine' : null);
  if (replay) return <Run which="mine" replay />;
  if (y.rides <= 0 && !which) return <NoRides />;
  if (!which) return <Pick onPick={setWhich} />;
  return <Run which={which} />;
}

function NoRides() {
  const voice = useVoice();
  useEffect(() => { void voice.say('Play a Round to earn a Ride!'); }, []);
  return (
    <div class="screen cc-ride-pick">
      <div class="roundbar"><IconButton label="Coaster Yard" onClick={() => { screen.value = 'yard'; }}>🛠️</IconButton></div>
      <div class="cc-pick-card"><h2>Play a Round to earn a Ride!</h2>
        <button class="big-btn go" aria-label="Play" onClick={() => startRound()}><span class="e">▶</span></button></div>
    </div>
  );
}

function Pick({ onPick }: { onPick(w: Which): void }) {
  const voice = useVoice(), y = player.state.value.yard, mine = canRideMine(y), g = guest(y.guest);
  useEffect(() => { void voice.say('Which coaster?', 'My Coaster', 'or', ...guestSaid(y.guest)); }, []);
  function pickMine() {
    if (!voice.active) return;
    if (!mine) { void voice.say(coasterOf(y).pieces.length ? 'Your coaster rolls back. Fix it in the Yard first!' : 'Build your coaster in the Yard first!'); return; }
    onPick('mine');
  }
  return (
    <div class="screen cc-ride-pick">
      <div class="roundbar"><IconButton label="Coaster Yard" onClick={() => { screen.value = 'yard'; }}>🛠️</IconButton><span class="cc-rides-left">🎢 {y.rides}</span></div>
      <div class="cc-pick-row">
        <button class={cls('cc-pick', !mine && 'locked')} aria-label="My Coaster" onClick={pickMine}>
          <CoasterThumb pieces={coasterOf(y).pieces} style={y.style} weather={y.night ? 'night' : 'sunset'} />
          <span class="nm">My Coaster</span>{!mine && <span class="tile-tag">🔧</span>}
          {mine && <span class="cc-thrill">⚡ {coasterOf(y).best || '?'}</span>}
        </button>
        <button class="cc-pick guest" aria-label="Guest Coaster" onClick={() => { if (voice.active) onPick('guest'); }}>
          <CoasterThumb pieces={g.pieces} style={g.style} weather={g.weather} />
          <span class="nm">{guestLabel(g.n)}</span>
          <span class="cc-thrill">{WEATHER_NAMES[g.weather]}</span>
        </button>
      </div>
    </div>
  );
}

/** A small picture of a whole coaster. */
export function CoasterThumb({ pieces, style, weather, theme = 'th:plain' }: { pieces: readonly string[]; style: string; weather: Weather; theme?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = r.width || 240, h = r.height || 140;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const st = startRide(pieces), pts = st.built.profile.pts, maxX = pts.at(-1)![0], maxY = Math.max(10, ...pts.map(p => p[1]));
    const k = Math.min(w / (maxX + 10), (h * .85) / (maxY + 8)), v: View = { x0: -5, y0: -4, k, w, h };
    drawSky(ctx, w, h, weather, 0); drawGround(ctx, v, weather === 'night'); drawTrack(ctx, st.built, v, style, { theme });
  }, [pieces.join(','), style, weather]);
  return <canvas ref={ref} class="cc-thumb" aria-hidden="true" />;
}

/** `photo`: the picture taken at the big drop, kept for the results when he has a Photo Booth (a small JPEG, not saved). */
interface Done { pay: RidePay | null; plan: RidePlan; st: RideState; photo: string | null }

function Run({ which, replay = false }: { which: Which; replay?: boolean }) {
  const voice = useVoice(), y0 = player.state.peek().yard;
  const plan = useMemo(() => planRide(y0, which), []);
  const ref = useRef<HTMLCanvasElement>(null);
  const input = useRef({ hold: false, lever: false, snap: false });
  const [ui, setUi] = useState<{ phase: RideState['phase']; camera: boolean; speed: number; stars: number; of: number }>({ phase: 'out', camera: false, speed: 0, stars: 0, of: 0 });
  const [done, setDone] = useState<Done | null>(null), [armed, setArmed] = useState(false);
  const g = which === 'guest' && plan?.guestN ? guest(plan.guestN) : null;
  const look = useMemo(() => trainLook(g ? { body: g.body, front: 'fr:plain', paint: g.paint, stripe: 'sp:one', riders: y0.train.riders } : y0.train), []);
  const cars = g ? g.cars : carsOf(y0), style = g ? g.style : y0.style, weather: Weather = g ? g.weather : y0.night ? 'night' : 'sunset';
  const speedo = does(y0, 'speedo'), fireworks = does(y0, 'fireworks'), moreStars = does(y0, 'stars'), band = does(y0, 'music'), booth = does(y0, 'photo');

  useEffect(() => {
    if (!plan) { screen.value = 'yard'; return; }
    let st = startRide(plan.pieces), raf = 0, last = performance.now(), said0 = false, heldSaid = false, camSaid = false, snap = false, photo: string | null = null;
    // an instruction ("Pull the lever!", "Hold your finger down...", "Tap the camera!") is never cut off by the riders' "Eek!" or "Woo-hoo!":
    // a squeal or a cheer is only said while no instruction is
    let telling = 0;
    const tell = (line: Phrase) => { telling++; void voice.say(line).finally(() => { telling--; }); };
    if (moreStars) for (const s of [...st.stars]) st.stars.push({ s: s.s + 12, caught: false, missed: false });
    const c = ref.current!, ctx = c.getContext('2d')!;
    const maxY = Math.max(...st.built.profile.pts.map(p => p[1]));
    void voice.say(...(replay ? ['Watch it run!' as const] : which === 'guest' ? guestSaid(plan.guestN!) : ['My Coaster' as const]));
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(1 / 20, (now - last) / 1000); last = now;
      const before = st.phase;
      st = tick(st, replay ? { hold: st.stars.some(s => !s.caught && Math.abs(s.s - st.car.s) < 6), lever: true, snap: false } : { ...input.current }, dt);
      input.current.lever = false; input.current.snap = false;
      for (const e of st.events) {
        if (e === 'star') { sChime(); }
        if (e === 'squeal') { tone(1400, .25, 'sine', 0, .08, 1800); if (!replay && !telling) void voice.say('Eek!'); }
        if (e === 'cheer') { sWhoosh(.8); if (!replay && !telling) void voice.say('Woo-hoo!'); }
        if (e === 'photo') { sPop(); snap = booth && !replay; if (st.photo === 'tapped') void voice.say('Snap!'); }
        if (e === 'lever') { sClink(); sWhoosh(1); if (band) [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .1 + i * .13, .07)); }
      }
      if (before !== 'hold' && st.phase === 'hold' && !replay && !heldSaid) { heldSaid = true; tell('Pull the lever!'); }
      if (!camSaid && !replay && cameraUp(st)) { camSaid = true; tell('Tap the camera!'); }
      if (!said0 && st.phase === 'run' && !replay) { said0 = true; tell('Hold your finger down to put your hands up!'); }
      if (st.phase === 'lift' && Math.floor(st.t * 4) !== Math.floor((st.t - dt) * 4)) tone(220, .04, 'square', 0, .04);
      // draw: the view follows the car, the whole coaster in replay
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, h = r.height, q = st.built.profile, car = posOf(st);
      let v: View;
      if (replay) { const maxX = q.pts.at(-1)![0], k = Math.min(w / (maxX + 16), h / (maxY + 20)); v = { x0: -8 - Math.max(0, w / k - maxX - 16) / 2, y0: -4, k, w, h }; }
      else { const k = Math.max(h / Math.max(46, maxY + 14), Math.min(w, h) / 70); v = { x0: car.x - (w * .38) / k, y0: Math.max(-4, car.y - (h * .55) / k), k, w, h }; }
      drawSky(ctx, w, h, weather, st.t); drawGround(ctx, v, weather === 'night');
      drawTrack(ctx, st.built, v, style, { theme: y0.theme });
      for (const s of st.stars) if (!s.caught) { const p = pointOf(st, s.s), [sx, sy] = toScreen(v, p.x, p.y); if (sx > -20 && sx < w + 20) emoji(ctx, '⭐', sx, sy - 7 * v.k, Math.max(18, 2.6 * v.k)); }
      drawTrain(ctx, q, st.car.s, cars, look, v, st.hands || replay, st.t);
      if (st.phase === 'done' && replay) { st = startRide(plan.pieces); }
      if (fireworks && st.phase === 'done') for (let i = 0; i < 3; i++) emoji(ctx, '🎆', w * (.2 + .3 * i), h * .2 + Math.sin(st.t * 3 + i) * 10, 40);
      // the Photo Booth keeps the picture: this frame, copied small (a quick copy, so the big drop doesn't stutter)
      if (snap) {
        snap = false;
        try { const pc = document.createElement('canvas'), pw = 360; pc.width = pw; pc.height = Math.round(pw * h / w); pc.getContext('2d')!.drawImage(c, 0, 0, pc.width, pc.height); photo = pc.toDataURL('image/jpeg', .8); } catch { photo = null; }
      }
      setUi(u => (u.phase === st.phase && u.camera === cameraUp(st) && Math.abs(u.speed - st.car.v) < 1 && u.stars === st.stars.filter(s => s.caught).length ? u
        : { phase: st.phase, camera: cameraUp(st), speed: st.car.v, stars: st.stars.filter(s => s.caught).length, of: st.stars.length }));
      if (st.phase === 'done' && !replay) {
        cancelAnimationFrame(raf);
        const res = { photo: st.photo === 'tapped', stars: st.stars.filter(s => s.caught).length, starsOf: st.stars.length };
        const pay = settleRide(player, plan, res);
        setDone({ pay, plan, st, photo });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function leave() {
    if (!voice.active) return;
    if (replay || armed) { screen.value = 'yard'; return; }
    setArmed(true); void voice.say('Tap again to leave.');
    setTimeout(() => setArmed(false), 4000);
  }
  // "Watch it run" draws the whole coaster, so its box is the coaster's own shape (with a little sky over the top): no tall empty sky
  const runAspect = useMemo(() => { if (!plan) return 3; const pts = startRide(plan.pieces).built.profile.pts; return (pts.at(-1)![0] + 16) / (Math.max(...pts.map(p => p[1])) + 20); }, []);
  if (!plan) return null;
  if (done) return <Results done={done} which={which} />;
  return (
    <div class={cls('screen', 'cc-ride', replay && 'replay')} style={replay ? { '--cc-run-aspect': runAspect.toFixed(3) } : undefined}>
      <canvas ref={ref} class="cc-ride-canvas" role="img" aria-label={replay ? 'Your coaster running' : 'The Ride'}
        onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); input.current.hold = true; }}
        onPointerUp={() => { input.current.hold = false; }} onPointerCancel={() => { input.current.hold = false; }} />
      <div class="roundbar cc-ride-bar">
        <IconButton label={armed ? 'Tap again to leave' : 'Leave'} class={armed ? 'armed' : ''} onClick={leave}>🛠️</IconButton>
        {!replay && <span class="cc-stars-count">⭐ {ui.stars}/{ui.of}</span>}
        {speedo && <span class="cc-speedo">⏱️ {kmh(ui.speed)}</span>}
      </div>
      {/* "Watch it run": his park working by itself beside the coaster, visitors walking about and his train going round */}
      {replay && <div class="cc-watch-park"><ParkMap y={y0} picked={null} onSpot={() => {}} fit /></div>}
      {!replay && ui.phase === 'hold' && (
        <button class="big-btn go cc-lever pulse" aria-label="Pull the lever" onPointerDown={() => { input.current.lever = true; }}>
          <span class="e">🕹️</span><span class="btn-word">Go!</span>
        </button>
      )}
      {!replay && ui.camera && (
        <button class="big-btn cc-camera pulse" aria-label="Take a photo" onPointerDown={() => { input.current.snap = true; }}><span class="e">📷</span></button>
      )}
    </div>
  );
}
const posOf = (st: RideState) => pointOf(st, st.car.s);
const pointOf = (st: RideState, s: number) => pointAt(st.built.profile, s);

function Results({ done, which }: { done: Done; which: Which }) {
  const voice = useVoice(), { pay, plan, st, photo } = done, y = player.state.value.yard;
  const [awake, setAwake] = useState(false), [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    void (async () => {
      sFanfare(); confetti(30, voice.signal);
      if (!pay) { setAwake(true); return; }
      const add = (l: string) => setLines(ls => [...ls, l]);
      await voice.say('What a ride!');
      const t = sayable(pay.tokens);
      if (voice.active) await voice.say('You got', t.said, pay.tokens === 1 ? 'Token.' : 'Tokens.');
      if (st.photo === 'tapped' && voice.active) { add('📷 Photo!'); await voice.say('Great photo!'); }
      if (voice.active) { add(`🧑‍🤝‍🧑 +${pay.riders}`); await voice.say(said(Math.min(100, pay.riders)), 'riders went round!'); }
      // the Thrill is said only when the voice has its number (to 100, or a whole ten to 400): it never says a number the screen doesn't show
      if (which === 'mine' && voice.active) { const th = sayable(plan.check.thrill); add(`⚡ Thrill ${plan.check.thrill}`); if (th.exact) await voice.say('Thrill', th.said); }
      if (pay.newBest && voice.active) { sFanfare(); add('🏆 New best!'); await voice.say('New best!'); }
      if (pay.prize && voice.active) {
        sFanfare(); confetti(40, voice.signal);
        if (pay.prize.kind === 'paint') { add('🎨 Guest Paint!'); await voice.say('A prize!', 'A new Guest Paint!'); }
        else { add(`🎁 ${pay.prize.name}`); await voice.say('A prize!', pay.prize.name as Phrase); }
      }
      for (const id of pay.trophies) { if (!voice.active) break; const tr = TROPHIES.find(x => x.id === id)!; sChime(); add(`🏆 ${tr.name}`); await voice.say('A new Trophy!', tr.name as Phrase); }
      if (pay.rank && voice.active) { sFanfare(); add(`🎖️ ${pay.rank.name}${pay.rank.number ? ` ${pay.rank.number}` : ''}`); await voice.say('You are now a', pay.rank.name as Phrase); }
      if (voice.active) setAwake(true);
    })();
  }, []);
  const go = (fn: () => void) => () => { if (awake && voice.active) fn(); };
  const rank = rankOf(y.riders);
  return (
    <div class="reward cc-results">
      <h2>{which === 'guest' ? guestLabel(plan.guestN!) : 'What a ride!'}</h2>
      <div class="cc-res-row">
        {pay && <div class="bigpile"><CurrencyIcon kind={CUR} size={64} /><span>+{pay.tokens}</span></div>}
        <div class="cc-res-stats">
          <span>⭐ {st.stars.filter(s => s.caught).length}/{st.stars.length}</span>
          <span>⏱️ {kmh(plan.check.topSpeed)}</span>
          {which === 'mine' && <span>⚡ {plan.check.thrill}</span>}
          <span>🎖️ {rank.name}{rank.number ? ` ${rank.number}` : ''}</span>
        </div>
      </div>
      {photo && <figure class="cc-photo"><img src={photo} alt="Your photo from the big drop" /><figcaption>📸</figcaption></figure>}
      <div class="lines">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <div class={`btns ${awake ? '' : 'asleep'}`}>
        <button class="big-btn garage" aria-label="Coaster Yard" onClick={go(() => { screen.value = 'yard'; })}><span class="e">🛠️</span><span class="btn-word">Yard</span></button>
        {y.rides > 0
          ? <button class="big-btn go race-btn pulse" aria-label="Ride" onClick={go(rideAgain)}><span class="race-flag" aria-hidden="true">🎢</span><span class="race-word">Ride</span><span class="race-count">{y.rides}</span></button>
          : <button class="big-btn go again pulse" aria-label="Play" onClick={go(() => startRound())}><span class="e">▶</span></button>}
      </div>
      <IconButton label="Home" class={awake ? '' : 'asleep'} onClick={go(() => { screen.value = 'home'; })}>🏠</IconButton>
    </div>
  );
}
