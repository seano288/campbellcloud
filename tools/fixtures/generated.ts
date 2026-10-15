import { createPlayback } from '../../src/voice/playback';
import { recordedAudio } from '../../src/audio/recorded';
import { generatedEntry } from './generatedVoice';

void createPlayback({ ...generatedEntry.voice, ...recordedAudio }).scope().say('25 cents', '42!', 'You need 30 more Bolts.', 'You earned 6 Bolts!');
