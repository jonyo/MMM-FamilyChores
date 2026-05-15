import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  publicDir: false,
  build: {
    outDir: 'dist/admin',
    sourcemap: true,
    // Readable output makes it easier to spot unexpected changes (e.g. supply-chain injections)
    // in git diffs. There's no performance benefit to minification in this local-only environment.
    minify: false,
    lib: {
      entry: './src/admin/app.tsx',
      name: 'AdminApp',
      formats: ['iife'],
      fileName: 'admin',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'admin.js',
        banner:
          '// Automatically built — do not edit directly. Edit src/admin/admin.tsx and run pnpm build:admin.',
      },
    },
  },
});
