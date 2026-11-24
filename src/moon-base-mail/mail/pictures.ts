// The pictures a question can show: each key is an emoji, or a picture drawn in code ("art:dome", art/pics.tsx). A crew member's picture
// carries their name, which he can read. `match` is what the picture names, so the tests can tell whether a picture choice names
// something in the letter (a wrong answer in Read the Mail must; an inference's answer must not be written in it).
export interface Pic { readonly show: string; readonly name?: string; readonly match: readonly string[] }
const p = (show: string, match: string | readonly string[], name?: string): Pic => ({ show, match: typeof match === 'string' ? [match] : match, ...(name && { name }) });

export const PICS: Readonly<Record<string, Pic>> = {
  // the crew
  Ava: p('👩‍🚀', 'Ava', 'Ava'), Sam: p('👨‍🚀', 'Sam', 'Sam'), Kit: p('👩🏽‍🚀', 'Kit', 'Kit'), Ben: p('👨🏾‍🚀', 'Ben', 'Ben'), Jo: p('🧑🏼‍🚀', 'Jo', 'Jo'),
  robot: p('🤖', ['robot', 'Dot'], 'Dot'), cat: p('🐈', ['cat', 'Pip'], 'Pip'), crew: p('art:crew', 'crew'), mom: p('👩', 'mom'),
  // the base and the moon
  dome: p('art:dome', 'dome'), greendome: p('art:greendome', 'green dome'), base: p('art:base', 'base'), hatch: p('art:hatch', 'hatch'),
  rover: p('art:rover', 'rover'), lander: p('art:lander', 'lander'), suit: p('art:suit', 'suit'), helmet: p('art:helmet', 'helmet'),
  boots: p('🥾', 'boots'), crater: p('art:crater', 'crater'), dust: p('art:dust', 'dust'), dustman: p('art:dustman', 'dust man'),
  outside: p('art:outside', 'outside'), storm: p('art:storm', 'storm'), moon: p('🌕', 'moon'), Earth: p('🌍', 'Earth'),
  sun: p('☀️', 'sun'), star: p('⭐', 'star'), planet: p('🪐', 'planet'), telescope: p('🔭', 'telescope'), night: p('🌙', 'night'),
  sunny: p('🌞', 'sunny'), light: p('💡', ['light', 'lights']), liftoff: p('🚀', 'went up'), rocket: p('🚀', 'rocket'), flag: p('🚩', 'flag'),
  rock: p('🪨', 'rock'), hill: p('⛰️', 'hill'), water: p('💧', 'water'),
  // things
  box: p('📦', 'box'), bag: p('👜', 'bag'), mitten: p('🧤', 'mitten'), bed: p('🛏️', 'bed'), bike: p('🚲', 'bike'), cup: p('🥤', 'cup'),
  letter: p('✉️', 'letter'), mail: p('📬', 'mail'), ball: p('⚽', 'ball'), bath: p('🛁', 'bath'), brush: p('🖌️', 'brush'),
  paint: p('🪣', 'paint'), painting: p('🎨', 'painting'), fork: p('🍴', 'fork'), table: p('🪑', 'table'), dish: p('🥣', 'dish'),
  seeds: p('art:seeds', 'seeds'), pot: p('art:pot', 'pot'), plant: p('🌱', ['plant', 'plants']), planting: p('🧑‍🌾', 'planting'),
  pepper: p('🌶️', ['pepper', 'peppers']), dirt: p('art:dirt', 'dirt'), candle: p('🕯️', 'candle'),
  // food
  pancake: p('🥞', ['pancake', 'pancakes']), cake: p('🎂', 'cake'), muffin: p('🧁', ['muffin', 'muffins']), fish: p('🐟', 'fish'),
  food: p('🍲', 'food'), catfood: p('art:catfood', 'cat food'), lunch: p('🥪', 'lunch'), dinner: p('🍽️', 'dinner'),
  // doing and feeling
  sleep: p('😴', 'sleep'), sleepy: p('🥱', 'sleepy'), eat: p('😋', 'eat'), dig: p('⛏️', 'dig'), happy: p('😀', 'happy'), scared: p('😨', 'scared'),
};
export const picOf = (key: string): Pic => PICS[key] ?? { show: '❓', match: [key] };
