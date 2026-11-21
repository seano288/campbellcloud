// The ten places he can dive, from the sunlit reef to the trench. A zone opens when his submarine has the parts it needs: a
// stronger Hull goes deeper, and the Shipwreck, the Crystal Cave and Under the Ice also need a part that does a job there (the Claw
// for the wreck's treasure, Sonar to find the way in the cave, bright Headlights under the ice). How dark each one is decides how
// much he sees outside his headlight: the reef is lit by the sun, the trench is pitch black. `top` and `bottom` are how dark the zone
// looks from outside (the map, the Logbook's pages); `water` is the sea as his headlight shows it on a Dive, shallow to deep, so even in
// the trench the beam lights up blue water instead of black.
//
// The Kelp Forest and the Open Ocean (added 2026-11-21) are shallow and sunlit but far from the Dock, so they need a faster Motor, not a
// stronger Hull: a stronger Hull is still only for going deeper.

export const ZONES = [
  { id: 'reef', name: 'The Sunlit Reef', dark: 0.18, hull: 0, needs: null, top: '#2fa6d6', bottom: '#0f5a8a', floor: '#e9d39a', water: ['#2fa6d6', '#0f5a8a'], icon: '🐠' },
  { id: 'kelp', name: 'The Kelp Forest', dark: 0.3, hull: 0, needs: { slot: 'motor', rung: 1 }, top: '#2f9a7a', bottom: '#0f4a4a', floor: '#8a7a5a', water: ['#3a9a86', '#1a6a66'], icon: '🌿' },
  { id: 'twilight', name: 'The Twilight Zone', dark: 0.62, hull: 1, needs: null, top: '#155a8a', bottom: '#0a2a52', floor: '#3a4a5a', water: ['#1e6a9e', '#164a80'], icon: '🌆' },
  { id: 'wreck', name: 'The Shipwreck', dark: 0.6, hull: 1, needs: { slot: 'claw', rung: 1 }, top: '#1a5a7a', bottom: '#0b2b44', floor: '#6a5a40', water: ['#22708f', '#164a6a'], icon: '⚓' },
  { id: 'open', name: 'The Open Ocean', dark: 0.1, hull: 0, needs: { slot: 'motor', rung: 3 }, top: '#3aa8f0', bottom: '#0a3a8a', floor: '#123a7a', water: ['#3aa0ee', '#1a5ab8'], icon: '🐋' },
  { id: 'midnight', name: 'The Midnight Zone', dark: 0.93, hull: 2, needs: null, top: '#06163a', bottom: '#020818', floor: '#1a2030', water: ['#1a3a7a', '#12285a'], icon: '🌙' },
  { id: 'cave', name: 'The Crystal Cave', dark: 0.9, hull: 3, needs: { slot: 'sonar', rung: 2 }, top: '#1a1240', bottom: '#080520', floor: '#2a2050', water: ['#3a2a7a', '#261a5a'], icon: '💎' },
  { id: 'vents', name: 'The Hot Vents', dark: 0.9, hull: 4, needs: null, top: '#1a0c14', bottom: '#0a0408', floor: '#3a1c14', water: ['#4a2a3a', '#33182a'], icon: '🌋' },
  { id: 'ice', name: 'Under the Ice', dark: 0.72, hull: 5, needs: { slot: 'lights', rung: 3 }, top: '#2a5a7a', bottom: '#0a2238', floor: '#24384a', water: ['#3a7aa0', '#24557a'], icon: '🧊' },
  { id: 'trench', name: 'The Deep Trench', dark: 0.97, hull: 6, needs: null, top: '#040814', bottom: '#000004', floor: '#14161c', water: ['#1a2a5a', '#101a40'], icon: '🕳️' },
] as const;
export type ZoneId = (typeof ZONES)[number]['id'];
export type ZoneName = (typeof ZONES)[number]['name'];
export const zone = (id: ZoneId) => ZONES.find(z => z.id === id)!;
export const isZoneId = (x: unknown): x is ZoneId => typeof x === 'string' && ZONES.some(z => z.id === x);
