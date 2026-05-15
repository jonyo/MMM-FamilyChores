import { defineConfig } from 'vite';

export default defineConfig({
  // Don't copy public directory files to build output
  publicDir: false,
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    // Readable output makes it easier to spot unexpected changes (e.g. supply-chain injections)
    // in git diffs. There's no performance benefit to minification in this local-only environment.
    minify: false,
    lib: {
      name: 'MMMFamilyChores',
      entry: {
        'MMM-FamilyChores': './src/frontend/frontend.ts',
      },
      formats: ['umd'],
    },
    rollupOptions: {
      external: ['logger'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        globals: {
          logger: 'Log',
        },
        banner: '// Automatically built — do not edit directly. Edit src/ and run pnpm build.',
      },
    },
  },
});
