import { defineConfig } from 'vite';

export default defineConfig({
  // Don't copy public directory files to build output
  publicDir: false,
  build: {
    outDir: 'dist/node',
    sourcemap: false,
    // Readable output makes it easier to spot unexpected changes (e.g. supply-chain injections)
    // in git diffs. There's no performance benefit to minification in this local-only environment.
    minify: false,
    lib: {
      entry: {
        node_helper: './src/backend/node-helper.ts',
      },
      // Output CommonJS modules
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'node_helper',
        'logger',
        'fs',
        'path',
        // Externalize all node: prefixed modules
        /^node:/,
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        exports: 'default',
        banner: '// Automatically built — do not edit directly. Edit src/ and run pnpm build.',
      },
    },
  },
});
