import tailwindcss from '@tailwindcss/vite';
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
          include: [
            'src/backend/**/*.test.ts',
            // run utils in both modes to make sure they work in node
            'src/utils/**/*.test.ts',
            'src/api/**/*.test.ts',
          ],
          // exclude browser-only utils from node tests
          exclude: ['src/utils/browser.test.ts'],
        },
      },
      // Browser project for frontend tests
      {
        plugins: [solidPlugin(), tailwindcss()],
        test: {
          name: 'browser',
          include: [
            'src/frontend/**/*.test.ts',
            // make sure utils work in browser too
            'src/utils/**/*.test.ts',
            'src/admin/**/*.test.tsx',
          ],
          setupFiles: ['./src/admin/browser-setup.ts'],
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
