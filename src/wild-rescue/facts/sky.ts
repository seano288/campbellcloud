// Sky and Seasons: day and night, the weather, the four seasons and the sun across the day (NGSS 1-ESS1-1, 1-ESS1-2, with K-ESS2-1
// weather as a base). Plain data, no game code.
//
// Seasons are taught as they look where most first graders in the U.S. live: snow in winter is said as "in many places it snows",
// never as always. The moon is never used to mean night, because it is often up in the daytime too; night is taught by the dark and
// the stars. "Noon" is taught as when the sun is highest, and morning and evening by the sun coming up and going down, never by
// which side of the picture the sun is on.

export const WEATHER = {
  sunny: { icon: '☀️', q: 'Tap the sunny picture!', lesson: 'When it is sunny, the sun shines in a clear sky.' },
  rainy: { icon: '🌧️', q: 'Tap the rainy picture!', lesson: 'When it is rainy, rain falls from the clouds.' },
  snowy: { icon: '🌨️', q: 'Tap the snowy picture!', lesson: 'When it is snowy, snow falls from the clouds.' },
  // only ever a wrong choice: rainy and snowy pictures are cloudy too, so "Tap the cloudy picture" would have two answers
  cloudy: { icon: '☁️', q: null, lesson: null },
} as const;
export type WeatherId = keyof typeof WEATHER;
export const WEATHER_ASKED = ['sunny', 'rainy', 'snowy'] as const satisfies readonly WeatherId[];

export const DAY_NIGHT = {
  q: 'Is it day or night?',
  day: { said: 'Day.', icon: '☀️', lesson: 'The sun is up, and the sky is bright. It is day.' },
  night: { said: 'Night.', icon: '✨', lesson: 'It is dark, and the stars are out. It is night.' },
} as const;

export const SEASON_IDS = ['spring', 'summer', 'fall', 'winter'] as const;
export type SeasonId = (typeof SEASON_IDS)[number];
export const SEASONS = {
  spring: { said: 'Spring.', icon: '🌷', lesson: 'In spring, flowers bloom and new leaves grow.', after: 'After winter comes spring.' },
  summer: { said: 'Summer.', icon: '☀️', lesson: 'In summer, it is hot and sunny.', after: 'After spring comes summer.' },
  fall: { said: 'Fall.', icon: '🍂', lesson: 'In fall, the leaves change color and fall off.', after: 'After summer comes fall.' },
  winter: { said: 'Winter.', icon: '❄️', lesson: 'In winter, it is cold, and in many places it snows.', after: 'After fall comes winter.' },
} as const;
export const SEASON_Q = 'Which season is this?';
export const AFTER_Q = { spring: 'What season comes after winter?', summer: 'What season comes after spring?', fall: 'What season comes after summer?', winter: 'What season comes after fall?' } as const;
export const SEASONS_ROUND = 'Spring, summer, fall, winter, and then spring again!';
/** The season whose question is "what comes after X?", keyed by the answer. */
export const BEFORE: Record<SeasonId, SeasonId> = { spring: 'winter', summer: 'spring', fall: 'summer', winter: 'fall' };

// ---------- what to wear ----------

export const CLOTHES = {
  coat: { icon: '🧥', said: 'A warm coat.' },
  mittens: { icon: '🧤', said: 'Mittens.' },
  swimsuit: { icon: '🩱', said: 'A swimsuit.' },
  sunhat: { icon: '👒', said: 'A sun hat.' },
  umbrella: { icon: '☂️', said: 'An umbrella.' },
  sandals: { icon: '🩴', said: 'Sandals.' },
  sunglasses: { icon: '🕶️', said: 'Sunglasses.' },
} as const;
export type ClothesId = keyof typeof CLOTHES;
export const WEAR_Q = 'What do you need today?';
export const WEAR = {
  snowy: { right: ['coat', 'mittens'], wrong: ['swimsuit', 'sandals'], lesson: 'When it snows, wear warm clothes.' },
  hot: { right: ['swimsuit', 'sunhat'], wrong: ['coat', 'mittens'], lesson: 'When it is hot, wear cool clothes.' },
  rainy: { right: ['umbrella'], wrong: ['swimsuit', 'sunglasses'], lesson: 'When it rains, an umbrella keeps you dry.' },
} as const satisfies Record<string, { right: readonly ClothesId[]; wrong: readonly ClothesId[]; lesson: string }>;
export type WearDay = keyof typeof WEAR;

// ---------- the sun through the day ----------

export const SUN_TIMES = {
  morning: { said: 'In the morning.', icon: '🌅' },
  noon: { said: 'At noon.', icon: '☀️' },
  evening: { said: 'In the evening.', icon: '🌇' },
} as const;
export type SunTime = keyof typeof SUN_TIMES;
export const SUN_WHEN = {
  up: { q: 'When does the sun come up?', right: 'morning' },
  down: { q: 'When does the sun go down?', right: 'evening' },
} as const satisfies Record<string, { q: string; right: SunTime }>;
export const NOON_Q = 'Where is the sun at noon?';
/** The three pictures for "Where is the sun at noon?": only one has the sun high. */
export const SUN_SPOTS = ['high', 'low', 'gone'] as const;
export type SunSpot = (typeof SUN_SPOTS)[number];
export const SUN_LESSON = ['The sun comes up in the morning.', 'At noon, it is high in the sky.', 'In the evening, it goes down.'] as const;
