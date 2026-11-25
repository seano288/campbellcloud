// The Ride cannot be failed: every scripted child gets round, the lever goes by itself, the photo snaps anyway.
import { describe, expect, it } from 'vitest';
import { rideWith, startRide, tick, TUNING } from './ride';
import { STARTER_COASTER } from '../park/yard';

const TRACKS = [[...STARTER_COASTER], ['pc:lift7', 'pc:drop7', 'pc:loop', 'pc:camel3', 'pc:cork', 'pc:helix', 'pc:splash'], ['pc:lift13', 'pc:drop11', 'pc:double', 'pc:tophat', 'pc:bigsplash']];

describe('the Ride', () => {
  it('gets every child to the station: one who does nothing, a clumsy one and a skilled one', () => {
    for (const t of TRACKS) for (const child of ['nothing', 'clumsy', 'skilled'] as const) {
      const st = rideWith(t, child);
      expect(st.phase).toBe('done');
      expect(st.t).toBeLessThan(80);
    }
  });
  it('waits at the top of the lift for the lever, and lets itself go after a few seconds', () => {
    let st = startRide(TRACKS[1]!);
    for (let i = 0; i < 60 * 40 && st.phase !== 'hold'; i++) st = tick(st, { hold: false, lever: false, snap: false }, 1 / 60);
    expect(st.phase).toBe('hold');
    const at = st.car.s;
    for (let i = 0; i < 60 * (TUNING.autoLever - 1); i++) st = tick(st, { hold: false, lever: false, snap: false }, 1 / 60);
    expect(st.car.s).toBe(at);
    for (let i = 0; i < 60 * 2; i++) st = tick(st, { hold: false, lever: false, snap: false }, 1 / 60);
    expect(st.phase).toBe('run');
  });
  it('catches stars only with hands up, and the skilled child catches them all; hands down only makes them squeal', () => {
    const lazy = rideWith(TRACKS[1]!, 'nothing'), keen = rideWith(TRACKS[1]!, 'skilled');
    expect(lazy.stars.filter(s => s.caught).length).toBe(0);
    expect(keen.stars.every(s => s.caught)).toBe(true);
    expect(lazy.squeals).toBeGreaterThan(0);
  });
  it('takes the photo at the big drop: tapped by a skilled child, by itself for one who does nothing', () => {
    expect(rideWith(TRACKS[1]!, 'skilled').photo).toBe('tapped');
    expect(rideWith(TRACKS[1]!, 'nothing').photo).toBe('auto');
  });
});
