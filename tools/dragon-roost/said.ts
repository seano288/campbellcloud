// Prints, as JSON, how Dragon Roost's question frames are said: a gap is read "blank", as a teacher reads one ("The dragon, blank, up
// the hill."). tools/make_voice.py merges these into the collection's said_as, so the frame on screen keeps its ___.
//   npx tsx tools/dragon-roost/said.ts
import { PHRASES } from '../../src/dragon-roost/phrases';

const said: Record<string, string> = {};
for (const p of PHRASES) if (p.includes('___')) said[p] = p.replace(/\s*___\s*/, ', blank, ').replace(/, blank, ([.!?])$/, ', blank$1');
process.stdout.write(JSON.stringify(said));
