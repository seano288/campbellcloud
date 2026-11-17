// The Museum: the screen he shows people. Along the top, the hall, where his living dinosaurs walk up and down among the things he has
// bought for it (tap one to hear it roar; tap a thing and it does something). Below, a plinth for each of the twelve dinosaurs: the
// skeleton with the bones he has found in place and the missing ones as dashed outlines, its name (said, never asked), and what to do
// next: Dig for more, Bring it to life, or Play as it. Then the shelf of fossils he has found.
//
// After a Dig the new bones snap onto their skeleton one at a time, and a finished one says so and offers to bring it to life.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime, sClink, sFanfare, sPop } from '../../audio/sfx';
import { confetti } from '../../celebrate/effects';
import { CurrencyPile } from '../../ui/currency';
import { IconButton } from '../../ui/bits';
import { bounds, drawDino } from '../art/dino';
import { EMOJI_FONT, useCanvasLoop } from '../art/loop';
import { DINO_CURRENCY } from '../branding';
import { player, updateMuseum, wakeDino } from '../game';
import { goDig, goRun, justFound, screen } from '../nav';
import type { Phrase } from '../phrases';
import { playRoar } from '../sounds';
import { useVoiceScope } from '../voice';
import { DECOS, keyOf, TOOLS } from '../shop/shop';
import { dino, DINOS, FOSSILS, site, type DinoId } from './dinos';
import { bonesOf, complete, foundBones, isOwned, lookOf, openSites } from './state';

/** A dinosaur on its plinth: the skeleton so far, or (alive) with its skin, standing. */
function Plinth({ id, have, alive, flash }: { id: DinoId; have: number; alive: boolean; flash: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null), m = player.state.value.museum;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(box.width * dpr)); cv.height = Math.max(1, Math.round(box.height * dpr));
    const c = cv.getContext('2d')!, d = dino(id), b = bounds(d), px = Math.min((cv.width * .92) / b.width, (cv.height * .86) / b.height);
    c.clearRect(0, 0, cv.width, cv.height);
    c.save(); c.translate((cv.width - b.width * px) / 2 - b.left * px, cv.height * .95);
    drawDino(c, d, alive ? { mode: 'skin', px, look: lookOf(m, id) } : { mode: 'bones', px, have: dino(id).bones.slice(0, have) });
    c.restore();
  }, [id, have, alive, m.looks[id]]);
  return <canvas ref={ref} class={`plinth-art ${flash ? 'flash' : ''}`} aria-hidden="true" />;
}

interface Walker { id: DinoId; x: number; dir: 1 | -1; phase: number; roar: number; px: number; left: number; width: number }

export function MuseumScreen() {
  const voice = useVoiceScope(), state = player.state.value, m = state.museum;
  const just = useRef(justFound.peek());
  const [shownBones, setShownBones] = useState<Partial<Record<DinoId, number>>>(() => (just.current ? { [just.current.dino]: just.current.had } : {}));
  const [flash, setFlash] = useState<DinoId | null>(null), [hop, setHop] = useState<string | null>(null);
  const hall = useRef<HTMLCanvasElement>(null), walkers = useRef<Walker[]>([]), t = useRef(0);
  const decos = DECOS.filter(x => isOwned(m, keyOf('deco', x.id)));
  const open = openSites(m);

  // the bones a Dig just found snap on one at a time
  useEffect(() => {
    justFound.value = null;
    const j = just.current;
    void (async () => {
      await voice.say('The Museum!');
      if (!j) { if (m.alive.length) void voice.say('Tap a dinosaur to play!'); return; }
      document.getElementById(`plinth-${j.dino}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const total = bonesOf(m, j.dino);
      for (let n = j.had + 1; n <= total && voice.active; n++) { await voice.wait(500); setShownBones(s => ({ ...s, [j.dino]: n })); setFlash(j.dino); sClink(); }
      if (!voice.active) return;
      setShownBones({});
      if (complete(m, j.dino) && !m.alive.includes(j.dino)) { sFanfare(); confetti(40, voice.signal); await voice.say('The skeleton is done!', 'Bring it to life!'); }
      else { await voice.say(dino(j.dino).name as Phrase, `${bonesOf(m, j.dino)}` as Phrase, 'out of', `${dino(j.dino).bones.length}` as Phrase, 'bones found!'); }
    })();
  }, []);

  // the hall's walkers: every living dinosaur, spread out
  const living = m.alive.join(',');
  useMemo(() => {
    walkers.current = m.alive.map((id, i) => {
      const d = dino(id), b = bounds(d), height = Math.min(150, 50 + d.size * .3), px = height / b.height;
      return { id, x: 120 + i * 210, dir: i % 2 ? -1 : 1, phase: i, roar: 0, px, left: b.left, width: b.width * px };
    });
  }, [living]);

  const HALL_W = Math.max(900, 260 + m.alive.length * 210);
  useCanvasLoop(hall, true, dt => {
    t.current += dt;
    for (const w of walkers.current) {
      w.x += w.dir * 40 * dt; w.phase += dt * 4; w.roar = Math.max(0, w.roar - dt);
      if (w.x > HALL_W - 80) w.dir = -1;
      if (w.x < 80) w.dir = 1;
    }
  }, (c, cw, ch) => {
    const sc = ch / 260, view = cw / sc, off = Math.max(0, (HALL_W - view) / 2);
    // walls and floor
    const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, isOwned(m, 'deco:skylight') ? '#bfe6ff' : '#e9d9b8'); g.addColorStop(.72, '#d9c49a'); g.addColorStop(.72, '#a87c4f'); g.addColorStop(1, '#8a6238');
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);
    c.fillStyle = '#00000014'; for (let x = 0; x < cw; x += 120 * sc) c.fillRect(x, 0, 6 * sc, ch * .72);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // decorations along the back wall
    decos.forEach((dc, i) => {
      const x = (60 + (i * 137) % Math.max(200, HALL_W - 120) - off) * sc, y = ch * (i % 3 === 0 ? .4 : .7), lift = hop === dc.id ? Math.abs(Math.sin(t.current * 10)) * 20 * sc : 0;
      c.font = `${(i % 3 === 0 ? 46 : 58) * sc}px ${EMOJI_FONT}`; c.fillText(dc.pic, x, y - lift);
    });
    if (isOwned(m, 'deco:disco')) { for (let i = 0; i < 6; i++) { c.fillStyle = `hsla(${(t.current * 120 + i * 60) % 360} 90% 60% / .18)`; c.beginPath(); c.arc((cw / 6) * i + Math.sin(t.current + i) * 40, ch * .5, 60 * sc, 0, Math.PI * 2); c.fill(); } }
    // the walkers, smallest in front
    const order = [...walkers.current].sort((a, b) => dino(b.id).size - dino(a.id).size);
    for (const w of order) {
      c.save(); c.translate((w.x - off) * sc, ch * .93); c.scale(w.dir * sc, sc);
      drawDino(c, dino(w.id), { mode: 'skin', px: w.px, look: lookOf(m, w.id), pose: { phase: w.phase, stride: 1, jaw: w.roar > 0 ? 1 : 0 }, t: t.current });
      c.restore();
    }
    if (!walkers.current.length) { c.font = `900 ${22 * sc}px Nunito, sans-serif`; c.fillStyle = '#6b4523'; c.fillText('🦴 Bring a dinosaur to life to see it here! 🦴', cw / 2, ch * .5); }
  }, 1.5);
  function tapHall(e: MouseEvent) {
    const cv = hall.current!, box = cv.getBoundingClientRect(), sc = box.height / 260, view = box.width / sc, off = Math.max(0, (HALL_W - view) / 2);
    const x = (e.clientX - box.left) / sc + off;
    const w = walkers.current.find(w => Math.abs(w.x - x) < Math.max(50, w.width / 2));
    if (w) { w.roar = .8; playRoar(lookOf(m, w.id).roar, dino(w.id).size); void voice.say(dino(w.id).name as Phrase); return; }
    const i = decos.findIndex((_, k) => Math.abs(60 + (k * 137) % Math.max(200, HALL_W - 120) - x) < 50);
    if (i >= 0) { const dc = decos[i]!; setHop(dc.id); sPop(); void voice.say(dc.name as Phrase); setTimeout(() => setHop(null), 900); if (dc.id === 'rocket' || dc.id === 'disco' || dc.id === 'meteor') confetti(25, voice.signal); }
  }

  function tapPlinth(id: DinoId) {
    if (!voice.active) return;
    const d = dino(id), have = bonesOf(m, id);
    if (m.alive.includes(id)) { void voice.say(d.line as Phrase); return; }
    if (!have) {
      if (!open.includes(d.site)) { const tool = TOOLS.find(x => x.tier === site(d.site).tier)!; void voice.say(d.name as Phrase, 'You need the', tool.name as Phrase, 'to dig here!'); }
      else void voice.say(d.name as Phrase, 'Find it in a Dig!');
      return;
    }
    if (complete(m, id)) { void voice.say(d.name as Phrase, 'Bring it to life!'); return; }
    void voice.say(d.name as Phrase, `${have}` as Phrase, 'out of', `${d.bones.length}` as Phrase, 'bones found!');
  }
  function bringToLife(id: DinoId) {
    if (!voice.active || !wakeDino(player, id)) return;
    sChime();
    goRun(id, true);
  }
  function play(id: DinoId) {
    if (!voice.active) return;
    updateMuseum(mm => ({ ...mm, pet: id }));
    goRun(id);
  }

  return (
    <div class="screen museum-screen">
      <header class="museum-head">
        <IconButton label="Home" onClick={() => { if (voice.active) screen.value = 'home'; }}>🏠</IconButton>
        <h1>Museum</h1>
        <CurrencyPile kind={DINO_CURRENCY} count={state.currency.balance} />
      </header>
      <div class="museum-scroll">
        <canvas ref={hall} class="museum-hall" onClick={tapHall} aria-label="The Museum hall" />
        <div class="museum-actions">
          <button class={`big-btn go dig-btn ${m.digs ? 'pulse' : 'none'}`} aria-label="Dig" onClick={() => { if (!voice.active) return; if (m.digs) goDig(); else void voice.say('Play a Round to earn a Dig!'); }}>
            🦴 Dig! <span class="count">{m.digs}</span>
          </button>
          <button class="big-btn garage shop-btn" aria-label="Shop" onClick={() => { if (voice.active) screen.value = 'shop'; }}>🛒 Shop</button>
        </div>
        <div class="plinths">
          {DINOS.map(d => {
            const id = d.id as DinoId, have = shownBones[id] ?? bonesOf(m, id), alive = m.alive.includes(id), whole = complete(m, id), locked = !open.includes(d.site);
            return (
              <div key={id} id={`plinth-${id}`} class={`plinth ${alive ? 'alive' : ''} ${locked && !have ? 'locked' : ''}`}>
                <button class="plinth-show" aria-label={d.name} onClick={() => tapPlinth(id)}>
                  <Plinth id={id} have={have} alive={alive} flash={flash === id} />
                  <span class="plinth-name">{d.name}</span>
                  <span class="plinth-bones">{alive ? '✨' : locked && !have ? `🔒 ${TOOLS.find(x => x.tier === site(d.site).tier)!.pic}` : `🦴 ${have}/${d.bones.length}`}</span>
                </button>
                {whole && !alive && <button class="big-btn go plinth-go pulse" aria-label={`Bring ${d.name} to life`} onClick={() => bringToLife(id)}>✨ Alive!</button>}
                {alive && <button class="big-btn go plinth-go" aria-label={`Play as ${d.name}`} onClick={() => play(id)}>▶</button>}
              </div>
            );
          })}
        </div>
        <section class="fossils" aria-label="Fossils">
          <h2>Fossils {m.finds.length}/{FOSSILS.length}</h2>
          <div class="fossil-shelf">
            {FOSSILS.map(f => {
              const got = m.finds.includes(f.id);
              return <button key={f.id} class={`fossil ${got ? '' : 'none'}`} aria-label={got ? f.name : 'A fossil to find'} onClick={() => void voice.say(...(got ? [f.name as Phrase] : ['Find it in a Dig!' as const]))}>{got ? f.pic : '❓'}</button>;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export { foundBones };
