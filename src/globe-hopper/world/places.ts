// Places on the Earth: the famous landmarks and animals Famous Places asks about, and every city, river, lake, mountain, volcano, desert,
// island and sea he can photograph from orbit. Tables only, no game code. Positions are longitude and latitude in degrees (to about a
// degree; they only aim the camera and place a pin). Each place says where it is in one plain line ("It is in Africa.", "It is in the
// Pacific Ocean.", "It is between Europe and Africa."), and the famous ones have one true "did you know" line, listed with its source in
// .scratch/globe-hopper/spec.md.
//
// Famous Places asks only about places plainly in one continent: nothing in Turkey, Russia or Egypt's Sinai, and animals only where the
// link is plain (kangaroos and Australia, emperor penguins and Antarctica). places.test.ts checks every famous place's pin is on its own
// continent as the map draws it.
import type { ContinentId } from './continents';
import type { OceanId } from './oceans';

export type Where = { readonly c: ContinentId } | { readonly o: OceanId } | { readonly between: readonly [ContinentId, ContinentId] } | { readonly own: 'greenland' };
export type PlaceKind = 'landmark' | 'animal' | 'city' | 'river' | 'lake' | 'mountain' | 'volcano' | 'desert' | 'land' | 'island' | 'sea' | 'falls';

export interface Place {
  readonly id: string;
  readonly name: string;
  readonly lon: number; readonly lat: number;
  readonly kind: PlaceKind;
  readonly where: Where;
  readonly emoji: string;
  /** Famous Places: the question ("Where are the pyramids?") and its "did you know" line. */
  readonly ask?: string;
  readonly line?: string;
}

const C = (c: ContinentId): Where => ({ c }), O = (o: OceanId): Where => ({ o }), B = (a: ContinentId, b: ContinentId): Where => ({ between: [a, b] });
const p = <const N extends string>(id: string, name: N, lon: number, lat: number, kind: PlaceKind, where: Where, emoji: string, ask?: string, line?: string) =>
  ({ id, name, lon, lat, kind, where, emoji, ...(ask && { ask, line }) }) as Place & { readonly name: N };

const f = <const N extends string, const A extends string, const L extends string>(id: string, name: N, lon: number, lat: number, kind: PlaceKind, where: Where, emoji: string, ask: A, line: L) =>
  ({ id, name, lon, lat, kind, where, emoji, ask, line }) as Place & { readonly name: N; readonly ask: A; readonly line: L };

/** The famous places Famous Places asks about, each plainly on one continent. */
export const FAMOUS = [
  f('pyramids', 'the pyramids', 31.13, 29.98, 'landmark', C('africa'), '🔺', 'Where are the pyramids?', 'The pyramids of Giza were built more than four thousand years ago.'),
  f('greatwall', 'the Great Wall', 116.57, 40.43, 'landmark', C('asia'), '🧱', 'Where is the Great Wall of China?', 'The Great Wall of China is thousands of miles long.'),
  f('eiffel', 'the Eiffel Tower', 2.29, 48.86, 'landmark', C('europe'), '🗼', 'Where is the Eiffel Tower?', 'The Eiffel Tower is in Paris, in France.'),
  f('liberty', 'the Statue of Liberty', -74.04, 40.69, 'landmark', C('namerica'), '🗽', 'Where is the Statue of Liberty?', 'The Statue of Liberty stands in New York Harbor.'),
  f('opera', 'the Sydney Opera House', 151.21, -33.86, 'landmark', C('australia'), '🎭', 'Where is the Sydney Opera House?', 'The roof of the Sydney Opera House looks like sails.'),
  f('machupicchu', 'Machu Picchu', -72.54, -13.16, 'landmark', C('samerica'), '⛰️', 'Where is Machu Picchu?', 'Machu Picchu is an old city high in the Andes mountains.'),
  f('tajmahal', 'the Taj Mahal', 78.04, 27.18, 'landmark', C('asia'), '🕌', 'Where is the Taj Mahal?', 'The Taj Mahal in India is made of white marble.'),
  f('everest', 'Mount Everest', 86.93, 27.99, 'mountain', C('asia'), '🏔️', 'Where is Mount Everest?', 'Mount Everest is the highest mountain in the world.'),
  f('uluru', 'Uluru', 131.04, -25.34, 'landmark', C('australia'), '🪨', 'Where is Uluru?', 'Uluru is a giant red rock in the middle of Australia.'),
  f('kilimanjaro', 'Mount Kilimanjaro', 37.36, -3.07, 'mountain', C('africa'), '🏔️', 'Where is Mount Kilimanjaro?', 'Mount Kilimanjaro is the highest mountain in Africa.'),
  f('amazon', 'the Amazon rainforest', -62, -4, 'land', C('samerica'), '🌳', 'Where is the Amazon rainforest?', 'The Amazon is the biggest rainforest in the world.'),
  f('grandcanyon', 'the Grand Canyon', -112.11, 36.11, 'land', C('namerica'), '🏜️', 'Where is the Grand Canyon?', 'The Colorado River carved the Grand Canyon.'),
  f('niagara', 'Niagara Falls', -79.07, 43.08, 'falls', C('namerica'), '💦', 'Where is Niagara Falls?', 'Niagara Falls is on the border of Canada and the United States.'),
  f('sahara', 'the Sahara', 10, 23, 'desert', C('africa'), '🐪', 'Where is the Sahara?', 'The Sahara is the biggest hot desert in the world.'),
  f('iguazu', 'Iguazu Falls', -54.44, -25.69, 'falls', C('samerica'), '🌊', 'Where is Iguazu Falls?', 'Iguazu Falls is made of hundreds of waterfalls.'),
  f('pisa', 'the Leaning Tower of Pisa', 10.4, 43.72, 'landmark', C('europe'), '🏛️', 'Where is the Leaning Tower of Pisa?', 'The Leaning Tower of Pisa, in Italy, leans to one side.'),
  f('colosseum', 'the Colosseum', 12.49, 41.89, 'landmark', C('europe'), '🏟️', 'Where is the Colosseum?', 'The Colosseum in Rome is almost two thousand years old.'),
  f('fuji', 'Mount Fuji', 138.73, 35.36, 'mountain', C('asia'), '🗻', 'Where is Mount Fuji?', 'Mount Fuji is the tallest mountain in Japan.'),
  f('victoria', 'Victoria Falls', 25.86, -17.92, 'falls', C('africa'), '💧', 'Where is Victoria Falls?', 'Victoria Falls is one of the biggest waterfalls in the world.'),
  f('southpole', 'the South Pole', 0, -89.9, 'land', C('antarctica'), '🧭', 'Where is the South Pole?', 'The South Pole is in Antarctica.'),
  f('bigben', 'Big Ben', -0.12, 51.5, 'landmark', C('europe'), '🕰️', 'Where is Big Ben?', 'Big Ben is a huge bell in a clock tower in London.'),
  f('stonehenge', 'Stonehenge', -1.83, 51.18, 'landmark', C('europe'), '🪨', 'Where is Stonehenge?', 'Stonehenge is a ring of giant stones in England.'),
  f('goldengate', 'the Golden Gate Bridge', -122.48, 37.82, 'landmark', C('namerica'), '🌉', 'Where is the Golden Gate Bridge?', 'The Golden Gate Bridge in San Francisco is painted orange.'),
  f('tablemountain', 'Table Mountain', 18.4, -33.96, 'mountain', C('africa'), '⛰️', 'Where is Table Mountain?', 'Table Mountain has a flat top, like a table.'),
  f('kangaroos', 'kangaroos', 134, -27, 'animal', C('australia'), '🦘', 'Where do kangaroos live in the wild?', 'Kangaroos carry their babies in a pouch.'),
  f('koalas', 'koalas', 147, -30, 'animal', C('australia'), '🐨', 'Where do koalas live in the wild?', 'Koalas eat the leaves of eucalyptus trees.'),
  f('penguins', 'emperor penguins', 60, -75, 'animal', C('antarctica'), '🐧', 'Where do emperor penguins live?', 'Emperor penguins huddle together to keep warm.'),
  f('pandas', 'giant pandas', 103, 31, 'animal', C('asia'), '🐼', 'Where do giant pandas live in the wild?', 'Giant pandas eat bamboo.'),
  f('tigers', 'tigers', 80, 22, 'animal', C('asia'), '🐯', 'Where do tigers live in the wild?', 'Tigers are the biggest cats in the world.'),
  f('zebras', 'zebras', 35, -2, 'animal', C('africa'), '🦓', 'Where do zebras live in the wild?', 'No two zebras have the same stripes.'),
  f('giraffes', 'giraffes', 36, 1, 'animal', C('africa'), '🦒', 'Where do giraffes live in the wild?', 'Giraffes are the tallest animals in the world.'),
  f('platypus', 'the platypus', 148, -36, 'animal', C('australia'), '🦆', 'Where does the platypus live in the wild?', 'The platypus is a mammal that lays eggs.'),
  f('baldeagle', 'bald eagles', -110, 50, 'animal', C('namerica'), '🦅', 'Where do bald eagles live in the wild?', 'The bald eagle is the national bird of the United States.'),
  f('orangutans', 'orangutans', 114, 0.5, 'animal', C('asia'), '🦧', 'Where do orangutans live in the wild?', 'Orangutans spend most of their lives in trees.'),
] as const;

/** Every other place to photograph from orbit. */
export const PHOTO_PLACES = [
  // cities
  p('cairo', 'Cairo', 31.24, 30.04, 'city', C('africa'), '🏙️'), p('nairobi', 'Nairobi', 36.82, -1.29, 'city', C('africa'), '🏙️'),
  p('lagos', 'Lagos', 3.38, 6.52, 'city', C('africa'), '🏙️'), p('capetown', 'Cape Town', 18.42, -33.92, 'city', C('africa'), '🏙️'),
  p('marrakesh', 'Marrakesh', -7.99, 31.63, 'city', C('africa'), '🏙️'), p('accra', 'Accra', -0.19, 5.6, 'city', C('africa'), '🏙️'),
  p('addis', 'Addis Ababa', 38.75, 9.03, 'city', C('africa'), '🏙️'), p('kinshasa', 'Kinshasa', 15.27, -4.44, 'city', C('africa'), '🏙️'),
  p('dakar', 'Dakar', -17.45, 14.69, 'city', C('africa'), '🏙️'),
  p('london', 'London', -0.13, 51.51, 'city', C('europe'), '🏙️'), p('paris', 'Paris', 2.35, 48.86, 'city', C('europe'), '🏙️'),
  p('rome', 'Rome', 12.5, 41.9, 'city', C('europe'), '🏙️'), p('madrid', 'Madrid', -3.7, 40.42, 'city', C('europe'), '🏙️'),
  p('berlin', 'Berlin', 13.4, 52.52, 'city', C('europe'), '🏙️'), p('athens', 'Athens', 23.73, 37.98, 'city', C('europe'), '🏙️'),
  p('amsterdam', 'Amsterdam', 4.9, 52.37, 'city', C('europe'), '🏙️'), p('oslo', 'Oslo', 10.75, 59.91, 'city', C('europe'), '🏙️'),
  p('lisbon', 'Lisbon', -9.14, 38.72, 'city', C('europe'), '🏙️'), p('vienna', 'Vienna', 16.37, 48.21, 'city', C('europe'), '🏙️'),
  p('dublin', 'Dublin', -6.26, 53.35, 'city', C('europe'), '🏙️'), p('stockholm', 'Stockholm', 18.07, 59.33, 'city', C('europe'), '🏙️'),
  p('tokyo', 'Tokyo', 139.69, 35.69, 'city', C('asia'), '🏙️'), p('beijing', 'Beijing', 116.4, 39.9, 'city', C('asia'), '🏙️'),
  p('mumbai', 'Mumbai', 72.88, 19.08, 'city', C('asia'), '🏙️'), p('bangkok', 'Bangkok', 100.5, 13.76, 'city', C('asia'), '🏙️'),
  p('seoul', 'Seoul', 126.98, 37.57, 'city', C('asia'), '🏙️'), p('singapore', 'Singapore', 103.82, 1.35, 'city', C('asia'), '🏙️'),
  p('delhi', 'Delhi', 77.21, 28.61, 'city', C('asia'), '🏙️'), p('shanghai', 'Shanghai', 121.47, 31.23, 'city', C('asia'), '🏙️'),
  p('hanoi', 'Hanoi', 105.85, 21.03, 'city', C('asia'), '🏙️'), p('manila', 'Manila', 120.98, 14.6, 'city', C('asia'), '🏙️'),
  p('dubai', 'Dubai', 55.27, 25.2, 'city', C('asia'), '🏙️'),
  p('newyork', 'New York', -74, 40.71, 'city', C('namerica'), '🏙️'), p('mexicocity', 'Mexico City', -99.13, 19.43, 'city', C('namerica'), '🏙️'),
  p('toronto', 'Toronto', -79.38, 43.65, 'city', C('namerica'), '🏙️'), p('losangeles', 'Los Angeles', -118.24, 34.05, 'city', C('namerica'), '🏙️'),
  p('chicago', 'Chicago', -87.63, 41.88, 'city', C('namerica'), '🏙️'), p('vancouver', 'Vancouver', -123.12, 49.28, 'city', C('namerica'), '🏙️'),
  p('havana', 'Havana', -82.37, 23.11, 'city', C('namerica'), '🏙️'), p('miami', 'Miami', -80.19, 25.76, 'city', C('namerica'), '🏙️'),
  p('washington', 'Washington, D.C.', -77.04, 38.9, 'city', C('namerica'), '🏙️'), p('anchorage', 'Anchorage', -149.9, 61.22, 'city', C('namerica'), '🏙️'),
  p('rio', 'Rio de Janeiro', -43.17, -22.91, 'city', C('samerica'), '🏙️'), p('buenosaires', 'Buenos Aires', -58.38, -34.6, 'city', C('samerica'), '🏙️'),
  p('lima', 'Lima', -77.04, -12.05, 'city', C('samerica'), '🏙️'), p('bogota', 'Bogotá', -74.07, 4.71, 'city', C('samerica'), '🏙️'),
  p('santiago', 'Santiago', -70.67, -33.45, 'city', C('samerica'), '🏙️'), p('quito', 'Quito', -78.47, -0.18, 'city', C('samerica'), '🏙️'),
  p('caracas', 'Caracas', -66.9, 10.48, 'city', C('samerica'), '🏙️'), p('manaus', 'Manaus', -60.02, -3.12, 'city', C('samerica'), '🏙️'),
  p('sydney', 'Sydney', 151.21, -33.87, 'city', C('australia'), '🏙️'), p('melbourne', 'Melbourne', 144.96, -37.81, 'city', C('australia'), '🏙️'),
  p('perth', 'Perth', 115.86, -31.95, 'city', C('australia'), '🏙️'), p('brisbane', 'Brisbane', 153.03, -27.47, 'city', C('australia'), '🏙️'),
  p('darwin', 'Darwin', 130.84, -12.46, 'city', C('australia'), '🏙️'), p('adelaide', 'Adelaide', 138.6, -34.93, 'city', C('australia'), '🏙️'),
  p('alicesprings', 'Alice Springs', 133.88, -23.7, 'city', C('australia'), '🏙️'), p('mcmurdo', 'McMurdo Station', 166.67, -77.85, 'city', C('antarctica'), '🏠'),
  // rivers
  p('nile', 'the Nile', 32.6, 24, 'river', C('africa'), '🏞️'), p('amazonriver', 'the Amazon River', -58, -3, 'river', C('samerica'), '🏞️'),
  p('mississippi', 'the Mississippi', -91, 33, 'river', C('namerica'), '🏞️'), p('yangtze', 'the Yangtze', 112, 30.5, 'river', C('asia'), '🏞️'),
  p('ganges', 'the Ganges', 84, 25.5, 'river', C('asia'), '🏞️'), p('danube', 'the Danube', 19, 45.5, 'river', C('europe'), '🏞️'),
  p('congo', 'the Congo River', 18, -1, 'river', C('africa'), '🏞️'), p('murray', 'the Murray River', 142, -34.2, 'river', C('australia'), '🏞️'),
  p('mekong', 'the Mekong', 105.8, 15, 'river', C('asia'), '🏞️'), p('rhine', 'the Rhine', 7.5, 50.2, 'river', C('europe'), '🏞️'),
  p('mackenzie', 'the Mackenzie River', -125, 63, 'river', C('namerica'), '🏞️'), p('niger', 'the Niger River', -1, 15, 'river', C('africa'), '🏞️'),
  p('zambezi', 'the Zambezi', 30, -16, 'river', C('africa'), '🏞️'), p('orinoco', 'the Orinoco', -64, 8, 'river', C('samerica'), '🏞️'),
  p('yukon', 'the Yukon River', -152, 64.7, 'river', C('namerica'), '🏞️'), p('thames', 'the Thames', -0.5, 51.47, 'river', C('europe'), '🏞️'),
  p('indus', 'the Indus', 68, 26, 'river', C('asia'), '🏞️'), p('yellowriver', 'the Yellow River', 110, 36, 'river', C('asia'), '🏞️'),
  p('riogrande', 'the Rio Grande', -104, 29.5, 'river', C('namerica'), '🏞️'), p('parana', 'the Paraná River', -59, -31, 'river', C('samerica'), '🏞️'),
  // lakes
  p('lakevictoria', 'Lake Victoria', 33, -1, 'lake', C('africa'), '💧'), p('superior', 'Lake Superior', -87.5, 47.7, 'lake', C('namerica'), '💧'),
  p('titicaca', 'Lake Titicaca', -69.4, -15.8, 'lake', C('samerica'), '💧'), p('tanganyika', 'Lake Tanganyika', 29.5, -6, 'lake', C('africa'), '💧'),
  p('saltlake', 'the Great Salt Lake', -112.5, 41.1, 'lake', C('namerica'), '💧'), p('michigan', 'Lake Michigan', -87, 44, 'lake', C('namerica'), '💧'),
  p('geneva', 'Lake Geneva', 6.5, 46.4, 'lake', C('europe'), '💧'), p('deadsea', 'the Dead Sea', 35.5, 31.5, 'lake', C('asia'), '💧'),
  // mountains and volcanoes
  p('himalayas', 'the Himalayas', 84, 28.5, 'mountain', C('asia'), '🏔️'), p('andes', 'the Andes', -70, -25, 'mountain', C('samerica'), '🏔️'),
  p('rockies', 'the Rocky Mountains', -110, 43, 'mountain', C('namerica'), '🏔️'), p('alps', 'the Alps', 10, 46.5, 'mountain', C('europe'), '🏔️'),
  p('atlas', 'the Atlas Mountains', -5, 32, 'mountain', C('africa'), '🏔️'), p('dividing', 'the Great Dividing Range', 148, -30, 'mountain', C('australia'), '🏔️'),
  p('appalachians', 'the Appalachian Mountains', -80, 37.5, 'mountain', C('namerica'), '🏔️'), p('montblanc', 'Mont Blanc', 6.86, 45.83, 'mountain', C('europe'), '🏔️'),
  p('denali', 'Denali', -151, 63.07, 'mountain', C('namerica'), '🏔️'), p('aconcagua', 'Aconcagua', -70.01, -32.65, 'mountain', C('samerica'), '🏔️'),
  p('mountkenya', 'Mount Kenya', 37.31, -0.15, 'mountain', C('africa'), '🏔️'), p('matterhorn', 'the Matterhorn', 7.66, 45.98, 'mountain', C('europe'), '🏔️'),
  p('etna', 'Mount Etna', 15, 37.75, 'volcano', C('europe'), '🌋'), p('sthelens', 'Mount St. Helens', -122.18, 46.2, 'volcano', C('namerica'), '🌋'),
  p('kilauea', 'Kilauea', -155.29, 19.41, 'volcano', O('pacific'), '🌋'), p('cotopaxi', 'Cotopaxi', -78.44, -0.68, 'volcano', C('samerica'), '🌋'),
  p('erebus', 'Mount Erebus', 167.15, -77.53, 'volcano', C('antarctica'), '🌋'), p('krakatoa', 'Krakatoa', 105.42, -6.1, 'volcano', C('asia'), '🌋'),
  // deserts, plains, forests
  p('gobi', 'the Gobi Desert', 105, 43, 'desert', C('asia'), '🏜️'), p('atacama', 'the Atacama Desert', -69.5, -24, 'desert', C('samerica'), '🏜️'),
  p('kalahari', 'the Kalahari Desert', 22, -23, 'desert', C('africa'), '🏜️'), p('victoriadesert', 'the Great Victoria Desert', 127, -29, 'desert', C('australia'), '🏜️'),
  p('mojave', 'the Mojave Desert', -116, 35, 'desert', C('namerica'), '🏜️'), p('namib', 'the Namib Desert', 15, -23, 'desert', C('africa'), '🏜️'),
  p('arabian', 'the Arabian Desert', 47, 22, 'desert', C('asia'), '🏜️'),
  p('greatplains', 'the Great Plains', -100, 40, 'land', C('namerica'), '🌾'), p('pampas', 'the Pampas', -62, -36, 'land', C('samerica'), '🌾'),
  p('serengeti', 'the Serengeti', 35, -2.3, 'land', C('africa'), '🦁'), p('congoforest', 'the Congo Rainforest', 22, 0, 'land', C('africa'), '🌳'),
  p('blackforest', 'the Black Forest', 8.2, 48.3, 'land', C('europe'), '🌲'), p('patagonia', 'Patagonia', -69, -46, 'land', C('samerica'), '🏔️'),
  p('outback', 'the Outback', 135, -26, 'land', C('australia'), '🏜️'),
  // islands
  p('madagascar', 'Madagascar', 46.9, -19, 'island', C('africa'), '🏝️'), p('greenland', 'Greenland', -42, 72, 'island', { own: 'greenland' }, '🧊'),
  p('iceland', 'Iceland', -19, 64.9, 'island', C('europe'), '🏝️'), p('britain', 'Great Britain', -2, 54, 'island', C('europe'), '🏝️'),
  p('ireland', 'Ireland', -8, 53.3, 'island', C('europe'), '🏝️'), p('japan', 'Japan', 138, 36, 'island', C('asia'), '🏝️'),
  p('borneo', 'Borneo', 114, 0.5, 'island', C('asia'), '🏝️'), p('srilanka', 'Sri Lanka', 80.7, 7.9, 'island', C('asia'), '🏝️'),
  p('tasmania', 'Tasmania', 146.6, -42, 'island', C('australia'), '🏝️'), p('newzealand', 'New Zealand', 172.5, -41.5, 'island', O('pacific'), '🏝️'),
  p('hawaii', 'Hawaii', -155.5, 19.6, 'island', O('pacific'), '🏝️'), p('cuba', 'Cuba', -79, 21.7, 'island', C('namerica'), '🏝️'),
  p('sicily', 'Sicily', 14.2, 37.5, 'island', C('europe'), '🏝️'), p('newfoundland', 'Newfoundland', -56, 49, 'island', C('namerica'), '🏝️'),
  p('baffin', 'Baffin Island', -71, 68, 'island', C('namerica'), '🏝️'), p('galapagos', 'the Galápagos Islands', -90.5, -0.6, 'island', O('pacific'), '🐢'),
  p('zanzibar', 'Zanzibar', 39.3, -6.1, 'island', C('africa'), '🏝️'), p('sumatra', 'Sumatra', 101.5, 0, 'island', C('asia'), '🏝️'),
  p('taiwan', 'Taiwan', 121, 23.7, 'island', C('asia'), '🏝️'), p('fiji', 'Fiji', 178, -17.8, 'island', O('pacific'), '🏝️'),
  p('easter', 'Easter Island', -109.35, -27.12, 'island', O('pacific'), '🗿'), p('svalbard', 'Svalbard', 17, 78.5, 'island', O('arctic'), '🐻‍❄️'),
  // seas and straits
  p('mediterranean', 'the Mediterranean Sea', 18, 35, 'sea', B('europe', 'africa'), '🌊'), p('caribbean', 'the Caribbean Sea', -75, 15, 'sea', O('atlantic'), '🌊'),
  p('gulfmexico', 'the Gulf of Mexico', -90, 25, 'sea', O('atlantic'), '🌊'), p('redsea', 'the Red Sea', 38, 20, 'sea', B('africa', 'asia'), '🌊'),
  p('arabiansea', 'the Arabian Sea', 65, 15, 'sea', O('indian'), '🌊'), p('bengal', 'the Bay of Bengal', 88, 15, 'sea', O('indian'), '🌊'),
  p('hudson', 'Hudson Bay', -85, 60, 'sea', C('namerica'), '🌊'), p('coralsea', 'the Coral Sea', 155, -18, 'sea', O('pacific'), '🐠'),
  p('tasman', 'the Tasman Sea', 160, -38, 'sea', O('pacific'), '🌊'), p('northsea', 'the North Sea', 3, 56, 'sea', O('atlantic'), '🌊'),
  p('baltic', 'the Baltic Sea', 19, 58, 'sea', C('europe'), '🌊'), p('blacksea', 'the Black Sea', 34, 43.5, 'sea', B('europe', 'asia'), '🌊'),
  p('southchina', 'the South China Sea', 114, 13, 'sea', O('pacific'), '🌊'), p('bering', 'the Bering Sea', -178, 58, 'sea', O('pacific'), '🌊'),
  p('seajapan', 'the Sea of Japan', 135, 40, 'sea', O('pacific'), '🌊'), p('guinea', 'the Gulf of Guinea', 3, 2, 'sea', O('atlantic'), '🌊'),
  p('persiangulf', 'the Persian Gulf', 51, 27, 'sea', O('indian'), '🌊'), p('weddell', 'the Weddell Sea', -45, -73, 'sea', O('southern'), '🌊'),
  p('ross', 'the Ross Sea', -175, -75, 'sea', O('southern'), '🌊'), p('drake', 'the Drake Passage', -65, -58, 'sea', B('samerica', 'antarctica'), '🌊'),
  p('gibraltar', 'the Strait of Gibraltar', -5.6, 35.95, 'sea', B('europe', 'africa'), '🌊'),
  // more to see
  p('barrierreef', 'the Great Barrier Reef', 147, -18, 'sea', O('pacific'), '🐠'), p('angelfalls', 'Angel Falls', -62.54, 5.97, 'falls', C('samerica'), '💦'),
  p('goodhope', 'the Cape of Good Hope', 18.47, -34.36, 'land', C('africa'), '⛵'), p('capehorn', 'Cape Horn', -67.27, -55.98, 'land', C('samerica'), '⛵'),
  p('panama', 'the Panama Canal', -79.7, 9.1, 'land', C('namerica'), '🚢'), p('northpole', 'the North Pole', 0, 89.9, 'land', O('arctic'), '🧭'),
] as const;

export type FamousName = (typeof FAMOUS)[number]['name'];
export type PhotoName = (typeof PHOTO_PLACES)[number]['name'];
export type PlaceName = FamousName | PhotoName;
export type FamousAsk = (typeof FAMOUS)[number]['ask'];
export type FamousLine = (typeof FAMOUS)[number]['line'];
export const PLACES: readonly Place[] = [...FAMOUS, ...PHOTO_PLACES];
export const placeOf = (id: string): Place | undefined => PLACES.find(x => x.id === id);
