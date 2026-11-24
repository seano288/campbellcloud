// The long words: each written as its syllables, with one agreed set of break points, and its picture if it has one plain enough to read
// it by. Plain data, no game code.
//
// How a word is written here: syllables between bars ('rab|bit'); a plus marks the joint of two small words (compounds: 'sun+set'). The
// breaks follow a school dictionary's end-of-line breaks (Merriam-Webster's) where they agree with the structured-literacy rules: two
// consonants in the middle split between them (nap|kin, rab|bit), a digraph never splits (rock|et, chick|en), one consonant in the middle
// goes with the second syllable when the first vowel says its name (ti|ger) and with the first when it's short (cab|in), and a
// consonant-le syllable takes the consonant before it (tur|tle). A word whose break is argued over is left out (ARGUED below).
//
// Every syllable is made of sounds he has met (sounds.ts): Dino Dig's, and the open, consonant-le and final-y syllables, each met in a
// Meeting here first. Unstressed syllables often say a softer vowel (the "et" in rocket, the "o" in octopus): that is how every long word
// sounds, and the voice says each syllable as it sounds in its word (tools/make_voice.py).
//
// Pictures: Apple emoji, only where the picture is plainly that word to a six-year-old (Dino Dig's rule). LOOK_ALIKE lists pictures one
// name could fit; they are never offered side by side.

export interface LongWord {
  readonly word: string;
  readonly syls: readonly string[];
  /** Two small words joined (sun+set): the break is at the joint. */
  readonly compound: boolean;
  readonly pic?: string;
}

const ENTRIES = [
  // ---------- one beat (How Many Containers only; Dino Dig's pictured words) ----------
  'ship 🚢', 'frog 🐸', 'cake 🎂', 'tree 🌳', 'star ⭐', 'fish 🐟', 'boat', 'drum 🥁', 'crab 🦀', 'sock 🧦', 'bike 🚲', 'kite 🪁',
  'snail 🐌', 'train 🚂', 'truck 🚚', 'bird 🐦', 'shell 🐚', 'nest 🪺', 'bone 🦴', 'goat 🐐', 'shark 🦈', 'corn 🌽', 'sheep 🐑', 'tent ⛺',
  'skunk 🦨', 'milk 🥛', 'snake 🐍', 'flag 🚩', 'brush 🪥', 'fork 🍴',

  // ---------- two beats: small words joined ----------
  'sun+set 🌅', 'cup+cake 🧁', 'pan+cake 🥞', 'hot+dog 🌭', 'back+pack 🎒', 'bath+tub 🛁', 'lap+top 💻', 'lip+stick 💄', 'hand+bag 👜',
  'pad+lock 🔒', 'sun+rise 🌄', 'cob+web 🕸️', 'pig+pen', 'gum+drop', 'hand+stand', 'bed+time', 'in+side', 'cat+nap', 'dust+pan',
  'sand+box', 'hill+top', 'sun+lamp', 'pop+corn 🍿', 'snow+man ⛄', 'sail+boat ⛵', 'rain+bow 🌈', 'tea+pot 🫖', 'pea+nut 🥜',
  'mail+box 📫', 'snow+flake ❄️', 'star+fish', 'sea+weed', 'rain+coat', 'pin+wheel', 'bird+bath', 'farm+yard',
  'oat+meal', 'day+time', 'road+map', 'sheep+dog', 'pine+cone',

  // ---------- two beats: twin letters in the middle ----------
  'rab|bit 🐇', 'kit|ten', 'mit|ten 🧤', 'muf|fin', 'ten|nis 🎾', 'rib|bon 🎀', 'sum|mit', 'hap|pen', 'pup|pet', 
  'muf|fin', 'traf|fic', 
  // ---------- two beats: two different letters in the middle ----------
  'nap|kin', 'pic|nic', 'bas|ket 🧺', 'pump|kin 🎃', 'cac|tus 🌵', 'trum|pet 🎺', 'mag|net 🧲', 'hel|met ⛑️', 'den|tist', 'in|sect',
  'plas|tic', 'prob|lem', 'con|test', 'sand|wich 🥪', 'pret|zel 🥨', 'nut|meg', 'fab|ric', 'ab|sent', 'at|las', 'un|til', 'in|vent',
  'chil|dren', 'pub|lic', 'tin|sel', 
  // ---------- two beats: one letter in the middle, a short first vowel (cab|in) ----------
  'cab|in', 'wag|on', 'rob|in', 'plan|et 🪐', 'com|et ☄️', 'fin|ish', 'vis|it', 'hab|it', 'pan|ic', 'sal|ad 🥗', 'lim|it', 
  'lev|el', 'mod|el', 'rap|id', 'rad|ish', 'sol|id', 
  'rock|et 🚀', 'tick|et 🎫', 'jack|et 🧥', 'buck|et 🪣', 'pock|et', 'chick|en 🐔', 'pack|et', 'lock|et', 
  // ---------- two beats: one letter in the middle, a first vowel that says its name (ti|ger) ----------
  'ti|ger 🐅', 'ro|bot 🤖', 'mu|sic 🎵', 'ba|con 🥓', 'pa|per 📄', 'si|lent', 'hu|man', 'ho|tel 🏨', 'fi|nal',
  'pi|lot', 'ze|ro', 'mo|ment', 'pu|pil', 'pre|tend', 'so|lo', 'ru|by', 'ba|by 👶', 'ti|ny', 
  'li|on 🦁', 'car|go', 
  // ---------- two beats: a consonant-le at the end ----------
  'tur|tle 🐢', 'ap|ple 🍎', 'can|dle 🕯️', 'pur|ple', 'puz|zle 🧩', 'bub|ble 🫧', 'bee|tle 🪲', 'nee|dle 🪡', 'ea|gle 🦅', 'bot|tle 🍼',
  'ket|tle', 'lit|tle', 'mid|dle', 'rid|dle', 'ta|ble', 'ca|ble', 'sim|ple', 'jun|gle', 'tum|ble', 'pud|dle', 'pad|dle',
  'hur|dle', 'cra|dle', 'ti|tle', 'pim|ple',
  // ---------- two beats: a y at the end that says ee ----------
  'hap|py', 'bun|ny', 'pup|py', 'fun|ny', 'sun|ny', 'sil|ly', 'jel|ly', 'can|dy 🍬', 'pen|ny', 'fluf|fy', 'mud|dy', 
  'mes|sy', 'hob|by', 'jol|ly', 'par|ty 🥳', 
  // ---------- two beats: bossy r ----------
  'gar|den', 'mar|ket', 'car|pet', 'tar|get 🎯', 'gar|lic 🧄', 'bar|ber', 'ar|tist', 'cor|ner', 'tur|nip', 'thir|teen',
  'per|fect', 'sis|ter', 'win|ter', 'sum|mer', 'din|ner', 'let|ter ✉️', 'lad|der 🪜', 'ham|mer 🔨', 'but|ter 🧈', 'pep|per 🌶️',
  'sil|ver', 'num|ber', 'ham|ster 🐹', 'lob|ster 🦞', 'riv|er', 'clev|er', 'nev|er', 'chap|ter', 'blis|ter', 'zip|per', 'sup|per',
  'mar|ble', 'har|vest', 'or|bit', 'for|got', 
  

  // ---------- three beats ----------
  'fan|tas|tic', 'mag|net|ic', 'grass+hop|per 🦗', 'pep|per|mint', 'car|pen|ter', 'thun|der|storm ⛈️', 'bar|ber|shop', 'lum|ber|jack',
  'fish|er|man', 'hum|ming|bird', 'snap|drag|on', 'oc|to|pus 🐙', 'pine+ap|ple 🍍', 'po|ta|to 🥔', 'vi|o|lin 🎻', 'croc|o|dile 🐊',
  'tel|e|scope 🔭', 'mi|cro|scope 🔬', 'sat|el|lite 🛰️', 'vol|ca|no 🌋', 'u|ni|corn 🦄', 'in|ter|net', 'un|hap|py',
   
  // ---------- four beats ----------
  'hel|i|cop|ter 🚁', 'kin|der|gar|ten', 'in|vis|i|ble', 
] as const;

/** Words whose break is argued over, even between dictionaries, or whose sounds don't follow the rules. Never on the table. */
export const ARGUED: Readonly<Record<string, string>> = {
  lemon: 'lem-on or le-mon', melon: 'mel-on or me-lon', every: 'ev-ery or ev-er-y; two or three beats', family: 'fam-i-ly or fam-ly',
  different: 'dif-fer-ent or dif-frent', seven: 'sev-en or se-ven', camel: 'cam-el or ca-mel', hamburger: 'ham-burg-er (dictionary) or ham-bur-ger (school)',
  burger: 'burg-er or bur-ger', surfer: 'surf-er or sur-fer', morning: 'morn-ing or mor-ning', forest: 'for-est or fo-rest', carrot: 'car-rot: a is short, not ar',
  parrot: 'par-rot: a is short, not ar', zebra: 'ze-bra: the a says uh', panda: 'pan-da: the a says uh', sofa: 'so-fa: the a says uh', banana: 'the a says uh',
  tomato: 'to-ma-to: ma said two ways', piano: 'pi says pee', lollipop: 'lol-li-pop or lol-ly-pop', dragon: 'frightening', spider: 'frightening',
  lizard: 'ard says erd', doctor: 'or says er', dollar: 'ar says er', water: 'wa says wah', waffle: 'wa says wah', monkey: 'ey', donkey: 'ey',
  cookie: 'oo and ie', rooster: 'oo', butterfly: 'y says i', strawberry: 'aw', blueberry: 'ue', pickle: 'pick-le, ckle', castle: 'silent t',
  pencil: 'soft c', circus: 'soft c', bagel: 'soft g', elephant: 'ph', dolphin: 'ph', penguin: 'gu', squirrel: 'qu and irr',
  kitchen: 'kitch-en (dictionary) or kit-chen (school)', dirty: 'dirt-y or dir-ty', shorten: 'short-en or shor-ten', holiday: 'the i says uh or ee',
  polish: 'said two ways (Polish)', medal: 'said like metal', metal: 'said like medal', pedal: 'said like peddle', cherry: 'cher says chair, not the er of her',
  berry: 'ber says bear, not the er of her', taco: 'ta says tah, not the name of a',
};

/** Left out for what they mean or how they sound alone, not their breaks. */
export const NOT_HERE: Readonly<Record<string, string>> = {
  goblin: 'frightening', bandit: 'frightening', monster: 'frightening', turkey: 'ey is a sound he has not met', peacock: 'a rude syllable alone',
  bumblebee: 'a rude syllable alone', hornet: 'its first syllable alone sounds like a rude word', wonderland: 'won says wun',
  sunflower: 'ow as in cow is not met', cinema: 'soft c', armor: 'or says er', starlight: 'igh is not met', muscle: 'silent c',
  velvet: 'the voice says vel alone as "they\'ll"', hammerhead: 'ea says e', sturdy: 'a rude word hides inside it', turbo: 'slang', fortress: 'a fort for war',
  // an open syllable said two ways: o in open but uh in violin, e in even but uh in telescope, a in acorn but uh in salamander (each
  // syllable has one clip, and the picture words were kept)
  open: 'o said two ways (violin)', even: 'e said two ways (telescope)', acorn: 'a said two ways', maple: 'ma said two ways (armadillo)',
  total: 'to said two ways (octopus)', pony: 'po said two ways (potato)', salamander: 'a said uh', armadillo: 'ma said muh',
};

// ---------- reading the entries ----------

function read(entry: string): LongWord {
  const [spelt, pic] = entry.split(' ') as [string, string | undefined];
  const compound = spelt.includes('+');
  const syls = spelt.split(/[|+]/);
  return { word: syls.join(''), syls, compound, ...(pic && { pic }) };
}

const seen = new Set<string>();
/** The table: every word once, in the order above. */
export const WORDS: readonly LongWord[] = ENTRIES.map(read).filter(w => {
  if (seen.has(w.word)) return false;
  seen.add(w.word);
  return true;
});
export const wordOf = (w: string): LongWord => WORDS.find(x => x.word === w)!;
export const isTableWord = (x: unknown): x is string => typeof x === 'string' && WORDS.some(w => w.word === x);
/** Every syllable on the table, each once. */
export const SYLLABLES: readonly string[] = [...new Set(WORDS.flatMap(w => w.syls))];

/** Pictures one name could fit, or that look alike: never two from one group side by side (no rabbit beside bunny). */
export const LOOK_ALIKE: readonly (readonly string[])[] = [
  ['sunset', 'sunrise'], ['telescope', 'microscope'], ['rabbit', 'bunny'], ['cupcake', 'muffin'], ['basket', 'bucket'], ['kitten', 'puppy'],
  ['rocket', 'satellite', 'comet', 'planet'], ['sailboat', 'boat', 'ship'], ['jacket', 'mitten'], ['snowman', 'snowflake'], ['bird', 'eagle', 'chicken'],
  ['lobster', 'crab', 'shrimp'], ['beetle', 'grasshopper'], ['thunderstorm', 'rainbow'], ['padlock', 'locket'],
  ['bottle', 'milk'], ['tiger', 'lion'], ['crocodile', 'turtle'],
];
export const pictureClash = (a: string, b: string) => a === b || LOOK_ALIKE.some(g => g.includes(a) && g.includes(b));
