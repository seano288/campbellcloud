// Show off: a walk round his base, from the side. His astronaut, in the suit and helmet he picked, walks with ◀ ▶ (held) and does long,
// slow moon hops with ⤴, leaving boot prints in the dust. His modules stand in a row along the ground, drawn as on the map and joined
// by a tunnel; his crew stand in front of them with their names over their heads, with Dot the robot and Pip the cat, and a tap on one
// gets a wave and a line. The base runs by itself: the light goes and comes (with the Solar Field the windows glow through the night;
// without it the base goes dark), the Earth hangs in the sky (from the Moon's near side it never rises or sets), and with the Rover
// Garage the moon buggy, with every buggy part he has bought, is his to drive (🚙); with the Observatory the telescope shows the Earth
// close up (🔭). Nothing is paid or used.
//
// The world is drawn at one scale for every screen (`zoom` grows it a little on a tall one); hills far off move slower than the ground.
// Pieces are few and the pictures are drawn once into images, so it holds 60 fps on an iPad 9.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sChime } from '../../audio/sfx';
import { IconButton } from '../../ui/bits';
import { Earth, lookOf, meSvg, modulesInOrder } from '../art/bits';
import { drawEarth } from '../art/sky';
import { moduleUrl } from '../art/modules';
import { astronautSvg, catSvg, PERSON_ASPECT, robotSvg, svgUrl } from '../art/people';
import { player } from '../game';
import { screen } from '../nav';
import { said, type Phrase } from '../phrases';
import { useVoiceScope } from '../voice';
import { CREW, crewOf, flagIcon, has } from '../base/base';

/** World units between one module and the next, a module's size, and a person's height. */
const GAP = 150, MOD = 132, PERSON = 64;
interface Person { name: string; x: number; line: Phrase; img: HTMLImageElement }

const images = new Map<string, HTMLImageElement>();
function image(url: string) {
  let im = images.get(url);
  if (!im) { im = new Image(); im.src = url; images.set(url, im); }
  return im;
}
const ready = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;
/** A number from 0 to 1 that is the same every time for the same i (where the craters and rocks go). */
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function WalkScreen() {
  const voice = useVoiceScope(), b = player.state.value.base;
  const modules = useMemo(() => modulesInOrder(b).slice(0, 60), []);
  const crew = useMemo<Person[]>(() => {
    const orange = image(svgUrl(astronautSvg('#ff8c1a'))), list: Omit<Person, 'x'>[] = [];
    const others = crewOf(b);
    CREW.forEach((name, i) => {
      list.push({ name, line: 'Hi, Commander!', img: orange });
      if (i === 0) list.push({ name: 'Dot', line: 'Beep boop!', img: image(svgUrl(robotSvg())) });
      if (i === 1) list.push({ name: 'Pip', line: 'Meow!', img: image(svgUrl(catSvg())) });
    });
    for (const c of others) list.push({ name: c.name, line: said(c.line), img: orange });
    return list.map((p, k) => ({ ...p, x: 210 + k * GAP * 0.62 }));
  }, []);
  const canBuggy = has(b, 'module:garage'), canScope = has(b, 'module:observatory'), solar = has(b, 'module:solar');
  const parts = useMemo(() => new Set(b.owned.filter(id => id.startsWith('buggy:')).map(id => id.slice(6))), []);
  const [buggy, setBuggy] = useState(false), [scope, setScope] = useState(false);
  const buggyRef = useRef(false), canvas = useRef<HTMLCanvasElement>(null), held = useRef({ left: false, right: false, hop: false }), tap = useRef<number | null>(null);
  const length = Math.max(900, 140 + modules.length * GAP + 200, (crew.at(-1)?.x ?? 0) + 200);

  useEffect(() => { void voice.say('Walk the base!'); }, []);
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!;
    const me = [-1, 0, 1].map(step => image(svgUrl(meSvg(b, step)))), mods = modules.map(id => ({ look: lookOf(id, b) })).map(m => ({ ...m, img: image(moduleUrl(m.look)) }));
    let w = 0, h = 0, zoom = 1, raf = 0, last = 0, x = 90, y = 0, vy = 0, cam = 0, face = 1, stride = 0, airborne = false;
    let waving: { who: string; until: number } | null = null;
    const prints: { x: number; left: boolean }[] = [], puffs: { x: number; t: number }[] = [];
    let lastPrint = x;
    const resize = () => { const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); zoom = Math.max(0.62, Math.min(1.6, h / 640, w / 480)); };
    resize();
    addEventListener('resize', resize);
    const font = (px: number, weight = 700, family = 'Andika, Nunito, sans-serif') => `${weight} ${px}px ${family}`;

    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      const t = ms / 1000, dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      const driving = buggyRef.current, speed = driving ? 140 : 60;
      const moving = held.current.left !== held.current.right;
      if (held.current.left) { x -= speed * dt; face = -1; }
      if (held.current.right) { x += speed * dt; face = 1; }
      x = Math.max(30, Math.min(length - 30, x));
      if (held.current.hop && y <= 0) { vy = driving ? 60 : 90; held.current.hop = false; airborne = true; }
      vy -= 70 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
      if (airborne && y === 0) { airborne = false; puffs.push({ x, t }); }
      if (moving && y === 0) stride += dt;
      // boot prints (or tyre marks) in the dust, the last few dozen
      if (y === 0 && Math.abs(x - lastPrint) > (driving ? 14 : 22)) { prints.push({ x, left: prints.length % 2 === 0 }); lastPrint = x; if (prints.length > 60) prints.shift(); }

      const vw = w / zoom, vh = h / zoom, groundY = vh * 0.76;
      cam += (x - vw / 2 - cam) * 0.1; cam = Math.max(0, Math.min(length - vw, cam));
      const dark = (Math.sin(t / 8) + 1) / 2;
      // a tap on a crew member: a wave and a line
      if (tap.current !== null) {
        const wx = tap.current / zoom + cam, p = crew.find(p => Math.abs(p.x - wx) < 34);
        tap.current = null;
        if (p) { waving = { who: p.name, until: t + 1.5 }; sChime(); void voice.say(said(p.name), p.line); }
      }

      ctx.save();
      ctx.scale(zoom, zoom);
      // the sky, its stars, and the Earth
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, '#05070f'); sky.addColorStop(1, '#1b2446');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, vw, vh);
      for (let i = 0; i < 70; i++) {
        const sx = ((hash(i) * vw * 1.4 - cam * 0.05) % vw + vw) % vw, sy = hash(i + 99) * groundY * 0.8, tw = 0.55 + 0.45 * Math.sin(t * 1.7 + i);
        ctx.fillStyle = `rgba(255,255,255,${tw})`; ctx.fillRect(sx, sy, i % 7 ? 1.6 : 2.6, i % 7 ? 1.6 : 2.6);
      }
      drawEarth(ctx, vw * 0.78 - cam * 0.02, vh * 0.2, Math.max(30, vh * 0.085));
      // far hills, then nearer ones, moving slower than the ground
      hills(ctx, cam * 0.2, vw, groundY - 34, 64, '#3a3f4b', 0.007, 3);
      hills(ctx, cam * 0.45, vw, groundY - 4, 30, '#5d626c', 0.013, 17);
      // the ground, its craters and rocks, and his prints in the dust
      ctx.fillStyle = '#9aa0ab'; ctx.fillRect(0, groundY, vw, vh - groundY);
      ctx.fillStyle = '#868c97'; ctx.fillRect(0, groundY + (vh - groundY) * 0.55, vw, vh);
      ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(vw, groundY); ctx.stroke();
      for (let k = Math.floor(cam / 170) - 1; k < (cam + vw) / 170 + 1; k++) {
        const cx = k * 170 + hash(k) * 120 - cam, cy = groundY + 22 + hash(k + 5) * (vh - groundY - 50), r = 14 + hash(k + 9) * 22;
        ctx.fillStyle = '#7d828c'; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#b7bcc5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy + 1, r, r * 0.32, 0, 0.1, Math.PI - 0.1); ctx.stroke();
        if (hash(k + 3) > 0.5) { ctx.fillStyle = '#6d727c'; ctx.beginPath(); ctx.ellipse(cx + r * 2, groundY + 10, 6, 4, 0, 0, 7); ctx.fill(); }
      }
      ctx.fillStyle = '#6d727c';
      for (const p of prints) { const px = p.x - cam; if (px < -10 || px > vw + 10) continue; ctx.beginPath(); ctx.ellipse(px, groundY + (p.left ? 8 : 13), driving ? 6 : 4.5, 2, 0, 0, 7); ctx.fill(); }

      // the tunnel and the modules
      const first = 140 - cam;
      if (mods.length > 1) {
        const tx = first + MOD / 2, tw2 = (mods.length - 1) * GAP, ty = groundY - 26;
        ctx.fillStyle = '#d9dde3'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 3;
        ctx.beginPath(); rounded(ctx, tx, ty, tw2, 22, 11); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#9aa5b1'; ctx.lineWidth = 2;
        for (let rx = tx + 20; rx < tx + tw2; rx += 26) { if (rx < -20 || rx > vw + 20) continue; ctx.beginPath(); ctx.moveTo(rx, ty + 3); ctx.lineTo(rx, ty + 19); ctx.stroke(); }
      }
      // the flag he flies
      ctx.strokeStyle = '#14161b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(70 - cam, groundY); ctx.lineTo(70 - cam, groundY - 70); ctx.stroke();
      ctx.font = font(34, 400, 'sans-serif'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(flagIcon(b), 66 - cam, groundY - 70);
      mods.forEach((m, i) => {
        const mx = first + i * GAP;
        if (mx < -MOD || mx > vw + MOD) return;
        // the picture is a 72-unit square with the ground at 64 of them
        const s = MOD * (72 / 64), top = groundY - s * (64 / 72);
        if (ready(m.img)) ctx.drawImage(m.img, mx - (s - MOD) / 2, top, s, s);
        if (m.look.icon) badge(ctx, mx + MOD * 0.92, top + MOD * 0.12, MOD * 0.13, m.look.icon);
      });
      // night: the whole base goes dark, and with the Solar Field its windows glow
      if (dark > 0.05) {
        ctx.fillStyle = `rgba(4,6,18,${dark * 0.5})`; ctx.fillRect(0, 0, vw, vh);
        if (solar) mods.forEach((_, i) => {
          const gx = first + i * GAP + MOD / 2, gy = groundY - MOD * 0.42;
          if (gx < -MOD || gx > vw + MOD) return;
          const g = ctx.createRadialGradient(gx, gy, 4, gx, gy, MOD * 0.75);
          g.addColorStop(0, `rgba(255,210,63,${0.55 * dark})`); g.addColorStop(1, 'rgba(255,210,63,0)');
          ctx.fillStyle = g; ctx.fillRect(gx - MOD, gy - MOD, MOD * 2, MOD * 2);
        });
      }

      // the crew, with their names over their heads
      for (const p of crew) {
        const px = p.x - cam;
        if (px < -60 || px > vw + 60) continue;
        const wave = waving && waving.who === p.name && t < waving.until, lift = wave ? Math.abs(Math.sin(t * 10)) * 10 : 0, ph = PERSON * (p.name === 'Pip' ? 0.8 : 1);
        if (ready(p.img)) ctx.drawImage(p.img, px - ph / PERSON_ASPECT / 2, groundY - ph - lift + 2, ph / PERSON_ASPECT, ph);
        if (wave) { ctx.font = font(24, 400, 'sans-serif'); ctx.textAlign = 'center'; ctx.fillText('👋', px + 26, groundY - ph - 4); }
        nameTag(ctx, px, groundY - ph - lift - 10, p.name, font(Math.max(16, 15 / zoom)));
      }
      // dust where he lands
      for (const p of puffs) { const a = 1 - (t - p.t) / 0.7; if (a <= 0) continue; ctx.fillStyle = `rgba(210,214,222,${a})`; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(p.x - cam + d * (1 - a) * 26, groundY - 4, 5 + (1 - a) * 10, 0, 7); ctx.fill(); } }
      while (puffs.length && t - puffs[0]!.t > 0.7) puffs.shift();

      // him, walking or driving
      const ax = x - cam, ay = groundY - y;
      const frame = me[moving && y === 0 ? (Math.floor(stride / 0.16) % 2 ? 0 : 2) : 1]!;
      ctx.save(); ctx.translate(ax, ay); ctx.scale(face, 1);
      if (driving) drawBuggy(ctx, parts, t, moving, me[1]!);
      else if (ready(frame)) { const ph = PERSON * 1.2; ctx.drawImage(frame, -ph / PERSON_ASPECT / 2, -ph + 2, ph / PERSON_ASPECT, ph); }
      ctx.restore();
      ctx.restore();
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
      <div class="mb-walk-pad left">
        <button class="big-btn mb-pad-btn" aria-label="Left" {...hold('left')}>◀</button>
        <button class="big-btn mb-pad-btn" aria-label="Right" {...hold('right')}>▶</button>
      </div>
      <div class="mb-walk-pad right">
        <button class="big-btn mb-pad-btn hop" aria-label="Hop" onClick={() => { held.current.hop = true; void voice.say('Moon hop!'); }}>⤴</button>
      </div>
      {scope && <button class="mb-scope" aria-label="Close the telescope" onClick={() => setScope(false)}><Earth cls="mb-scope-earth" size={400} /></button>}
    </div>
  );
}

// ---------- drawing ----------

/** A rounded rectangle path (by hand: older iPads have no ctx.roundRect). */
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function hills(ctx: CanvasRenderingContext2D, off: number, vw: number, base: number, amp: number, fill: string, freq: number, seed: number) {
  ctx.fillStyle = fill; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, base + amp * 2);
  for (let sx = 0; sx <= vw + 20; sx += 16) {
    const wx = sx + off;
    ctx.lineTo(sx, base - amp * (0.5 + 0.3 * Math.sin(wx * freq + seed) + 0.2 * Math.sin(wx * freq * 2.7 + seed * 3)));
  }
  ctx.lineTo(vw + 20, base + amp * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, icon: string) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.font = `${Math.round(r * 1.25)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, x, y + 1);
}

function nameTag(ctx: CanvasRenderingContext2D, x: number, bottom: number, name: string, font: string) {
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(name).width + 14, th = parseFloat(font.split(' ')[1]!) * 1.4;
  ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = '#14161b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); rounded(ctx, x - tw / 2, bottom - th, tw, th, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#14161b'; ctx.fillText(name, x, bottom - th / 2 + 1);
}

/** The moon buggy, facing right with its front at +x, wheels on the ground at y 0, with every part he has bought. */
function drawBuggy(ctx: CanvasRenderingContext2D, parts: ReadonlySet<string>, t: number, moving: boolean, driver: HTMLImageElement) {
  const O = '#14161b', big = parts.has('wheels') || parts.has('gold'), wr = big ? 13 : 10, spin = moving ? t * 8 : 0;
  ctx.lineWidth = 3; ctx.strokeStyle = O; ctx.lineJoin = 'round';
  if (parts.has('trailer')) { ctx.fillStyle = '#c8873a'; ctx.beginPath(); rounded(ctx, -78, -wr - 22, 30, 18, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-48, -wr - 10); ctx.lineTo(-34, -wr - 10); ctx.stroke(); wheel(-63, wr * 0.8); }
  if ((parts.has('turbo') || parts.has('boost')) && moving) { ctx.fillStyle = parts.has('boost') ? '#ff8c1a' : 'rgba(210,214,222,.8)'; ctx.beginPath(); ctx.moveTo(-36, -wr - 14); ctx.lineTo(-36 - 14 - Math.sin(t * 30) * 5, -wr - 9); ctx.lineTo(-36, -wr - 4); ctx.closePath(); ctx.fill(); }
  // the driver sits in the seat
  if (ready(driver)) { const ph = PERSON * 0.95; ctx.drawImage(driver, -14 - ph / PERSON_ASPECT / 2, -wr - 16 - ph + 14, ph / PERSON_ASPECT, ph); }
  ctx.fillStyle = '#e63946'; ctx.beginPath(); rounded(ctx, -36, -wr - 20, 72, 16, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3b424c'; ctx.beginPath(); rounded(ctx, -24, -wr - 28, 20, 9, 3); ctx.fill(); ctx.stroke();
  if (parts.has('bar')) { ctx.beginPath(); ctx.moveTo(-30, -wr - 20); ctx.lineTo(-26, -wr - 62); ctx.lineTo(2, -wr - 62); ctx.lineTo(6, -wr - 20); ctx.lineWidth = 4; ctx.stroke(); ctx.lineWidth = 3; }
  if (parts.has('flag')) { ctx.beginPath(); ctx.moveTo(-32, -wr - 20); ctx.lineTo(-32, -wr - 70); ctx.stroke(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-32, -wr - 70); ctx.lineTo(-14, -wr - 64); ctx.lineTo(-32, -wr - 58); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (parts.has('dish')) { ctx.beginPath(); ctx.moveTo(20, -wr - 20); ctx.lineTo(20, -wr - 32); ctx.stroke(); ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.ellipse(20, -wr - 36, 10, 5, -0.4, 0, 7); ctx.fill(); ctx.stroke(); }
  if (parts.has('arm')) { ctx.strokeStyle = '#9aa5b1'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(30, -wr - 18); ctx.lineTo(44, -wr - 34); ctx.lineTo(54, -wr - 22); ctx.stroke(); ctx.strokeStyle = O; ctx.lineWidth = 3; ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(54, -wr - 22, 4, 0, 7); ctx.fill(); ctx.stroke(); }
  if (parts.has('lights')) { const g = ctx.createLinearGradient(38, 0, 110, 0); g.addColorStop(0, 'rgba(255,230,120,.55)'); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(38, -wr - 14); ctx.lineTo(110, -wr - 28); ctx.lineTo(110, -wr + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(37, -wr - 12, 4, 0, 7); ctx.fill(); ctx.stroke(); }
  wheel(-22, wr); wheel(22, wr);
  function wheel(cx: number, r: number) {
    ctx.fillStyle = '#2a2d35'; ctx.beginPath(); ctx.arc(cx, -r, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = parts.has('gold') ? '#e8b923' : '#9aa5b1'; ctx.beginPath(); ctx.arc(cx, -r, r * 0.42, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(spin) * r * 0.8, -r + Math.sin(spin) * r * 0.8); ctx.lineTo(cx - Math.cos(spin) * r * 0.8, -r - Math.sin(spin) * r * 0.8); ctx.stroke();
  }
}
