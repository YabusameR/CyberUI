import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Showcase app (uses Tailwind for layout utilities, like the spec's example).
export default defineConfig({
  root: 'demo',
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist-demo', emptyOutDir: true },
});
