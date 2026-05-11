import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    minify: 'terser', // Use terser for better minification
    lib: {
      entry: {
        'MMM-FamilyChores': './src/frontend/register-frontend.ts',
      },
      formats: ['es'], // Output ES modules
    },
    rollupOptions: {
      external: ['node_helper'],
      output: {
        // Generate .js files (not .cjs) even though they're CommonJS
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
