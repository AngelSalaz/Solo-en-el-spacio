import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // permite publicar en cualquier ruta (itch.io, GitHub Pages...)
  build: { chunkSizeWarningLimit: 1600 }, // Phaser pesa bastante
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
