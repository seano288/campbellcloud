import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { CLOCK_PHRASES, timePhrase } from './speech';
import { choicesFor, confusions, digital, fitsLevel, fromMinutes, handAngles, minutesOf, parseDigital, randomTime, sameTime, snap, startingTime, swappedHands, timesAt } from './time';

describe('clock time', () => {
  it('counts minutes past twelve and back, wrapping round the dial', () => {
    expect(minutesOf({ hour: 12, minute: 0 })).toBe(0);
    expect(minutesOf({ hour: 3, minute: 15 })).toBe(195);
    expect(fromMinutes(195)).toEqual({ hour: 3, minute: 15 });
    expect(fromMinutes(-5)).toEqual({ hour: 11, minute: 55 });
    expect(fromMinutes(720 + 60)).toEqual({ hour: 1, minute: 0 });
  });
  it('moves the short hand along between the numbers, like a real clock', () => {
    expect(handAngles({ hour: 3, minute: 0 })).toEqual({ hour: 90, minute: 0 });
    expect(handAngles({ hour: 3, minute: 30 })).toEqual({ hour: 105, minute: 180 });
  });
  it('writes and reads times as a digital clock shows them', () => {
    expect(digital({ hour: 9, minute: 5 })).toBe('9:05');
    expect(parseDigital('9:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseDigital('13:00')).toBeNull();
    expect(parseDigital('')).toBeNull();
  });
  it('uses whole hours at Level 1, quarters at Level 2 and every five minutes at Level 3', () => {
    expect(timesAt(1)).toHaveLength(12);
    expect(timesAt(2)).toHaveLength(48);
    expect(timesAt(3)).toHaveLength(144);
    const rng = seeded(4);
    for (let i = 0; i < 200; i++) for (const level of [1, 2, 3] as const) expect(fitsLevel(randomTime(level, rng), level)).toBe(true);
    expect(snap(197, 2)).toBe(195);
    expect(snap(197, 1)).toBe(180);
  });
  it('never asks the same time twice in a row when told what was last asked', () => {
    const rng = seeded(9);
    let last = randomTime(1, rng);
    for (let i = 0; i < 100; i++) { const next = randomTime(1, rng, last); expect(sameTime(next, last)).toBe(false); last = next; }
  });
  it('offers three different choices, the right one among them, from the classic mix-ups', () => {
    const rng = seeded(1);
    for (let i = 0; i < 300; i++) for (const level of [1, 2, 3] as const) {
      const t = randomTime(level, rng), c = choicesFor(t, level, rng);
      expect(c).toHaveLength(3);
      expect(c.filter(x => sameTime(x, t))).toHaveLength(1);
      expect(new Set(c.map(digital)).size).toBe(3);
      for (const x of c) expect(fitsLevel(x, level)).toBe(true);
    }
    // past the half, the short hand is near the next number: reading that one is the commonest slip
    expect(confusions({ hour: 3, minute: 45 }, 2)[0]).toEqual({ hour: 4, minute: 45 });
    expect(swappedHands({ hour: 3, minute: 20 })).toEqual({ hour: 4, minute: 15 });
  });
  it('starts Set the Clock somewhere other than the answer', () => {
    const rng = seeded(2);
    for (let i = 0; i < 200; i++) for (const level of [1, 2, 3] as const) {
      const t = randomTime(level, rng), s = startingTime(t, level, rng);
      expect(sameTime(s, t)).toBe(false);
      expect(fitsLevel(s, level)).toBe(true);
    }
  });
  it('has a recording for every time a Level can ask', () => {
    for (const t of timesAt(3)) expect(CLOCK_PHRASES).toContain(timePhrase(t));
    expect(timePhrase({ hour: 3, minute: 0 })).toBe("three o'clock");
    expect(timePhrase({ hour: 12, minute: 5 })).toBe('twelve oh five');
    expect(timePhrase({ hour: 7, minute: 45 })).toBe('seven forty-five');
  });
});
