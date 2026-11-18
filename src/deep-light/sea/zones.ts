// The eight places he can dive, from the sunlit reef to the trench. A zone opens when his submarine has the parts it needs: a
// stronger Hull goes deeper, and the Shipwreck, the Crystal Cave and Under the Ice also need a part that does a job there (the Claw
// for the wreck's treasure, Sonar to find the way in the cave, bright Headlights under the ice). How dark each one is decides how
// much he sees outside his headlight: the reef is lit by the sun, the trench is pitch black.

export const ZONES = [
  { id: 'reef', name: 'The Sunlit Reef', dark: 0.18, hull: 0, needs: null, top: '#2fa6d6', bottom: '#0f5a8a', floor: '#e9d39a', icon: '🐠' },
  { id: 'twilight', name: 'The Twilight Zone', dark: 0.62, hull: 1, needs: null, top: '#155a8a', bottom: '#0a2a52', floor: '#3a4a5a', icon: '🌆' },
  { id: 'wreck', name: 'The Shipwreck', dark: 0.6, hull: 1, needs: { slot: 'claw', rung: 1 }, top: '#1a5a7a', bottom: '#0b2b44', floor: '#6a5a40', icon: '⚓' },
  { id: 'midnight', name: 'The Midnight Zone', dark: 0.93, hull: 2, needs: null, top: '#06163a', bottom: '#020818', floor: '#1a2030', icon: '🌙' },
  { id: 'cave', name: 'The Crystal Cave', dark: 0.9, hull: 3, needs: { slot: 'sonar', rung: 2 }, top: '#1a1240', bottom: '#080520', floor: '#2a2050', icon: '💎' },
  { id: 'vents', name: 'The Hot Vents', dark: 0.9, hull: 4, needs: null, top: '#1a0c14', bottom: '#0a0408', floor: '#3a1c14', icon: '🌋' },
  { id: 'ice', name: 'Under the Ice', dark: 0.72, hull: 5, needs: { slot: 'lights', rung: 3 }, top: '#2a5a7a', bottom: '#0a2238', floor: '#24384a', icon: '🧊' },
  { id: 'trench', name: 'The Deep Trench', dark: 0.97, hull: 6, needs: null, top: '#040814', bottom: '#000004', floor: '#14161c', icon: '🕳️' },
] as const;
export type ZoneId = (typeof ZONES)[number]['id'];
export type ZoneName = (typeof ZONES)[number]['name'];
export const zone = (id: ZoneId) => ZONES.find(z => z.id === id)!;
export const isZoneId = (x: unknown): x is ZoneId => typeof x === 'string' && ZONES.some(z => z.id === x);
