import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/node',
    sourcemap: true,
    minify: 'esbuild', // Minify the output
    lib: {
      entry: {
        node_helper: './src/backend/node-helper.ts',
      },
      formats: ['es'], // Output ES modules
    },
    rollupOptions: {
      external: ['node_helper'],
      output: {
        // Generate .js files for ES modules
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
