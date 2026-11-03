import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build runs from any static host or subfolder.
  base: './',
  build: {
    // Phaser alone is ~1.3 MB minified; warn only if the bundle grows well past that.
    chunkSizeWarningLimit: 1600,
  },
});
