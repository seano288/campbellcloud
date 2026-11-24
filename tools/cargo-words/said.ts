// Prints how each Cargo Words syllable clip is said, as JSON for tools/make_voice.py: {"(rab)": "rab", "(ti)": "tie", ...}. The add-ons
// alone are here too ("(ful)": "full").
import { syllableSounds } from '../../src/cargo-words/words/said';

const { said } = syllableSounds();
const ADD_ONS: Record<string, string> = { un: 'un', re: 'ree', ful: 'full', less: 'less', er: 'urr', est: 'est' };
process.stdout.write(JSON.stringify(Object.fromEntries([...Object.entries(said), ...Object.entries(ADD_ONS)].map(([s, x]) => [`(${s})`, x]))));
