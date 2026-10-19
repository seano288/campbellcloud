import { defineConfig } from 'vitest/config';
import { staticBuild } from './tools/static-build';
import { moneyBuild } from './tools/money-build';

export default defineConfig({
  ...staticBuild(moneyBuild),
  test: { include: ['src/**/*.test.ts', 'tools/**/*.test.ts'], pool: 'threads' },
});
