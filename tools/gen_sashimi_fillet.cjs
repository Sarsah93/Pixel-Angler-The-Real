/**
 * gen_sashimi_fillet.cjs — 회썰기(사시미) 미니게임용 필렛 스프라이트 생성기 (2뷰).
 *
 * `food assets/trimmings/pure_pillet_{bream,amberjack}.png`(고해상 픽셀아트 실사)에서:
 *  ① **탑뷰**(일반 회뜨기 — y plane 정면뷰, 위에서 본 필렛): 원본이 이미 탑뷰 사진이므로
 *     **리매핑 없이 고품질 박스 다운샘플만** — 원본 충실도 최대 (사용자 지시 2026-08-03).
 *  ② **측면 뷰**(고급 회뜨기 — z plane 정면뷰): 원본 컬럼을 **낮고 완만한 슬랩 실루엣**으로
 *     리매핑 — 왼쪽 완만 상승 → 긴 평탄부(우측으로 살짝 상승) → 오른쪽 끝 뭉툭한 낙하
 *     (사용자 스케치 2026-08-03 — 구 돔형 마운드는 높낮이가 과했음).
 *
 * 출력:
 *  - packages/client-pc/public/sashimi/fillet_top_{fam}.png   (탑뷰 — 원본 비율 유지)
 *  - packages/client-pc/public/sashimi/fillet_side_{fam}.png  (측면 슬랩 384×120)
 *  - packages/client-pc/src/data/SashimiFilletProfiles.ts     (뷰별 실루엣 — 유도선 배치용)
 *
 * 방향 규칙: **살코기 머리쪽 = 오른쪽**. 실행: node tools/gen_sashimi_fillet.cjs
 */
const fs = require('fs');
const path = require('path');

const PW = 'C:/Users/dungy/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'packages', 'client-pc', 'public', 'sashimi');
const OUT_TS = path.join(ROOT, 'packages', 'client-pc', 'src', 'data', 'SashimiFilletProfiles.ts');

const FAMILIES = [
  // flipX = 측면 뷰 텍스처 방향 / flipTop = 탑뷰 방향
  //  탑뷰: 꼬리 = **왼쪽** (사용자 정정 2026-08-04 — 구 flip이 꼬리를 오른쪽에 두어
  //  "우측(첫 컷)부터 꼬리를 자르는" 연출이 됐었다. 컷은 오른쪽(머리)부터 = 정석 유지)
  { fam: 'bream', src: path.join(ROOT, 'food assets', 'trimmings', 'pure_pillet_bream.png'), flipX: true, flipTop: false },
  { fam: 'amberjack', src: path.join(ROOT, 'food assets', 'trimmings', 'pure_pillet_amberjack.png'), flipX: false, flipTop: false },
];

/** 탑뷰 목표 폭 (높이는 원본 비율 유지) / 측면 뷰 크기 */
const TOP_W = 384;
const SIDE_W = 384;
const SIDE_H = 120;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await (await browser.newContext()).newPage();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const profiles = {};

  for (const { fam, src, flipX, flipTop } of FAMILIES) {
    const b64 = fs.readFileSync(src).toString('base64');
    const result = await page.evaluate(async ({ b64, flipX, flipTop, TOP_W, SIDE_W, SIDE_H }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const sw = img.naturalWidth, sh = img.naturalHeight;
      const sc = document.createElement('canvas');
      sc.width = sw; sc.height = sh;
      const sg = sc.getContext('2d', { willReadFrequently: true });
      sg.drawImage(img, 0, 0);
      const sd = sg.getImageData(0, 0, sw, sh).data;
      const isBg = (i) => sd[i + 3] < 40 || (sd[i] < 26 && sd[i + 1] < 26 && sd[i + 2] < 26);

      // 소스 컬럼별 불투명 스팬
      const topSrc = new Array(sw).fill(-1);
      const botSrc = new Array(sw).fill(-1);
      let sx0 = sw, sx1 = 0, sy0 = sh, sy1 = 0;
      for (let x = 0; x < sw; x++) {
        for (let y = 0; y < sh; y++) {
          const i = (y * sw + x) * 4;
          if (!isBg(i)) {
            if (topSrc[x] < 0) topSrc[x] = y;
            botSrc[x] = y;
            sy0 = Math.min(sy0, y); sy1 = Math.max(sy1, y);
          }
        }
        if (topSrc[x] >= 0) { sx0 = Math.min(sx0, x); sx1 = Math.max(sx1, x); }
      }
      const span = sx1 - sx0;

      // 공용 박스 샘플러
      const sample = (sxF, syF, bw, bh) => {
        let r = 0, g = 0, b = 0, n = 0;
        const x0 = Math.max(sx0, Math.round(sxF) - bw), x1 = Math.min(sx1, Math.round(sxF) + bw);
        const y0 = Math.max(0, Math.round(syF) - bh), y1 = Math.min(sh - 1, Math.round(syF) + bh);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = (y * sw + x) * 4;
          if (isBg(i)) continue;
          r += sd[i]; g += sd[i + 1]; b += sd[i + 2]; n++;
        }
        return n ? [r / n, g / n, b / n] : null;
      };

      // ═══════════ ① 탑뷰 — 원본 직접 다운샘플 (리매핑 없음) ═══════════
      const srcH = sy1 - sy0 + 1;
      const TOP_H = Math.max(60, Math.round(TOP_W * (srcH / span)));
      const tc1 = document.createElement('canvas');
      tc1.width = TOP_W; tc1.height = TOP_H;
      const tg1 = tc1.getContext('2d', { willReadFrequently: true });
      const td1 = tg1.createImageData(TOP_W, TOP_H);
      const t1 = td1.data;
      const bx = Math.max(1, Math.floor(span / TOP_W / 1.6));
      const by = Math.max(1, Math.floor(srcH / TOP_H / 1.6));
      const topEdge = new Array(TOP_W).fill(1);
      const botEdge = new Array(TOP_W).fill(1);
      for (let tx = 0; tx < TOP_W; tx++) {
        const u = tx / (TOP_W - 1);
        const su = flipTop ? 1 - u : u;
        const sxF = sx0 + su * span;
        const cx = Math.min(sw - 1, Math.max(sx0, Math.round(sxF)));
        if (topSrc[cx] < 0) continue;
        for (let ty = 0; ty < TOP_H; ty++) {
          const syF = sy0 + (ty / (TOP_H - 1)) * srcH;
          // 해당 컬럼 스팬 밖은 투명 (실루엣 유지)
          if (syF < topSrc[cx] - by || syF > botSrc[cx] + by) continue;
          const c = sample(sxF, syF, bx, by);
          if (!c) continue;
          const i = (ty * TOP_W + tx) * 4;
          t1[i] = c[0]; t1[i + 1] = c[1]; t1[i + 2] = c[2]; t1[i + 3] = 255;
          if (topEdge[tx] >= 1) topEdge[tx] = ty / TOP_H;
          botEdge[tx] = ty / TOP_H;
        }
      }
      tg1.putImageData(td1, 0, 0);

      // ── 한 점 슬라이스 아이콘 — 탑뷰 살코기 중앙부 세로 스트립 1컷 (회 조각 아이템 아이콘용) ──
      const stripW = Math.max(18, Math.round(TOP_W * 0.07));
      const sxStart = Math.round(TOP_W * 0.46);
      let py0 = TOP_H, py1 = 0;
      for (let y = 0; y < TOP_H; y++) {
        for (let x = sxStart; x < sxStart + stripW; x++) {
          if (t1[(y * TOP_W + x) * 4 + 3] > 0) { py0 = Math.min(py0, y); py1 = Math.max(py1, y); }
        }
      }
      const pc = document.createElement('canvas');
      pc.width = stripW; pc.height = Math.max(4, py1 - py0 + 1);
      const pg = pc.getContext('2d');
      pg.drawImage(tc1, sxStart, py0, stripW, pc.height, 0, 0, stripW, pc.height);

      // ═══════════ ② 측면 뷰 — 완만한 슬랩 실루엣 리매핑 ═══════════
      //  사용자 스케치: 좌측 완만 상승 → 긴 평탄부(우측으로 살짝 상승) → 우측 뭉툭 낙하
      const BASE_Y = SIDE_H - 9;
      const MAX_H = SIDE_H - 24;
      const CP_U = [0.0, 0.025, 0.07, 0.16, 0.40, 0.62, 0.80, 0.90, 0.965, 1.0];
      const CP_F = [0.0, 0.42, 0.68, 0.78, 0.84, 0.88, 0.94, 1.00, 0.82, 0.0];
      const prof = (u) => {
        if (u <= 0 || u >= 1) return 0;
        let i = 0;
        while (i < CP_U.length - 2 && u > CP_U[i + 1]) i++;
        const t01 = (u - CP_U[i]) / (CP_U[i + 1] - CP_U[i]);
        const s = (1 - Math.cos(Math.PI * t01)) / 2;
        return CP_F[i] + (CP_F[i + 1] - CP_F[i]) * s;
      };
      // 유기적 윗면 요철
      const jitter = new Array(SIDE_W).fill(0);
      let seed = flipX ? 13 : 7;
      for (let x = 0; x < SIDE_W; x += 7) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const j = ((seed / 0x7fffffff) - 0.5) * 2.4;
        for (let k = 0; k < 7 && x + k < SIDE_W; k++) jitter[x + k] = j * (1 - k / 7) + (jitter[x + k - 1] ?? 0) * (k / 7);
      }
      const tc2 = document.createElement('canvas');
      tc2.width = SIDE_W; tc2.height = SIDE_H;
      const tg2 = tc2.getContext('2d', { willReadFrequently: true });
      const td2 = tg2.createImageData(SIDE_W, SIDE_H);
      const t2 = td2.data;
      const sideTop = new Array(SIDE_W).fill(1);
      const bw2 = Math.max(1, Math.floor(span / SIDE_W / 1.2));
      for (let tx = 0; tx < SIDE_W; tx++) {
        const u = tx / (SIDE_W - 1);
        const h = prof(u) * MAX_H + (prof(u) > 0.03 ? jitter[tx] : 0);
        if (h < 1.5) continue;
        const topY = Math.round(BASE_Y - h);
        sideTop[tx] = topY / SIDE_H;
        const su = flipX ? 1 - u : u;
        const sxF = sx0 + su * span;
        const cx = Math.min(sw - 1, Math.max(sx0, Math.round(sxF)));
        const st = topSrc[cx] >= 0 ? topSrc[cx] : 0;
        const sb = botSrc[cx] >= 0 ? botSrc[cx] : sh - 1;
        const syBox = Math.max(1, Math.floor((sb - st) / Math.max(8, h) / 1.6));
        for (let ty = topY; ty <= BASE_Y; ty++) {
          const v = (ty - topY) / Math.max(1, BASE_Y - topY);
          const c = sample(sxF, st + v * (sb - st), bw2, syBox);
          if (!c) continue;
          let [r, g, b] = c;
          const fromTop = ty - topY;
          if (fromTop <= 2) { const k = 1.18 - fromTop * 0.05; r = Math.min(255, r * k + 18); g = Math.min(255, g * k + 18); b = Math.min(255, b * k + 16); }
          const nearBase = (ty - topY) / Math.max(1, BASE_Y - topY);
          if (nearBase > 0.82) { const k = 1 - (nearBase - 0.82) * 0.55; r *= k; g *= k; b *= k; }
          const i = (ty * SIDE_W + tx) * 4;
          t2[i] = r; t2[i + 1] = g; t2[i + 2] = b; t2[i + 3] = 255;
        }
      }
      // 접지 그림자
      for (let tx = 0; tx < SIDE_W; tx++) {
        const u = tx / (SIDE_W - 1);
        if (prof(u) < 0.04) continue;
        for (let dy = 1; dy <= 4; dy++) {
          const ty = BASE_Y + dy;
          if (ty >= SIDE_H) break;
          const i = (ty * SIDE_W + tx) * 4;
          const a = Math.max(0, 90 - dy * 22 - Math.abs(u - 0.5) * 50);
          if (a > t2[i + 3]) { t2[i] = 20; t2[i + 1] = 12; t2[i + 2] = 10; t2[i + 3] = a; }
        }
      }
      tg2.putImageData(td2, 0, 0);

      return {
        topPng: tc1.toDataURL('image/png').split(',')[1], topW: TOP_W, topH: TOP_H,
        topEdge, botEdge,
        piecePng: pc.toDataURL('image/png').split(',')[1],
        sidePng: tc2.toDataURL('image/png').split(',')[1],
        sideTop, sideBaseY: BASE_Y / SIDE_H,
      };
    }, { b64, flipX, flipTop, TOP_W, SIDE_W, SIDE_H });

    fs.writeFileSync(path.join(OUT_DIR, `fillet_top_${fam}.png`), Buffer.from(result.topPng, 'base64'));
    fs.writeFileSync(path.join(OUT_DIR, `fillet_side_${fam}.png`), Buffer.from(result.sidePng, 'base64'));
    fs.writeFileSync(path.join(OUT_DIR, `piece_${fam}.png`), Buffer.from(result.piecePng, 'base64'));
    const step = 8;
    const ds = (arr) => {
      const out = [];
      for (let x = 0; x < arr.length; x += step) out.push(Number(arr[x].toFixed(4)));
      return out;
    };
    profiles[fam] = {
      top: { topEdge: ds(result.topEdge), botEdge: ds(result.botEdge), aspect: Number((result.topW / result.topH).toFixed(4)) },
      side: { top: ds(result.sideTop), baseY: Number(result.sideBaseY.toFixed(4)) },
    };
    console.log(`[gen_sashimi_fillet] ${fam}: top ${result.topW}x${result.topH} / side ${SIDE_W}x${SIDE_H}`);
  }

  const ts = `/**
 * @file SashimiFilletProfiles.ts
 * @description 회썰기 필렛 스프라이트 실루엣 프로필 (뷰별) — 컷 유도선 배치용.
 *  tools/gen_sashimi_fillet.cjs 가 자동 생성 (수동 편집 금지 — 재생성으로 갱신).
 *  - top(탑뷰 — 일반 회뜨기): topEdge/botEdge = x별 필렛 상·하 윤곽(정규화 y, 1 = 빈 컬럼), aspect = 스프라이트 W/H.
 *  - side(측면 — 고급 회뜨기): top = x별 윗면 실루엣 / baseY = 접지 라인.
 */
export interface SashimiTopProfile { topEdge: number[]; botEdge: number[]; aspect: number; }
export interface SashimiSideProfile { top: number[]; baseY: number; }

export const SASHIMI_FILLET_PROFILES: Record<'bream' | 'amberjack', { top: SashimiTopProfile; side: SashimiSideProfile }> = ${JSON.stringify(profiles, null, 2).replace(/"(\w+)":/g, '$1:')};

/** 뷰별 텍스처 키 (BootScene: public/sashimi/fillet_{top,side}_{fam}.png) */
export const SASHIMI_FILLET_TEX: Record<'top' | 'side', Record<'bream' | 'amberjack', string>> = {
  top: { bream: 'sashimi_fillet_top_bream', amberjack: 'sashimi_fillet_top_amberjack' },
  side: { bream: 'sashimi_fillet_side_bream', amberjack: 'sashimi_fillet_side_amberjack' },
};
`;
  fs.writeFileSync(OUT_TS, ts, 'utf8');
  console.log(`[gen_sashimi_fillet] profiles -> ${OUT_TS}`);
  await browser.close();
})();
