import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Node.js project for backend tests
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/backend/**/*.test.ts'],
        },
      },
      // Browser project for frontend tests
      {
        test: {
          name: 'browser',
          include: ['src/frontend/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    clearMocks: true,
    restoreMocks: true,
  },
});
