// Dragon Roost's recorded phrases and their clips, for the app and the build. Its phrases are built from its word tables (every word and
// sentence is a clip), so they are typed as strings rather than one long literal union; voice.test.ts checks that every line the game
// builds is a phrase with a clip on disk, which the type would otherwise do.
import type { VoiceCollection } from '../voice/collection';
import { PHRASES, type Phrase } from './phrases';
import { CLIPS } from './voice.gen';

export const roostVoice: VoiceCollection<Phrase> = { id: 'dragon-roost', phrases: [...new Set(PHRASES)], clips: CLIPS as Readonly<Record<Phrase, string>> };
