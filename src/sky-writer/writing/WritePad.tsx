// The writing pad: the three writing lines drawn as contrails across a strip of sky, one box per letter, and his finger (or an Apple
// Pencil: pointer events take either, and while a pencil is writing, and for a moment after, a resting palm's touches are ignored)
// leaving smoke. One finger writes at a time: when several touch at once, the one that moves is the writing, and a touch that sits
// still (a resting hand, a second finger) is dropped without a word. The checker's lanes are never narrower than a fingertip, however small the pad draws the lines
// (letters/check.ts forPad). Each time he lifts,
// the stroke checker (letters/check.ts) says what the path did: strokes that count stay as his smoke, a slip rubs out with a puff, and a
// wrong start or wrong way is a miss, which the Round teaches (writing/teach.ts: the little plane flies it).
//
// Trace It shows the letter (dotted, with a start dot and an arrow at Level 1; dotted with a start dot at Level 2; faint, fading as he
// starts, at Level 3). Write It and Write a Word show nothing but the lines: the letter can sit anywhere along them.
import { useEffect, useRef } from 'preact/hooks';
import { sClink, sPop, sWhoosh } from '../../audio/sfx';
import { drawPlane, type Look } from '../art/plane';
import { feed, forPad, startProgress, travel, type Progress, type Tuning } from '../letters/check';
import { leadIn, letter, startOf, type Letter, type Pt } from '../letters/strokes';
import { useVoice } from '../voice';
import { lessonFor, showAgain, walkNext } from './teach';

export type Guide = 'arrow' | 'dots' | 'faint' | 'none';
/** The pad shows the lines (0 to 3) with a little sky above the top line and below the tail line. */
const TOP = 0.3, HEIGHT = 3.6;
/** After a pencil is lifted, touches are a palm for this long. */
const PEN_PALM_MS = 1200;
/** A touch that has moved less than this (CSS px) since it came down is a resting hand, and a new touch takes over from it. */
const RESTING_PX = 10;

interface Box { ch: string; L: Letter; left: number; w: number; place: number }
function layout(chars: readonly string[], free: boolean) {
  let x = 0;
  const boxes: Box[] = chars.map(ch => {
    const L = letter(ch), w = free ? Math.max(2.6, L.width + 1.5) : Math.max(2.1, L.width + 1.3), b = { ch, L, left: x, w, place: (w - L.width) / 2 };
    x += w;
    return b;
  });
  return { boxes, width: x };
}

export interface PadEvents {
  /** A stroke counted; `done` when it was the last stroke of the last box. */
  stroke(done: boolean, box: number): void;
  miss(why: string, stroke: number, box: number): void;
  rub(why: string): void;
}

export function WritePad({ chars, tuning, guide, signal, active, flash, smoke, look, on }: {
  chars: readonly string[]; tuning: Tuning; guide: Guide; signal: AbortSignal; active: boolean; flash?: boolean;
  smoke: string; look: Look; on: PadEvents;
}) {
  const voice = useVoice(), lesson = lessonFor(signal);
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    ...layout(chars, tuning.free),
    progress: chars.map(() => startProgress(tuning)) as Progress[],
    box: 0,
    smoke: [] as { pts: Pt[]; box: number }[],
    rubbed: [] as { pts: Pt[]; t: number }[],
    /** The fingers (or pencil) on the pad now, each with its path. */
    touches: new Map<number, { path: Pt[]; type: string }>(),
    /** Touches still down when another one's writing was read: when they lift they are ignored. */
    others: new Set<number>(),
    penDown: false,
    pen: 0,
    rubs: 0,
    started: performance.now(),
    firstTouch: 0,
    view: { ox: 0, oy: 0, s: 1, dpr: 1 },
    pan: null as number | null,
  }).current;
  const latest = useRef({ active, on, tuning, guide });
  latest.current = { active, on, tuning, guide };

  const dxOf = (b: number) => (tuning.free ? st.progress[b]!.dx ?? st.boxes[b]!.place : st.boxes[b]!.place);
  /** A stroke's points in pad units. */
  const strokePts = (b: number, k: number): Pt[] => { const box = st.boxes[b]!, dx = box.left + dxOf(b); return box.L.strokes[k]!.pts.map(([x, y]) => [x + dx, y]); };

  // the browser tour draws the next stroke by touch (tools/sky-writer/tour.ts)
  if (import.meta.env.DEV) (window as unknown as { __pad(): unknown }).__pad = () => {
    const r = canvas.current?.getBoundingClientRect(), b = st.box, box = st.boxes[b];
    if (!r || !box) return null;
    const { ox, oy, s, dpr } = st.view, k = st.progress[b]!.done, toScreen = ([x, y]: Pt) => [r.left + (ox + x * s) / dpr, r.top + (oy + y * s) / dpr];
    return { box: b, boxes: st.boxes.length, stroke: k, strokes: box.L.strokes.length, ch: box.ch, pts: k < box.L.strokes.length ? strokePts(b, k).map(toScreen) : [], scale: s / dpr, done: st.progress.map(p => p.done) };
  };

  function toUnits(e: PointerEvent): Pt {
    const r = canvas.current!.getBoundingClientRect(), { ox, oy, s, dpr } = st.view;
    return [((e.clientX - r.left) * dpr - ox) / s, ((e.clientY - r.top) * dpr - oy) / s];
  }
  const local = (b: number, p: Pt): Pt => [p[0] - st.boxes[b]!.left - (tuning.free ? 0 : st.boxes[b]!.place), p[1]];

  /** How far a path has gone, in CSS pixels. */
  const px = (path: readonly Pt[]) => travel(path) * (st.view.s / st.view.dpr);
  /** The touch that is writing: the one that has moved furthest. */
  const writing = (): Pt[] | null => { let best: Pt[] | null = null; for (const t of st.touches.values()) if (!best || px(t.path) > px(best)) best = t.path; return best; };

  function down(e: PointerEvent) {
    if (e.pointerType === 'pen') st.pen = performance.now();
    // a palm resting while he writes with the pencil (it may also come down first, just before the pencil)
    else if (e.pointerType === 'touch' && (st.penDown || performance.now() - st.pen < PEN_PALM_MS)) return;
    if (!latest.current.active || st.box >= st.boxes.length || st.touches.size >= 4) return;
    e.preventDefault();
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* the pointer is already gone */ }
    if (e.pointerType === 'pen') {
      st.penDown = true;
      // the pencil came down over a palm: the palm's touches are not writing
      for (const [id, t] of st.touches) if (t.type === 'touch') { st.touches.delete(id); st.others.add(id); }
    }
    st.touches.set(e.pointerId, { path: [toUnits(e)], type: e.pointerType });
    if (!st.firstTouch) st.firstTouch = performance.now();
  }
  function move(e: PointerEvent) {
    if (e.pointerType === 'pen') st.pen = performance.now();
    const t = st.touches.get(e.pointerId);
    if (!t) return;
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const p = toUnits(ev), last = t.path.at(-1)!;
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.015) t.path.push(p);
    }
  }
  function up(e: PointerEvent) {
    if (e.pointerType === 'pen') { st.pen = performance.now(); st.penDown = false; }
    const t = st.touches.get(e.pointerId);
    if (!t) return;
    st.touches.delete(e.pointerId);
    // Several touches at once: only one writes. A touch that sat still while another was down (a resting hand, a second finger) is
    // dropped without a word; the one that moved is the writing, and the others still down when it lifts are only along for the ride.
    // (A dot is made by a touch that sits still, so when a dot is next a still touch counts unless it was only along for the ride.)
    const still = px(t.path) < RESTING_PX, along = st.others.delete(e.pointerId), dotNext = !!st.boxes[st.box]?.L.strokes[st.progress[st.box]?.done ?? 0]?.dot;
    if (still && (along || (st.touches.size > 0 && !dotNext))) return;
    for (const id of st.touches.keys()) st.others.add(id);
    st.touches.clear();
    const path = t.path, b = st.box, box = st.boxes[b]!;
    if (!latest.current.active) { st.rubbed.push({ pts: path, t: performance.now() }); return; }
    const r = feed(box.L, forPad(latest.current.tuning, st.view.s / st.view.dpr), st.progress[b]!, path.map(p => local(b, p)));
    if (import.meta.env.DEV) ((window as unknown as { __padLog?: unknown[] }).__padLog ??= []).push({ ch: box.ch, outcome: r.outcome, finished: r.finished, n: path.length });
    st.progress[b] = r.progress;
    lesson.at.box = b; lesson.at.done = r.progress.done;
    if (r.finished.length || r.outcome.kind === 'ok') { st.smoke.push({ pts: path, box: b }); st.rubs = 0; }
    if (r.outcome.kind === 'rubout' && r.outcome.why !== 'lift') st.rubbed.push({ pts: path, t: performance.now() });
    if (r.outcome.kind === 'rubout' && r.outcome.why === 'lift' && !r.finished.length) st.smoke.push({ pts: path, box: b });
    if (r.finished.length) {
      sClink();
      const letterDone = r.progress.done >= box.L.strokes.length;
      if (letterDone) { st.box++; lesson.at.box = st.box; lesson.at.done = 0; }
      const all = st.box >= st.boxes.length;
      latest.current.on.stroke(all, b);
      if (!all && lesson.walk.peek()) {
        const nb = st.box, nk = st.progress[nb]!.done;
        void walkNext(signal, st.boxes[nb]!.ch, nb, nk);
      }
    }
    if (r.outcome.kind === 'miss') { latest.current.on.miss(r.outcome.why, r.outcome.stroke, b); return; }
    if (r.outcome.kind === 'rubout') {
      sPop();
      st.rubs++;
      latest.current.on.rub(r.outcome.why);
      if (st.rubs >= 3) { st.rubs = 0; void showAgain(signal, box.ch, b, st.progress[b]!.done); }
    }
  }

  // ---------- drawing ----------
  useEffect(() => {
    const cv = canvas.current!, c = cv.getContext('2d')!;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(box.width * dpr), Hh = Math.round(box.height * dpr);
      if (!W || !Hh) return;
      if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
      // every box across the pad; or, when that would make the letters small (a word on an upright phone), the box he's on fills the
      // pad and the pad slides along to the next one
      const all = Math.min(Hh / HEIGHT, W / (st.width + 0.3)), widest = Math.max(...st.boxes.map(b => b.w));
      const one = Math.min(Hh / HEIGHT, W / (widest + 0.5)), focus = st.boxes.length > 1 && all < one * 0.7;
      const s = focus ? one : all, on = st.boxes[Math.min(st.box, st.boxes.length - 1)]!;
      const want = focus ? W / 2 - (on.left + on.w / 2) * s : (W - st.width * s) / 2;
      st.pan = st.pan === null || Math.abs(st.pan - want) < 1 ? want : st.pan + (want - st.pan) * 0.15;
      const ox = st.pan, oy = (Hh - HEIGHT * s) / 2 + TOP * s;
      st.view = { ox, oy, s, dpr };
      const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, Hh);
      const line = (pts: readonly Pt[], width: number, color: string, alpha = 1, dash: number[] = []) => {
        if (pts.length < 2) return;
        c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash(dash);
        c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])))); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
      };
      const dot = (p: Pt, r: number, color: string, alpha = 1) => { c.globalAlpha = alpha; c.fillStyle = color; c.beginPath(); c.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; };
      // the lines, as contrails
      const lx0 = Math.min(-0.1, -ox / s), lx1 = Math.max(st.width + 0.1, (W - ox) / s);
      for (const [y, w, a, dash] of [[0, 0.05, 0.9, []], [1, 0.04, 0.85, [0.16 * s, 0.12 * s]], [2, 0.07, 1, []], [3, 0.035, 0.55, [0.08 * s, 0.14 * s]]] as const) {
        line([[lx0, y], [lx1, y]], s * w * 2.6, '#ffffff', a * 0.25);
        line([[lx0, y], [lx1, y]], s * w, '#ffffff', a, [...dash]);
      }
      // boxes
      if (st.boxes.length > 1) for (const [i, b] of st.boxes.entries()) {
        c.globalAlpha = i === st.box ? 0.22 : 0.08; c.fillStyle = '#ffffff';
        c.beginPath(); c.roundRect(X(b.left + 0.08), Y(-0.25), (b.w - 0.16) * s, 3.5 * s, 0.25 * s); c.fill(); c.globalAlpha = 1;
      }
      const lw = s * 0.17, smokeAt = (i: number) => (smoke === 'rainbow' ? `hsl(${(i * 47) % 360} 90% 60%)` : smoke === 'glow' ? '#fffbd0' : smoke);
      // the guide for the box he's on
      const b = st.box, bx = st.boxes[b], L = bx?.L, prog = st.progress[b];
      const walk = lesson.walk.value, g = latest.current.guide;
      if (bx && L && prog) {
        const next = prog.done < L.strokes.length ? prog.done : -1;
        const sinceTouch = st.firstTouch ? (now - st.firstTouch) / 1000 : 0;
        for (let k = 0; k < L.strokes.length; k++) {
          if (k < prog.done) continue;
          const pts = strokePts(b, k);
          if (walk && k !== next) continue;
          if (g === 'arrow' || g === 'dots' || walk) {
            if (L.strokes[k]!.dot) dot(pts[0]!, s * 0.09, '#ffffff', 0.9);
            else for (let i = 0; i < pts.length; i += 3) dot(pts[i]!, s * 0.045, '#ffffff', 0.95);
          } else if (g === 'faint') line(pts, lw * 0.8, '#ffffff', Math.max(0, 0.32 - sinceTouch * 0.3));
        }
        if (flash) { const t = (now - st.started) / 1000, a = t < 1.1 ? 1 : Math.max(0, 1 - (t - 1.1) * 2); if (a > 0) for (let k = 0; k < L.strokes.length; k++) { const pts = strokePts(b, k); if (L.strokes[k]!.dot) dot(pts[0]!, lw * 0.6, '#ffffff', a); else line(pts, lw, '#ffffff', a); } }
        if (next >= 0 && (g === 'arrow' || g === 'dots' || walk || (tuning.free && prog.dx !== null))) {
          const p = strokePts(b, next), pulse = 1 + Math.sin(now / 180) * 0.15;
          dot(p[0]!, s * 0.17 * pulse, '#000000', 0.35); dot(p[0]!, s * 0.14 * pulse, walk ? '#ffd23f' : '#2fd36b');
          if (g === 'arrow' && p.length > 6) {
            const head = p.slice(0, Math.min(p.length, 18)), a = head.at(-1)!, a0 = head.at(-4)!, ang = Math.atan2(a[1] - a0[1], a[0] - a0[0]);
            line(head.slice(3), s * 0.07, '#ffd23f');
            c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(X(a[0]) + Math.cos(ang) * s * 0.16, Y(a[1]) + Math.sin(ang) * s * 0.16);
            c.lineTo(X(a[0]) + Math.cos(ang + 2.4) * s * 0.14, Y(a[1]) + Math.sin(ang + 2.4) * s * 0.14); c.lineTo(X(a[0]) + Math.cos(ang - 2.4) * s * 0.14, Y(a[1]) + Math.sin(ang - 2.4) * s * 0.14); c.fill();
          }
        }
      }
      // the plane's smoke from a lesson, to trace over
      for (const gd of lesson.guide.value) { if (gd.box !== b) continue; const pts = strokePts(gd.box, gd.stroke); if (st.boxes[gd.box]!.L.strokes[gd.stroke]!.dot) dot(pts[0]!, lw * 0.9, '#fff3b0', 0.8); else line(pts, lw * 1.6, '#fff3b0', 0.55); }
      // his smoke
      st.smoke.forEach((sm, i) => { line(sm.pts, lw * 1.9, smokeAt(i), 0.3); line(sm.pts, lw, smokeAt(i)); if (sm.pts.length === 1) dot(sm.pts[0]!, lw * 0.7, smokeAt(i)); });
      const live = writing();
      if (live) { line(live, lw * 1.9, smokeAt(st.smoke.length), 0.3); line(live, lw, smokeAt(st.smoke.length)); if (live.length === 1) dot(live[0]!, lw * 0.6, smokeAt(0)); }
      st.rubbed = st.rubbed.filter(r => now - r.t < 600);
      for (const r of st.rubbed) { const a = 1 - (now - r.t) / 600; line(r.pts, lw * (1 + (1 - a) * 2), '#ffffff', a * 0.6); }
      // the plane flying a stroke
      const fly = lesson.fly.value;
      if (fly && st.boxes[fly.box]) {
        // a stroke that starts by pushing back up what was drawn ("Push up.", "Back up and over.") is flown from where the last one ended
        const fb = st.boxes[fly.box]!, fdx = fb.left + dxOf(fly.box), lead = leadIn(fb.L, fly.stroke).map(([x, y]) => [x + fdx, y] as Pt);
        const pts = [...lead, ...strokePts(fly.box, fly.stroke)], u = Math.min(1, (now - fly.from) / fly.ms), n = Math.max(1, Math.round(u * (pts.length - 1)));
        if (pts.length > 1) { line(pts.slice(0, n + 1), lw * 1.6, '#fff3b0', 0.85); } else dot(pts[0]!, lw * 0.9 * u, '#fff3b0');
        const at = pts[Math.min(pts.length - 1, n)]!, prev = pts[Math.max(0, n - 2)]!, ang = pts.length > 1 ? Math.atan2(at[1] - prev[1], at[0] - prev[0]) : 0;
        c.save(); c.translate(X(at[0]), Y(at[1])); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1); drawPlane(c, look, s * 0.0042, now / 1000); c.restore();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // a lesson's first fly-by is a whoosh
  useEffect(() => lesson.fly.subscribe(f => { if (f) sWhoosh(0.4); }), []);
  void voice; void startOf;
  return <canvas ref={canvas} class="sw-pad" aria-label={`Write ${chars.join('')}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />;
}
