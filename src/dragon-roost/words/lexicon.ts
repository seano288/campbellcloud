// Dragon Roost's words: every word a question can show, with its job (noun, verb, adjective), its picture where one is plain, and, for
// a noun, whether it names a person, an animal, a place or a thing. Plain data, no game code.
//
// The one-job rule (the brief's first risk): many short words do two jobs (fly, play, run, jump, park, orange, cold, rock, kick). Each
// such word lists both jobs here and is never a choice in a Level 1 question, where it stands alone and either job would be fair. It may
// appear in a sentence, where its job is plain and recorded (sentences.ts). TWO_JOBS below names the brief's own examples and the ones a
// first grader would plausibly use the other way, and words.test.ts checks none of them is marked with one job.
//
// Every word here is one he can read: a Sight Squad, Dino Dig, Word Wreckers or Cargo Words word (or one of those with a plain -s, -ed or
// -ing), or one of this game's own words (allowed.ts), each met first with its picture and the voice.

export type Job = 'noun' | 'verb' | 'adj';
export type Cat = 'person' | 'animal' | 'place' | 'thing';
export interface Lex { readonly w: string; readonly jobs: readonly Job[]; readonly cat?: Cat; readonly pic?: string }

const n = (w: string, cat: Cat, pic?: string): Lex => ({ w, jobs: ['noun'], cat, ...(pic && { pic }) });
const v = (w: string, pic?: string): Lex => ({ w, jobs: ['verb'], ...(pic && { pic }) });
const a = (w: string, pic?: string): Lex => ({ w, jobs: ['adj'], ...(pic && { pic }) });
const two = (w: string, jobs: Job[], pic?: string, cat?: Cat): Lex => ({ w, jobs, ...(pic && { pic }), ...(cat && { cat }) });

/** Words with one job. Only these are ever choices on their own (Level 1). */
export const ONE_JOB: readonly Lex[] = [
  // people
  n('king', 'person', '🤴'), n('girl', 'person', '👧'), n('sister', 'person', '👧'), n('dentist', 'person'),
  n('barber', 'person', '💈'), n('carpenter', 'person', '🪚'), n('fisherman', 'person', '🎣'), n('lumberjack', 'person', '🪓'),
  // animals (no cat: the voice says a lone "cat" as "Kate")
  n('dog', 'animal', '🐕'), n('pig', 'animal', '🐖'), n('hen', 'animal', '🐔'), n('goat', 'animal', '🐐'), n('sheep', 'animal', '🐑'),
  n('crab', 'animal', '🦀'), n('snail', 'animal', '🐌'), n('bird', 'animal', '🐦'), n('skunk', 'animal', '🦨'), n('shark', 'animal', '🦈'),
  n('rabbit', 'animal', '🐇'), n('kitten', 'animal', '🐈'), n('tiger', 'animal', '🐅'), n('lion', 'animal', '🦁'), n('turtle', 'animal', '🐢'),
  n('robin', 'animal', '🐦'), n('chicken', 'animal', '🐔'), n('puppy', 'animal', '🐶'), n('bunny', 'animal', '🐰'), n('octopus', 'animal', '🐙'),
  n('eagle', 'animal', '🦅'), n('hamster', 'animal', '🐹'), n('lobster', 'animal', '🦞'), n('crocodile', 'animal', '🐊'), n('frog', 'animal', '🐸'),
  n('goose', 'animal', '🪿'), n('mouse', 'animal', '🐭'), n('deer', 'animal', '🦌'),
  // places
  n('barn', 'place', '🛖'), n('pond', 'place'), n('hill', 'place', '⛰️'), n('cabin', 'place', '🛖'), n('hotel', 'place', '🏨'), n('street', 'place', '🛣️'),
  n('church', 'place', '⛪'), n('jungle', 'place', '🌴'), n('farmyard', 'place'), n('lake', 'place'), n('kindergarten', 'place', '🏫'),
  // things
  n('cup', 'thing', '🥤'), n('hat', 'thing', '🎩'), n('bed', 'thing', '🛏️'), n('kite', 'thing', '🪁'), n('cake', 'thing', '🎂'), n('sock', 'thing', '🧦'),
  n('pen', 'thing', '🖊️'), n('jar', 'thing', '🫙'), n('shirt', 'thing', '👕'), n('basket', 'thing', '🧺'), n('helmet', 'thing', '⛑️'), n('ticket', 'thing', '🎫'),
  n('jacket', 'thing', '🧥'), n('pocket', 'thing'), n('wagon', 'thing'), n('candle', 'thing', '🕯️'), n('ladder', 'thing', '🪜'), n('ribbon', 'thing', '🎀'),
  n('mitten', 'thing', '🧤'), n('sandwich', 'thing', '🥪'), n('pretzel', 'thing', '🥨'), n('robot', 'thing', '🤖'), n('globe', 'thing', '🌐'), n('coat', 'thing', '🧥'),
  n('lamp', 'thing'), n('desk', 'thing'), n('gift', 'thing', '🎁'), n('apple', 'thing', '🍎'), n('cupcake', 'thing', '🧁'), n('pancake', 'thing', '🥞'),
  n('backpack', 'thing', '🎒'), n('teapot', 'thing', '🫖'), n('mailbox', 'thing', '📫'), n('raincoat', 'thing'), n('pumpkin', 'thing', '🎃'), n('muffin', 'thing'),
  n('egg', 'thing', '🥚'), n('wing', 'thing'), n('tooth', 'thing', '🦷'), n('foot', 'thing', '🦶'), n('bone', 'thing', '🦴'), n('shell', 'thing', '🐚'),
  n('dragon', 'animal', '🐉'),
  // verbs that are never names of things
  v('see', '👀'), v('eat', '🍽️'), v('go'), v('come'), v('find'), v('make'), v('get'), v('sit'), v('grab'), v('grow'), v('speak'), v('think'),
  v('fill'), v('save'), v('sell'), v('thank'), v('happen'), v('invent'), v('dig'), v('hide'), v('tell'),
  // adjectives that are never names of things or doing words
  a('big'), a('little'), a('tiny'), a('funny'), a('happy'), a('silly'), a('sunny'), a('muddy'), a('jolly'), a('sharp'), a('smart'), a('short'),
  a('thick'), a('soft'), a('careful'), a('helpful'), a('unhappy'), a('useful'), a('playful'), a('clever'), a('rapid'), a('silent'), a('simple'),
  a('new'), a('good'), a('cute'), a('rich'), a('invisible'), a('fantastic'), a('spotless'), a('endless'), a('harmless'), a('hopeful'), a('thankful'),
  a('unsafe'), a('long'),
];

/** Words only ever shown in a sentence, where their job is marked: words with two jobs, and a few nouns kept out of the choices. */
export const TWO_JOB: readonly Lex[] = [
  // the brief's examples
  two('fly', ['verb', 'noun']), two('play', ['verb', 'noun']), two('run', ['verb', 'noun']), two('jump', ['verb', 'noun']), two('park', ['noun', 'verb'], undefined, 'place'),
  two('orange', ['noun', 'adj']), two('cold', ['adj', 'noun']), two('water', ['noun', 'verb']),
  // the dragon's own doing words, all names of things too ("a roar", "a loop")
  two('roar', ['verb', 'noun']), two('glide', ['verb', 'noun']), two('flap', ['verb', 'noun']), two('loop', ['verb', 'noun']), two('dive', ['verb', 'noun']),
  two('roost', ['noun', 'verb'], '🏔️', 'place'), two('flame', ['noun', 'verb'], '🔥', 'thing'), two('nest', ['noun', 'verb'], '🪺'),
  // doing words that also name things
  two('swim', ['verb', 'noun']), two('hop', ['verb', 'noun']), two('kick', ['verb', 'noun']), two('clap', ['verb', 'noun']), two('hug', ['verb', 'noun']),
  two('spin', ['verb', 'noun']), two('sleep', ['verb', 'noun']), two('dream', ['verb', 'noun']), two('smile', ['verb', 'noun']), two('skate', ['verb', 'noun']),
  two('slide', ['verb', 'noun']), two('ride', ['verb', 'noun']), two('drive', ['verb', 'noun']), two('blow', ['verb', 'noun']), two('show', ['verb', 'noun']),
  two('paint', ['verb', 'noun']), two('plant', ['verb', 'noun']), two('shop', ['verb', 'noun']), two('chop', ['verb', 'noun']), two('start', ['verb', 'noun']),
  two('walk', ['verb', 'noun']), two('help', ['verb', 'noun']), two('look', ['verb', 'noun']), two('rest', ['verb', 'noun']), two('visit', ['verb', 'noun']),
  two('hurt', ['verb', 'adj']), two('like', ['verb']), two('have', ['verb']), two('want', ['verb', 'noun']), two('snap', ['verb', 'noun']),
  two('splash', ['verb', 'noun']), two('wave', ['verb', 'noun']), two('wink', ['verb', 'noun']), two('nod', ['verb', 'noun']), two('wiggle', ['verb', 'noun']),
  two('tumble', ['verb', 'noun']), two('spray', ['verb', 'noun']), two('dance', ['verb', 'noun']), two('hatch', ['verb', 'noun']),
  // things that are also doing words
  two('rock', ['noun', 'verb'], '🪨', 'thing'), two('box', ['noun', 'verb'], '📦', 'thing'), two('map', ['noun', 'verb'], '🗺️', 'thing'), two('drum', ['noun', 'verb'], '🥁', 'thing'),
  two('bike', ['noun', 'verb'], '🚲', 'thing'), two('duck', ['noun', 'verb'], '🦆', 'animal'), two('seal', ['noun', 'verb'], '🦭', 'animal'), two('fish', ['noun', 'verb'], '🐟', 'animal'),
  two('farm', ['noun', 'verb'], undefined, 'place'), two('garden', ['noun', 'verb'], undefined, 'place'), two('market', ['noun', 'verb'], undefined, 'place'),
  two('rocket', ['noun', 'verb'], '🚀', 'thing'), two('kid', ['noun', 'verb'], undefined, 'person'), two('cave', ['noun', 'verb'], undefined, 'place'),
  two('snow', ['noun', 'verb'], '❄️', 'thing'), two('star', ['noun', 'verb'], '⭐', 'thing'), two('storm', ['noun', 'verb'], '⛈️', 'thing'),
  two('mud', ['noun']), two('grass', ['noun']), two('sky', ['noun']), two('tail', ['noun']), two('trick', ['noun', 'verb']), two('bath', ['noun', 'verb']),
  two('ball', ['noun', 'verb'], '⚽', 'thing'), two('cub', ['noun']), two('shed', ['noun', 'verb']), two('tree', ['noun', 'verb']), two('sun', ['noun', 'verb']),
  two('bag', ['noun', 'verb']), two('man', ['noun', 'verb']), two('woman', ['noun']), two('child', ['noun']),
  // describing words that also name things or say what happens
  two('red', ['adj', 'noun']), two('blue', ['adj', 'noun']), two('green', ['adj', 'noun']), two('yellow', ['adj', 'noun']), two('black', ['adj', 'noun']),
  two('white', ['adj', 'noun']), two('brown', ['adj', 'noun']), two('purple', ['adj', 'noun']), two('dark', ['adj', 'noun']), two('fast', ['adj', 'verb']),
  two('wet', ['adj', 'verb']), two('clean', ['adj', 'verb']), two('safe', ['adj', 'noun']), two('solid', ['adj', 'noun']), two('perfect', ['adj', 'verb']),
  two('hot', ['adj']), two('well', ['adj', 'noun']),
  // naming or doing words a first grader also uses to describe: "a baby dragon", "a pretend castle"
  two('baby', ['noun', 'adj'], '👶', 'person'), two('pretend', ['verb', 'adj']),
];

/** Words a first grader would plausibly use as another job. None may be a choice on its own (words.test.ts). */
export const TWO_JOBS: readonly string[] = [
  'fly', 'play', 'run', 'jump', 'water', 'park', 'orange', 'cold', 'rock', 'kick', 'hug', 'swim', 'hop', 'clap', 'sleep', 'dream', 'smile', 'ride', 'drive', 'paint',
  'plant', 'walk', 'help', 'look', 'roar', 'loop', 'dive', 'glide', 'flap', 'spin', 'slide', 'skate', 'box', 'drum', 'bike', 'duck', 'seal', 'fish', 'farm', 'nest',
  'roost', 'flame', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'purple', 'dark', 'fast', 'wet', 'clean', 'safe', 'snow', 'star', 'storm', 'kid',
  'cave', 'map', 'rocket', 'garden', 'market', 'shop', 'chop', 'start', 'rest', 'visit', 'hurt', 'want', 'show', 'blow', 'snap', 'trick', 'bath', 'ball', 'man',
  'well', 'perfect', 'solid', 'dance', 'wave', 'hatch', 'tree', 'sun', 'shed', 'bag', 'baby', 'pretend',
];

export const LEXICON: readonly Lex[] = [...ONE_JOB, ...TWO_JOB];
const byWord = new Map(LEXICON.map(l => [l.w, l]));
export const lex = (w: string): Lex | undefined => byWord.get(w.toLowerCase());
export const oneJob = (job: Job) => ONE_JOB.filter(l => l.jobs.length === 1 && l.jobs[0] === job);
/** Nouns for "Is it a person, an animal, a place or a thing?": one job, and plainly one of the four (no dragon: is it an animal?). */
export const SORTABLE = ONE_JOB.filter(l => l.cat && l.w !== 'dragon' && l.w !== 'egg' && l.w !== 'wing');

export const CATS: readonly Cat[] = ['person', 'animal', 'place', 'thing'];
export const CAT_PICS: Record<Cat, string> = { person: '🧑', animal: '🐾', place: '🏞️', thing: '🧸' };
