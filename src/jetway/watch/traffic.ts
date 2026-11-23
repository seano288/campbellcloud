// "Watch it run": his airport working by itself. His own planes land on his runway, taxi to his gates, wait while the fuel truck and the
// bag carts come and go, push back, taxi out and take off again. More gates and more planes mean more traffic, and his trucks drive
// about. Capped so it holds 60 fps on an iPad 9: at most MAX_PLANES planes and MAX_VEHICLES vehicles move at once.
import { PLANE_SPECS, VEHICLES, type PlaneModel } from '../airport/catalog';
import { fleet, has, type AirportState } from '../airport/airport';
import { EXTRA_STANDS, GATE_X, HOLD_POINT, HOME_STAND, RUNWAY_Y, runwayRect, SPOTS, STAND_Y, TAXI_Y } from '../airport/plot';

export const MAX_PLANES = 6, MAX_VEHICLES = 8;
type Pt = { x: number; y: number };
type PlaneState = 'parked' | 'out' | 'roll' | 'away' | 'land' | 'in';
export interface MovingPlane { model: PlaneModel; x: number; y: number; heading: number; state: PlaneState; timer: number; path: Pt[]; at: number; speed: number; stand: Pt; lift: number }
export interface MovingVehicle { id: string; hex: string; len: number; x: number; y: number; heading: number; path: Pt[]; at: number; wait: number; home: Pt }

/** Where his planes park: the gates he has built (and the extra ones), or the grass in front of the hut. */
export function stands(a: Pick<AirportState, 'owned' | 'more'>): Pt[] {
  const out: Pt[] = GATE_X.filter((_, i) => has(a, `piece:gate${i + 1}`)).map(x => ({ x, y: STAND_Y }));
  out.push(...EXTRA_STANDS.slice(0, a.more.gate));
  return out.length ? out : [HOME_STAND];
}

export interface Traffic { planes: MovingPlane[]; vehicles: MovingVehicle[]; t: number; landings: number }

/** `seed` spreads the planes out so they don't all move together. */
export function createTraffic(a: AirportState, seed = 1): Traffic {
  const spots = stands(a), models = fleet(a).filter(m => PLANE_SPECS[m].ability !== 'heli').slice(-MAX_PLANES);
  // one plane to a stand, so two never park on top of each other
  const n = Math.max(1, Math.min(MAX_PLANES, models.length, spots.length));
  const planes: MovingPlane[] = [];
  for (let i = 0; i < n; i++) {
    const model = models[(models.length - 1 - i + models.length) % models.length] ?? 'twoseater', stand = spots[i % spots.length]!;
    // the first ones start parked, the others in the air, so traffic begins at once
    const parked = i < spots.length && i % 2 === 0;
    planes.push({ model, x: parked ? stand.x : -80, y: parked ? stand.y : RUNWAY_Y, heading: parked ? Math.PI / 2 : 0, state: parked ? 'parked' : 'away', timer: 2 + i * 3.5 + (seed % 3), path: [], at: 0, speed: 0, stand, lift: 0 });
  }
  const owned = VEHICLES.filter(v => has(a, v.id)).slice(0, MAX_VEHICLES);
  const depots: Pt[] = [{ x: 300, y: 580 }, { x: 880, y: 580 }, { x: 600, y: 590 }, { x: 320, y: 480 }];
  const vehicles = owned.map((v, i) => { const home = depots[i % depots.length]!; return { id: v.id, hex: v.hex, len: v.len, x: home.x + (i >> 2) * 24, y: home.y, heading: 0, path: [], at: 0, wait: 1 + i * .7, home: { x: home.x + (i >> 2) * 24, y: home.y } }; });
  return { planes, vehicles, t: 0, landings: 0 };
}

const runwayEnds = (a: Pick<AirportState, 'owned'>) => { const r = runwayRect(id => has(a, id)); return { start: r.x + 30, end: r.x + r.w - 30 }; };

function follow(p: { x: number; y: number; heading: number; path: Pt[]; at: number }, speed: number, dt: number): boolean {
  let left = speed * dt;
  while (left > 0 && p.at < p.path.length) {
    const goal = p.path[p.at]!, dx = goal.x - p.x, dy = goal.y - p.y, d = Math.hypot(dx, dy);
    if (d < .5) { p.at++; continue; }
    p.heading = Math.atan2(dy, dx);
    const s = Math.min(d, left);
    p.x += (dx / d) * s; p.y += (dy / d) * s; left -= s;
    if (s === d) p.at++;
  }
  return p.at >= p.path.length;
}

export function stepTraffic(tr: Traffic, a: AirportState, dt: number) {
  tr.t += dt;
  const ends = runwayEnds(a);
  // one plane on the runway at a time
  let runwayBusy = tr.planes.some(p => p.state === 'roll' || p.state === 'land');
  for (const p of tr.planes) {
    p.timer -= dt;
    switch (p.state) {
      case 'parked':
        if (p.timer <= 0) { p.state = 'out'; p.path = [{ x: p.stand.x, y: p.stand.y + 20 }, { x: p.stand.x, y: TAXI_Y }, { x: HOLD_POINT.x, y: TAXI_Y }, { x: HOLD_POINT.x, y: TAXI_Y + 30 }]; p.at = 0; }
        break;
      case 'out':
        if (follow(p, 55, dt) && !runwayBusy) { runwayBusy = true; p.state = 'roll'; p.path = [{ x: ends.start, y: RUNWAY_Y }, { x: 1400, y: RUNWAY_Y }]; p.at = 0; p.speed = 20; }
        break;
      case 'roll':
        p.speed = Math.min(260, p.speed + 70 * dt);
        follow(p, p.speed, dt);
        if (p.x > ends.start + 250) p.lift = Math.min(1, p.lift + dt * .8);
        if (p.x > 1360) { p.state = 'away'; p.timer = 6 + Math.random() * 6; p.lift = 1; }
        break;
      case 'away':
        if (p.timer <= 0 && !runwayBusy) { runwayBusy = true; p.state = 'land'; p.x = -120; p.y = RUNWAY_Y; p.heading = 0; p.lift = 1; p.speed = 200; p.path = [{ x: ends.end - 60, y: RUNWAY_Y }]; p.at = 0; }
        break;
      case 'land': {
        const touch = ends.start + 60;
        if (p.x < touch) p.lift = Math.max(0, (touch - p.x) / (touch + 120)); else p.lift = 0;
        if (p.x > touch) p.speed = Math.max(40, p.speed - 90 * dt);
        if (follow(p, p.speed, dt)) {
          tr.landings++;
          p.state = 'in';
          const exit = Math.min(ends.end - 60, 900);
          p.path = [{ x: exit, y: TAXI_Y }, { x: p.stand.x, y: TAXI_Y }, { x: p.stand.x, y: p.stand.y }]; p.at = 0;
        }
        break;
      }
      case 'in':
        if (follow(p, 60, dt)) { p.state = 'parked'; p.timer = 7 + Math.random() * 5; p.heading = -Math.PI / 2; }
        break;
    }
  }
  // the trucks visit a parked plane and go home
  const parked = tr.planes.filter(p => p.state === 'parked');
  tr.vehicles.forEach((v, i) => {
    if (v.wait > 0) { v.wait -= dt; return; }
    if (v.at >= v.path.length) {
      const target = parked.length ? parked[(i + Math.floor(tr.t / 9)) % parked.length]! : null;
      const atHome = Math.hypot(v.x - v.home.x, v.y - v.home.y) < 2;
      if (atHome && target) { const side = i % 2 ? 26 : -26; v.path = [{ x: v.x, y: 580 }, { x: target.stand.x + side, y: 580 }, { x: target.stand.x + side, y: target.stand.y + 12 }]; }
      else v.path = [{ x: v.x, y: 580 }, { x: v.home.x, y: 580 }, v.home];
      v.at = 0; v.wait = atHome ? 0 : 2.5;
      return;
    }
    follow(v, 70, dt);
  });
}

/** The fire station's engine and the de-icer park beside their buildings when he has them, so a still picture shows them too. */
export const vehicleHome = (id: string): Pt | null => (id === 'vehicle:fireengine' ? { x: SPOTS['piece:fire']!.x + 45, y: SPOTS['piece:fire']!.y + 80 } : null);
