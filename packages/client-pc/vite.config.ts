import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

/**
 * dev 맵 편집기 저장 미들웨어 (101차 — OSM 심리스 패치).
 * 브라우저는 파일을 쓸 수 없으므로 편집 결과(patch.json)를 POST로 받아
 *  ① pixelazed/<region>/patch.json (정본 — build_region_maps가 굽는다)
 *  ② public/data/<region>/patch.json (런타임 즉시 소비 — F5로 반영)
 * 두 곳에 쓴다. dev 서버에만 존재 — 프로덕션 빌드와 무관.
 */
function devRegionPatchPlugin(): Plugin {
  return {
    name: 'dev-region-patch',
    configureServer(server) {
      server.middlewares.use('/__dev/region-patch', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        const region = new URL(req.url ?? '/', 'http://x').searchParams.get('region') ?? '';
        if (!/^[a-z0-9_]+$/.test(region)) { res.statusCode = 400; res.end('bad region'); return; }
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString('utf8'); });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as unknown;
            const json = JSON.stringify(parsed);
            const targets = [
              resolve(__dirname, '../../pixelazed', region, 'patch.json'),
              resolve(__dirname, 'public/data', region, 'patch.json'),
            ];
            for (const t of targets) {
              mkdirSync(resolve(t, '..'), { recursive: true });
              writeFileSync(t, json, 'utf8');
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, written: targets }));
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [devRegionPatchPlugin()],
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
