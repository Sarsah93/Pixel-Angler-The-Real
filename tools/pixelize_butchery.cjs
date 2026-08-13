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
function pageHtml(fileUrl, bgTol, erasePolys, fitLong, keepPolys) {
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
  // ── ①-b 영역 제거 (ERASE_POLY) / 영역 한정 (KEEP_POLY) ──
  //  ERASE = 사진에 **게임이 자체 연출로 그리는 요소**(칼 등)가 찍혀 있으면 굽기 전에 지운다.
  //  KEEP  = **피사체 폴리곤 바깥을 전부 지운다** — 손·도마·싱크대가 프레임을 채우는
  //          공정 실사(문어 손질 등)에서 배경 BFS만으로는 분리가 안 되는 경우의 주 수단.
  //  좌표는 둘 다 원본 정규화(0~1) 폴리곤 — 회전/미러보다 **먼저** 적용된다.
  const inPoly = (px, py, poly) => {
    let hit = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [xa, ya] = poly[a], [xb, yb] = poly[b];
      if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) hit = !hit;
    }
    return hit;
  };
  const polys = ${JSON.stringify(erasePolys || [])};
  const keeps = ${JSON.stringify(keepPolys || [])};
  if (polys.length || keeps.length) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = x / W, ny = y / H;
      if (keeps.length && !keeps.some((poly) => inPoly(nx, ny, poly))) { removed[y * W + x] = 1; continue; }
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
function processImage(absPngPath, bgTol = 46, erasePolys = [], fitLong = false, keepPolys = []) {
  const tmpHtml = path.join(os.tmpdir(), `pixbut_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpHtml, pageHtml(
    'file:///' + encodeURI(absPngPath.replace(/\\/g, '/')), bgTol, erasePolys, fitLong, keepPolys,
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
  // 내장 뽑기 연출 2프레임 — 개복 화면(squid_spread)과 좌우가 반대 (사용자 확인 2026-08-13)
  'squid_viscera_lift1',
  'squid_viscera_lift2',
  // 날개살 분리 1/2 진행 사진(5.1) — 095차 "아직 좌우반전이 안 되어 있네" (상하반전과 병행)
  'squid_fin1',
]);
/**
 * 상하 반전 키 (회전·미러 뒤 적용) — 날개살 분리 1/2의 진행 프레임(5.1)은 cw 베이크로
 * 살이 위쪽으로 들리는데, 사용자 지시(2026-08-13)로 아래쪽 들림(원본 사진 방향)으로 뒤집는다.
 */
const FLIPV_KEYS = new Set(['squid_fin1']);
const flipVSprite = (spr) => ({ ...spr, rows: [...spr.rows].reverse() });
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
  // 문어 싱크대 실사 — 젖은 회색 문어가 싱크대 스테인리스 색과 겹쳐 BFS가 피사체를 먹는다
  // (098차 실측: 기본 46이면 몸통이 얼룩으로 분해). 분리는 KEEP_POLY 전담, BFS는 사실상 끔.
  octo_invert1: 4, octo_invert2: 4, octo_invert3: 4, octo_viscera: 4,
  octo_beak1: 4, octo_beak3: 4, octo_salt: 4, octo_scrub: 4,
  // 완료 사진은 흰 테이블 배경이라 기본 임계 유지 (트레이 정리는 폴리곤이 담당)
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
  // ── 껍질 섹션 = 표시 회전 270(ccw) 통일 (093차) — 세로 사진을 cw로 눕혀 두면
  //    회전 뷰에서 촬영 방향 그대로 보인다. 4.1도 같은 뷰에 편입되어 cw 재배향.
  squid_skin_grip: 'cw',  // 4.1 — 093차부터 회전 뷰(270) 전용 (구 무회전 표시 폐기)
  squid_skin_lift: 'cw', // 목업 0-1 (회전 뷰 방향 캡처)
  squid_peel1: 'cw',
  squid_peel2: 'cw',
  squid_peel3: 'cw',
  squid_skin_done: 'cw',  // 완료 순살 (사진 6)
  squid_fin1: 'cw',
  squid_fin2: 'cw',
  squid_clean: 'cw',      // 완료 — 몸통 끝 위 → 오른쪽
  // 내장 분리 연출 2프레임 — 원본은 "펼친 몸통 아래 + 들어올린 덩어리 위".
  //  ccw(위→왼쪽)로 눕히면 덩어리가 **왼쪽으로 뽑히는** 그림이 되어
  //  squid_spread(다리·머리 = 왼쪽)의 레이아웃과 이어진다. cw면 좌우가 뒤집혀 튄다.
  squid_viscera_lift1: 'ccw',
  squid_viscera_lift2: 'ccw',
};

/**
 * 긴 축 기준 다운샘플 키 — 세로 원본은 가로 기준(GRID_W)이면 다운샘플이 안 걸린다.
 * 두족류는 뷰마다 종횡비가 0.27~2.6으로 크게 흔들리므로 전 키를 긴 축 기준으로 통일한다
 * (뷰가 바뀌어도 디테일 예산이 같다).
 */
const FIT_LONG_PREFIX = ['squid_', 'octo_'];
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
  // ── 091차 추가분 (사용자 2026-08-12) — 내장 분리 연출 2프레임 + 날개 뜯기 시작 ──
  //  ⚠ 파일명 공백이 둘이 다르다 — 1번은 `(내장부)위로`(공백 없음), 2번은 `(내장부) 위로`.
  '다리부+머리부를 몸통부(내장부)위로 뽑기 1.png': 'squid_viscera_lift1',
  '다리부+머리부를 몸통부(내장부) 위로 뽑기 2.png': 'squid_viscera_lift2',
  '날개뜯기1.png': 'squid_fin_tear',
};

/**
 * ── 껍질·날개 detail 시퀀스 (093차 — 사용자 준비 2026-08-13) ────────────────────
 * `껍질 제거 및 날개 뜯기 detail/` 하위 폴더. 껍질 뜯기 진행 프레임 3장 + 완료본 + 날개 시작본.
 * 시퀀스 번호 중 0(현재 상태 캡처)·0-1(들추기 목업 — 링 포함이라 파생으로 대체)·1(가이드 목업)·
 * 4(기존 4.1)·5(기존 4.2)·날개 1(기존 5.1 캡처)·이빨 제거(부리 좌표 목업)는 **베이크하지 않는다**.
 * ⚠ 파일명 공백 불일치 주의 — 1-2·2·3은 `벗기기  N`(공백 2), 6은 `벗기기 6`(공백 1).
 * ⚠ 세로(회전 뷰 방향) 사진은 cw로 눕혀 굽는다 — 표시 회전 270(ccw)이 원래 방향으로 되돌린다.
 */
const CEPH_DETAIL_DIR = path.resolve(CEPH_SRC_DIR, '껍질 제거 및 날개 뜯기 detail');
const CEPH_DETAIL_SRC = {
  // 095차: 손잡이 플랩은 절차 합성이 아니라 **목업 0-1을 그대로 베이크** (사용자 "두 번째
  // 캡처화면처럼 되어야 해"). 조준 링은 굽은 뒤 색 필터로 걷어내고 이웃 색으로 메운다(아래 파생).
  '껍질 벗기기  0-1.png': 'squid_skin_lift',
  '껍질 벗기기  1-2.png': 'squid_peel1',   // 우→좌 뜯기는 중 (초반)
  '껍질 벗기기  2.png': 'squid_peel2',     // 절반까지 딸려옴
  '껍질 벗기기  3.png': 'squid_peel3',     // 절반보다 조금 더
  '껍질 벗기기 6.png': 'squid_skin_done',  // 다 벗겨진 순살 (구 파생 대체 — 실사)
  '날개 0.png': 'squid_fin0',              // 날개+껍질 덩어리 — 날개살이 아직 안 뜯긴 시작 상태
};

/**
 * ── 문어(참문어) 공정 실사 (098차 — 사용자 준비 2026-08-13) ──────────────────────
 * `reference/cephalopod/octopus/` 하위 폴더. 번호 = 공정 순서(사용자 넘버링).
 * 싱크대·손이 프레임을 채우는 촬영이라 **KEEP_POLY(피사체 폴리곤)**가 주 분리 수단이고,
 * 배경 BFS는 폴리곤 안에 남은 싱크대/트레이 조각 정리용 보조다.
 * ⚠ 사진 6(부리 제거2)은 손가락이 피사체 대부분을 가려 **스프라이트로 채택하지 않는다**.
 * '문어 삶기 준비 완료.jpg'는 사용자 지시로 무시. PNG 4종(삶은 문어·머리·다리·숙회)은
 * 투명 배경이라 이 파이프라인이 아니라 `gen_octo_assets.cjs`(직접 로드 아이콘)가 소비한다.
 */
const OCTO_SRC_DIR = path.resolve(CEPH_SRC_DIR, 'octopus');
const OCTO_SRC = {
  '1문어 머리 뒤집기1.jpg': 'octo_invert1',   // 외번 시작 — 외투막을 밀어 넣는 중
  '2문어 머리 뒤집기2.jpg': 'octo_invert2',   // 외번 진행 — 속면(흰 주머니)이 나옴
  '3문어 머리 뒤집기3.jpg': 'octo_invert3',   // 외번 완료 — 내장 덩어리 노출
  '4문어 머리 내장 제거.jpg': 'octo_viscera', // 내장 떼어내기 — 덩어리를 당겨 분리
  '5문어 부리 제거1.jpg': 'octo_beak1',       // 입면 — 악판(검은 부리) 눌러내기 시작
  '7문어 부리 제거3.jpg': 'octo_beak3',       // 악판 제거 완료 — 입 자리 구멍
  '8문어 다리 소금세척1.jpg': 'octo_salt',    // 굵은소금 뿌린 상태
  '9문어 다리 소금세척2.jpg': 'octo_scrub',   // 거품 문지르기 (손·거품 위주 — 품질 확인 대상)
  '문어 손질 완료.jpg': 'octo_clean',         // 완료 — 트레이 위 통마리 (아이콘 원본 겸용)
};

/**
 * 피사체 폴리곤 (원본 정규화 0~1) — 바깥은 전부 제거. 손·트레이·싱크대를 걷어내고
 * "문어로 추정되는 영역"만 남긴다 (사용자 지시 2026-08-13 — 근사 추론 허용).
 * 손가락이 피사체에 겹친 부분은 폴리곤 경계로 근사 절단한다.
 */
const KEEP_POLY = {
  // 그리드 오버레이 실측 (0.1 간격 — scratchpad grid_overlay.cjs, 2026-08-13)
  octo_invert1: [[
    [0.440, 0.740], [0.470, 0.670], [0.520, 0.630], [0.585, 0.615], [0.635, 0.635],
    [0.640, 0.680], [0.590, 0.710], [0.565, 0.800], [0.530, 0.910], [0.470, 0.895], [0.440, 0.820],
  ]],
  octo_invert2: [[
    [0.415, 0.215], [0.520, 0.215], [0.585, 0.260], [0.635, 0.330], [0.645, 0.420],
    [0.600, 0.490], [0.545, 0.525], [0.470, 0.555], [0.415, 0.545], [0.370, 0.500],
    [0.345, 0.420], [0.350, 0.320], [0.380, 0.250],
  ]],
  octo_invert3: [[
    [0.310, 0.430], [0.380, 0.375], [0.440, 0.360], [0.500, 0.405], [0.545, 0.470],
    [0.545, 0.565], [0.500, 0.655], [0.440, 0.725], [0.375, 0.755], [0.315, 0.715],
    [0.283, 0.620], [0.278, 0.500],
  ]],
  // 내장 제거 — 외번 머리(흰 주머니) + 내장 줄 + 트레이 위 다리 뭉치 + 뽑히는 내장 덩어리(우)
  octo_viscera: [
    [[0.075, 0.500], [0.150, 0.440], [0.240, 0.470], [0.295, 0.550], [0.300, 0.630],
      [0.270, 0.700], [0.190, 0.775], [0.100, 0.730], [0.050, 0.620], [0.045, 0.545]],
    [[0.245, 0.500], [0.320, 0.475], [0.420, 0.500], [0.500, 0.530], [0.600, 0.500],
      [0.680, 0.510], [0.685, 0.560], [0.620, 0.585], [0.655, 0.630], [0.640, 0.720],
      [0.570, 0.780], [0.550, 0.880], [0.460, 0.930], [0.350, 0.935], [0.270, 0.880],
      [0.220, 0.780], [0.235, 0.620]],
    [[0.775, 0.410], [0.815, 0.395], [0.855, 0.425], [0.875, 0.480], [0.855, 0.545],
      [0.810, 0.570], [0.775, 0.545], [0.765, 0.480]],
  ],
  // 부리1 — 좌 검지·우 엄지 끝이 입 주변에 겹쳐 노치로 근사 절단 (부리 0.385,0.59는 보존)
  octo_beak1: [[
    [0.380, 0.340], [0.460, 0.315], [0.540, 0.360], [0.555, 0.440], [0.530, 0.500],
    [0.495, 0.560], [0.500, 0.660], [0.560, 0.720], [0.640, 0.780], [0.625, 0.860],
    [0.550, 0.940], [0.460, 0.985], [0.370, 0.950], [0.300, 0.860], [0.275, 0.750],
    [0.300, 0.660], [0.345, 0.620], [0.335, 0.550], [0.360, 0.470], [0.360, 0.400],
  ]],
  octo_beak3: [[
    [0.455, 0.380], [0.520, 0.330], [0.580, 0.380], [0.600, 0.470], [0.565, 0.520],
    [0.550, 0.580], [0.515, 0.660], [0.530, 0.760], [0.580, 0.820], [0.550, 0.900],
    [0.460, 0.950], [0.360, 0.930], [0.270, 0.900], [0.200, 0.830], [0.210, 0.770],
    [0.310, 0.730], [0.380, 0.680], [0.430, 0.580], [0.455, 0.470],
  ]],
  octo_salt: [[
    [0.600, 0.300], [0.700, 0.300], [0.780, 0.330], [0.820, 0.400], [0.840, 0.480],
    [0.800, 0.560], [0.720, 0.600], [0.700, 0.680], [0.630, 0.760], [0.540, 0.800],
    [0.460, 0.760], [0.410, 0.680], [0.400, 0.580], [0.440, 0.500], [0.500, 0.440], [0.550, 0.360],
  ]],
  // 문지르기 — 거품 낀 대각 몸통 띠만 (손·거품이 대부분이라 근사 — 품질 미달 시 salt 공유)
  octo_scrub: [[
    [0.360, 0.020], [0.500, 0.020], [0.460, 0.120], [0.430, 0.220], [0.400, 0.320],
    [0.365, 0.430], [0.330, 0.470], [0.300, 0.450], [0.290, 0.380],
    [0.300, 0.300], [0.320, 0.160],
  ]],
  octo_clean: [[
    [0.185, 0.285], [0.270, 0.252], [0.360, 0.262], [0.440, 0.272], [0.525, 0.175],
    [0.620, 0.148], [0.715, 0.175], [0.810, 0.205], [0.870, 0.270], [0.900, 0.350],
    [0.920, 0.470], [0.900, 0.580], [0.830, 0.680], [0.780, 0.780], [0.700, 0.880],
    [0.620, 0.950], [0.500, 0.930], [0.420, 0.880], [0.370, 0.800], [0.335, 0.700],
    [0.260, 0.660], [0.185, 0.600], [0.157, 0.500], [0.157, 0.360],
  ]],
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
  // ⚠ squid_skin_lift(목업 0-1)에 ERASE_POLY를 쓰면 안 된다 — 사전 지우기가 투명 비율을
  //   3% 넘겨 **알파 경로로 오판**되고 도마색 배경 제거가 통째로 꺼진다 (095차 실측).
  //   검은 띠·링·프린지는 굽은 뒤 파생 단계에서 정리한다.
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
for (const [fname, key] of Object.entries(CEPH_DETAIL_SRC)) {
  const abs = path.join(CEPH_DETAIL_DIR, fname);
  if (!fs.existsSync(abs)) { console.warn(`⚠ 두족류 detail 입력 없음 (건너뜀): ${fname}`); continue; }
  photoJobs.push([abs, key]);
}
for (const [fname, key] of Object.entries(OCTO_SRC)) {
  const abs = path.join(OCTO_SRC_DIR, fname);
  if (!fs.existsSync(abs)) { console.warn(`⚠ 문어 입력 없음 (건너뜀): ${fname}`); continue; }
  photoJobs.push([abs, key]);
}

for (const [abs, key] of photoJobs) {
  let spr = processImage(abs, BG_TOL[key] ?? 46, ERASE_POLY[key] ?? [], fitsLong(key), KEEP_POLY[key] ?? []);
  const rot = ROTATE_KEYS[key];
  if (rot) spr = rotateSprite(spr, rot);
  if (MIRROR_KEYS.has(key)) spr = mirrorSprite(spr);
  if (FLIPV_KEYS.has(key)) spr = flipVSprite(spr);
  const tag = [
    rot ? `회전 ${rot}` : null,
    MIRROR_KEYS.has(key) ? '미러' : null,
    FLIPV_KEYS.has(key) ? '상하반전' : null,
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

/**
 * ── 파생: 두족류 추론 합성 3종 (091차 — 사용자 지시 2026-08-12) ─────────────────
 * "뜯기 전" 상태의 실사가 존재하지 않아(사용자: "원물 실사를 찾기가 어려워. 결국 추론해서
 * 이미지를 만드는 수 밖에 없어") **영상(껍질벗기기.mp4) 형태 참고 + 보유 에셋 색 샘플링**으로
 * 그리드 레벨 합성한다 — deriveLiftA(84차)와 같은 방식(사진 1장 = 상태 1개가 아니다).
 *
 *  squid_skin_on   : 껍질이 온전히 붙은 펼친 몸통 (베이스 = squid_clean 실루엣 + 4.1 껍질 색)
 *  squid_skin_down : 아래로 뜯기 **시작** 상태 (베이스 = 4.2 — 살 위로 껍질을 되덮어 덜 뜯긴 상태)
 *  squid_finskin_on: 필렛+껍질+날개 온전 (베이스 = 날개뜯기1 — 하얀 절단면 띠를 껍질 색으로 되덮음)
 *
 * 껍질 질감(영상 실측): 유백 바탕에 회갈색 얼룩 + 검은 색소포 반점. 원본 명암을 유지해
 * 입체감을 보존한다(원본 밝기 → 껍질 셰이드 10단 매핑 + 해시 지터 + 반점 5%).
 */
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
const lumOf = (c) => (((c >> 16) & 255) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000;

/**
 * 스프라이트에서 조건에 맞는 픽셀의 평균 톤을 뽑는다.
 * @param pickFn (x, y, lum) => boolean — 샘플 대상 판정
 */
function sampleTone(spr, pickFn, fallback) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < spr.rows.length; y++) {
    const row = spr.rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      const c = spr.palette[AB.indexOf(row[x])];
      if (!pickFn(x, y, lumOf(c))) continue;
      r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; n++;
    }
  }
  if (!n) return fallback;
  return { r: r / n, g: g / n, b: b / n };
}

/**
 * base의 특정 픽셀들을 껍질 질감으로 되덮는다.
 * @param regionFn (x, y, lum) => boolean — 덮을 픽셀 판정
 */
function deriveSkinOver(base, tone, regionFn) {
  if (!base || !tone) return null;
  const palette = [...base.palette];
  const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  // 껍질 셰이드 10단 (0.62 ~ 1.16 배) + 색소포 반점
  const SH = 10;
  const shadeIdx = [];
  for (let k = 0; k < SH; k++) {
    const s = 0.62 + (k / (SH - 1)) * 0.54;
    shadeIdx.push(palette.push((clamp8(tone.r * s) << 16) | (clamp8(tone.g * s) << 8) | clamp8(tone.b * s)) - 1);
  }
  const speckIdx = palette.push((clamp8(tone.r * 0.42) << 16) | (clamp8(tone.g * 0.42) << 8) | clamp8(tone.b * 0.42)) - 1;
  if (palette.length > AB.length) throw new Error('팔레트 초과: ' + palette.length);

  const rows = base.rows.map((r) => [...r]);
  const H = rows.length, W = rows[0].length;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = base.rows[y][x];
      if (ch === '.') continue;
      const L = lumOf(base.palette[AB.indexOf(ch)]);
      if (!regionFn(x, y, L)) continue;
      if (hash2(x * 7 + 3, y * 13 + 1) < 0.05) { rows[y][x] = AB[speckIdx]; continue; }  // 색소포 반점
      // 원본 명암 유지 + 지터 1단
      let k = Math.round(((Math.max(110, Math.min(230, L)) - 110) / 120) * (SH - 1));
      const j = hash2(x, y);
      k = Math.max(0, Math.min(SH - 1, k + (j < 0.22 ? -1 : j > 0.78 ? 1 : 0)));
      rows[y][x] = AB[shadeIdx[k]];
    }
  }
  return { ...base, palette, rows: rows.map((r) => r.join('')) };
}

{
  const skinRef = map.get('squid_skin_grip');
  // 껍질 톤 = 4.1의 껍질 몸통 픽셀(밝은 살·짙은 그늘 제외) — 영상 실측(유백 회갈 얼룩)과 정합
  const skinTone = skinRef
    ? sampleTone(skinRef, (_x, _y, L) => L >= 60 && L <= 150, { r: 168, g: 152, b: 140 })
    : null;

  // ① 껍질 온전 — 펼친 몸통(squid_clean) 전면을 껍질로
  const skinOn = deriveSkinOver(map.get('squid_clean'), skinTone, () => true);
  if (skinOn) { map.set('squid_skin_on', skinOn); console.log(`squid_skin_on: ${skinOn.w}x${skinOn.h} (합성 ← squid_clean + 4.1 껍질톤)`); }

  // ② 아래로 뜯기 시작 — 4.2(왼쪽 = 껍질 덩어리 · 오른쪽 = 드러난 살)에서
  //    살 영역 왼쪽 절반가량을 다시 껍질로 덮어 "덜 뜯긴" 시작 상태를 만든다.
  //    ⚠ 경계는 **전역 x 기준**(휘도 맵 실측: 살 돔 = x/W 0.40~0.95) — 행별 최좌측 밝은 픽셀
  //      기준은 껍질 덩어리의 젖은 하이라이트에 걸려 빗살 아티팩트가 났다(1차 시도 실패).
  //      지터는 4행 단위 청크로 — 1행 단위는 빗살, 청크는 뜯긴 가장자리로 읽힌다.
  const pull = map.get('squid_skin_pull');
  if (pull && skinTone) {
    const W2 = pull.rows[0].length;
    const skinDown = deriveSkinOver(pull, skinTone, (x, y, L) => {
      if (L < 160) return false;
      const boundary = W2 * 0.62 + (hash2(1, y >> 2) - 0.5) * 8;
      return x < boundary;
    });
    if (skinDown) { map.set('squid_skin_down', skinDown); console.log(`squid_skin_down: ${skinDown.w}x${skinDown.h} (합성 ← squid_skin_pull 경계 0.62W 되덮음)`); }
  }

  // ③ 필렛+껍질+날개 온전 — 날개뜯기1의 **하얀 절단면 띠**(뜯기며 드러난 살, 휘도 맵 실측:
  //    y ≥ 48 · L ≥ 205의 세로 띠)만 되덮는다. 톤은 4.1 껍질이 아니라 **자기 돔(위쪽 황갈 껍질)**
  //    에서 샘플 — 돔과 이어져 "아직 뜯지 않은 한 덩어리"로 읽힌다. 상단 돔의 젖은 하이라이트와
  //    하단 자투리는 보존(전역 휘도 기준으로 덮으면 돔 전체가 얼룩져 탁해진다 — 1차 시도 실패).
  const tear = map.get('squid_fin_tear');
  if (tear) {
    const domeTone = sampleTone(tear, (_x, y, L) => y < 48 && L >= 160 && L <= 215, { r: 196, g: 182, b: 165 });
    const finskinOn = deriveSkinOver(tear, domeTone, (_x, y, L) => y >= 48 && L >= 205);
    if (finskinOn) { map.set('squid_finskin_on', finskinOn); console.log(`squid_finskin_on: ${finskinOn.w}x${finskinOn.h} (합성 ← squid_fin_tear 절단면 띠 되덮음)`); }
  }
}

/**
 * ── 파생: 두족류 092~095차 ─────────────────────────────
 *  squid_skin_lift : **목업 0-1 베이크의 조준 링 제거** — 붉은 링 픽셀을 색으로 골라 지우고
 *                    이웃 다수색으로 메운다 (095차 — 구 절차 합성 플랩은 "이상한 걸 넣어놨네"로 폐기)
 *  squid_gill_on   : 아가미 온전 = squid_clean 위에 2.2(squid_pen)의 아가미(깃털 기관)만 얹음
 *  *_m 미러 3키    : 날개 뜯기(껍질째) 2/2 + 날개살 분리 2/2 시작 프레임용 좌우 반전
 */
{
  // ① 목업 0-1 정리 — 캡처의 도마색(불투명 배경) 잔여 프린지를 침식으로 걷어낸 뒤,
  //    조준 링(적색 — 채도 인지: 갈색 프린지(g−b 큼)와 구분)을 플랩 주변 영역에서만 지우고
  //    3×3 이웃 다수색으로 인페인트한다.
  const liftRaw = map.get('squid_skin_lift');
  if (liftRaw) {
    const W2 = liftRaw.rows[0].length, H2 = liftRaw.rows.length;
    const rows = liftRaw.rows.map((r) => [...r]);
    const rgbOf = (ch) => {
      const c = liftRaw.palette[AB.indexOf(ch)];
      return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    };
    // (0) 도마색 보더 플러드 제거 — 목업 PNG는 **투명 여백이 있는 캡처**라 알파 경로로 판정되어
    //     도마색(불투명 배경)이 그대로 구워진다(095차 실측). 테두리에서 도마 유사색만 타고
    //     퍼지는 BFS로 걷어낸다 (표준 누끼의 그리드판 — 색 제한이라 플랩 검은 테두리는 안전).
    {
      const border = [];
      const colorCount = new Map();
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          if (y !== 0 && y !== H2 - 1 && x !== 0 && x !== W2 - 1) continue;
          const ch = rows[y][x];
          if (ch === '.') continue;
          border.push([x, y]);
          colorCount.set(ch, (colorCount.get(ch) ?? 0) + 1);
        }
      }
      let boardCh = null, boardN = 0;
      for (const [ch, n] of colorCount) if (n > boardN) { boardN = n; boardCh = ch; }
      if (boardCh) {
        const [br, bg2, bb] = rgbOf(boardCh);
        const boardLike = (ch) => {
          if (ch === '.') return false;
          const [r, g, b] = rgbOf(ch);
          // 도마 유사색 = 색 근접 **그리고 따뜻함(r−b) 유지** — 몸통 회색(r≈b)은 맨해튼 거리만으로
          // 도마와 99까지 근접해서(095차 실측 — 거리 110 단독이면 몸통까지 먹었다) 따뜻함으로 가른다.
          return Math.abs(r - br) + Math.abs(g - bg2) + Math.abs(b - bb) < 130 && r - b >= 40;
        };
        const q = border.filter(([x, y]) => boardLike(rows[y][x]));
        const inQ = rows.map((r) => r.map(() => false));
        for (const [x, y] of q) inQ[y][x] = true;
        while (q.length) {
          const [x, y] = q.pop();
          rows[y][x] = '.';
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ax = x + dx, ay = y + dy;
            if (ax < 0 || ay < 0 || ax >= W2 || ay >= H2 || inQ[ay][ax]) continue;
            if (!boardLike(rows[ay][ax])) continue;
            inQ[ay][ax] = true;
            q.push([ax, ay]);
          }
        }
      }
    }
    // (a0) 캡처 최하단 검은 띠 (cw 로컬 = 좌측 5% 열의 어두운 셀 — 좌표 한정이라 플랩 테두리 안전)
    for (let y = 0; y < H2; y++) {
      for (let x = 0; x < Math.ceil(W2 * 0.05); x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        const [r, g, b] = rgbOf(ch);
        if ((r * 299 + g * 587 + b * 114) / 1000 < 70) rows[y][x] = '.';
      }
    }
    // (a) 테두리 침식 — 투명(또는 그리드 밖)과 맞닿은 따뜻한 갈색(도마 잔여)을 3패스 제거
    const warmTan = (ch) => {
      if (ch === '.') return false;
      const [r, g, b] = rgbOf(ch);
      return r - b >= 40 && r - g >= 15 && r > 120;
    };
    let eroded = 0;
    for (let pass = 0; pass < 3; pass++) {
      const kill = [];
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          if (!warmTan(rows[y][x])) continue;
          const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
            const ax = x + dx, ay = y + dy;
            return ax < 0 || ay < 0 || ax >= W2 || ay >= H2 || rows[ay][ax] === '.';
          });
          if (edge) kill.push([x, y]);
        }
      }
      for (const [x, y] of kill) rows[y][x] = '.';
      eroded += kill.length;
    }
    // (b) 조준 링 제거 — 플랩 주변 영역(cw 로컬: 우하단) 한정 + 채도 인지 적색 판정
    const isRed = (ch) => {
      if (ch === '.') return false;
      const [r, g, b] = rgbOf(ch);
      return r - g >= 35 && r - b >= 35 && Math.abs(g - b) <= 25;
    };
    const marked = [];
    for (let y = Math.floor(H2 * 0.55); y < H2; y++) {
      for (let x = Math.floor(W2 * 0.45); x < W2; x++) {
        if (isRed(rows[y][x])) { marked.push([x, y]); }
      }
    }
    for (const [x, y] of marked) rows[y][x] = '.';
    for (const [x, y] of marked) {
      const votes = new Map();
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const ax = x + dx, ay = y + dy;
          if (ax < 0 || ay < 0 || ax >= W2 || ay >= H2) continue;
          const ch = rows[ay][ax];
          if (ch === '.') continue;
          votes.set(ch, (votes.get(ch) ?? 0) + 1);
        }
      }
      let best = null, bestN = 0, total = 0;
      for (const [ch, n] of votes) { total += n; if (n > bestN) { bestN = n; best = ch; } }
      if (best && total >= 3) rows[y][x] = best;
    }
    // (d) 최대 연결요소만 유지 — 몸 밖 허공의 링 조각·도마 잔재 제거 (skin_done과 동일 방식)
    {
      const seen = rows.map((r) => r.map(() => 0));
      let compId = 0, bestId = 0, bestN = 0;
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          if (rows[y][x] === '.' || seen[y][x]) continue;
          compId++;
          let n = 0;
          const q = [[x, y]];
          seen[y][x] = compId;
          while (q.length) {
            const [cx, cy] = q.pop();
            n++;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const ax = cx + dx, ay = cy + dy;
              if (ax < 0 || ay < 0 || ax >= W2 || ay >= H2) continue;
              if (rows[ay][ax] === '.' || seen[ay][ax]) continue;
              seen[ay][ax] = compId;
              q.push([ax, ay]);
            }
          }
          if (n > bestN) { bestN = n; bestId = compId; }
        }
      }
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          if (rows[y][x] !== '.' && seen[y][x] !== bestId) rows[y][x] = '.';
        }
      }
    }
    // (e) 플랩 재채색 (096차 — 사용자 "뒤집힌 부분은 배경색임. 왼쪽 = 껍질 컬러 / 우측 = 흰색"):
    //     목업 캡처의 플랩이 도마색 계열로 구워지므로, 플랩 셀(우하단 영역의 따뜻/밝은 셀 —
    //     검은 테두리 제외)을 로컬 y 하위 절반 = 몸통 껍질톤 / 상위 절반 = 흰 살 톤으로 다시 칠한다.
    //     (회전 뷰(270)에서 로컬 y = 화면 가로축: 작은 y = 왼쪽 ✓)
    const palette = [...liftRaw.palette];
    let recolored = 0;
    {
      const lumOf2 = (r, g2, b) => (r * 299 + g2 * 587 + b * 114) / 1000;
      // 몸통 껍질톤 = 좌측 절반(몸통부)의 중간 명도 셀 평균
      let br2 = 0, bg3 = 0, bb2 = 0, bn = 0;
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < Math.floor(W2 * 0.5); x++) {
          const ch = rows[y][x];
          if (ch === '.') continue;
          const [r, g2, b] = rgbOf(ch);
          const L = lumOf2(r, g2, b);
          if (L < 80 || L > 160) continue;
          br2 += r; bg3 += g2; bb2 += b; bn++;
        }
      }
      const tone = bn ? { r: br2 / bn, g: bg3 / bn, b: bb2 / bn } : { r: 128, g: 118, b: 122 };
      const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
      const SKIN_SH = 5, WHITE_SH = 4;
      const skinIdx = [], whiteIdx = [];
      for (let k = 0; k < SKIN_SH; k++) {
        const s = 0.72 + (k / (SKIN_SH - 1)) * 0.44;
        skinIdx.push(palette.push((clamp8(tone.r * s) << 16) | (clamp8(tone.g * s) << 8) | clamp8(tone.b * s)) - 1);
      }
      for (let k = 0; k < WHITE_SH; k++) {
        const v = 205 + k * 13;
        whiteIdx.push(palette.push((clamp8(v) << 16) | (clamp8(v) << 8) | clamp8(v - 8)) - 1);
      }
      if (palette.length > AB.length) throw new Error('팔레트 초과(skin_lift 재채색): ' + palette.length);
      // 플랩 셀 수집 (우하단 영역 · 따뜻하거나 밝은 셀 — 검은 테두리는 보존)
      const flap = [];
      let yMin = H2, yMax = 0;
      for (let y = Math.floor(H2 * 0.5); y < H2; y++) {
        for (let x = Math.floor(W2 * 0.5); x < W2; x++) {
          const ch = rows[y][x];
          if (ch === '.') continue;
          const [r, g2, b] = rgbOf(ch);
          const L = lumOf2(r, g2, b);
          if (L < 85) continue;                       // 테두리·짙은 그늘 보존
          if (!(r - b >= 18 || L >= 170)) continue;   // 몸통 회색(중성)은 제외
          flap.push([x, y, L]);
          if (y < yMin) yMin = y;
          if (y > yMax) yMax = y;
        }
      }
      const range = Math.max(1, yMax - yMin);
      for (const [x, y, L] of flap) {
        const half = (y - yMin) / range;
        if (half < 0.45) {
          const k = Math.max(0, Math.min(SKIN_SH - 1, Math.round(((L - 85) / 130) * (SKIN_SH - 1))));
          rows[y][x] = AB[skinIdx[k]];
        } else {
          const k = Math.max(0, Math.min(WHITE_SH - 1, Math.round(((L - 85) / 150) * (WHITE_SH - 1))));
          rows[y][x] = AB[whiteIdx[k]];
        }
        recolored++;
      }
    }
    const lift = { ...liftRaw, palette, rows: rows.map((r) => r.join('')) };
    map.set('squid_skin_lift', lift);
    console.log(`squid_skin_lift: ${lift.w}x${lift.h} (목업 0-1 — 프린지 ${eroded}px 침식 · 링 ${marked.length}px · 플랩 ${recolored}px 재채색)`);
  }

  // ② 아가미 온전 — 2.2(squid_pen)의 깃털 기관 2개를 **색으로 골라**(갈분홍 — 청록 외투막·
  //    회백 연골 배제) squid_clean의 같은 정규화 위치에 얹는다. 두 스프라이트 모두 펼친 몸통
  //    전신 뷰(128×127 / 128×121)라 위치가 근사 정합. 톤은 아가미 샘플 → 셰이드 8단 양자화
  //    (팔레트 상한 64 방어 — deriveSkinOver 방식).
  const pen = map.get('squid_pen');
  const clean = map.get('squid_clean');
  if (pen && clean) {
    const PW = pen.rows[0].length, PH = pen.rows.length;
    const CW = clean.rows[0].length, CH = clean.rows.length;
    const gillPick = (x, y) => {
      const nx = x / (PW - 1), ny = y / (PH - 1);
      if (nx < 0.16 || nx > 0.64 || ny < 0.26 || ny > 0.78) return false;   // 아가미 존재 영역(실측)
      const ch = pen.rows[y][x];
      if (ch === '.') return false;
      const c = pen.palette[AB.indexOf(ch)];
      const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
      // 갈색조(아가미 깃털) = 적 > 청 뚜렷 + 적 ≥ 녹. 청록 외투막(g·b > r)과
      // 회백 연골(r ≈ g ≈ b)은 탈락 — r>g+12는 은회색 깃털 축을 놓쳐 137px 낙서가 됐다(1차 실패).
      return r - b > 14 && r >= g - 2;
    };
    const tone = (() => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
        if (!gillPick(x, y)) continue;
        const c = pen.palette[AB.indexOf(pen.rows[y][x])];
        r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; n++;
      }
      return n ? { r: r / n, g: g / n, b: b / n } : { r: 176, g: 138, b: 128 };
    })();
    const palette = [...clean.palette];
    const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const SH = 8;
    const shadeIdx = [];
    for (let k = 0; k < SH; k++) {
      const s = 0.55 + (k / (SH - 1)) * 0.65;
      shadeIdx.push(palette.push((clamp8(tone.r * s) << 16) | (clamp8(tone.g * s) << 8) | clamp8(tone.b * s)) - 1);
    }
    if (palette.length > AB.length) throw new Error('팔레트 초과(gill_on): ' + palette.length);
    const rows = clean.rows.map((r) => [...r]);
    let stamped = 0;
    for (let cy = 0; cy < CH; cy++) {
      for (let cx = 0; cx < CW; cx++) {
        if (clean.rows[cy][cx] === '.') continue;             // 몸 실루엣 밖에는 얹지 않는다
        const px2 = Math.round((cx / (CW - 1)) * (PW - 1));
        const py2 = Math.round((cy / (CH - 1)) * (PH - 1));
        if (!gillPick(px2, py2)) continue;
        const L = lumOf(pen.palette[AB.indexOf(pen.rows[py2][px2])]);
        const k = Math.max(0, Math.min(SH - 1, Math.round(((Math.max(70, Math.min(210, L)) - 70) / 140) * (SH - 1))));
        rows[cy][cx] = AB[shadeIdx[k]];
        stamped++;
      }
    }
    const gillOn = { ...clean, palette, rows: rows.map((r) => r.join('')) };
    map.set('squid_gill_on', gillOn);
    console.log(`squid_gill_on: ${gillOn.w}x${gillOn.h} (합성 ← squid_clean + squid_pen 아가미 ${stamped}px)`);
  }

  // ③ 미러 3키 — 날개 뜯기(껍질째) 2/2 + 날개살 분리 2/2 시작 프레임 (좌우 반전)
  for (const key of ['squid_finskin_on', 'squid_fin_tear', 'squid_fin0']) {
    const s = map.get(key);
    if (!s) continue;
    const m = mirrorSprite(s);
    map.set(`${key}_m`, m);
    console.log(`${key}_m: ${m.w}x${m.h} (미러 ← ${key})`);
  }
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
