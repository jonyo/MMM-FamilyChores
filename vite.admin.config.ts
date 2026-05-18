import path from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// Plugin to add banner to CSS files
function cssBannerPlugin(): Plugin {
  return {
    name: 'css-banner',
    transform(code: string, id: string) {
      if (id.endsWith('.css')) {
        const banner = `/*
This file was automatically generated:
 - edit the CSS files in src/admin/
 - run "pnpm build" to regenerate this file

- section source: src/admin/${path.basename(id)}
*/\n`;
        return {
          code: banner + code,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [solidPlugin(), cssBannerPlugin()],
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
          '// Automatically built — do not edit directly. Edit src/admin/.. files and run pnpm build',
      },
    },
  },
});
