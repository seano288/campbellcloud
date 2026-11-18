// The Wall: the screen he shows people. His postcards (the drawings he kept from Free Sky, each over the Show it was drawn at), his
// planes, the patches of the places he has flown, and the things he bought for the Wall. Tapping a postcard opens it big and the plane
// draws it again; "take down" needs two taps, and is the only way a postcard ever leaves.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sPop } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { PlanePic } from '../art/PlanePic';
import { PLANES, WALL, keyOf, type PlaneId } from '../airfield/parts';
import { isOwned, takeDown, type Postcard } from '../airfield/state';
import { player, updateAirfield } from '../game';
import { screen } from '../nav';
import type { Phrase } from '../phrases';
import { SHOWS } from '../show/places';
import { drawPostcard, strokesOf } from '../show/postcard';
import { useVoiceScope } from '../voice';

function Card({ card, replay = false, gold }: { card: Postcard; replay?: boolean; gold: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!, box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(box.width * dpr)); cv.height = Math.max(1, Math.round(box.height * dpr));
    const c = cv.getContext('2d')!, total = strokesOf(card).reduce((n, s) => n + s.length, 0);
    if (!replay) { drawPostcard(c, card, cv.width, cv.height); return; }
    let raf = 0, n = 0;
    const step = () => { n += Math.max(1, total / 120); drawPostcard(c, card, cv.width, cv.height, n); if (n < total) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [card, replay]);
  return <canvas ref={ref} class={`wall-card ${gold ? 'gold' : ''}`} aria-hidden="true" />;
}

export function WallScreen() {
  const voice = useVoiceScope(), a = player.state.value.airfield;
  const [open, setOpen] = useState<number | null>(null), [armed, setArmed] = useState(false);
  useEffect(() => { void voice.say('Your Wall!'); }, []);
  const gold = isOwned(a, keyOf('wall', 'frames'));
  const planes = PLANES.filter(p => isOwned(a, keyOf('plane', p.id)));
  const things = WALL.filter(w => isOwned(a, keyOf('wall', w.id)) && w.id !== 'frames');
  function down() {
    if (open === null || !voice.active) return;
    if (!armed) { setArmed(true); void voice.say('Tap again to take it down.'); return; }
    updateAirfield(s => takeDown(s, open)); setOpen(null); setArmed(false); sPop();
  }
  return (
    <div class="screen wall-screen">
      <header class="af-head">
        <IconButton label="Airfield" onClick={() => { if (voice.active) screen.value = 'airfield'; }}>🛫</IconButton>
        <h1>Wall</h1>
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
      </header>
      <div class="wall-scroll">
        {things.length > 0 && <div class="wall-things" aria-label="Your Wall things">{things.map(t => <button key={t.id} class="wall-thing" aria-label={t.name} onClick={() => { sPop(); void voice.say(t.name as Phrase); }}>{t.pic}</button>)}</div>}
        <section class="wall-section">
          <h2>📮 Postcards</h2>
          {a.postcards.length ? (
            <div class="wall-cards">
              {a.postcards.map((card, i) => <button key={i} class="wall-card-btn" aria-label={`Postcard ${i + 1}`} onClick={() => { setOpen(i); setArmed(false); sPop(); }}><Card card={card} gold={gold} /></button>)}
            </div>
          ) : <button class="wall-empty" aria-label="No postcards yet" onClick={() => void voice.say('Draw in Free Sky to make a postcard!')}>🎨 Draw in Free Sky to make a postcard!</button>}
        </section>
        <section class="wall-section">
          <h2>✈️ Planes</h2>
          <div class="wall-planes">
            {planes.map(p => <button key={p.id} class="wall-plane" aria-label={p.name} onClick={() => { sPop(); void voice.say(p.name as Phrase); }}><PlanePic look={{ plane: p.id as PlaneId, paint: a.fitted.paint, prop: a.fitted.prop, pilot: a.fitted.pilot }} still /></button>)}
          </div>
        </section>
        <section class="wall-section">
          <h2>🏅 Patches</h2>
          <div class="wall-patches">
            {SHOWS.map(s => <button key={s.id} class={`wall-patch ${a.flown.includes(s.id) ? '' : 'none'}`} aria-label={s.name} onClick={() => void voice.say(...(a.flown.includes(s.id) ? [s.name as Phrase] : ['Fly a Show to earn its patch!' as const]))}>{a.flown.includes(s.id) ? s.patch : '❔'}</button>)}
          </div>
        </section>
      </div>
      {open !== null && a.postcards[open] && (
        <div class="wall-big-wrap" onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div class="wall-big">
            <Card card={a.postcards[open]} replay gold={gold} />
            <div class="wall-big-btns">
              <button class={`big-btn garage ${armed ? 'armed' : ''}`} aria-label={armed ? 'Tap again to take it down' : 'Take it down'} onClick={down}>🗑️</button>
              <button class="big-btn go" aria-label="Close" onClick={() => setOpen(null)}>✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
