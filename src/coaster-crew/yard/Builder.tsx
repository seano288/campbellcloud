// The builder: his coaster from the side, the pieces he can add next in a tray (only pieces that fit there), and one big button that takes
// the last piece off. Pieces snap on the end; there is no free drawing.
//
// If a piece makes a hill too tall for the car, nothing is refused and nothing is lost: the car is shown slowing on that hill and rolling
// back, the piece goes red, and the voice says why ("It can't get over that hill. It needs to start higher, or get a push."). The two honest
// fixes sit right there, one tap each: a taller first lift, or a booster in front of the hill (bought first if he hasn't got it).
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { sChime, sNope, sPop } from '../../audio/sfx';
import { CurrencyIcon } from '../../ui/currency';
import { drawGround, drawSky, drawTrack, drawTrain, trainLook, type View } from '../art/coaster';
import { CUR } from '../branding';
import { pieceOf } from '../coaster/pieces';
import { build, check, START } from '../coaster/track';
import { buy, player, updateYard } from '../game';
import { ride, watch, yardTab } from '../nav';
import { needLine, sayable, type Phrase } from '../phrases';
import { roll } from '../physics/motion';
import { addPiece, applyFix, canRideMine, carsOf, coasterOf, fixesFor, pickCoaster, selectGoal, slotsOf, takeLast, trayFor, type Fix } from '../park/yard';
import { itemOf } from '../park/catalog';
import { useVoice } from '../voice';

const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
const name = (id: string) => pieceOf(id).name as Phrase;

/** The coaster from the side, fitted to the box (the end of a long one, where he's building). A coaster that rolls back shows the car
 *  slowing and rolling back on the piece it can't get over, again and again. */
export function CoasterView({ pieces, style, theme, train, cars, label, night }: { pieces: readonly string[]; style: string; theme: string; train: ReturnType<typeof trainLook>; cars: number; label: string; night?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const built = useMemo(() => build(pieces), [pieces.join(',')]);
  const c = useMemo(() => check(pieces, built), [built]);
  const frames = useMemo(() => (c.backAt ? roll(built.profile, START, { maxT: 40 }).frames : null), [built, c]);
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (!r.width) return;
      if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, h = r.height, pts = built.profile.pts, maxY = Math.max(14, ...pts.map(p => p[1])), lastX = (built.spans.at(-3) ?? built.spans.at(-1)!).x1;
      const k = Math.max(Math.min(w / (pts.at(-1)![0] + 14), h / (maxY + 12)), Math.min(h / (maxY + 12), w / 140));
      const x0 = Math.max(-7, lastX + 10 - w / k);
      const v: View = { x0, y0: -4, k, w, h };
      drawSky(ctx, w, h, night ? 'night' : 'sunset', 0); drawGround(ctx, v, !!night);
      drawTrack(ctx, built, v, style, { theme, back: c.backAt?.index ?? null, highlight: pieces.length - 1 });
      if (frames) {
        const i = Math.floor(((now - t0) / 1000) * 60 * 1.6) % (frames.length + 90);
        drawTrain(ctx, built.profile, frames[Math.min(i, frames.length - 1)]!.s, 1, train, v, false, (now - t0) / 1000);
      } else drawTrain(ctx, built.profile, 9, cars, train, v, false, (now - t0) / 1000);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [built, frames, style, theme, train, cars, night]);
  return <canvas ref={ref} class="cc-coaster-view" role="img" aria-label={label} />;
}

export function Builder() {
  const voice = useVoice(), state = player.state.value, y = state.yard, balance = state.currency.balance;
  const coaster = coasterOf(y), tray = trayFor(y), slots = slotsOf(y);
  const c = useMemo(() => check(coaster.pieces), [coaster.pieces.join(',')]);
  const fixes = useMemo(() => (c.backAt ? fixesFor(y) : []), [c, y.owned.length, y.prizes.length, slots]);
  const look = useMemo(() => trainLook(y.train), [y.train]);
  const rideable = canRideMine(y);

  function say(...items: Phrase[]) { if (voice.active) void voice.say(...items); }
  function add(id: string) {
    if (!voice.active) return;
    const next = addPiece(y, id);
    if (!next) { sNope(); return; }
    updateYard(() => next); sPop();
    const after = check(coasterOf(next).pieces);
    if (after.backAt) { sNope(); say(name(id), 'Oh no! The car can not get over that.', 'It needs to start higher, or get a push.'); return; }
    say(name(id));
  }
  function off() {
    if (!voice.active) return;
    if (!coaster.pieces.length) { sNope(); return; }
    const gone = coaster.pieces[coaster.pieces.length - 1]!;
    updateYard(takeLast); sChime(); say('Took off', name(gone));
  }
  function fix(f: Fix) {
    if (!voice.active) return;
    if (!f.owned) {
      const price = itemOf(f.piece).price;
      if (price > balance) { updateYard(x => selectGoal(x, { kind: 'item', id: f.piece })); sNope(); say(name(f.piece), 'It costs', sayable(price).said, 'Tokens.', ...needLine(price - balance)); return; }
      if (buy({ kind: 'item', id: f.piece }).kind !== 'accepted') { sNope(); return; }
    }
    const done = updateYard(x => applyFix(x, f));
    if (done.kind !== 'accepted') { sNope(); return; }
    sChime(); say(f.kind === 'lift' ? 'A taller first hill! Now it gets over.' : 'A booster! Now it gets over.');
  }
  function rideIt() {
    if (!voice.active) return;
    if (!rideable) { sNope(); say(coaster.pieces.length ? 'Your coaster rolls back. Fix it first!' : 'Add some pieces first!'); return; }
    if (y.rides <= 0) { sNope(); say('Play a Round to earn a Ride!'); return; }
    ride();
  }
  const pieceTile = (id: string) => {
    const pc = pieceOf(id);
    return (
      <button key={id} class={cls('cc-tile', 'piece', pc.prize && 'prize')} aria-label={pc.name} onClick={() => add(id)}>
        <span class="tile-icon" aria-hidden="true">{pc.icon}</span><span class="tile-name">{pc.name}</span>
      </button>
    );
  };
  return (
    <div class="cc-builder">
      <div class="cc-build-top">
        <CoasterView pieces={coaster.pieces} style={y.style} theme={y.theme} train={look} cars={carsOf(y)} night={y.night} label="Your coaster" />
        {y.coasters.length > 1 && (
          <div class="cc-coaster-pick" role="group" aria-label="Your coasters">
            {y.coasters.map((_, i) => <button key={i} class={cls('cc-num', i === y.current && 'on')} aria-label={`Coaster ${i + 1}`} onClick={() => { updateYard(x => pickCoaster(x, i)); say('Coaster', `${i + 1}` as Phrase); }}>{i + 1}</button>)}
          </div>
        )}
        <span class="cc-slots" aria-label="Pieces used">{coaster.pieces.length}/{slots}</span>
        {c.backAt === null && coaster.pieces.length > 0 && <span class="cc-thrill-tag">⚡ {c.thrill}</span>}
      </div>
      <div class="cc-build-actions">
        <button class={cls('big-btn', 'cc-off', c.backAt !== null && !fixes.length && 'pulse')} aria-label="Take off the last piece" onClick={off}><span class="e">↩️</span></button>
        {c.backAt !== null ? (
          // rolling back: the two honest fixes take the tray's place, right beside ↩️, while the car rolls back above (where he can see it)
          <div class="cc-rollback" role="group" aria-label="It rolls back">
            <span class="cc-rb-say">🐢 It needs more speed!</span>
            {fixes.map(f => (
              <button key={f.kind} class="cc-fix" aria-label={f.kind === 'lift' ? 'Taller first hill' : 'Add a booster'} onClick={() => fix(f)}>
                <span class="e" aria-hidden="true">{f.kind === 'lift' ? '⛓️' : '⚡'}</span>
                <span class="tile-name">{f.kind === 'lift' ? 'Taller hill' : 'Booster'}</span>
                {!f.owned && <span class="tile-cost"><CurrencyIcon kind={CUR} size={16} />{itemOf(f.piece).price}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div class="cc-tray" role="group" aria-label="Pieces that fit">
            {tray.length ? tray.map(pieceTile)
              // a full track: the way to more is one tap, to More Track in the shop
              : coaster.pieces.length >= slots ? <button class="cc-tile repeat" aria-label="More Track" onClick={() => { if (!voice.active) return; yardTab.value = 'track'; say('More Track'); }}><span class="tile-icon" aria-hidden="true">➕</span><span class="tile-name">More Track</span></button>
              : <span class="cc-tray-empty">—</span>}
          </div>
        )}
        <button class={cls('big-btn', 'go', 'cc-ride-go', rideable && y.rides > 0 && 'pulse', !rideable && 'locked')} aria-label="Ride" onClick={rideIt}>
          <span class="e">🎢</span><span class="race-count">{y.rides}</span>
        </button>
        {rideable && <button class="big-btn cc-watch" aria-label="Watch it run" onClick={() => { if (voice.active) watch(); }}><span class="e">👀</span></button>}
      </div>
    </div>
  );
}
