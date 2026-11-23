// The airport plot, from above: where every piece stands. Pieces go in fixed places, so whatever order he buys them in the layout
// works and nothing overlaps (airport.test.ts checks every pair). The runway runs along the bottom, the taxiway above it, then the
// apron with its gates, the terminal, and the landside (car parks, trains, the hotel) along the top.
//
// The Flight's taxi and "Watch it run" drive on this plot: paved ground is quick, grass is slow (and never stops a plane).

export const PLOT_W = 1300, PLOT_H = 780;
export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** The runway he starts with, and its upgrades. y is the centre line. */
export const RUNWAY_Y = 670, RUNWAY_HALF = 20;
export const RUNWAYS = { grass: r(220, 652, 400, 36), tarmac: r(220, 650, 500, 40), long: r(120, 650, 880, 40) } as const;
export const CROSSING = r(1220, 130, 40, 560);
/** Where a Flight's take-off roll starts. */
export const HOLD_POINT = { x: 250, y: RUNWAY_Y } as const;
export const TAXI_Y = 610;
export const STAND_Y = 535;
/** Gate stands, left to right; with no gates the plane waits on the grass in front of the hut. */
export const GATE_X = [360, 450, 540, 630, 720, 810] as const;
export const HOME_STAND = { x: 560, y: STAND_Y } as const;
/** Extra hangars (the repeatable kind) stand in a row beyond the runway. */
export const EXTRA_HANGARS = [0, 1, 2, 3].map(i => r(120 + i * 112, 712, 100, 60));
/** Where the airport starts: a shed beside the grass strip. Drawn until the Ticket Hut replaces it. */
export const SHED = r(535, 405, 50, 40);
/** Extra gates (the repeatable kind) park along the concourses. */
export const EXTRA_STANDS = [r(205, 455, 0, 0), r(255, 455, 0, 0), r(905, 455, 0, 0), r(955, 455, 0, 0), r(205, 300, 0, 0), r(255, 300, 0, 0), r(905, 300, 0, 0), r(955, 300, 0, 0)].map(s => ({ x: s.x, y: s.y }));

/** Where each piece, sign and garden thing goes. */
export const SPOTS: Record<string, Rect> = {
  'piece:tarmac': RUNWAYS.tarmac, 'piece:long': RUNWAYS.long, 'piece:crossing': CROSSING,
  'piece:taxiway': r(300, 600, 420, 20), 'piece:taxiway2': r(140, 600, 860, 20), 'piece:apron': r(300, 470, 580, 120),
  'piece:hut': r(520, 395, 80, 55), 'piece:terminal': r(420, 375, 280, 75), 'piece:bigterminal': r(330, 365, 470, 85), 'piece:glass': r(300, 355, 560, 95),
  'piece:baggage': r(330, 300, 90, 50), 'piece:food': r(430, 300, 80, 50), 'piece:shops': r(520, 300, 80, 50), 'piece:lounge': r(610, 300, 90, 50),
  'piece:deck': r(710, 300, 80, 50), 'piece:roofgarden': r(360, 380, 90, 30),
  'piece:gate1': r(340, 450, 40, 60), 'piece:gate2': r(430, 450, 40, 60), 'piece:gate3': r(520, 450, 40, 60), 'piece:gate4': r(610, 450, 40, 60), 'piece:gate5': r(700, 450, 40, 60), 'piece:gate6': r(790, 450, 40, 60),
  'piece:bridges': r(340, 450, 490, 20),
  'piece:tower': r(900, 480, 50, 90), 'piece:talltower': r(895, 470, 60, 100), 'piece:radar': r(1000, 330, 70, 80), 'piece:weather': r(1085, 330, 45, 70),
  'piece:hangar': r(20, 540, 110, 80), 'piece:bighangar': r(20, 430, 130, 100), 'piece:paintshop': r(20, 330, 90, 85), 'piece:maintenance': r(120, 330, 70, 85),
  'piece:museum': r(700, 30, 180, 105),
  'piece:fire': r(980, 520, 90, 70), 'piece:firepit': r(980, 440, 90, 70), 'piece:fuel': r(20, 170, 140, 130),
  'piece:cargo': r(1080, 470, 125, 120), 'piece:warehouse': r(1080, 410, 125, 50),
  'piece:deice': r(160, 520, 110, 70), 'piece:plough': r(160, 440, 110, 70), 'piece:helipad': r(30, 705, 70, 70), 'piece:dock': r(1110, 690, 80, 40),
  'piece:catering': r(420, 105, 80, 60), 'piece:post': r(330, 105, 80, 60),
  'piece:carpark': r(330, 185, 140, 85), 'piece:bigcarpark': r(650, 185, 170, 85), 'piece:busstop': r(480, 220, 50, 50), 'piece:taxi': r(835, 220, 60, 50),
  'piece:hotel': r(920, 140, 100, 130), 'piece:train': r(180, 170, 130, 80), 'piece:monorail': r(190, 278, 820, 14), 'piece:monostation': r(555, 232, 80, 50),
  'piece:watertower': r(190, 40, 50, 80), 'piece:solar': r(20, 30, 150, 110), 'piece:wind': r(1100, 30, 110, 170), 'piece:show': r(900, 30, 180, 90),
  'piece:blast': r(95, 640, 14, 60), 'piece:clock': r(260, 30, 50, 120),
  // signs and lights
  'sign:windsock': r(640, 700, 30, 40), 'sign:flags': r(330, 455, 0, 0), 'sign:holdlines': r(240, 620, 40, 30), 'sign:numbers': r(0, 0, 0, 0),
  'sign:taxisigns': r(290, 580, 0, 0), 'sign:welcome': r(650, 148, 70, 30), 'sign:airline': r(300, 330, 0, 0), 'sign:arrivals': r(305, 395, 20, 20),
  'sign:departures': r(805, 395, 20, 20), 'sign:board': r(560, 340, 0, 0), 'sign:neon': r(1035, 230, 55, 30), 'sign:billboard': r(1035, 150, 55, 55),
  'sign:runwaylights': r(0, 0, 0, 0), 'sign:approach': r(10, 662, 80, 16), 'sign:edgelights': r(0, 0, 0, 0), 'sign:glidelights': r(1010, 700, 50, 20),
  'sign:beacon': r(0, 0, 0, 0), 'sign:flood': r(0, 0, 0, 0), 'sign:search': r(860, 470, 0, 0), 'sign:goldlights': r(0, 0, 0, 0),
  // the garden
  'decor:trees': r(330, 167, 135, 16), 'decor:flowers': r(478, 178, 70, 38), 'decor:palms': r(700, 705, 120, 60), 'decor:benches': r(615, 165, 30, 20),
  'decor:pond': r(830, 710, 90, 55), 'decor:fountain': r(560, 165, 45, 45), 'decor:statue': r(520, 110, 40, 60), 'decor:playground': r(1030, 210, 0, 0),
  'decor:picnic': r(930, 715, 60, 40), 'decor:kites': r(1135, 215, 75, 100), 'decor:balloons': r(570, 30, 120, 70), 'decor:rainbow': r(410, 30, 150, 70),
  'decor:hedge': r(1215, 20, 80, 100), 'decor:pines': r(176, 318, 0, 0), 'decor:sunflowers': r(625, 102, 70, 44), 'decor:mushrooms': r(995, 700, 0, 0),
  'decor:planeplay': r(568, 705, 62, 65), 'decor:lake': r(1080, 690, 0, 0), 'decor:cows': r(1095, 600, 100, 40), 'decor:snowman': r(287, 548, 0, 0),
};

/** The playground, lake, pines, toadstools and snowman sit where nothing else does; they're listed as points above (0 by 0) and drawn
 *  where they are. A spot of 0 by 0 is a thing drawn on or beside another (the runway numbers, the lights along an edge). */
export const isPoint = (s: Rect) => s.w === 0 && s.h === 0;

export function runwayRect(owned: (id: string) => boolean): Rect {
  return owned('piece:long') ? RUNWAYS.long : owned('piece:tarmac') ? RUNWAYS.tarmac : RUNWAYS.grass;
}

const inside = (s: Rect, x: number, y: number, pad = 0) => x >= s.x - pad && x <= s.x + s.w + pad && y >= s.y - pad && y <= s.y + s.h + pad;
/** Paved ground under this point: the runway, the taxiways, the apron, the stands and the roads that join them. Grass otherwise. */
export function paved(owned: (id: string) => boolean, x: number, y: number): boolean {
  if (inside(runwayRect(owned), x, y, 4)) return true;
  // even before the taxiway, a worn track joins the stand to the runway, so the plain path is always quick
  if (Math.abs(y - TAXI_Y) < 16 && x >= HOLD_POINT.x - 20 && x <= 900) return true;
  if (Math.abs(x - HOLD_POINT.x) < 16 && y >= TAXI_Y - 10 && y <= RUNWAY_Y) return true;
  for (const id of ['piece:taxiway', 'piece:taxiway2', 'piece:apron', 'piece:deice', 'piece:cargo', 'piece:helipad'] as const) if (owned(id) && inside(SPOTS[id]!, x, y, 4)) return true;
  for (const gx of [...GATE_X, HOME_STAND.x]) if (Math.abs(x - gx) < 18 && y >= STAND_Y - 20 && y <= TAXI_Y) return true;
  return false;
}

/** The stand a plane starts from: his first gate, or the grass in front of the hut. */
export function standFor(owned: (id: string) => boolean, gate = 0): { x: number; y: number } {
  const gates = GATE_X.filter((_, i) => owned(`piece:gate${i + 1}`));
  return gates.length ? { x: gates[Math.min(gate, gates.length - 1)]!, y: STAND_Y } : HOME_STAND;
}
/** From a stand to the runway: down to the taxiway, along it, and down to the hold point. */
export function taxiPath(stand: { x: number; y: number }): { x: number; y: number }[] {
  return [stand, { x: stand.x, y: TAXI_Y }, { x: HOLD_POINT.x, y: TAXI_Y }, HOLD_POINT];
}
