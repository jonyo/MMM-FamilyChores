import { defineConfig } from 'vite';

export default defineConfig({
  // Don't copy public directory files to build output
  publicDir: false,
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    // Use terser for better minification
    minify: 'terser',
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
      },
    },
  },
});
