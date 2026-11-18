// Every animal drawn in code, friendly rather than frightening: round bodies, big round eyes with a white shine, a little smile, and
// any teeth as soft rounded nubs. Each is drawn about its middle, facing right, about 100 units wide, in the family look's thick dark
// outline. The Dive draws each one once into a picture (sprite) at the size it needs and stamps that every frame.
import type { Animal, Art } from '../sea/animals';

const INK = '#141414';
type C = CanvasRenderingContext2D;

function blob(ctx: C, fill: string, path: () => void, lw = 4) {
  ctx.beginPath(); path();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
const ellipse = (ctx: C, x: number, y: number, rx: number, ry: number, rot = 0) => ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);

/** A kind eye: white, a big dark pupil looking a little forward, and a shine. */
function eye(ctx: C, x: number, y: number, r: number, look = 0.25) {
  blob(ctx, '#fff', () => ellipse(ctx, x, y, r, r), Math.max(2, r * 0.32));
  ctx.beginPath(); ellipse(ctx, x + r * look, y + r * 0.08, r * 0.6, r * 0.62); ctx.fillStyle = '#1b1530'; ctx.fill();
  ctx.beginPath(); ellipse(ctx, x + r * look - r * 0.22, y - r * 0.22, r * 0.22, r * 0.22); ctx.fillStyle = '#fff'; ctx.fill();
}
function smile(ctx: C, x: number, y: number, w: number) {
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y);
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
}
function cheek(ctx: C, x: number, y: number, r: number) {
  ctx.beginPath(); ellipse(ctx, x, y, r, r * 0.6); ctx.fillStyle = '#ff7a9a66'; ctx.fill();
}
function dots(ctx: C, pts: readonly [number, number][], r: number, fill: string) {
  for (const [x, y] of pts) { ctx.beginPath(); ellipse(ctx, x, y, r, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(); }
}
function lines(ctx: C, segs: readonly [number, number, number, number][], color = INK, w = 3) {
  ctx.beginPath(); for (const [a, b, c, d] of segs) { ctx.moveTo(a, b); ctx.lineTo(c, d); }
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
}

// ---------- the anglerfish: the parent sees this one first ----------

/** Round and plum-coloured, with a big gentle smile, soft rounded teeth, kind eyes and its glowing lure bobbing on a stalk. */
function angler(ctx: C, a: Art, t: number) {
  const bob = Math.sin(t * 2.4) * 3;
  // the lure's stalk, from the top of the head forward and up, and the glowing bulb
  ctx.beginPath(); ctx.moveTo(4, -30); ctx.quadraticCurveTo(10, -66, 36, -58 + bob);
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = a.body; ctx.stroke();
  // tail and fins
  blob(ctx, a.body, () => { ctx.moveTo(-34, 0); ctx.lineTo(-58, -20); ctx.quadraticCurveTo(-52, 0, -58, 20); ctx.closePath(); });
  blob(ctx, a.body, () => { ctx.moveTo(-14, -30); ctx.quadraticCurveTo(-6, -44, 2, -32); ctx.closePath(); });
  // the body
  blob(ctx, a.body, () => ellipse(ctx, 0, 0, 40, 33));
  ctx.beginPath(); ellipse(ctx, -6, 14, 26, 14); ctx.fillStyle = '#ffffff1f'; ctx.fill();
  // the mouth: a wide smile, open a little, with rounded teeth like little pebbles
  blob(ctx, '#2a1530', () => { ctx.moveTo(10, 6); ctx.quadraticCurveTo(28, 26, 42, 4); ctx.quadraticCurveTo(28, 12, 10, 6); });
  for (const [x, y] of [[17, 10], [24, 14], [31, 13], [37, 8]] as const) blob(ctx, '#fffbe8', () => ellipse(ctx, x, y, 2.6, 3.2), 1.5);
  // a side fin and the eye, big and kind, looking up at its lure
  blob(ctx, a.accent === '#ffe95a' ? '#7a6aa0' : a.accent, () => { ctx.moveTo(-8, 6); ctx.quadraticCurveTo(-24, 18, -12, 22); ctx.closePath(); }, 3);
  eye(ctx, 14, -12, 10, 0.35);
  cheek(ctx, 4, 4, 6);
  // the lure: its own light
  blob(ctx, a.accent, () => ellipse(ctx, 37, -58 + bob, 8, 8), 3);
  ctx.beginPath(); ellipse(ctx, 35, -60 + bob, 3, 3); ctx.fillStyle = '#fff'; ctx.fill();
}

// ---------- fish of every shape ----------

function fish(ctx: C, a: Art, t: number) {
  const f = a.form ?? 'round', wag = Math.sin(t * 6) * 3;
  const size = { round: [38, 28], tall: [32, 36], long: [46, 18], thin: [44, 12], sword: [44, 18], tadpole: [40, 22], tripod: [42, 15], rattail: [26, 20], viper: [44, 19], loosejaw: [44, 17], flashlight: [36, 26], hatchet: [30, 32] }[f] ?? [38, 28];
  const [rx, ry] = size as [number, number];
  // a hatchetfish is deep in the belly and thin at the tail, like the blade of a hatchet; the rest are ovals
  const shape = f === 'hatchet'
    ? () => { ctx.moveTo(-rx, -ry * 0.25); ctx.quadraticCurveTo(0, -ry * 1.05, rx, -ry * 0.45); ctx.quadraticCurveTo(rx * 1.1, ry * 0.2, rx * 0.5, ry * 0.75); ctx.quadraticCurveTo(-rx * 0.1, ry * 1.25, -rx * 0.75, ry * 0.25); ctx.closePath(); }
    : () => ellipse(ctx, 0, 0, rx, ry);
  // the tail
  if (f === 'rattail' || f === 'tadpole') {
    blob(ctx, a.body, () => { ctx.moveTo(-rx * 0.4, -ry * 0.7); ctx.quadraticCurveTo(-rx * 2, -2 + wag, -rx * 2.4, wag); ctx.quadraticCurveTo(-rx * 2, 2 + wag, -rx * 0.4, ry * 0.7); ctx.closePath(); });
  } else {
    blob(ctx, a.accent === '#ffffff' ? a.body : a.body, () => { ctx.moveTo(-rx + 6, 0); ctx.lineTo(-rx - 22, -ry * 0.75 + wag); ctx.quadraticCurveTo(-rx - 14, wag, -rx - 22, ry * 0.75 + wag); ctx.closePath(); });
  }
  // the top fin
  if (a.spines) {
    for (let i = 0; i < 6; i++) { const x = -rx * 0.6 + i * rx * 0.25; lines(ctx, [[x, -ry * 0.8, x - 6 + i, -ry - 18 + Math.abs(i - 3) * 3]], INK, 5); lines(ctx, [[x, -ry * 0.8, x - 6 + i, -ry - 18 + Math.abs(i - 3) * 3]], a.accent, 2.5); }
  } else {
    blob(ctx, a.body, () => { ctx.moveTo(-rx * 0.5, -ry * 0.85); ctx.quadraticCurveTo(-rx * 0.1, -ry - 16, rx * 0.25, -ry * 0.9); ctx.closePath(); });
  }
  if (f === 'viper') { // a long spine on its back with a light at the tip
    ctx.beginPath(); ctx.moveTo(-rx * 0.35, -ry * 0.9); ctx.quadraticCurveTo(-rx * 0.2, -ry - 26, rx * 0.25, -ry - 22);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = a.body; ctx.stroke();
    blob(ctx, a.accent, () => ellipse(ctx, rx * 0.25 + 2, -ry - 22, 4.5, 4.5), 2);
  }
  if (f === 'tripod') { // three long fins to stand on
    lines(ctx, [[-10, ry * 0.6, -30, ry + 44], [10, ry * 0.6, 4, ry + 46], [-rx - 4, 0, -rx - 30, ry + 40]], INK, 5);
    lines(ctx, [[-10, ry * 0.6, -30, ry + 44], [10, ry * 0.6, 4, ry + 46], [-rx - 4, 0, -rx - 30, ry + 40]], a.accent, 2.5);
  }
  // the body
  blob(ctx, a.body, shape);
  ctx.save(); ctx.beginPath(); shape(); ctx.clip();
  ctx.beginPath(); ellipse(ctx, -4, ry * 0.55, rx * 0.8, ry * 0.45); ctx.fillStyle = '#ffffff2a'; ctx.fill();
  if (a.stripes) for (const x of [-rx * 0.45, rx * 0.15]) { ctx.beginPath(); ctx.rect(x - 5, -ry, 10, ry * 2); ctx.fillStyle = a.accent; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); }
  if (a.spots) dots(ctx, [[-rx * 0.5, -ry * 0.3], [-rx * 0.15, ry * 0.25], [-rx * 0.3, ry * 0.5], [rx * 0.05, -ry * 0.45], [-rx * 0.65, ry * 0.1]], Math.max(2.5, ry * 0.13), a.accent);
  ctx.restore();
  if (f === 'sword') blob(ctx, a.accent, () => { ctx.moveTo(rx - 6, -4); ctx.lineTo(rx + 40, -1); ctx.lineTo(rx - 4, 4); ctx.closePath(); }, 3);
  // a side fin
  blob(ctx, a.body, () => { ctx.moveTo(-2, ry * 0.1); ctx.quadraticCurveTo(-16, ry * 0.5 + wag * 0.5, -6, ry * 0.65); ctx.closePath(); }, 3);
  // its lights, in a row along the belly
  if (a.lights) dots(ctx, Array.from({ length: 5 }, (_, i) => [-rx * 0.6 + i * rx * 0.3, ry * 0.62] as [number, number]), Math.max(2, ry * 0.12), a.accent);
  // the face
  const ex = rx * 0.55, ey = -ry * 0.25, er = Math.max(5, Math.min(11, ry * 0.42));
  // a light of its own under the eye: the flashlight fish's big bean, the loosejaw's red lamp (and a little blue one behind it)
  if (f === 'flashlight' || f === 'loosejaw') {
    const lx = ex - er * 0.2, ly = ey + er * 1.55, big = f === 'flashlight';
    if (!big) blob(ctx, '#7ad8ff', () => ellipse(ctx, lx - er * 1.5, ly + 1, er * 0.42, er * 0.42), 2);
    blob(ctx, a.accent, () => ellipse(ctx, lx, ly, er * (big ? 1.05 : 0.9), er * (big ? 0.62 : 0.62), -0.15), 2.5);
    ctx.beginPath(); ellipse(ctx, lx - er * 0.3, ly - er * 0.18, er * 0.25, er * 0.16, -0.15); ctx.fillStyle = '#fff'; ctx.fill();
  }
  // a viperfish's big lower jaw, its long teeth soft and rounded like a smiling walrus's; a loosejaw's jaw hangs open on its hinge
  if (f === 'viper') {
    blob(ctx, a.body, () => { ctx.moveTo(rx * 0.35, ry * 0.3); ctx.quadraticCurveTo(rx * 0.8, ry * 1.05, rx + 4, ry * 0.2); ctx.closePath(); }, 3);
    for (const [x, h] of [[rx * 0.8, 17], [rx * 0.97, 14]] as const) blob(ctx, '#fffbe8', () => { ctx.moveTo(x - 3.2, ry * 0.55); ctx.lineTo(x - 3.2, ry * 0.55 - h + 3.2); ctx.arc(x, ry * 0.55 - h + 3.2, 3.2, Math.PI, 0); ctx.lineTo(x + 3.2, ry * 0.55); ctx.closePath(); }, 2);
  }

  if (a.see) { // a see-through head, eyes looking up through it
    ctx.beginPath(); ellipse(ctx, ex - 2, -ry * 0.45, er * 1.7, er * 1.5); ctx.fillStyle = '#bff6ff55'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffffaa'; ctx.stroke();
    eye(ctx, ex - 2, -ry * 0.35, er * 0.9, 0); ctx.beginPath(); ellipse(ctx, ex - 2, -ry * 0.35 - er * 0.3, er * 0.45, er * 0.45); ctx.fillStyle = '#1b1530'; ctx.fill();
  } else eye(ctx, ex, ey, er);
  smile(ctx, rx * 0.72, ry * 0.25, Math.max(4, ry * 0.2));
  if (a.teeth && f !== 'viper') for (const [x, y] of [[rx * 0.78, ry * 0.05], [rx * 0.9, ry * 0.12]] as const) blob(ctx, '#fffbe8', () => { ctx.moveTo(x - 2.5, y); ctx.quadraticCurveTo(x, y - 12, x + 2.5, y); ctx.closePath(); }, 1.5);
}

// ---------- the rest of the sea ----------

function eel(ctx: C, a: Art, t: number) {
  const w = Math.sin(t * 3) * 6, gulper = a.form === 'gulper';
  ctx.beginPath(); ctx.moveTo(30, 0); ctx.bezierCurveTo(0, -14 + w, -30, 14 - w, -64, w);
  ctx.lineWidth = gulper ? 14 : 22; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = gulper ? 8 : 15; ctx.strokeStyle = a.body; ctx.stroke();
  if (gulper) { // a huge pouch of a mouth, shut in a long grin, and a pink light at the tip of its whip of a tail
    blob(ctx, a.body, () => { ctx.moveTo(8, -8); ctx.quadraticCurveTo(26, -34, 56, -16); ctx.quadraticCurveTo(66, -6, 60, 4); ctx.quadraticCurveTo(52, 34, 22, 22); ctx.quadraticCurveTo(8, 14, 8, -8); ctx.closePath(); });
    ctx.save(); ctx.beginPath(); ctx.moveTo(8, -8); ctx.quadraticCurveTo(26, -34, 56, -16); ctx.quadraticCurveTo(66, -6, 60, 4); ctx.quadraticCurveTo(52, 34, 22, 22); ctx.quadraticCurveTo(8, 14, 8, -8); ctx.clip();
    ctx.beginPath(); ellipse(ctx, 38, 20, 26, 12); ctx.fillStyle = '#ff9ad866'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.quadraticCurveTo(44, 12, 61, 0); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
    blob(ctx, a.accent, () => ellipse(ctx, -66, w, 6, 6), 2);
    ctx.beginPath(); ellipse(ctx, -67.5, w - 1.5, 2, 2); ctx.fillStyle = '#fff'; ctx.fill();
    eye(ctx, 30, -14, 7, 0.3); cheek(ctx, 22, 4, 5);
  } else {
    blob(ctx, a.body, () => ellipse(ctx, 32, 0, 18, 13));
    eye(ctx, 38, -5, 6); smile(ctx, 44, 5, 4);
  }
}

function jelly(ctx: C, a: Art, t: number) {
  const f = a.form ?? 'bell', pulse = 1 + Math.sin(t * 3) * 0.05, w = f === 'wide' ? 40 : f === 'phantom' ? 44 : 32;
  // tentacles or arms
  if (f === 'phantom') {
    for (const x of [-26, -8, 10, 26]) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.bezierCurveTo(x - 10, 40, x + 14, 60 + Math.sin(t * 2 + x) * 6, x, 90); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = a.accent; ctx.stroke(); }
  } else {
    for (let i = 0; i < 6; i++) { const x = -w * 0.7 + i * w * 0.28; ctx.beginPath(); ctx.moveTo(x, 4); ctx.bezierCurveTo(x - 8, 24, x + 8, 40 + Math.sin(t * 3 + i) * 5, x, 58); ctx.lineWidth = 3; ctx.strokeStyle = a.accent; ctx.stroke(); }
  }
  ctx.save(); ctx.scale(pulse, 1 / pulse);
  blob(ctx, a.body + (f === 'wide' || f === 'bell' ? 'dd' : ''), () => { ctx.moveTo(-w, 6); ctx.bezierCurveTo(-w, -w * 1.1, w, -w * 1.1, w, 6); ctx.quadraticCurveTo(0, 14, -w, 6); });
  if (f === 'crown') for (let i = 0; i < 7; i++) dots(ctx, [[-w * 0.8 + i * w * 0.27, 4]], 3, a.accent);
  if (f === 'wide') { ctx.beginPath(); ctx.moveTo(-w + 4, 4); ctx.quadraticCurveTo(0, 12, w - 4, 4); ctx.lineWidth = 4; ctx.strokeStyle = a.accent; ctx.stroke(); }
  ctx.restore();
  eye(ctx, -9, -12, 5, 0); eye(ctx, 9, -12, 5, 0); smile(ctx, 0, -3, 4);
}

function comb(ctx: C, a: Art, t: number) {
  blob(ctx, a.body + 'cc', () => ellipse(ctx, 0, 0, 26, 36));
  const rainbow = ['#ff4a4a', '#ffb02e', '#ffe95a', '#5aff9a', '#4fb8ff', '#9a5aff'];
  for (let i = 0; i < 6; i++) {
    const x = -16 + i * 6.4, shift = Math.floor(t * 8 + i) % rainbow.length;
    ctx.beginPath(); ctx.moveTo(x, -30 + Math.abs(i - 2.5) * 3); ctx.quadraticCurveTo(x * 1.25, 0, x, 30 - Math.abs(i - 2.5) * 3);
    ctx.setLineDash([3, 3]); ctx.lineWidth = 3; ctx.strokeStyle = rainbow[shift]!; ctx.stroke(); ctx.setLineDash([]);
  }
  eye(ctx, -8, -8, 5, 0); eye(ctx, 8, -8, 5, 0); smile(ctx, 0, 4, 4);
}

function squid(ctx: C, a: Art, t: number) {
  const bob = a.form === 'bob', long = a.form === 'long', wig = Math.sin(t * 4) * 4, s = long ? 1.2 : 1;
  ctx.save(); ctx.scale(s, s);
  // arms reaching forward
  for (let i = 0; i < 5; i++) { const y = -10 + i * 5; ctx.beginPath(); ctx.moveTo(14, y * 0.6); ctx.bezierCurveTo(30, y, 40, y + wig, 52 + (i % 2) * 6, y * 1.4 + wig); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = a.body; ctx.stroke(); }
  if (bob) blob(ctx, a.body, () => ellipse(ctx, -2, 0, 22, 18));
  else {
    blob(ctx, a.body, () => { ctx.moveTo(-50, 0); ctx.lineTo(-62, -14); ctx.lineTo(-42, -8); ctx.closePath(); ctx.moveTo(-50, 0); ctx.lineTo(-62, 14); ctx.lineTo(-42, 8); ctx.closePath(); });
    blob(ctx, a.body, () => { ctx.moveTo(18, -14); ctx.quadraticCurveTo(-30, -18, -52, 0); ctx.quadraticCurveTo(-30, 18, 18, 14); ctx.closePath(); });
  }
  if (bob) blob(ctx, a.body, () => { ellipse(ctx, -16, -12, 8, 5, -0.5); }, 3);
  if (a.lights) dots(ctx, [[-30, -4], [-18, 6], [-6, -6], [-38, 6]], 2.5, a.accent);
  ctx.restore();
  eye(ctx, 8 * s, -4, long ? 12 : 7, 0.3);
  smile(ctx, 10 * s, long ? 13 : 7, long ? 5 : 3.5); cheek(ctx, 0, long ? 8 : 5, long ? 5 : 4);
}

function octopus(ctx: C, a: Art, t: number) {
  const dumbo = a.form === 'dumbo', vampire = a.form === 'vampire';
  if (vampire) { // the cape of skin between its arms, scalloped at the edge
    blob(ctx, a.body, () => { ctx.moveTo(-28, 4); ctx.quadraticCurveTo(-40, 30, -34, 44); for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(-27 + i * 15, 34 + Math.sin(t * 3 + i) * 2, -20 + i * 15, 46); ctx.quadraticCurveTo(40, 30, 28, 4); ctx.closePath(); });
    ctx.beginPath(); ctx.moveTo(-26, 12); ctx.quadraticCurveTo(0, 30, 26, 12); ctx.lineTo(30, 40); ctx.lineTo(-30, 40); ctx.closePath(); ctx.fillStyle = '#0000002a'; ctx.fill();
    for (const s of [-1, 1]) blob(ctx, a.body, () => ellipse(ctx, s * 22, -30, 10, 6, s * 0.7), 3);
  }
  for (let i = 0; i < 6; i++) {
    const x = -24 + i * 9.6, w = Math.sin(t * 3 + i) * 6;
    ctx.beginPath(); ctx.moveTo(x, 6); ctx.bezierCurveTo(x - 6, 28, x + 10 + w, 34, x + 6 + w, 46);
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = a.body; ctx.stroke();
  }
  if (dumbo) for (const s of [-1, 1]) blob(ctx, a.accent, () => ellipse(ctx, s * 30, -22 + Math.sin(t * 4) * 3, 14, 9, s * 0.5), 3);
  blob(ctx, a.body, () => { ctx.moveTo(-28, 10); ctx.bezierCurveTo(-34, -44, 34, -44, 28, 10); ctx.quadraticCurveTo(0, 18, -28, 10); });
  if (a.lights) dots(ctx, [[-18, -24], [18, -24]], 3, a.accent);
  dots(ctx, [[-12, -26], [6, -30], [14, -16]], 2.5, a.accent);
  eye(ctx, -9, -6, 7, 0.1); eye(ctx, 9, -6, 7, 0.1); smile(ctx, 0, 4, 5);
}

function crab(ctx: C, a: Art, t: number) {
  const yeti = a.form === 'yeti', snap = Math.sin(t * 5) * 0.15;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) lines(ctx, [[s * 14, 6 + i * 4, s * (34 + i * 3), 22 + i * 6]], INK, 5);
    ctx.save(); ctx.translate(s * 30, -16); ctx.rotate(s * snap);
    blob(ctx, a.body, () => ellipse(ctx, 0, 0, 12, 9));
    if (yeti) lines(ctx, Array.from({ length: 7 }, (_, i) => [-10 + i * 3.4, 6, -12 + i * 3.4, 14] as [number, number, number, number]), a.accent, 2);
    ctx.restore();
  }
  blob(ctx, a.body, () => ellipse(ctx, 0, 4, 28, 18));
  eye(ctx, -7, -10, 6, 0); eye(ctx, 7, -10, 6, 0); smile(ctx, 0, 8, 6);
}

function shrimp(ctx: C, a: Art, t: number) {
  const kick = Math.sin(t * 8) * 4;
  lines(ctx, [[20, -6, 52, -30], [20, -4, 54, -18]], INK, 2);
  for (let i = 0; i < 4; i++) lines(ctx, [[-10 + i * 8, 10, -14 + i * 8, 20 + kick * (i % 2 ? 1 : -1)]], INK, 2.5);
  blob(ctx, a.body, () => { ctx.moveTo(24, 0); ctx.bezierCurveTo(20, -18, -24, -20, -34, 4); ctx.lineTo(-48, 16); ctx.lineTo(-30, 14); ctx.bezierCurveTo(-18, 12, 18, 14, 24, 0); });
  if (a.stripes) lines(ctx, [[-10, -14, -6, 12], [4, -14, 6, 12]], a.accent, 4);
  for (const x of [-18, -4, 8]) lines(ctx, [[x, -12, x + 2, 10]], '#0003', 1.5);
  if (a.lights) dots(ctx, [[-14, 8], [0, 9], [12, 6]], 2.5, a.accent);
  eye(ctx, 14, -6, 5.5); smile(ctx, 19, 3, 3);
}

function lobster(ctx: C, a: Art, t: number) {
  const w = Math.sin(t * 2) * 4;
  lines(ctx, [[30, -6, 76, -34 + w], [30, -2, 78, -14 + w]], INK, 5); lines(ctx, [[30, -6, 76, -34 + w], [30, -2, 78, -14 + w]], a.body, 2.5);
  for (let i = 0; i < 4; i++) lines(ctx, [[-4 + i * 9, 8, -10 + i * 9, 22]], INK, 3.5);
  blob(ctx, a.body, () => { ctx.moveTo(34, 0); ctx.bezierCurveTo(30, -18, -30, -16, -44, -2); ctx.lineTo(-60, -10); ctx.lineTo(-58, 12); ctx.lineTo(-44, 6); ctx.bezierCurveTo(-30, 14, 30, 16, 34, 0); });
  if (a.spines) for (let i = 0; i < 5; i++) blob(ctx, a.accent, () => { const x = -24 + i * 11; ctx.moveTo(x - 3, -11); ctx.lineTo(x, -18); ctx.lineTo(x + 3, -11); ctx.closePath(); }, 1.5);
  eye(ctx, 22, -8, 6); smile(ctx, 28, 3, 3.5);
}

function turtle(ctx: C, a: Art, t: number) {
  const flap = Math.sin(t * 3) * 0.3;
  for (const [x, y, r] of [[18, -18, -0.6 - flap], [18, 18, 0.6 + flap], [-24, -14, -0.4], [-24, 14, 0.4]] as const) blob(ctx, a.body, () => ellipse(ctx, x, y, 16, 7, r), 3.5);
  blob(ctx, a.body, () => ellipse(ctx, 40, -2, 14, 11));
  blob(ctx, a.accent, () => ellipse(ctx, 0, 0, 34, 24));
  ctx.beginPath(); for (const [x, y] of [[-12, -8], [12, -8], [0, 8], [-20, 8], [20, 8]] as const) { ctx.moveTo(x + 7, y); ellipse(ctx, x, y, 7, 6); }
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#0006'; ctx.stroke();
  eye(ctx, 44, -6, 5); smile(ctx, 49, 2, 3);
}

function whale(ctx: C, a: Art, t: number) {
  const big = a.form === 'big', tail = Math.sin(t * 2) * 6;
  blob(ctx, a.body, () => { ctx.moveTo(-40, 0); ctx.lineTo(-62, -16 + tail); ctx.quadraticCurveTo(-56, tail, -62, 16 + tail); ctx.closePath(); });
  if (big) blob(ctx, a.body, () => { ctx.moveTo(44, -22); ctx.lineTo(44, 14); ctx.quadraticCurveTo(0, 30, -44, 6); ctx.quadraticCurveTo(-30, -26, 44, -22); });
  else blob(ctx, a.body, () => { ellipse(ctx, 0, 0, 46, 24); });
  if (!big) blob(ctx, a.body, () => ellipse(ctx, 30, -8, 18, 16), 0.01);
  ctx.beginPath(); ellipse(ctx, 0, 12, 34, 9); ctx.fillStyle = a.accent + '88'; ctx.fill();
  blob(ctx, a.body, () => ellipse(ctx, 0, 14, 12, 5, 0.6), 3);
  if (a.spots) dots(ctx, [[-20, -10], [-6, -14], [-28, 2]], 3, a.accent);
  eye(ctx, big ? 30 : 26, -4, 5.5); smile(ctx, big ? 38 : 34, 8, 6);
}

function narwhal(ctx: C, a: Art, t: number) {
  ctx.beginPath(); ctx.moveTo(44, -8); ctx.lineTo(96, -20); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3.5; ctx.strokeStyle = a.accent; ctx.stroke();
  for (let i = 0; i < 6; i++) lines(ctx, [[50 + i * 8, -12 - i * 1.8, 52 + i * 8, -7 - i * 1.8]], '#0006', 1.5);
  whale(ctx, { ...a, form: undefined }, t);
}

function seal(ctx: C, a: Art, t: number) {
  const f = Math.sin(t * 3) * 5;
  blob(ctx, a.body, () => { ctx.moveTo(-38, 0); ctx.lineTo(-58, -12 + f); ctx.lineTo(-58, 12 + f); ctx.closePath(); });
  blob(ctx, a.body, () => ellipse(ctx, 0, 0, 44, 20));
  if (a.spots) dots(ctx, [[-16, -6], [-2, -10], [-24, 6], [8, 6]], 3, a.accent);
  blob(ctx, a.body, () => ellipse(ctx, 6, 16, 12, 5, 0.5), 3);
  lines(ctx, [[42, 2, 54, -2], [42, 4, 54, 6]], INK, 1.5);
  eye(ctx, 30, -6, 6); smile(ctx, 38, 4, 4);
}

function penguin(ctx: C, a: Art, t: number) {
  const f = Math.sin(t * 6) * 0.4;
  blob(ctx, a.body, () => ellipse(ctx, 0, 0, 40, 18));
  ctx.beginPath(); ellipse(ctx, 2, 6, 32, 10); ctx.fillStyle = '#f4f4f0'; ctx.fill();
  blob(ctx, a.body, () => ellipse(ctx, -2, 12, 16, 5, 0.4 + f), 3);
  blob(ctx, a.accent, () => ellipse(ctx, 26, -2, 7, 6), 2);
  blob(ctx, '#ff9a3a', () => { ctx.moveTo(38, -2); ctx.lineTo(52, 2); ctx.lineTo(38, 4); ctx.closePath(); }, 2);
  eye(ctx, 32, -7, 5);
}

function ray(ctx: C, a: Art, t: number) {
  const f = Math.sin(t * 2) * 8;
  lines(ctx, [[-30, 0, -80, 4]], INK, 4);
  blob(ctx, a.body, () => { ctx.moveTo(30, 0); ctx.quadraticCurveTo(0, -60 - f, -30, -2); ctx.quadraticCurveTo(0, 60 + f, 30, 0); });
  ctx.beginPath(); ellipse(ctx, 0, 0, 18, 10); ctx.fillStyle = a.accent + '55'; ctx.fill();
  blob(ctx, a.body, () => { ellipse(ctx, 32, -8, 8, 4, -0.4); }, 3); blob(ctx, a.body, () => { ellipse(ctx, 32, 8, 8, 4, 0.4); }, 3);
  eye(ctx, 18, -10, 5); eye(ctx, 18, 10, 5); smile(ctx, 26, 0, 4);
}

function seahorse(ctx: C, a: Art, t: number) {
  const s = Math.sin(t * 2) * 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-14, 30, 10, 40, 4, 50 + s); ctx.bezierCurveTo(0, 58, -12, 52, -6, 46);
  ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = a.body; ctx.stroke();
  blob(ctx, a.body, () => { ctx.moveTo(0, -40); ctx.bezierCurveTo(22, -30, 20, 10, 2, 16); ctx.bezierCurveTo(-18, 10, -16, -30, 0, -40); });
  blob(ctx, a.body, () => { ctx.moveTo(4, -38); ctx.lineTo(28, -30); ctx.lineTo(28, -24); ctx.lineTo(6, -26); ctx.closePath(); }, 3);
  blob(ctx, a.accent, () => { ctx.moveTo(-12, -10); ctx.quadraticCurveTo(-26, -4, -14, 4); ctx.closePath(); }, 2.5);
  eye(ctx, 6, -34, 5);
}

function clam(ctx: C, a: Art, t: number) {
  const open = 4 + Math.sin(t * 1.5) * 3;
  if (a.form === 'mussel') {
    blob(ctx, a.body, () => { ctx.moveTo(-30, 4); ctx.quadraticCurveTo(-10, -22, 30, -6); ctx.quadraticCurveTo(10, 18, -30, 4); });
    lines(ctx, [[-20, 2, 22, -4]], a.accent, 2);
    eye(ctx, 6, -6, 5, 0); smile(ctx, 14, 2, 3);
    return;
  }
  blob(ctx, a.body, () => { ctx.moveTo(-40, 0); for (let i = 0; i <= 8; i++) ctx.lineTo(-40 + i * 10, (i % 2 ? 8 : 0) + 4 + open); ctx.quadraticCurveTo(10, 40, -40, 4); });
  blob(ctx, a.accent, () => { ctx.moveTo(-36, 2); ctx.quadraticCurveTo(0, open + 6, 36, 2); ctx.quadraticCurveTo(0, -open + 2, -36, 2); }, 2.5);
  blob(ctx, a.body, () => { ctx.moveTo(-40, 0); for (let i = 0; i <= 8; i++) ctx.lineTo(-40 + i * 10, (i % 2 ? -8 : 0) - open); ctx.quadraticCurveTo(10, -40, -40, -4); });
  eye(ctx, -10, -18, 5, 0); eye(ctx, 10, -18, 5, 0); smile(ctx, 0, -10, 4);
}

function anemone(ctx: C, a: Art, t: number) {
  for (let i = 0; i < 11; i++) {
    const an = -Math.PI + (i / 10) * Math.PI, w = Math.sin(t * 2 + i) * 0.15;
    ctx.beginPath(); ctx.moveTo(Math.cos(an) * 14, -6 + Math.sin(an) * 6); ctx.quadraticCurveTo(Math.cos(an + w) * 30, -16 + Math.sin(an) * 30, Math.cos(an + w * 2) * 40, -10 + Math.sin(an) * 40);
    ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = a.body; ctx.stroke();
  }
  blob(ctx, a.accent, () => { ctx.moveTo(-18, -6); ctx.lineTo(-22, 30); ctx.quadraticCurveTo(0, 38, 22, 30); ctx.lineTo(18, -6); ctx.quadraticCurveTo(0, 0, -18, -6); });
  eye(ctx, -7, 10, 5, 0); eye(ctx, 7, 10, 5, 0); smile(ctx, 0, 20, 4);
}

function worm(ctx: C, a: Art, t: number) {
  if (a.form === 'tube') {
    for (const [x, h] of [[-18, 34], [2, 44], [20, 30]] as const) {
      blob(ctx, a.body, () => { ctx.rect(x - 6, -h + 30, 12, h); }, 3);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ellipse(ctx, x - 6 + i * 3, -h + 26 - Math.sin(t * 3 + i + x) * 2, 3.5, 7, (i - 2) * 0.3); ctx.fillStyle = a.accent; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(); }
    }
    eye(ctx, 2, -4, 4, 0);
    return;
  }
  blob(ctx, a.body, () => { ctx.moveTo(-36, 6); ctx.quadraticCurveTo(0, -10, 30, 0); ctx.lineTo(30, 10); ctx.quadraticCurveTo(0, 4, -36, 14); ctx.closePath(); });
  lines(ctx, Array.from({ length: 10 }, (_, i) => [-30 + i * 6, 2 - i * 0.2, -32 + i * 6, -8 + Math.sin(t * 4 + i) * 2] as [number, number, number, number]), '#ffffffcc', 2);
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ellipse(ctx, 34, -2 + i * 4, 6, 2, 0.4); ctx.fillStyle = a.accent; ctx.fill(); }
  eye(ctx, 24, 0, 4); smile(ctx, 28, 6, 2.5);
}

function snail(ctx: C, a: Art, t: number) {
  const f = a.form;
  if (f === 'angel') { // a sea angel: see-through, with an orange middle and two flapping wings
    const flap = Math.sin(t * 6) * 0.5;
    for (const s of [-1, 1]) blob(ctx, a.body + 'cc', () => ellipse(ctx, s * 18, -6, 16, 7, s * (0.4 + flap)), 2.5);
    blob(ctx, a.body + 'dd', () => { ctx.moveTo(0, -24); ctx.bezierCurveTo(16, -20, 10, 26, 0, 30); ctx.bezierCurveTo(-10, 26, -16, -20, 0, -24); });
    ctx.beginPath(); ellipse(ctx, 0, 8, 6, 10); ctx.fillStyle = a.accent; ctx.fill();
    eye(ctx, -4, -14, 3.5, 0); eye(ctx, 4, -14, 3.5, 0);
    return;
  }
  if (f === 'slug') { // a nudibranch: a soft slug with frilly tufts down its back
    blob(ctx, a.body, () => { ctx.moveTo(-40, 8); ctx.quadraticCurveTo(-10, -18, 34, -4); ctx.quadraticCurveTo(38, 12, -40, 8); });
    for (let i = 0; i < 7; i++) blob(ctx, a.accent, () => ellipse(ctx, -28 + i * 9, -8 + Math.abs(i - 3), 4, 8 + Math.sin(t * 3 + i), -0.2), 2);
    lines(ctx, [[30, -6, 38, -20], [26, -6, 30, -20]], INK, 3);
    eye(ctx, 22, -2, 4.5); smile(ctx, 27, 4, 2.5); return;
  }
  blob(ctx, a.accent, () => { ctx.moveTo(-36, 16); ctx.quadraticCurveTo(0, 10, 36, 14); ctx.quadraticCurveTo(40, 22, -36, 22); ctx.closePath(); });
  lines(ctx, [[30, 12, 40, -2], [26, 12, 32, -2]], INK, 3);
  blob(ctx, a.body, () => ellipse(ctx, -4, -4, 26, 22));
  ctx.beginPath(); ctx.arc(-4, -4, 16, 0, Math.PI * 1.6); ctx.arc(-4, -4, 8, Math.PI * 1.6, 0, true); ctx.lineWidth = 3; ctx.strokeStyle = a.accent; ctx.stroke();
  eye(ctx, 28, 6, 4.5); smile(ctx, 33, 14, 3);
}

function urchin(ctx: C, a: Art, t: number) {
  ctx.beginPath(); for (let i = 0; i < 22; i++) { const an = (i / 22) * Math.PI * 2 + Math.sin(t) * 0.04; ctx.moveTo(Math.cos(an) * 20, Math.sin(an) * 18); ctx.lineTo(Math.cos(an) * 40, Math.sin(an) * 36); }
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = a.accent; ctx.stroke();
  blob(ctx, a.body, () => ellipse(ctx, 0, 0, 24, 22));
  eye(ctx, -7, -4, 5, 0); eye(ctx, 7, -4, 5, 0); smile(ctx, 0, 7, 4);
}

function cucumber(ctx: C, a: Art, t: number) {
  const pig = a.form === 'pig';
  if (pig) for (let i = 0; i < 5; i++) lines(ctx, [[-24 + i * 12, 14, -26 + i * 12, 26 + Math.sin(t * 4 + i) * 2]], INK, 6);
  if (pig) for (let i = 0; i < 5; i++) lines(ctx, [[-24 + i * 12, 14, -26 + i * 12, 26 + Math.sin(t * 4 + i) * 2]], a.body, 3);
  if (pig) lines(ctx, [[-20, -16, -24, -32], [-8, -18, -8, -34]], INK, 4);
  blob(ctx, a.body, () => { ctx.moveTo(-40, 0); ctx.bezierCurveTo(-40, -24, 40, -24, 40, 0); ctx.bezierCurveTo(40, 20, -40, 20, -40, 0); });
  if (!pig) dots(ctx, [[-24, -8], [-10, -12], [6, -10], [20, -8], [-16, 4], [12, 4]], 3, a.accent);
  else { ctx.beginPath(); ellipse(ctx, 0, 6, 30, 6); ctx.fillStyle = a.accent + '66'; ctx.fill(); }
  eye(ctx, 26, -6, 5); smile(ctx, 32, 4, 3);
}

function isopod(ctx: C, a: Art, t: number) {
  const amph = a.form === 'amphipod';
  lines(ctx, [[34, -6, 56, -24], [34, -2, 58, -10]], INK, 2.5);
  for (let i = 0; i < 6; i++) lines(ctx, [[-26 + i * 10, 10, -30 + i * 10, 22 + Math.sin(t * 6 + i) * 2]], INK, 3);
  if (amph) blob(ctx, a.body, () => { ctx.moveTo(36, 0); ctx.bezierCurveTo(30, -26, -34, -26, -40, 6); ctx.lineTo(-52, 18); ctx.lineTo(-34, 14); ctx.bezierCurveTo(-20, 16, 30, 16, 36, 0); });
  else blob(ctx, a.body, () => ellipse(ctx, 0, 0, 40, 20));
  for (let i = 0; i < 6; i++) lines(ctx, [[-28 + i * 10, -18, -28 + i * 10, 14]], '#0004', 2);
  eye(ctx, 26, -6, 5.5); smile(ctx, 32, 5, 3);
}

function shark(ctx: C, a: Art, t: number) {
  const tail = Math.sin(t * 2.5) * 5;
  blob(ctx, a.body, () => { ctx.moveTo(-40, 0); ctx.lineTo(-64, -24 + tail); ctx.lineTo(-56, 2 + tail); ctx.lineTo(-62, 16 + tail); ctx.closePath(); });
  blob(ctx, a.body, () => { ctx.moveTo(-4, -16); ctx.lineTo(-14, -34); ctx.lineTo(10, -16); ctx.closePath(); });
  blob(ctx, a.body, () => { ctx.moveTo(52, 2); ctx.quadraticCurveTo(30, -22, -44, -2); ctx.quadraticCurveTo(0, 22, 52, 2); });
  ctx.beginPath(); ellipse(ctx, 6, 8, 34, 6); ctx.fillStyle = a.accent + '88'; ctx.fill();
  blob(ctx, a.body, () => ellipse(ctx, 6, 12, 12, 4, 0.5), 3);
  eye(ctx, 34, -4, 5); smile(ctx, 42, 6, 4);
}

const SHAPES: Record<Art['shape'], (ctx: C, a: Art, t: number) => void> = {
  fish, angler, eel, jelly, comb, squid, octopus, crab, shrimp, lobster, turtle, whale, seal, penguin, ray, seahorse, clam, anemone, worm,
  snail, urchin, cucumber, isopod, shark, narwhal,
};

/** Draws an animal centred on (0, 0), facing right, about 100 units wide, at time t (seconds) for its little movements. */
export function drawCreature(ctx: C, a: Pick<Animal, 'art'>, t = 0) {
  ctx.save();
  SHAPES[a.art.shape](ctx, a.art, t);
  ctx.restore();
}

/** Where an animal's own light is, in its drawing's units: the anglerfish's lure, a jelly's bell, the middle for the rest. */
export function glowAt(a: Pick<Animal, 'art'>, t = 0): [number, number] {
  if (a.art.shape === 'angler') return [37, -58 + Math.sin(t * 2.4) * 3];
  if (a.art.shape === 'jelly') return [0, -8];
  if (a.art.shape === 'eel' && a.art.form === 'gulper') return [-66, 0];
  if (a.art.form === 'flashlight') return [18, 10];
  if (a.art.form === 'loosejaw') return [23, 7];
  if (a.art.form === 'viper') return [13, -41];
  return [0, 4];
}
/** The box an animal's drawing fills, in its units: wide enough for tails, arms and lures. */
export const CREATURE_BOX = { w: 200, h: 170 } as const;
