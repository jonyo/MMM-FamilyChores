import { defineConfig } from 'vite';

export default defineConfig({
  // Don't copy public directory files to build output
  publicDir: false,
  build: {
    outDir: 'dist/node',
    sourcemap: true,
    // Minify the output
    minify: 'esbuild',
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
      },
    },
  },
});
