import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    minify: 'terser', // Use terser for better minification
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
