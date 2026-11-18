import { writeFileSync } from 'node:fs';
import { PHRASES } from '../../../src/deep-light/phrases';
import { ANIMALS } from '../../../src/deep-light/sea/animals';
const names = new Set(ANIMALS.map(a => a.name));
const pick = PHRASES.filter(p => !/^\d+$/.test(p) && (names.has(p) || p.split(' ').length <= 3));
// animal names first, then the rest by length
pick.sort((a, b) => Number(names.has(b)) - Number(names.has(a)) || a.split(' ').length - b.split(' ').length);
writeFileSync(process.argv[2]!, JSON.stringify(pick));
console.log(pick.length);
