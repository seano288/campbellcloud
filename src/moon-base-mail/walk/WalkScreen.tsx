// Show off: a walk round his base, from the side. His astronaut, in the suit and helmet he picked, walks with ◀ ▶ (held) and does long,
// slow moon hops with ⤴. His modules stand in a row along the ground, joined by a tunnel; his crew stand by them, with Dot and Pip, and
// a tap on one gets a wave and a line. The base runs by itself: the light goes and comes (with the Solar Field the windows stay lit
// through the night), the Earth hangs in the sky (from the Moon's near side it never rises or sets), and with the Rover Garage the moon
// buggy is his to drive (🚙), with the Observatory the telescope shows the Earth close up (🔭). Nothing is paid or used.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { player } from '../game';
import { screen } from '../nav';
import { said, type Phrase } from '../phrases';
import { useVoiceScope } from '../voice';
import { CREW, crewOf, domeHex, flagIcon, has, helmetIcon, HOME, suitHex } from '../base/base';
import { itemOf } from '../base/catalog';
import { moduleFor } from '../base/gen';

const GAP = 120;
interface Person { name: string; x: number; line: Phrase; icon: string }

export function WalkScreen() {
  const voice = useVoiceScope(), b = player.state.value.base;
  const modules = useMemo(() => Object.entries(b.placed).sort(([a], [c]) => { const [ax, ay] = a.split(',').map(Number), [cx, cy] = c.split(',').map(Number); return ay! - cy! || ax! - cx!; }).map(([, id]) => id).slice(0, 60), []);
  const crew = useMemo<Person[]>(() => [
    ...CREW.map((name, i) => ({ name, x: 60 + i * 2 * GAP + 40, line: 'Hi, Commander!' as Phrase, icon: '🧑‍🚀' })),
    { name: 'Dot', x: 160, line: 'Beep boop!', icon: '🤖' }, { name: 'Pip', x: 260, line: 'Meow!', icon: '🐈' },
    ...crewOf(b).map((c, i) => ({ name: c.name, x: 120 + (i + 5) * 2 * GAP, line: said(c.line), icon: '🧑‍🚀' })),
  ], []);
  const canBuggy = has(b, 'module:garage'), canScope = has(b, 'module:observatory'), solar = has(b, 'module:solar');
  const [buggy, setBuggy] = useState(false), [scope, setScope] = useState(false);
  const buggyRef = useRef(false), canvas = useRef<HTMLCanvasElement>(null), held = useRef({ left: false, right: false, hop: false }), tap = useRef<number | null>(null);
  const length = Math.max(800, modules.length * GAP + 300);

  useEffect(() => { void voice.say('Walk the base!'); }, []);
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!;
    let w = 0, h = 0, raf = 0, last = 0, x = 80, y = 0, vy = 0, cam = 0, waving: { who: string; until: number } | null = null;
    const resize = () => { const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    addEventListener('resize', resize);
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const t = ms / 1000, dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      const speed = buggyRef.current ? 140 : 60;
      if (held.current.left) x -= speed * dt;
      if (held.current.right) x += speed * dt;
      x = Math.max(30, Math.min(length - 30, x));
      if (held.current.hop && y <= 0) { vy = buggyRef.current ? 60 : 90; held.current.hop = false; }
      vy -= 70 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
      cam += (x - w / 2 - cam) * 0.1; cam = Math.max(0, Math.min(length - w, cam));
      const dark = (Math.sin(t / 8) + 1) / 2, groundY = h * 0.78;
      // a tap on a crew member: a wave and a line
      if (tap.current !== null) {
        const wx = tap.current + cam, p = crew.find(p => Math.abs(p.x - wx) < 30);
        tap.current = null;
        if (p) { waving = { who: p.name, until: t + 1.5 }; sChime(); void voice.say(said(p.name), p.line); }
      }
      ctx.fillStyle = '#0b1022'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 50; i++) { ctx.fillStyle = '#fff9'; ctx.fillRect(((i * 157 - cam * 0.1) % w + w) % w, (i * 37) % (groundY - 20), 2, 2); }
      ctx.fillStyle = '#3a86ff'; ctx.beginPath(); ctx.arc(w * 0.75, h * 0.18, 26, 0, 7); ctx.fill();
      ctx.fillStyle = `rgb(${138 - dark * 50},${143 - dark * 50},${153 - dark * 50})`; ctx.fillRect(0, groundY, w, h - groundY);
      // the tunnel and the modules
      ctx.fillStyle = '#c0c7d0'; ctx.fillRect(60 - cam, groundY - 18, modules.length * GAP, 14);
      modules.forEach((id, i) => {
        const mx = 60 + i * GAP - cam;
        if (mx < -100 || mx > w + 100) return;
        const hex = id === HOME ? domeHex(b) : id.startsWith('gen:') ? moduleFor(Number(id.slice(4))).hex : domeHex(b);
        ctx.fillStyle = hex; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mx + 40, groundY, 40, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = solar || dark < 0.5 ? '#ffd23f' : '#4b4f57'; ctx.fillRect(mx + 32, groundY - 22, 16, 14); ctx.strokeRect(mx + 32, groundY - 22, 16, 14);
        if (id !== HOME && !id.startsWith('gen:')) { ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(itemOf(id).icon, mx + 40, groundY - 46); }
      });
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(flagIcon(b), 30 - cam, groundY - 6);
      // the crew
      for (const p of crew) {
        const px = p.x - cam;
        if (px < -40 || px > w + 40) continue;
        const wave = waving && waving.who === p.name && t < waving.until;
        ctx.font = '30px sans-serif'; ctx.fillText(p.icon, px, groundY - 4 - (wave ? Math.abs(Math.sin(t * 10)) * 8 : 0));
        if (wave) { ctx.font = '20px sans-serif'; ctx.fillText('👋', px + 18, groundY - 34); }
      }
      // him
      const ax = x - cam, ay = groundY - y;
      if (buggyRef.current) {
        ctx.fillStyle = '#e63946'; ctx.strokeStyle = '#111'; ctx.fillRect(ax - 28, ay - 22, 56, 14); ctx.strokeRect(ax - 28, ay - 22, 56, 14);
        ctx.fillStyle = '#333'; for (const dx of [-18, 18]) { ctx.beginPath(); ctx.arc(ax + dx, ay - 6, 8, 0, 7); ctx.fill(); }
        ctx.font = '20px sans-serif'; ctx.fillText(helmetIcon(b), ax, ay - 26);
      } else {
        ctx.fillStyle = suitHex(b); ctx.strokeStyle = '#111'; ctx.fillRect(ax - 9, ay - 30, 18, 22); ctx.strokeRect(ax - 9, ay - 30, 18, 22);
        ctx.fillRect(ax - 9, ay - 8, 7, 8); ctx.fillRect(ax + 2, ay - 8, 7, 8);
        ctx.font = '22px sans-serif'; ctx.fillText(helmetIcon(b), ax, ay - 32);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  useEffect(() => { buggyRef.current = buggy; }, [buggy]);

  const hold = (k: 'left' | 'right') => ({
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); held.current[k] = true; },
    onPointerUp: () => { held.current[k] = false; }, onPointerLeave: () => { held.current[k] = false; }, onPointerCancel: () => { held.current[k] = false; },
  });
  return (
    <div class="screen landing-screen walk-screen">
      <canvas ref={canvas} class="mb-canvas" onPointerDown={e => { tap.current = e.clientX - (e.target as Element).getBoundingClientRect().left; }} />
      <div class="mb-landing-top"><IconButton label="Moon Base" onClick={() => { if (voice.active) screen.value = 'base'; }}>🏠</IconButton>
        {canBuggy && <IconButton label={buggy ? 'Walk' : 'Drive'} onClick={() => { setBuggy(v => !v); void voice.say(buggy ? 'Walk!' : 'Drive!'); }}>{buggy ? '🧑‍🚀' : '🚙'}</IconButton>}
        {canScope && <IconButton label="Telescope" onClick={() => { setScope(v => !v); void voice.say('Look at the Earth!'); }}>🔭</IconButton>}
      </div>
      <div class="mb-walk-pad">
        <button class="big-btn side-btn" aria-label="Left" {...hold('left')}>◀</button>
        <button class="big-btn side-btn" aria-label="Hop" onClick={() => { held.current.hop = true; void voice.say('Moon hop!'); }}>⤴</button>
        <button class="big-btn side-btn" aria-label="Right" {...hold('right')}>▶</button>
      </div>
      {scope && <button class="mb-scope" aria-label="Close the telescope" onClick={() => setScope(false)}><span class="mb-scope-earth" aria-hidden="true">🌍</span></button>}
    </div>
  );
}
