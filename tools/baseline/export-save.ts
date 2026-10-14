import assert from 'node:assert/strict';
import { JOURNEY_SAVES, SAVE_CASES, UNSAFE_BALANCE_CASE } from './saves';

const id = process.argv[2];
const fixtures = [...SAVE_CASES, UNSAFE_BALANCE_CASE, ...Object.entries(JOURNEY_SAVES).map(([id, state]) => ({ id, raw: state, expected: state }))];
const fixture = fixtures.find(fixture => fixture.id === id);
assert.ok(fixture, `Choose a synthetic save: ${fixtures.map(fixture => fixture.id).join(', ')}`);
console.log(JSON.stringify(process.argv.includes('--expected') ? fixture.expected : fixture.raw, null, 2));
