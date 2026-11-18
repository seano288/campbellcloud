// His plane, drawn in code from what's fitted: the plane's own shape, its paint (and pattern), the propeller, and the pilot in the
// cockpit. Side view, facing right, centred on (0, 0), about 120 units nose to tail at px = 1. The same drawing is used at the Airfield,
// in the Show (rotated to the way it flies), on the Wall and in the icon, so the plane he builds is the one that flies.
import { PAINTS, PILOTS, PROPS, type PaintId, type PilotId, type PlaneId } from '../airfield/parts';

export interface Look { plane: PlaneId; paint: PaintId; prop: string; pilot: PilotId }
export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const INK = '#14161c';

const paintOf = (id: PaintId) => PAINTS.find(p => p.id === id) ?? PAINTS[0];
const propOf = (id: string) => PROPS.find(p => p.id === id) ?? PROPS[0];
const pilotOf = (id: PilotId) => PILOTS.find(p => p.id === id) ?? PILOTS[0];

/** Which planes have a propeller at the nose. */
const PROP_NOSE: Partial<Record<PlaneId, number>> = { biplane: 62, glider: 58, paper: 0, seaplane: 60, racer: 66, triplane: 60, twin: 0 };
/** Which have a flame behind. */
const FLAME: Partial<Record<PlaneId, number>> = { jet: -62, rocket: -60, shuttle: -64 };

function outline(c: CanvasRenderingContext2D, w = 5) { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function fill(c: CanvasRenderingContext2D, color: string, w = 5) { c.fillStyle = color; c.fill(); outline(c, w); }

/** The fuselage outline for each plane (its pattern is clipped inside it). */
function body(c: CanvasRenderingContext2D, plane: PlaneId) {
  c.beginPath();
  switch (plane) {
    case 'paper': c.moveTo(70, 0); c.lineTo(-60, -26); c.lineTo(-40, 2); c.lineTo(-60, 22); c.closePath(); return;
    case 'saucer': c.ellipse(0, 6, 64, 18, 0, 0, Math.PI * 2); return;
    case 'rocket': c.moveTo(70, 0); c.quadraticCurveTo(50, -20, 10, -20); c.lineTo(-56, -18); c.lineTo(-56, 18); c.lineTo(10, 20); c.quadraticCurveTo(50, 20, 70, 0); return;
    case 'shuttle': c.moveTo(68, 4); c.quadraticCurveTo(60, -16, 30, -18); c.lineTo(-58, -16); c.lineTo(-62, 16); c.lineTo(40, 16); c.quadraticCurveTo(64, 14, 68, 4); return;
    case 'jet': c.moveTo(72, 2); c.quadraticCurveTo(50, -16, 10, -14); c.lineTo(-58, -10); c.lineTo(-58, 12); c.lineTo(20, 14); c.quadraticCurveTo(56, 12, 72, 2); return;
    case 'racer': c.moveTo(62, 0); c.quadraticCurveTo(56, -16, 20, -15); c.lineTo(-56, -6); c.lineTo(-56, 8); c.lineTo(20, 15); c.quadraticCurveTo(56, 14, 62, 0); return;
    case 'dragon': c.ellipse(-4, 4, 46, 20, 0, 0, Math.PI * 2); return;
    case 'glider': c.moveTo(60, 2); c.quadraticCurveTo(50, -12, 20, -11); c.lineTo(-58, -4); c.lineTo(-58, 6); c.lineTo(20, 13); c.quadraticCurveTo(50, 14, 60, 2); return;
    default: c.moveTo(58, 0); c.quadraticCurveTo(54, -18, 24, -18); c.lineTo(-54, -8); c.lineTo(-56, 8); c.lineTo(24, 18); c.quadraticCurveTo(54, 18, 58, 0); return;
  }
}

function pattern(c: CanvasRenderingContext2D, kind: string, trim: string) {
  c.fillStyle = trim; c.strokeStyle = trim;
  if (kind === 'stripes') { c.fillRect(-70, -6, 150, 5); c.fillRect(-70, 4, 150, 5); }
  if (kind === 'checks') for (let x = -70; x < 80; x += 12) for (let y = -24; y < 24; y += 12) if (((x + y) / 12) % 2 === 0) c.fillRect(x, y, 12, 12);
  if (kind === 'stars') { c.font = `14px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (const [x, y] of [[-34, -4], [-6, 6], [22, -6], [-48, 8]]) c.fillText('★', x!, y!); }
  if (kind === 'flames') { c.beginPath(); c.moveTo(60, 0); for (let i = 0; i < 5; i++) { c.lineTo(30 - i * 18, -12 + (i % 2) * 6); c.lineTo(20 - i * 18, 0); } c.lineTo(60, 10); c.closePath(); c.fill(); }
  if (kind === 'lightning') { c.beginPath(); c.moveTo(-50, -10); c.lineTo(-10, -2); c.lineTo(-20, 4); c.lineTo(30, 10); c.lineTo(-4, 8); c.lineTo(4, 2); c.closePath(); c.fill(); }
}

function wing(c: CanvasRenderingContext2D, x: number, y: number, len: number, color: string, thick = 9) {
  c.beginPath(); c.roundRect(x - len / 2, y - thick / 2, len, thick, thick / 2); fill(c, color, 4);
}

function propeller(c: CanvasRenderingContext2D, x: number, y: number, prop: string, t: number, r = 26) {
  const p = propOf(prop), spin = t * 40;
  c.save(); c.translate(x, y);
  c.globalAlpha = 0.25; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 0, 4, r, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  for (let b = 0; b < p.blades; b++) {
    const a = spin + (b * Math.PI * 2) / p.blades, h = Math.cos(a) * r;
    c.strokeStyle = p.color === 'rainbow' ? `hsl(${(b * 360) / p.blades + t * 200} 90% 55%)` : p.color;
    c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 3, h); c.stroke();
  }
  c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); fill(c, '#f4f6f8', 3);
  c.restore();
}

function flame(c: CanvasRenderingContext2D, x: number, t: number) {
  const f = 1 + Math.sin(t * 30) * 0.15;
  c.beginPath(); c.moveTo(x, -10); c.quadraticCurveTo(x - 30 * f, 0, x, 10); c.closePath(); c.fillStyle = '#ffb000'; c.fill();
  c.beginPath(); c.moveTo(x, -5); c.quadraticCurveTo(x - 16 * f, 0, x, 5); c.closePath(); c.fillStyle = '#fff3b0'; c.fill();
}

/** Draws the plane at the current transform. `roll`: 0 to 1 through a roll (it squashes and flips); `t` spins the propeller. */
export function drawPlane(c: CanvasRenderingContext2D, look: Look, px = 1, t = 0, roll = 0) {
  const paint = paintOf(look.paint), plane = look.plane;
  c.save();
  c.scale(px, px * (roll ? Math.cos(roll * Math.PI * 2) : 1));
  const flap = Math.sin(t * 8);
  // behind the body: the far wing, the tail fin
  if (plane === 'dragon') {
    c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-20, -50 - flap * 30, 20, -60 - flap * 30); c.quadraticCurveTo(10, -24, 20, -6); c.closePath(); fill(c, paint.trim);
    c.beginPath(); c.moveTo(-46, 2); c.quadraticCurveTo(-80, -10, -92, 14); c.lineTo(-80, 10); c.lineTo(-44, 14); c.closePath(); fill(c, paint.body);
  } else if (plane === 'saucer') {
    c.beginPath(); c.ellipse(0, -8, 30, 24, 0, Math.PI, 0); fill(c, '#bfe8ff');
  } else if (plane !== 'paper') {
    c.beginPath(); c.moveTo(-40, -6); c.lineTo(-56, -36); c.lineTo(-44, -36); c.lineTo(-24, -8); c.closePath(); fill(c, paint.trim);
  }
  if (plane === 'biplane' || plane === 'triplane') { c.beginPath(); c.moveTo(4, -32); c.lineTo(10, 18); c.moveTo(32, -32); c.lineTo(34, 18); outline(c, 4); }
  if (plane === 'biplane') wing(c, 18, -34, 66, paint.trim);
  if (plane === 'triplane') { wing(c, 18, -34, 60, paint.trim); wing(c, 20, -8, 56, paint.trim); }
  // the body, its pattern clipped inside
  body(c, plane);
  c.fillStyle = paint.body; c.fill();
  c.save(); body(c, plane); c.clip(); pattern(c, paint.pattern, paint.trim); c.restore();
  body(c, plane); outline(c);
  // cockpit and pilot
  const pilot = pilotOf(look.pilot).pic, seat = plane === 'saucer' ? [0, -14] : plane === 'paper' ? [10, -12] : plane === 'dragon' ? [-6, -18] : [6, -18];
  c.font = `26px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(pilot, seat[0]!, seat[1]!);
  if (plane !== 'saucer' && plane !== 'dragon' && plane !== 'paper') { c.beginPath(); c.moveTo(-8, -16); c.quadraticCurveTo(6, -40, 24, -16); outline(c, 4); }
  // the near wing and the rest
  if (plane === 'paper') { c.beginPath(); c.moveTo(70, 0); c.lineTo(-40, 2); outline(c, 3); }
  else if (plane === 'saucer') { for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 22, 12, 4, 0, Math.PI * 2); c.fillStyle = Math.sin(t * 6 + i) > 0 ? '#ffd23f' : '#ff5a4f'; c.fill(); } }
  else if (plane === 'dragon') {
    c.beginPath(); c.moveTo(36, -6); c.quadraticCurveTo(56, -30, 72, -18); c.quadraticCurveTo(80, -6, 64, 4); c.quadraticCurveTo(48, 10, 36, 6); c.closePath(); fill(c, paint.body);
    c.beginPath(); c.arc(64, -14, 3, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(10, -40 + flap * 34, 46, -44 + flap * 40); c.quadraticCurveTo(30, -14, 34, 4); c.closePath(); fill(c, paint.trim);
  } else if (plane === 'jet' || plane === 'shuttle') { c.beginPath(); c.moveTo(10, 4); c.lineTo(-30, 30); c.lineTo(-44, 30); c.lineTo(-20, 4); c.closePath(); fill(c, paint.trim); }
  else if (plane === 'rocket') { c.beginPath(); c.moveTo(-20, 10); c.lineTo(-50, 34); c.lineTo(-56, 18); c.closePath(); fill(c, paint.trim); }
  else if (plane === 'glider') wing(c, 6, 2, 104, paint.trim, 8);
  else wing(c, 16, 6, plane === 'racer' ? 56 : 66, paint.trim);
  if (plane === 'seaplane') { c.beginPath(); c.moveTo(0, 14); c.lineTo(-6, 30); c.moveTo(30, 14); c.lineTo(34, 30); outline(c, 4); c.beginPath(); c.roundRect(-24, 28, 74, 11, 6); fill(c, '#f4f6f8', 4); }
  if (plane === 'twin') { for (const y of [-2]) { c.beginPath(); c.roundRect(20, y - 6, 34, 16, 8); fill(c, paint.trim, 4); propeller(c, 56, y + 2, look.prop, t, 18); } }
  const nose = PROP_NOSE[plane];
  if (nose) propeller(c, nose, 0, look.prop, t);
  const fl = FLAME[plane];
  if (fl) flame(c, fl, t);
  c.restore();
}

/** The plane as an SVG-free picture on its own small canvas. */
export function paintPlaneCanvas(cv: HTMLCanvasElement, look: Look, t = 0) {
  const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(box.width * dpr)); cv.height = Math.max(1, Math.round(box.height * dpr));
  const c = cv.getContext('2d')!;
  c.clearRect(0, 0, cv.width, cv.height);
  const px = Math.min(cv.width / 190, cv.height / 110);
  c.save(); c.translate(cv.width / 2, cv.height * 0.55); drawPlane(c, look, px, t); c.restore();
}
