import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { build } from 'vite';
import { moneyBuild } from '../money-build';
import { selectedVoice, voicePacks } from '../static-build';

export async function fixtureScript(entry: URL) {
  const built = await build({
    // the money app's voice packs, as dist/ has them, so a fixture's clips play from the preview of dist/
    configFile: false, plugins: [preact(), voicePacks(selectedVoice(moneyBuild))], logLevel: 'silent',
    build: {
      write: false, assetsInlineLimit: Infinity,
      lib: { entry: fileURLToPath(entry), name: 'BaselineFixture', formats: ['iife'] },
    },
  });
  const output = Array.isArray(built) ? built[0] : built;
  if (!output || !('output' in output)) throw new Error(`No fixture build for ${entry}`);
  const chunk = output.output.find(file => file.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error(`No fixture script for ${entry}`);
  return chunk.code;
}
