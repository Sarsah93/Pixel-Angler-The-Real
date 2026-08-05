/**
 * @file pixelize_butchery.cjs
 * @description 손질 단계 실사 사진 → 도트 스프라이트 변환 파이프라인 (누끼 + 다운샘플 + 팔레트 양자화)
 *
 * 입력:  food assets/butchery/*.png  (흰/밝은 스튜디오 배경 실사 — 파일명 = 스프라이트 키)
 *   권장 파일명 (방어류 기준 — 캡처 1~4 대응):
 *     amberjack_vessel.png        내장 제거 후 배 안쪽(척추 혈관) 측면 뷰   → 핏줄 긁기/세척 단계
 *     amberjack_dorsal_score1.png 등쪽 길 만들기 1차 (경계 칼집)            → 장 뜨기 1스트로크 후
 *     amberjack_dorsal_score2.png 등쪽 길 2차 (벌어짐)                      → 2스트로크 후
 *     amberjack_dorsal_score3.png 등쪽 깊이 갈라 윗면 뜨는 중               → 3스트로크/분리 단계
 *     (배쪽: amberjack_belly_score1~3.png — 배쪽 길 만들기 사진 제공 시)
 *     (돔류: bream_*.png 동일 규칙)
 *
 * 출력:  packages/client-pc/src/data/PixelFishStages.ts (FISH_STAGE_SPRITES 레지스트리)
 *
 * 방식:  헤드리스 크롬 캔버스 — ① 누끼: 테두리 BFS로 배경(밝은/균일색)만 투명화
 *        ② bbox 크롭 → 폭 128 그리드 박스 평균 다운샘플 ③ 미디언컷 44색 양자화
 *        ④ PixelFishSprite 인코딩(rows 문자열)  — PixelFishSprites.ts와 동일 포맷.
 *
 * 실행:  node tools/pixelize_butchery.cjs           (전체 재생성)
 *        node tools/pixelize_butchery.cjs --test F  (단일 파일 → scratch 미리보기 JSON)
 *
 * 돔류(bream)는 사진 없이도 **가이드 시트 SVG의 중간 단계 패널에서 자동 추출**한다
 * (세장뜨기 구조 동일 — 사용자 지시 2026-07-30): 선-8=핏줄 뷰 / 본편3·5·7=길내기 1~3.
 * 같은 키를 사진(food assets/butchery/bream_*.png)이 덮어쓸 수 있다 (사진 우선).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SRC_DIR = path.resolve(__dirname, '..', 'food assets', 'butchery');
const OUT_TS = path.resolve(__dirname, '..', 'packages', 'client-pc', 'src', 'data', 'PixelFishStages.ts');
const GRID_W = 128;      // 목표 그리드 폭 (셀)
const PALETTE_N = 44;    // 팔레트 색 수
const AB = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

/** 크롬 페이지에서 실행할 처리 스크립트 (이미지 → {w,h,palette,rows} JSON) */
function pageHtml(fileUrl) {
  return `<!doctype html><body><script>
const img = new Image();
img.onload = () => {
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, W, H).data;
  // ── ① 누끼: 테두리에서 배경색 샘플 → 근접색만 BFS 투명화 (내부 흰 살은 보존) ──
  const bg = [0, 0, 0]; let n = 0;
  const samp = (x, y) => { const i = (y * W + x) * 4; bg[0] += d[i]; bg[1] += d[i+1]; bg[2] += d[i+2]; n++; };
  for (let x = 0; x < W; x += 7) { samp(x, 0); samp(x, H - 1); }
  for (let y = 0; y < H; y += 7) { samp(0, y); samp(W - 1, y); }
  bg[0] /= n; bg[1] /= n; bg[2] /= n;
  const TH = 46;   // 배경 근접 임계 (그림자 약간 포함)
  const near = (i) => Math.abs(d[i] - bg[0]) + Math.abs(d[i+1] - bg[1]) + Math.abs(d[i+2] - bg[2]) < TH * 3;
  const removed = new Uint8Array(W * H);
  const q = [];
  for (let x = 0; x < W; x++) { q.push(x, x + (H - 1) * W); }
  for (let y = 0; y < H; y++) { q.push(y * W, y * W + W - 1); }
  while (q.length) {
    const p = q.pop();
    if (removed[p]) continue;
    if (!near(p * 4)) continue;
    removed[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) q.push(p - 1);
    if (x < W - 1) q.push(p + 1);
    if (y > 0) q.push(p - W);
    if (y < H - 1) q.push(p + W);
  }
  // bbox
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!removed[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  // ── ② 다운샘플 (박스 평균 — 불투명 커버리지 35% 미만 셀은 투명) ──
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const gw = Math.min(${GRID_W}, bw);
  const cell = bw / gw;
  const gh = Math.max(1, Math.round(bh / cell));
  const cells = [];   // [r][c] = [r,g,b] | null
  for (let r = 0; r < gh; r++) {
    const row = [];
    for (let c = 0; c < gw; c++) {
      let sr = 0, sg = 0, sb = 0, cnt = 0, tot = 0;
      const px0 = x0 + Math.floor(c * cell), px1 = x0 + Math.max(px0 - x0 + 1, Math.floor((c + 1) * cell));
      const py0 = y0 + Math.floor(r * cell), py1 = y0 + Math.max(py0 - y0 + 1, Math.floor((r + 1) * cell));
      for (let y = py0; y < py1 && y <= y1; y++) for (let x = px0; x < px1 && x <= x1; x++) {
        tot++;
        if (removed[y * W + x]) continue;
        const i = (y * W + x) * 4;
        sr += d[i]; sg += d[i+1]; sb += d[i+2]; cnt++;
      }
      row.push(cnt / Math.max(1, tot) >= 0.35 ? [Math.round(sr / cnt), Math.round(sg / cnt), Math.round(sb / cnt)] : null);
    }
    cells.push(row);
  }
  // ── ③ 미디언컷 양자화 (${PALETTE_N}색) ──
  let box = [[]];
  for (const row of cells) for (const c of row) if (c) box[0].push(c);
  const boxes = [box[0]];
  while (boxes.length < ${PALETTE_N}) {
    let bi = -1, bs = -1;
    boxes.forEach((b, i) => { if (b.length > bs && b.length > 1) { bs = b.length; bi = i; } });
    if (bi < 0) break;
    const b = boxes[bi];
    let ch = 0, spread = -1;
    for (let k = 0; k < 3; k++) {
      let lo = 255, hi = 0;
      for (const p of b) { if (p[k] < lo) lo = p[k]; if (p[k] > hi) hi = p[k]; }
      if (hi - lo > spread) { spread = hi - lo; ch = k; }
    }
    b.sort((p, q2) => p[ch] - q2[ch]);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  const pal = boxes.filter((b) => b.length).map((b) => {
    const s = [0, 0, 0];
    for (const p of b) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
    return [Math.round(s[0] / b.length), Math.round(s[1] / b.length), Math.round(s[2] / b.length)];
  });
  const nearest = (p) => {
    let bi2 = 0, bd = 1e9;
    pal.forEach((q3, i) => {
      const dd = (p[0]-q3[0])**2 + (p[1]-q3[1])**2 + (p[2]-q3[2])**2;
      if (dd < bd) { bd = dd; bi2 = i; }
    });
    return bi2;
  };
  const ABc = '${AB}';
  const rows = cells.map((row) => row.map((c) => (c ? ABc[nearest(c)] : '.')).join(''));
  const palette = pal.map((p) => (p[0] << 16) | (p[1] << 8) | p[2]);
  document.body.textContent = JSON.stringify({ w: gw, h: gh, cellPx: 1, palette, rows });
};
img.src = ${JSON.stringify(fileUrl)};
</` + `script></body>`;
}

/** 크롬 dump-dom으로 1장 처리 */
function processImage(absPngPath) {
  const tmpHtml = path.join(os.tmpdir(), `pixbut_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpHtml, pageHtml('file:///' + absPngPath.replace(/\\/g, '/')));
  const dom = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--allow-file-access-from-files',
    '--virtual-time-budget=8000', '--dump-dom', 'file:///' + tmpHtml.replace(/\\/g, '/'),
  ], { maxBuffer: 64 * 1024 * 1024 }).toString();
  fs.unlinkSync(tmpHtml);
  const m = dom.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!m) throw new Error('dump-dom 파싱 실패: ' + absPngPath);
  const text = m[1].replace(/<[^>]+>/g, '').trim();
  return JSON.parse(text);
}

function serialize(key, spr) {
  return `  ${JSON.stringify(key)}: {\n    w: ${spr.w}, h: ${spr.h}, cellPx: ${spr.cellPx ?? 1},\n    palette: [${spr.palette.map((p) => '0x' + p.toString(16).padStart(6, '0')).join(', ')}],\n    rows: [\n${spr.rows.map((r) => `      '${r}',`).join('\n')}\n    ],\n  },`;
}

// ────────────────────────────────────────────────────────────
// 돔류(bream) — 가이드 시트 SVG 패널 도트 직접 추출 (사진 불필요, 세장뜨기 구조 공유)
//  선-8(핏줄 뷰) → bream_vessel / 본편 3·5·7(길내기 1~3) → bream_fillet1~3
//  (47차 extract_fish.js와 동일 기법 — 마커색 제외 + 행 인페인트 + 최대 연결요소)
// ────────────────────────────────────────────────────────────
const SVG_PATH = path.resolve(__dirname, '..', 'assets', 'guide', 'sashimi_pixel_guide.svg');
const SVG_MARKERS = ['#d63b2c', '#e0592c', '#c9a63c', '#8a6242', '#6d4a30', '#3d2818'];
const SVG_BG = new Set(['#edefee', '#fbfcfb']);

/** 키별 지우기 영역 (정규화 rect) — 생선 실루엣 밖으로 튀어나온 칼날 잔재 제거 */
const SVG_ERASE = {
  bream_vessel: [{ x0: 0, y0: 0.7, x1: 0.75, y1: 1 }],
  bream_fillet1: [{ x0: 0, y0: 0.68, x1: 0.8, y1: 1 }],
  bream_fillet2: [{ x0: 0, y0: 0.5, x1: 0.1, y1: 1 }],
  // 배 따기 컷 — 몸통 밖으로 튀어나온 칼(날+손잡이) 제거 (복면 절개선은 x<0.34라 보존)
  bream_finless: [{ x0: 0.34, y0: 0.72, x1: 0.66, y1: 1 }],
};

function extractSvgPanel(svg, px0, py0, key) {
  const re = /<rect x="([0-9.]+)" y="([0-9.]+)" width="([0-9.]+)" height="([0-9.]+)"[^/]*fill="(#[0-9a-fA-F]{3,6})"[^/]*\/>/g;
  const ex = new Set(SVG_MARKERS);
  const CELL = 2;
  const W = Math.ceil(316 / CELL), H = Math.ceil(186 / CELL);
  const grid = Array.from({ length: H }, () => new Array(W).fill(null));
  const marker = Array.from({ length: H }, () => new Array(W).fill(false));
  let m;
  while ((m = re.exec(svg))) {
    const x = +m[1], y = +m[2], w = +m[3], h = +m[4], f = m[5].toLowerCase();
    if (x < px0 + 2 || y < py0 + 2 || x + w > px0 + 314 || y + h > py0 + 184) continue;
    if (SVG_BG.has(f)) continue;
    const c0 = Math.floor((x - px0) / CELL), c1 = Math.ceil((x + w - px0) / CELL);
    const r0 = Math.floor((y - py0) / CELL), r1 = Math.ceil((y + h - py0) / CELL);
    const isMark = ex.has(f);
    for (let r = r0; r < r1 && r < H; r++) for (let c = c0; c < c1 && c < W; c++) {
      if (isMark) { marker[r][c] = true; grid[r][c] = null; }
      else { grid[r][c] = f; marker[r][c] = false; }
    }
  }
  // 인페인트 (마커가 지운 생선 내부)
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (!marker[r][c] || grid[r][c]) continue;
    let L = null, R = null;
    for (let k = c - 1; k >= Math.max(0, c - 6); k--) if (grid[r][k]) { L = grid[r][k]; break; }
    for (let k = c + 1; k <= Math.min(W - 1, c + 6); k++) if (grid[r][k]) { R = grid[r][k]; break; }
    if (L && R) grid[r][c] = L;
  }
  // 키별 지우기 영역 — bbox 산출 전 1차 bbox로 정규화 적용 (칼날 등 실루엣 밖 잔재)
  const erases = SVG_ERASE[key] ?? [];
  if (erases.length) {
    let er0 = H, er1 = -1, ec0 = W, ec1 = -1;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) {
      if (r < er0) er0 = r; if (r > er1) er1 = r; if (c < ec0) ec0 = c; if (c > ec1) ec1 = c;
    }
    const eh = er1 - er0 + 1, ew = ec1 - ec0 + 1;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (!grid[r][c]) continue;
      const ny = (r - er0) / eh, nx = (c - ec0) / ew;
      for (const e of erases) {
        if (nx >= e.x0 && nx <= e.x1 && ny >= e.y0 && ny <= e.y1) { grid[r][c] = null; break; }
      }
    }
  }
  // 최대 연결요소만 유지 (숟가락/물방울/튄 조각 제거)
  const label = Array.from({ length: H }, () => new Array(W).fill(0));
  let next = 0; const sizes = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (!grid[r][c] || label[r][c]) continue;
    next++; let size = 0; const st = [[r, c]]; label[r][c] = next;
    while (st.length) {
      const [rr, cc] = st.pop(); size++;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = rr + dr, nc = cc + dc;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
        if (grid[nr][nc] && !label[nr][nc]) { label[nr][nc] = next; st.push([nr, nc]); }
      }
    }
    sizes[next] = size;
  }
  let best = 0, bs = 0;
  for (let i = 1; i <= next; i++) if ((sizes[i] || 0) > bs) { bs = sizes[i]; best = i; }
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && label[r][c] !== best) grid[r][c] = null;
  // bbox 크롭 + 인코딩
  let r0 = H, r1 = -1, c0 = W, c1 = -1;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) {
    if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c;
  }
  const rows = [], pal = [], palIdx = new Map();
  for (let r = r0; r <= r1; r++) {
    let s = '';
    for (let c = c0; c <= c1; c++) {
      const f = grid[r][c];
      if (!f) { s += '.'; continue; }
      if (!palIdx.has(f)) { palIdx.set(f, pal.length); pal.push(f); }
      s += AB[palIdx.get(f)];
    }
    rows.push(s);
  }
  return { w: c1 - c0 + 1, h: r1 - r0 + 1, cellPx: 2, palette: pal.map((p) => parseInt(p.slice(1), 16)), rows };
}

/** 시트 그리드: idx(0=pre1) → 패널 좌상단 (x=24+col·332, y=112+row·254, 6열) */
function panelXY(idx) {
  return [24 + (idx % 6) * 332, 112 + Math.floor(idx / 6) * 254];
}

function extractBreamStages() {
  if (!fs.existsSync(SVG_PATH)) return [];
  const svg = fs.readFileSync(SVG_PATH, 'utf8');
  const picks = [
    // ── 손질 중간 상태 (원물) — 진행도에 맞는 몸통을 도마에 표시 ──
    ['bream_headless', 3],   // 선-4 — 머리만 분리 (지느러미 有 · 내장 有)
    ['bream_finless', 5],    // 선-6 — 지느러미 제거 후 배 따기 직전 (내장 有)
    ['bream_vessel', 7],     // 선-8 (idx 7) — 핏줄(신장) 긁기 뷰
    // ── 장뜨기 진행 ──
    ['bream_fillet1', 11],   // 본편 3 (idx 9+3-1) — 길 만들기 ② (얕은→깊은 선)
    ['bream_fillet2', 13],   // 본편 5 — 척추 끊기 (벌어진 몸통)
    ['bream_fillet3', 15],   // 본편 7 — 잘라내기 (3층 스택)
  ];
  return picks.map(([key, idx]) => {
    const [px, py] = panelXY(idx);
    const spr = extractSvgPanel(svg, px, py, key);
    console.log(`${key}: ${spr.w}x${spr.h}, pal ${spr.palette.length} (SVG 패널 ${idx})`);
    return [key, spr];
  });
}

// ── main ──
const testIdx = process.argv.indexOf('--test');
if (testIdx >= 0) {
  const f = path.resolve(process.argv[testIdx + 1]);
  const spr = processImage(f);
  const out = f + '.pix.json';
  fs.writeFileSync(out, JSON.stringify(spr));
  console.log(`[test] ${path.basename(f)} → ${spr.w}x${spr.h}, pal ${spr.palette.length} → ${out}`);
  process.exit(0);
}

if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR, { recursive: true });
  console.log(`입력 폴더 생성: ${SRC_DIR} — 실사 사진(png)을 넣으면 사진 스프라이트가 추가됩니다.`);
}
// 좌우 미러 키 — 도마 필렛 방향 규칙 = **꼬리 왼쪽·머리 오른쪽** (박피 peel_grip 꼬리 칼집·회썰기
// 컷 순서와 동일 컨벤션). 원본 사진이 머리 왼쪽인 에셋은 여기 등록해 굽는 시점에 반전한다.
const MIRROR_KEYS = new Set(['pure_fillet_halibut']);
const mirrorSprite = (spr) => ({ ...spr, rows: spr.rows.map((r) => [...r].reverse().join('')) });

// ① 돔류 = SVG 자동 추출 (기본) → ② 사진 폴더가 같은 키를 덮어씀 (사진 우선)
const map = new Map(extractBreamStages());
const files = fs.existsSync(SRC_DIR) ? fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.png')) : [];
for (const f of files) {
  const key = path.basename(f, '.png');
  let spr = processImage(path.join(SRC_DIR, f));
  if (MIRROR_KEYS.has(key)) spr = mirrorSprite(spr);
  map.set(key, spr);
  console.log(`${key}: ${spr.w}x${spr.h}, pal ${spr.palette.length} (사진${MIRROR_KEYS.has(key) ? '·미러' : ''})`);
}
const entries = [...map.entries()];
const ts = `/**
 * @file PixelFishStages.ts
 * @description 손질 단계별 실사 → 도트 스프라이트 레지스트리 (자동 생성 — 수동 편집 금지)
 *
 * 생성: node tools/pixelize_butchery.cjs  (입력: food assets/butchery/*.png — 파일명 = 키)
 * 키 규칙: {family}_{state} — amberjack_vessel / amberjack_dorsal_score1~3 / bream_* 등.
 * PixelButcherFish가 스테이지 상태에 맞는 키를 조회하고, 없으면 프로그램 오버레이 폴백.
 */

import type { PixelFishSprite } from './PixelFishSprites.js';

export const FISH_STAGE_SPRITES: Record<string, PixelFishSprite> = {
${entries.map(([k, s]) => serialize(k, s)).join('\n')}
};
`;
fs.writeFileSync(OUT_TS, ts);
console.log(`written: ${OUT_TS} (${entries.length} sprites)`);
