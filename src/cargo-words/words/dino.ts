// What he has met in Dino Dig: its Patterns, read from its own word list (src/dino-dig/words/list.ts, read only). Every one of them,
// Bossy R (the "r" Pattern: ar, or, er, ir, ur) included, so Cargo Words' Bossy R starts past single words (see reading/problems.ts).
import { PATTERN_IDS } from '../../dino-dig/words/list';

export const DINO_PATTERNS_MET = [...PATTERN_IDS];
