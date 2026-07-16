import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  /**
   * 상대 경로 빌드 — GitHub Pages 등 서브패스 호스팅 호환.
   * 게임 내 에셋 로드(BootScene/RegionFieldScene)도 전부 상대 경로를 쓴다
   * (선행 '/'를 쓰면 서브패스 배포에서 404 — 새 에셋 추가 시 주의).
   */
  base: './',
  resolve: {
    alias: {
      '@tra/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    /**
     * 공공 API CORS 우회 프록시 (dev 전용).
     * NMPNT(해양기상)/MAFRA(경락가)는 HTTP 전용 + CORS 헤더 없음,
     * KOSIS(어획량)는 HTTPS지만 CORS 헤더 없음 → 브라우저 직접 호출이 전부 차단된다.
     * ExternalDataStore가 dev에서 이 경로들로 baseUrl을 바꿔 실데이터를 받는다.
     * ⚠️ 프로덕션(정적 빌드/Tauri)에는 이 프록시가 없다 — 배포 시 서버 프록시 필요.
     */
    proxy: {
      '/api/nmpnt': {
        target: 'http://marineweather.nmpnt.go.kr:8001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/nmpnt/, ''),
      },
      '/api/mafra': {
        target: 'http://211.237.50.150:7080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/mafra/, ''),
      },
      '/api/kosis': {
        target: 'https://kosis.kr',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/kosis/, ''),
      },
    },
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
