import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.mts';

// Real Airtable credentials from .env.local; workers inherit this process's env.
process.loadEnvFile('.env.local');

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['src/**/*.integration.test.ts'],
    exclude: [],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
