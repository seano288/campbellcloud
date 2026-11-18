// The sixteen Shows: places to fly, each with its own sky, ground and things in the air. The first is open from the start; flying a
// Show he hasn't flown before opens the next one, and puts its patch on his Wall.
export const SHOWS = [
  { id: 'beach', name: 'Sunny Beach', patch: '🏖️', sky: ['#5fb8f2', '#cdeeff'], ground: '#f2d98f', far: '#4aa3df', scenery: 'beach', thing: 'balloon', ring: '#ff5a4f' },
  { id: 'city', name: 'Big City', patch: '🏙️', sky: ['#4b8fd6', '#d4e9fb'], ground: '#7d8794', far: '#5b6573', scenery: 'city', thing: 'balloon', ring: '#ffd23f' },
  { id: 'canyon', name: 'Red Canyon', patch: '🏜️', sky: ['#f29b52', '#ffe2b5'], ground: '#c4643a', far: '#a34a2a', scenery: 'canyon', thing: 'bird', ring: '#3f8cff' },
  { id: 'mountains', name: 'Snowy Mountains', patch: '🏔️', sky: ['#6aa9e0', '#eef6fc'], ground: '#f4f8fb', far: '#8aa1b8', scenery: 'mountains', thing: 'cloud', ring: '#e63946' },
  { id: 'stadium', name: 'Stadium', patch: '🏟️', sky: ['#3d7fd1', '#bfe0fb'], ground: '#3a9a4a', far: '#c9ccd2', scenery: 'stadium', thing: 'balloon', ring: '#ffd23f' },
  { id: 'farm', name: 'Farm', patch: '🚜', sky: ['#7cc4f2', '#e9f7ff'], ground: '#6fb04a', far: '#9fd067', scenery: 'farm', thing: 'bird', ring: '#ff8a1f' },
  { id: 'jungle', name: 'Jungle', patch: '🌴', sky: ['#4fb3a9', '#d9f5e6'], ground: '#2f7d3a', far: '#3f9a4a', scenery: 'jungle', thing: 'bird', ring: '#ff5a4f' },
  { id: 'island', name: 'Treasure Island', patch: '🏝️', sky: ['#47b4ea', '#d8f3ff'], ground: '#2a86c9', far: '#1d6aa6', scenery: 'island', thing: 'cloud', ring: '#ffd23f' },
  { id: 'desert', name: 'Desert', patch: '🐪', sky: ['#f6c46a', '#fff2cf'], ground: '#e0b46a', far: '#c9944a', scenery: 'desert', thing: 'balloon', ring: '#3f8cff' },
  { id: 'volcano', name: 'Volcano', patch: '🌋', sky: ['#7a3a32', '#f29a5a'], ground: '#4a3a36', far: '#2e2422', scenery: 'volcano', thing: 'cloud', ring: '#ffd23f' },
  { id: 'lake', name: 'Big Lake', patch: '🛶', sky: ['#6fb7e8', '#e3f4ff'], ground: '#3d8fd0', far: '#3a7a3a', scenery: 'lake', thing: 'bird', ring: '#ff5a4f' },
  { id: 'castle', name: 'Castle', patch: '🏰', sky: ['#8a9fe0', '#efe9ff'], ground: '#5c9a4a', far: '#7d8794', scenery: 'castle', thing: 'balloon', ring: '#ff8ac4' },
  { id: 'rainbow', name: 'Rainbow Valley', patch: '🌈', sky: ['#9fc8ff', '#fff0fa'], ground: '#7fd06a', far: '#58b85a', scenery: 'rainbow', thing: 'cloud', ring: '#a46bff' },
  { id: 'sunset', name: 'Sunset Sky', patch: '🌅', sky: ['#5a3a8a', '#ff9a5a'], ground: '#3a2a4a', far: '#2a1d36', scenery: 'sunset', thing: 'bird', ring: '#ffd23f' },
  { id: 'night', name: 'Night Fireworks', patch: '🎆', sky: ['#0b1a3a', '#2a3f7a'], ground: '#1a2238', far: '#121a2e', scenery: 'night', thing: 'balloon', ring: '#3fd16a' },
  { id: 'space', name: 'Edge of Space', patch: '🌌', sky: ['#05070f', '#1d2a5a'], ground: '#2b6fd0', far: '#e8f0ff', scenery: 'space', thing: 'cloud', ring: '#ff8ac4' },
] as const;
export type ShowId = (typeof SHOWS)[number]['id'];
export type Show = (typeof SHOWS)[number];
export const SHOW_IDS: readonly ShowId[] = SHOWS.map(s => s.id);
export const isShowId = (x: unknown): x is ShowId => (SHOW_IDS as readonly unknown[]).includes(x);
export const show = (id: ShowId): Show => SHOWS.find(s => s.id === id)!;
export type ShowName = Show['name'];
