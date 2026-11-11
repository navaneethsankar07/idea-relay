import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'IdeaRelayWidget',
      fileName: (format) => `widget.${format}.js`,
      formats: ['es', 'umd', 'iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
        exports: 'named',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
