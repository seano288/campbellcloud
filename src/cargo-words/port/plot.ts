// Where everything goes in the Port, so the layout always works whatever order he buys in. The Port is drawn as a wide picture of the
// harbour: buildings on the land at the back, the yard and the rail in the middle, the quay with its cranes along the front, and the
// berths' ships in the water. Each piece has its own place; no two places overlap (tested).
export const PLOT_W = 1200, PLOT_H = 520;
export const LAND_Y = 150, YARD_Y = 260, QUAY_Y = 360, SEA_Y = 392;

export interface Place { x: number; y: number; w: number; h: number; colour: string }
const at = (x: number, y: number, w: number, h: number, colour: string): Place => ({ x, y, w, h, colour });

/** Each piece's place. Berths are along the quay's front edge; the ships he owns moor at them. */
export const PLACES: Readonly<Record<string, Place>> = {
  // the back row, on the land
  'piece:office': at(20, 90, 70, 60, '#e9e2cf'), 'piece:clock': at(92, 40, 36, 110, '#d9c9a3'), 'piece:customs': at(130, 80, 80, 70, '#d8d8e0'),
  'piece:canteen': at(212, 104, 56, 46, '#f4c7a1'), 'piece:watertower': at(270, 50, 40, 100, '#a7b6c4'), 'piece:weather': at(312, 96, 34, 54, '#ffffff'),
  'piece:signal': at(348, 40, 24, 110, '#e63946'), 'piece:radar': at(374, 54, 40, 96, '#c0c8d0'), 'piece:shed': at(416, 84, 110, 66, '#b77a4a'),
  'piece:bigshed': at(528, 70, 140, 80, '#8f6a4a'), 'piece:coldstore': at(670, 90, 76, 60, '#dff3ff'), 'piece:solar': at(416, 76, 110, 8, '#2b4c7e'),
  'piece:silo': at(748, 40, 46, 110, '#e2c98a'), 'piece:oiltanks': at(796, 92, 90, 58, '#c9c9c9'), 'piece:wind': at(888, 20, 30, 130, '#f4f4f4'),
  'piece:pilot': at(920, 100, 56, 50, '#f2f2f2'), 'piece:coastguard': at(978, 92, 70, 58, '#ff7a00'), 'piece:rescue': at(1050, 104, 56, 46, '#e63946'),
  'piece:lighthouse': at(1130, 10, 44, 140, '#ffffff'), 'piece:harbourlights': at(1108, 120, 20, 30, '#ffd23f'),
  // the middle: the yard, the rail and the gate
  'piece:yard': at(20, 186, 220, 70, '#c9ced3'), 'piece:bigyard': at(242, 186, 200, 70, '#c9ced3'), 'piece:reefer': at(20, 172, 220, 12, '#3da5ff'),
  'piece:straddle': at(444, 196, 50, 60, '#ffcc00'), 'piece:stacker': at(496, 210, 50, 46, '#ff7a00'), 'piece:repair': at(548, 200, 60, 56, '#6b7a8f'),
  'piece:paintshop': at(610, 200, 60, 56, '#ff6fb5'), 'piece:rail': at(0, 262, 760, 14, '#6b4b3a'), 'piece:engine': at(680, 236, 60, 26, '#2f8a3f'),
  'piece:longtrain': at(520, 240, 158, 22, '#8a4b2a'), 'piece:gate': at(780, 220, 60, 50, '#ffcc00'), 'piece:lorry': at(842, 236, 60, 30, '#2f6fe0'),
  'piece:biglorry': at(904, 230, 80, 36, '#e63946'), 'piece:weigh': at(780, 200, 60, 16, '#8a939c'), 'piece:carpark': at(986, 214, 110, 56, '#7e858c'),
  'piece:busstop': at(1100, 226, 30, 40, '#2f6fe0'), 'piece:shipyard': at(672, 150, 100, 82, '#5b636b'), 'piece:fishmarket': at(1136, 196, 60, 70, '#68c3f5'),
  'piece:ice': at(1140, 160, 52, 34, '#dff3ff'), 'piece:tugshed': at(990, 160, 60, 50, '#8a5a35'), 'piece:ferrypier': at(1052, 160, 80, 50, '#f4f4f0'),
  // the quay
  'piece:longquay': at(0, 340, 1200, 20, '#9aa1a8'), 'piece:deepquay': at(0, 356, 1200, 10, '#6b737b'), 'piece:rails': at(20, 330, 700, 8, '#3a3f44'),
  'piece:bollards': at(20, 334, 680, 6, '#2b2b2b'), 'piece:fenders': at(20, 360, 680, 8, '#111111'), 'piece:floodlights': at(730, 280, 30, 60, '#ffd23f'),
  'piece:fuel': at(780, 300, 70, 40, '#ffcc00'), 'piece:drydock': at(860, 290, 120, 50, '#5b636b'), 'piece:ramp': at(990, 300, 50, 40, '#c9b38a'),
  'piece:breakwater': at(1050, 420, 150, 30, '#7e858c'), 'piece:foghorn': at(1180, 300, 20, 40, '#e63946'),
};
/** Pieces that move about (the train and the lorries): drawn as vehicles on the rail and the road, not in a place of their own. */
export const VEHICLES: readonly string[] = ['piece:engine', 'piece:longtrain', 'piece:lorry', 'piece:biglorry'];
/** Strips along the quay, the rail and the yard, drawn as bands under other things. */
export const STRIPS: readonly string[] = ['piece:rail', 'piece:rails', 'piece:bollards', 'piece:fenders', 'piece:longquay', 'piece:deepquay', 'piece:reefer', 'piece:solar', 'piece:weigh', 'piece:harbourlights'];
/** Berths along the quay, left to right: the wooden pier is the first. */
export const BERTH_X = [40, 160, 280, 400, 520, 640, 760, 880, 1000, 1120] as const;
/** Decorations along the front of the land, left to right. */
export const DECOR_X0 = 20, DECOR_STEP = 46, DECOR_Y = 300;
/** At most this many of each again-and-again thing are drawn; the rest are counted. */
export const DRAW_MOST = { berth: 0, block: 6, shed: 4, rail: 6, crane: 4 } as const;
