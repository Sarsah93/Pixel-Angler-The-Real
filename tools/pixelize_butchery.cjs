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
function pageHtml(fileUrl, bgTol, erasePolys, fitLong) {
  return `<!doctype html><body><script>
const img = new Image();
img.onload = () => {
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, W, H).data;
  // ── ① 누끼: 테두리에서 배경색 샘플 → 근접색만 BFS 투명화 (내부 흰 살은 보존) ──
  // ⚠ 평균이 아니라 **중앙값** — 피사체가 프레임 가장자리에 닿으면 평균이 배경색에서 밀려나
  //    (흰 배경인데 bg≈230으로 추정) 임계를 좁힐수록 오히려 아무것도 안 지워진다.
  const bs = [[], [], []];
  const samp = (x, y) => { const i = (y * W + x) * 4; bs[0].push(d[i]); bs[1].push(d[i+1]); bs[2].push(d[i+2]); };
  for (let x = 0; x < W; x += 7) { samp(x, 0); samp(x, H - 1); }
  for (let y = 0; y < H; y += 7) { samp(0, y); samp(W - 1, y); }
  const bg = bs.map((a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
  const TH = ${bgTol};   // 배경 근접 임계 (키별 조정 — BG_TOL)
  // 원본이 **투명 배경 PNG**면 알파로 바로 판정한다 — 피사체와 배경이 둘 다 흰색이라
  // 색 근접 BFS로는 분리할 수 없는 사진(흰 살코기 + 순백 배경)을 위한 경로.
  // ⚠ 테두리만 보면 안 된다 — 타이트하게 잘린 누끼본은 피사체가 프레임을 꽉 채워
  //    테두리가 대부분 불투명하다. **전체 픽셀 중 투명 비율**로 판정한다.
  let alphaBg = 0, alphaN = 0;
  for (let p = 0; p < W * H; p += 13) { alphaN++; if (d[p * 4 + 3] < 8) alphaBg++; }
  const useAlpha = alphaN > 0 && alphaBg / alphaN > 0.03;
  // 알파 경로에서도 **순백 매트**는 함께 제거한다 — 손누끼본에 흰 여백이 남아 있는 경우가 많다.
  //  임계 246: 크림색 살(≈235~245)은 살리고 순백(250~255)만 걷어낸다.
  const WHITE_CUT = 246;
  const near = (i) => useAlpha
    ? (d[i+3] < 8 || (d[i] >= WHITE_CUT && d[i+1] >= WHITE_CUT && d[i+2] >= WHITE_CUT))
    : Math.abs(d[i] - bg[0]) + Math.abs(d[i+1] - bg[1]) + Math.abs(d[i+2] - bg[2]) < TH * 3;
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
  // ── ①-b 영역 제거 (ERASE_POLY) ──
  //  사진에 **게임이 자체 연출로 그리는 요소**(칼 등)가 찍혀 있으면 굽기 전에 지운다.
  //  좌표는 원본 정규화(0~1) 폴리곤 — 회전/미러보다 **먼저** 적용된다.
  const polys = ${JSON.stringify(erasePolys || [])};
  if (polys.length) {
    const inPoly = (px, py, poly) => {
      let hit = false;
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const [xa, ya] = poly[a], [xb, yb] = poly[b];
        if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) hit = !hit;
      }
      return hit;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = x / W, ny = y / H;
      for (const poly of polys) if (inPoly(nx, ny, poly)) { removed[y * W + x] = 1; break; }
    }
  }
  // bbox
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!removed[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  // ── ② 다운샘플 (박스 평균 — 불투명 커버리지 35% 미만 셀은 투명) ──
  //  기본은 **가로 기준**(GRID_W). FIT_LONG이면 **긴 축 기준**으로 잡는다 —
  //  세로로 찍힌 원본(두족류 사진 다수)은 가로 기준이면 다운샘플이 거의 걸리지 않아
  //  bbox가 좁을수록 행이 폭증한다(실측: 121x449 원본이 cell=1로 449행 그대로 구워짐).
  //  가로 원본(bw >= bh)에서는 longPx === bw라 기존 결과와 **완전히 동일**하다.
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const longPx = ${fitLong ? 'Math.max(bw, bh)' : 'bw'};
  const longG = Math.min(${GRID_W}, longPx);
  const cell = longPx / longG;
  const gw = Math.max(1, Math.round(bw / cell));
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
function processImage(absPngPath, bgTol = 46, erasePolys = [], fitLong = false) {
  const tmpHtml = path.join(os.tmpdir(), `pixbut_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpHtml, pageHtml(
    'file:///' + encodeURI(absPngPath.replace(/\\/g, '/')), bgTol, erasePolys, fitLong,
  ));
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
const MIRROR_KEYS = new Set([
  'pure_fillet_halibut',
  'halibut_fin_score',   // 원본이 머리 오른쪽 — 온마리 규칙(머리 왼쪽)으로 반전
  'halibut_lift_done',   // cw 회전 후 머리가 오른쪽이 되므로 함께 반전
  // 반쪽 필렛 2종(엔가와 분리 슬랩) — 원본 머리 왼쪽 → **필렛 규칙(꼬리 왼쪽·머리 오른쪽)**으로 반전
  'fillet_upper_halibut',
  'fillet_under_halibut',
]);
/**
 * 키별 배경 근접 임계 (기본 46). **배경이 흰색이고 피사체도 흰색**인 사진은 기본값이
 * 살코기까지 먹어버리므로 낮춘다 (halibut_open_cross — 크림색 살 vs 순백 배경).
 */
/**
 * 키별 배경 근접 임계 (기본 46). **배경도 피사체도 흰색**인 사진은 낮춰도 분리가 안 되므로
 * 투명 배경 PNG로 다시 받는 편이 정확하다 (그 경우 알파 경로가 자동 적용된다).
 */
const BG_TOL = {
  // 순백 배경 + 크림색 살 — 기본 46(임계 138)은 살까지 먹으므로 순백만 걷어내게 좁힌다
  halibut_gut_lift: 6,
  halibut_lift_b: 6,
};
const mirrorSprite = (spr) => ({ ...spr, rows: spr.rows.map((r) => [...r].reverse().join('')) });

/**
 * 90° 회전 — **세로로 찍힌 원본을 가로 기준으로 정규화**할 때 쓴다.
 * 도마 스프라이트는 전부 "가로·머리 왼쪽" 기준으로 구워야 한다 —
 * 세로 배치는 패널의 회전 축(80차 `BoardRotation`)이 렌더 시점에 만들어내므로,
 * 원본이 이미 세로면 이중 회전이 되어 눕는다.
 *  'cw'  = 시계방향(원본 위 → 오른쪽)   'ccw' = 반시계(원본 위 → 왼쪽)
 */
function rotateSprite(spr, dir) {
  const h = spr.rows.length, w = spr.rows[0].length;
  const out = [];
  for (let y = 0; y < w; y++) {
    let row = '';
    for (let x = 0; x < h; x++) {
      row += dir === 'cw' ? spr.rows[h - 1 - x][y] : spr.rows[x][w - 1 - y];
    }
    out.push(row);
  }
  return { ...spr, w: h, h: w, rows: out };
}

/**
 * 키별 방향 정규화 (미러보다 먼저 적용). 원본 사진의 촬영 방향을 "가로·머리 왼쪽"으로 맞춘다.
 *  halibut_lift_done — 원본이 **세로(머리 위·꼬리 아래)** + 열린 살이 왼쪽
 *    → cw 회전(머리 오른쪽·열린 살 위) 후 미러(머리 왼쪽·열린 살 위 유지) = 한 장을 떠낸 상태
 */
const ROTATE_KEYS = {
  halibut_lift_done: 'cw',
  halibut_fin_score: 'cw',
  // ── 두족류(무늬오징어) — 세로로 찍힌 원본을 "가로 · 다리 왼쪽 / 외투막 끝 오른쪽"으로 정규화 ──
  //  기준은 가로로 찍힌 원물 사진(squid_whole/shime1/shime2)이다: 다리가 왼쪽, 몸통이 오른쪽.
  //  세로 사진은 전부 **외투막 끝이 위 · 다리(또는 입구)가 아래**라 cw(위→오른쪽) 하나로 정렬된다.
  squid_spread: 'cw',     // 펼치기 — 다리 아래 → 왼쪽
  squid_pen: 'cw',        // 연골 노출 — 몸통 끝 위 → 오른쪽
  squid_headmass: 'cw',   // 머리+다리 덩어리 — 절단면 위 → 오른쪽, 다리 아래 → 왼쪽
  squid_skin_pull: 'cw',  // 껍질 위→아래 당김 → 오른쪽→왼쪽 (squid_skin_grip과 같은 방향)
  squid_fin1: 'cw',
  squid_fin2: 'cw',
  squid_clean: 'cw',      // 완료 — 몸통 끝 위 → 오른쪽
};

/**
 * 긴 축 기준 다운샘플 키 — 세로 원본은 가로 기준(GRID_W)이면 다운샘플이 안 걸린다.
 * 두족류는 뷰마다 종횡비가 0.27~2.6으로 크게 흔들리므로 전 키를 긴 축 기준으로 통일한다
 * (뷰가 바뀌어도 디테일 예산이 같다).
 */
const FIT_LONG_PREFIX = ['squid_'];
const fitsLong = (key) => FIT_LONG_PREFIX.some((p) => key.startsWith(p));

/**
 * ── 추가 입력 폴더 (파일명이 키가 아닌 경우) ────────────────────────────────
 * 두족류 손질 단계 실사는 사용자가 **공정 순서 한글 파일명**으로 관리한다
 * (`food assets/butchery/reference/cephalopod/`). 원본을 ASCII로 복제하면 사본이 갈라지므로
 * 여기서 파일명 → 키를 명시적으로 잇는다. 파이프라인 기본 스캔은 하위 폴더를 보지 않는다.
 *
 * 매핑 근거 = 사용자 지정 공정 6구간(시메 / 개복·내장 / 연골 / 껍질 / 아가미·날개 / 머리부 분할).
 * 사진 번호는 **촬영 순서**이고 구간 번호와 1:1이 아니다 — `3.`은 구간 2에서 떨어져 나온
 * 머리+다리 덩어리이며, 구간 6(머리부 분할)의 도마 피사체가 된다.
 */
const CEPH_SRC_DIR = path.resolve(SRC_DIR, 'reference', 'cephalopod');
const CEPH_SRC = {
  '0. 무늬오징어 원물(손질대기).png': 'squid_whole',
  '1.1. 갑-눈 사이(몸통부 신경 차단).png': 'squid_shime1',
  '1.2. 눈-다리 사이(다리부 신경 차단).png': 'squid_shime2',
  '2.1. 개복 및 내장 분리(펼치기 및 내장  노출).png': 'squid_spread',
  '2.2. 개복 및 내장 분리(내장 분리 결과 확인 및 가운데 연골 노출).png': 'squid_pen',
  '3. 내장이 제거된 머리부와 다리부.png': 'squid_headmass',
  '4.1. 껍질 제거 - 오른쪽 부분에서 왼쪽으로 잡아뜯기.png': 'squid_skin_grip',
  '4.2. 껍질 제거 - 위쪽 부분에서 아래쪽 부분으로 잡아뜯기.png': 'squid_skin_pull',
  '5.1. 한 쪽 날개를 껍질로부터 분리하는 중.png': 'squid_fin1',
  '5.2. 다른 쪽 날개를 껍질로부터 분리.png': 'squid_fin2',
  '6. 아가미 제거 및 내장면 닦기가 완료된 사진.png': 'squid_clean',
};

/**
 * 굽기 전에 지울 영역 (원본 정규화 폴리곤 — 회전·미러보다 먼저).
 *  halibut_fin_score — 사용자가 **칼길 위치를 알려주려고 포토샵으로 그려 넣은 칼**.
 *    게임은 칼을 별도 연출(actionAnimG)로 그리므로 스프라이트에 구우면 칼이 둘이 된다.
 *    행별 실루엣 실측: y≥0.62부터 생선(~0.526)과 칼(0.541~)이 **별도 런으로 분리**되므로
 *    그 사이를 지나는 직선으로 잘라낸다. (y<0.61 구간의 칼끝은 몸통과 겹쳐 있어 남지만
 *    원본 2~3px = 다운샘플 후 1셀 미만이라 무시 가능.)
 */
const ERASE_POLY = {
  halibut_fin_score: [[
    [0.60, 0.585], [1.0, 0.585], [1.0, 1.0], [0.746, 1.0], [0.528, 0.612], [0.60, 0.612],
  ]],
};

// ① 돔류 = SVG 자동 추출 (기본) → ② 사진 폴더가 같은 키를 덮어씀 (사진 우선)
const map = new Map(extractBreamStages());

/** [절대경로, 키] 목록 — 기본 폴더(파일명=키) + 명시 매핑 폴더 */
const photoJobs = [];
if (fs.existsSync(SRC_DIR)) {
  for (const f of fs.readdirSync(SRC_DIR).filter((n) => n.toLowerCase().endsWith('.png'))) {
    photoJobs.push([path.join(SRC_DIR, f), path.basename(f, '.png')]);
  }
}
for (const [fname, key] of Object.entries(CEPH_SRC)) {
  const abs = path.join(CEPH_SRC_DIR, fname);
  if (!fs.existsSync(abs)) { console.warn(`⚠ 두족류 입력 없음 (건너뜀): ${fname}`); continue; }
  photoJobs.push([abs, key]);
}

for (const [abs, key] of photoJobs) {
  let spr = processImage(abs, BG_TOL[key] ?? 46, ERASE_POLY[key] ?? [], fitsLong(key));
  const rot = ROTATE_KEYS[key];
  if (rot) spr = rotateSprite(spr, rot);
  if (MIRROR_KEYS.has(key)) spr = mirrorSprite(spr);
  const tag = [
    rot ? `회전 ${rot}` : null,
    MIRROR_KEYS.has(key) ? '미러' : null,
    fitsLong(key) ? '긴축' : null,
  ].filter(Boolean).join('·');
  map.set(key, spr);
  console.log(`${key}: ${spr.w}x${spr.h}, pal ${spr.palette.length} (사진${tag ? '·' + tag : ''})`);
}

/**
 * ── 파생: `halibut_lift_a` (오로시 길 1회 = 지느러미쪽이 살짝 들린 상태) ───────────────
 * 이 상태만 담긴 전용 사진이 없어도, **이미 가진 에셋 + 해부 구조**로 합성할 수 있다:
 *   베이스 = `halibut_fin_score`(칼길만 낸 배면 전체 뷰 — 흰 뱃살·지느러미 경계가 온전)
 *   더할 것 = 경계 안쪽으로 칼이 한 번 들어가 **살이 들리며 드러나는 얇은 붉은 단면**
 *   두께   = 꼬리(오른쪽)에서 가장 두껍고 머리로 갈수록 0 — 사용자 ref_4가 보여준 "저 정도만 들림"
 * 74차에서 등면 스프라이트로 배면을 파생한 것과 같은 방식이다(사진 1장 = 상태 1개가 아니다).
 */
function deriveLiftA(base, sideDir) {
  if (!base) return null;
  const H = base.rows.length, W = base.rows[0].length;
  const idx = (ch) => (ch === '.' ? -1 : AB.indexOf(ch));
  const lum = (c) => (((c >> 16) & 255) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000;
  // 단면(칼이 들어가 드러난 살) 색 2단 — 팔레트에 추가한다(AB 64자라 여유 있음).
  //  팔레트 최근접 재사용은 흰 뱃살에 묻혀 보이지 않았다(실측) → 전용 색을 넣는다.
  const palette = [...base.palette];
  const cutIdx = palette.push(0xb86f66) - 1;   // 단면(붉은 살)
  const rimIdx = palette.push(0x8d4b45) - 1;   // 칼이 지나간 자리 그늘
  const rows = base.rows.map((r) => [...r]);
  for (let x = 0; x < W; x++) {
    // 작업 중인 면의 바깥(지느러미·어두움) → 안쪽(살·밝음) 전이점을 찾는다
    {
      const dir = sideDir;
      let sawFin = false, edge = -1;
      for (let n = 0; n < H; n++) {
        const y = dir === 1 ? n : H - 1 - n;
        const i = idx(base.rows[y][x]);
        if (i < 0) continue;                       // 투명 = 실루엣 밖
        const L = lum(base.palette[i]);
        if (L < 110) { sawFin = true; continue; }  // 어두운 지느러미
        if (sawFin && L > 175) { edge = y; break; } // 지느러미 → 밝은 살 전이
      }
      if (edge < 0) continue;
      // 꼬리(오른쪽)로 갈수록 두껍게 — 머리쪽은 아직 칼이 닿지 않았다
      const t = Math.max(0, (x / (W - 1) - 0.20) / 0.80);
      const th = Math.round(t * t * 6);          // 제곱 램프 = 꼬리쪽에 몰림
      for (let k = 0; k < th; k++) {
        const y = edge + dir * k;
        if (y < 0 || y >= H) break;
        if (idx(base.rows[y][x]) < 0) break;
        rows[y][x] = AB[k === 0 ? rimIdx : cutIdx];
      }
    }
  }
  return { ...base, palette, rows: rows.map((r) => r.join('')) };
}
for (const [suffix, dir] of [['up', 1], ['dn', -1]]) {
  const liftA = deriveLiftA(map.get('halibut_fin_score'), dir);
  if (!liftA) continue;
  map.set(`halibut_lift_a_${suffix}`, liftA);
  console.log(`halibut_lift_a_${suffix}: ${liftA.w}x${liftA.h} (파생 ← halibut_fin_score)`);
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
