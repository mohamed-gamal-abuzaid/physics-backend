import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
});