import { ALL_KEYS, infoOf, tabOf } from '../../../src/deep-light/dock/parts';
import { ZONES } from '../../../src/deep-light/sea/zones';
import { animalsIn } from '../../../src/deep-light/sea/animals';
const buy = ALL_KEYS.filter(k => infoOf(k).price > 0);
console.log('items', ALL_KEYS.length, 'buyable', buy.length, 'total', buy.reduce((a, k) => a + infoOf(k).price, 0), 'max', Math.max(...buy.map(k => infoOf(k).price)));
const names = ALL_KEYS.map(k => infoOf(k).name); console.log('dup names', names.filter((n, i) => names.indexOf(n) !== i));
for (const z of ZONES) console.log(z.id, z.hull, JSON.stringify(z.needs), animalsIn(z.id).length);
