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
      formats: ['cjs'], // Output CommonJS modules
    },
    rollupOptions: {
      external: [
        'node_helper',
        'logger',
        'fs',
        'path',
        /^node:/, // Externalize all node: prefixed modules
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
