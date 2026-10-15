import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { build } from 'vite';

export async function fixtureScript(entry: URL) {
  const built = await build({
    configFile: false, plugins: [preact()], logLevel: 'silent',
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
