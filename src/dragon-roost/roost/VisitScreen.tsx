// Visit the roost: every dragon he has, wandering a meadow under the mountain with the toys he has bought. Tap one and it does its
// tricks and its name is said; with Feed on (once he has a treat), a tap gives it a treat instead. Twelve are out at a time (◀ ▶ shows
// the rest), so a big family still draws quickly on the iPad 9: what is drawn is capped, not what he owns.
import { useEffect, useRef, useState } from 'preact/hooks';
import { sChime, sPop } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { drawDragon } from '../art/dragon';
import { player } from '../game';
import { screen } from '../nav';
import { wordPhrase } from '../phrases';
import { useVoice } from '../voice';
import { itemOf, TOYS, type TrickItem } from './catalog';
import { marksOf, shownName, stageOf } from './dragons';
import { has, lookOf, type Dragon } from './roost';

export const PER_PAGE = 12;
interface Walker { d: Dragon; x: number; y: number; vx: number; act: number; treat: string | null }

export function VisitScreen() {
  const voice = useVoice(), a = player.state.value.roost;
  const [page, setPage] = useState(0), [feed, setFeed] = useState(false);
  const pages = Math.max(1, Math.ceil(a.dragons.length / PER_PAGE));
  const shown = a.dragons.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const treats = TOYS.filter(t => t.treat && has(a, t.id)), toys = TOYS.filter(t => !t.treat && has(a, t.id));
  const tricks = a.tricksOn.map(id => itemOf(id) as TrickItem);
  const ref = useRef<HTMLCanvasElement>(null), walkers = useRef<Walker[]>([]);
  useEffect(() => { walkers.current = shown.map((d, i) => ({ d, x: .1 + ((i * .37) % .8), y: .55 + ((i * .17) % .35), vx: (i % 2 ? 1 : -1) * (.03 + (i % 3) * .01), act: -1, treat: null })); }, [page, a.dragons.length]);
  useEffect(() => { void voice.say('Visit the roost', 'Tap a dragon!'); }, []);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d');
    if (!ctx) return;
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;
    let raf = 0, last = performance.now();
    const draw = (ms: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(.05, (ms - last) / 1000); last = ms;
      const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = r.width, h = r.height;
      if (!w) return;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffb3c6'); g.addColorStop(.45, '#ffe0a8'); g.addColorStop(.46, '#7fcf6a'); g.addColorStop(1, '#3f9b4f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b9735a'; ctx.beginPath(); ctx.moveTo(w * .55, h * .46); ctx.lineTo(w * .78, h * .08); ctx.lineTo(w * 1.02, h * .46); ctx.fill();
      ctx.font = `${Math.min(w, h) * .06}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      toys.slice(0, 15).forEach((t, i) => ctx.fillText(t.icon, w * (.06 + (i * .061) % .9), h * (.62 + (i % 3) * .13)));
      for (const k of [...walkers.current].sort((p, q) => p.y - q.y)) {
        if (!still) { k.x += k.vx * dt; if (k.x < .06 || k.x > .94) k.vx *= -1; }
        if (k.act >= 0) k.act += dt;
        if (k.act > 1.6) { k.act = -1; k.treat = null; }
        const s = Math.min(w, h) * .16 * [.7, .85, 1][stageOf(k.d.flights)]! * (.75 + k.y * .4);
        const hop = k.act >= 0 ? Math.abs(Math.sin(k.act * 6)) * s * .3 : 0, spin = k.act >= 0 && !k.treat ? k.act / 1.6 * Math.PI * 2 : 0;
        ctx.save(); ctx.translate(k.x * w, k.y * h - hop); if (k.vx < 0) ctx.scale(-1, 1); ctx.rotate(spin);
        drawDragon(ctx, lookOf(k.d), s, { stage: stageOf(k.d.flights), t: ms / 1000 + k.d.id, flap: still ? 0 : k.act >= 0 ? 4 : .8, open: k.act >= 0, marks: marksOf(k.d.flights) });
        ctx.restore();
        if (k.treat) { ctx.fillText(k.treat, k.x * w + (k.vx < 0 ? -s * .6 : s * .6), k.y * h - s * .5); }
        ctx.font = `900 ${Math.max(12, s * .16)}px Nunito, sans-serif`; ctx.fillStyle = '#2a1a12'; ctx.fillText(shownName(k.d.name), k.x * w, k.y * h + s * .55);
        ctx.font = `${Math.min(w, h) * .06}px system-ui`;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [page]);
  function tap(e: PointerEvent) {
    if (!voice.active) return;
    const r = ref.current!.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const hit = [...walkers.current].sort((p, q) => Math.hypot(p.x - x, p.y - .04 - y) - Math.hypot(q.x - x, q.y - .04 - y))[0];
    if (!hit || Math.hypot(hit.x - x, hit.y - .04 - y) > .14) return;
    hit.act = 0;
    if (feed && treats.length) { hit.treat = treats[hit.d.id % treats.length]!.icon; sPop(); void voice.say('Yum!'); return; }
    sChime();
    const trick = tricks[hit.d.id % Math.max(1, tricks.length)];
    if (hit.d.name) void voice.say(wordPhrase(hit.d.name[0]), wordPhrase(hit.d.name[1]), ...(trick ? [trick.name] : []));
  }
  return (
    <div class="screen dr-visit-screen">
      <header class="dr-head">
        <IconButton label="Roost" onClick={() => { if (voice.active) screen.value = 'roost'; }}>🏔️</IconButton>
        <h1>Visit</h1>
        <span class="rank-chip">🐉 <small>{a.dragons.length}</small></span>
      </header>
      <canvas ref={ref} class="dr-visit" role="img" aria-label="Your dragons" onPointerDown={tap} />
      <div class="dr-visit-bar">
        {pages > 1 && <button class="big-btn side-btn" aria-label="Back" onClick={() => setPage(p => (p + pages - 1) % pages)}>◀</button>}
        {treats.length > 0 && <button class={`big-btn side-btn ${feed ? 'on' : ''}`} aria-label="Feed" onClick={() => { setFeed(f => !f); void voice.say('Feed'); }}><span aria-hidden="true">{treats[0]!.icon}</span><span class="side-word">Feed</span></button>}
        {pages > 1 && <button class="big-btn side-btn" aria-label="More" onClick={() => setPage(p => (p + 1) % pages)}>▶</button>}
      </div>
    </div>
  );
}
