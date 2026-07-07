import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@tra/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  // Phaser 3 최적화: 순수 Canvas 2D 렌더러 — WebGL 비활성화 가능
  optimizeDeps: {
    include: ['phaser'],
  },
  // 픽셀 아트 에셋 최적화 (이미지 압축 비활성화)
  assetsInclude: ['**/*.png', '**/*.webp', '**/*.ogg', '**/*.mp3'],
});
