import { playwright } from '@vitest/browser-playwright';
import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Node.js project for backend tests
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/backend/**/*.test.ts', 'src/utils/**/*.test.ts', 'src/api/**/*.test.ts'],
        },
      },
      // Browser project for frontend tests
      {
        plugins: [solidPlugin()],
        test: {
          name: 'browser',
          include: [
            'src/frontend/**/*.test.ts',
            'src/utils/**/*.test.ts',
            'src/admin/**/*.test.tsx',
          ],
          css: {
            include: /.+/,
          },
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
