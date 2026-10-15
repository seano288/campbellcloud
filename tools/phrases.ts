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
  amounts: async () => (await import('../src/voice/amount')).allAmountPieces(),
};
if (!name || !Object.hasOwn(collections, name)) throw new Error(`Select --collection ${Object.keys(collections).join('|')}`);
const phrases = await collections[name as keyof typeof collections]();

process.stdout.write(JSON.stringify([...new Set(phrases)]));
