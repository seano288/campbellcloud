// The pictures: one emoji per word, used only where the emoji is unmistakable on an Apple device (the family iPad and iPhone), as
// in the Dino Dig brief. A word missing from this table is shown as its written word on a tile, never as a guess at a picture.
// Plain data, no game code. words.test.ts checks that no two words share a picture (except the few listed in SAME_THING, which
// are the same thing called two ways) and that every emoji here is from Emoji 14 or earlier, so iPadOS 15 on the iPad 9 draws it.
//
// Words that only ever appear in one size (big, little) or as a set (two dogs) are drawn from these in code, not given their own.

export const PICTURES = {
  // compounds (the word they make)
  'fire truck': '🚒', rainbow: '🌈', football: '🏈', snowman: '⛄', sunflower: '🌻', cupcake: '🧁', popcorn: '🍿', sailboat: '⛵',
  snowflake: '❄️', toothbrush: '🪥', mailbox: '📫', pancake: '🥞', sunglasses: '🕶️', backpack: '🎒', bathtub: '🛁', footprint: '👣',
  headphones: '🎧', airplane: '✈️', wheelchair: '🦽', skateboard: '🛹', watermelon: '🍉', blueberry: '🫐', basketball: '🏀',
  cowboy: '🤠', seashell: '🐚', handbag: '👜',
  // the halves of compounds that have a clear picture
  fire: '🔥', truck: '🚚', foot: '🦶', ball: '⚽', sun: '☀️', flower: '🌸', cake: '🍰', corn: '🌽', tooth: '🦷', box: '📦', glasses: '👓',
  wheel: '🛞', chair: '🪑', water: '💧', melon: '🍈', basket: '🧺', cow: '🐄', boy: '👦', man: '👨', rain: '🌧️', hand: '✋',
  // opposites (and the strong words that have one)
  hot: '🥵', cold: '🥶', happy: '😀', sad: '😢', fast: '🐇', slow: '🐌', up: '⬆️', down: '⬇️', day: '🌞', night: '🌙', open: '📖',
  shut: '📕', loud: '📢', quiet: '🤫', laugh: '😂', cry: '😭', left: '⬅️', right: '➡️', smile: '🙂', frown: '☹️', asleep: '😴',
  // Sort It: animals
  dog: '🐕', cat: '🐈', pig: '🐖', horse: '🐎', sheep: '🐑', frog: '🐸', lion: '🦁', bear: '🐻', rabbit: '🐰', mouse: '🐁',
  elephant: '🐘', monkey: '🐒', giraffe: '🦒', zebra: '🦓', snake: '🐍', turtle: '🐢', tiger: '🐅', fox: '🦊', owl: '🦉', bee: '🐝',
  duck: '🦆', bird: '🐦', eagle: '🦅', parrot: '🦜', whale: '🐋', octopus: '🐙', shark: '🦈', camel: '🐫',
  // food
  apple: '🍎', banana: '🍌', grapes: '🍇', carrot: '🥕', bread: '🍞', cookie: '🍪', egg: '🥚', cheese: '🧀', pizza: '🍕', pear: '🍐',
  strawberry: '🍓', lemon: '🍋', donut: '🍩', sandwich: '🥪', pie: '🥧', cherries: '🍒', broccoli: '🥦',
  // clothes
  shirt: '👕', pants: '👖', dress: '👗', sock: '🧦', shoe: '👟', hat: '🎩', coat: '🧥', scarf: '🧣', glove: '🧤', boot: '👢',
  // things that go
  car: '🚗', bus: '🚌', train: '🚂', boat: '🚤', plane: '🛩️', bike: '🚲', helicopter: '🚁', rocket: '🚀', tractor: '🚜',
  scooter: '🛴',
  // body parts
  nose: '👃', ear: '👂', eye: '👁️', leg: '🦵', mouth: '👄', tongue: '👅',
  // Endings: things to count
  cup: '🥤', hen: '🐔', bug: '🐛', book: '📘', tree: '🌳', star: '⭐', bell: '🔔', key: '🔑', drum: '🥁', kite: '🪁',
} as const satisfies Record<string, string>;
export type PicWord = keyof typeof PICTURES;

/** Words that are honestly the same thing, so they may share a picture. */
export const SAME_THING: readonly (readonly [string, string])[] = [];

export const picOf = (word: string): string | null => (PICTURES as Record<string, string>)[word] ?? null;
