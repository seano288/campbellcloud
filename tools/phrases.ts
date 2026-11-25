// Prints the phrase list as JSON for tools/make_voice.py.
export {};
const name = process.argv[process.argv.indexOf('--collection') + 1];
const collections = {
  money: async () => (await import('../src/voice/phrases')).PHRASES,
  subject: async () => (await import('../src/modes/phrases')).SUBJECT_PHRASES,
  garage: async () => (await import('../src/garage/phrases')).GARAGE_PHRASES,
  trophies: async () => (await import('../src/trophies/phrases')).TROPHY_PHRASES,
  presentation: async () => (await import('../src/app/presentationPhrases')).PRESENTATION_PHRASES,
  payment: async () => (await import('../src/modes/pay/phrases')).PAYMENT_PHRASES,
  inspection: async () => (await import('../src/money/phrases')).MONEY_INSPECTION_PHRASES,
  amounts: async () => (await import('../src/voice/amount')).allAmountPieces(),
  'time-flies': async () => (await import('../src/time-flies/phrases')).PHRASES,
  purrdoku: async () => (await import('../src/purrdoku/phrases')).PHRASES,
  'chop-chop': async () => (await import('../src/chop-chop/phrases')).PHRASES,
  'sight-squad': async () => (await import('../src/sight-squad/phrases')).PHRASES,
  'math-bots': async () => (await import('../src/math-bots/phrases')).PHRASES,
  'rover-code': async () => (await import('../src/rover-code/phrases')).PHRASES,
  'treasure-fleet': async () => (await import('../src/treasure-fleet/phrases')).PHRASES,
  'wild-rescue': async () => (await import('../src/wild-rescue/phrases')).PHRASES,
  'sentence-express': async () => (await import('../src/sentence-express/phrases')).PHRASES,
  'word-wreckers': async () => (await import('../src/word-wreckers/phrases')).PHRASES,
  'turbo-tally': async () => (await import('../src/turbo-tally/phrases')).PHRASES,
  'hook-and-ladder': async () => (await import('../src/hook-and-ladder/phrases')).PHRASES,
  'dino-dig': async () => (await import('../src/dino-dig/phrases')).PHRASES,
  'food-truck': async () => (await import('../src/food-truck/phrases')).PHRASES,
  'deep-light': async () => (await import('../src/deep-light/phrases')).PHRASES,
  'sky-writer': async () => (await import('../src/sky-writer/phrases')).PHRASES,
  skyline: async () => (await import('../src/skyline/phrases')).PHRASES,
  jetway: async () => (await import('../src/jetway/phrases')).PHRASES,
  'carrier-deck': async () => (await import('../src/carrier-deck/phrases')).PHRASES,
  'cargo-words': async () => (await import('../src/cargo-words/phrases')).PHRASES,
  'moon-base-mail': async () => (await import('../src/moon-base-mail/phrases')).PHRASES,
  'globe-hopper': async () => (await import('../src/globe-hopper/phrases')).PHRASES,
  'coaster-crew': async () => (await import('../src/coaster-crew/phrases')).PHRASES,
  'dragon-roost': async () => (await import('../src/dragon-roost/phrases')).PHRASES,
};
if (!name || !Object.hasOwn(collections, name)) throw new Error(`Select --collection ${Object.keys(collections).join('|')}`);
const phrases = await collections[name as keyof typeof collections]();

process.stdout.write(JSON.stringify([...new Set(phrases)]));
