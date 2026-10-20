import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Library build: ESM bundle + extracted CSS, React kept external.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: new URL('./src/index.ts', import.meta.url).pathname,
      formats: ['es'],
      fileName: () => 'fui-ui.js',
      cssFileName: 'fui-ui',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    sourcemap: true,
  },
});
