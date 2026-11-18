// The review's probe server: Deep Light's dev build with no file watching and no hot reload, so edits made during a probe run don't
// reach the pages it is playing (restart it to pick them up).
import { defineConfig } from 'vite';
import base from '../../../vite.deep-light.config';

const b = base as Record<string, any>;
export default defineConfig({ ...b, server: { ...(b.server ?? {}), hmr: false, watch: { ignored: ['**/*'] } } });
