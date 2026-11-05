/**
 * @file audit_roads.mjs
 * @description 301차 — 심리스 지역 도로망 감사(사용자 「독도 … 차선 · 차량 수 · 도로와 다른 타일 · 해안선과 육로의 경계가 뒤섞임 … 전수조사」).
 *
 *  지역마다 `public/data/<지역>/roads.json`(차도 중심선) + `seamless.json`(지형)을 읽어
 *   - 도로 성분(정점을 공유하는 묶음) · 성분별 길이 · 간선(service · track · construction · *_link 밖) 길이
 *   - 토막(간선 없는 짧은 고립 성분 — 독도의 접안시설 service 셋이 이것) · 바다 · 방파제('~' · 'b') 위 비율이 높은 도로
 *   - 차량 예산(core `vehicleBudget` 와 같은 식) · 길에서 먼 보도('w') 칸 수
 *  를 표로 찍는다. 의심 지점(타일 좌표)은 `node tools/capture_wiki_maps.cjs`가 아니라 scratchpad `shot_region.cjs`로 찍어 눈으로 본다.
 *
 *  실행: node tools/audit_roads.mjs [지역 …] [--verbose]   (지역을 주지 않으면 심리스 15 전부)
 *  게임이 실제로 그리고 달리는 도로는 core `packages/core/src/rules/RoadNetwork.ts`(`pruneRoads` · `vehicleBudget`)가 같은 식으로 고른다 — 상수를 바꾸면 둘 다 바꾼다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'packages/client-pc/public/data');
const ALL = ['sokcho_v2', 'busan_gamcheon', 'busan_baegunpo', 'ulsan', 'pohang_guryongpo', 'geoje_east', 'geoje_south', 'yeosu_city',
  'taean_anheung', 'taean_manripo', 'jeju_city', 'jeju_moseulpo', 'jeju_seogwipo', 'ulleung', 'dokdo'];
const MINOR = new Set(['service', 'track', 'construction']);
const isMinor = (cls) => MINOR.has(cls) || cls.endsWith('_link');
const STUB_MAX = 40;        // 타일(200m) — 이보다 짧고 간선이 없는 고립 성분 = 토막
const WET_FRAC = 0.5;       // 표본의 이 비율 이상이 '~' · 'b' 위면 「물가 위 도로」
const TILES_PER_CAR = 150;  // 간선 길이(타일) ÷ 이것 = 차량 수(상한 36 · 간선 300타일 미만이면 0)

const len = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
const key = (p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;

function components(roads) {
  const parent = roads.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const byKey = new Map();
  roads.forEach((rd, i) => rd.pts.forEach((p) => { const k = key(p); const j = byKey.get(k); if (j === undefined) byKey.set(k, i); else parent[find(i)] = find(j); }));
  return roads.map((_, i) => find(i));
}

function samples(pts, step = 1) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; const L = Math.hypot(bx - ax, by - ay); const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k <= n; k++) out.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
  }
  return out;
}

export function auditRegion(region) {
  const dir = path.join(DATA, region);
  const roads = JSON.parse(fs.readFileSync(path.join(dir, 'roads.json'), 'utf8'));
  const sm = JSON.parse(fs.readFileSync(path.join(dir, 'seamless.json'), 'utf8'));
  const T = sm.terrain; const rows = T.length, cols = T[0].length;
  const at = (x, y) => { const c = Math.floor(x), r = Math.floor(y); return c < 0 || r < 0 || c >= cols || r >= rows ? '~' : T[r][c]; };
  const comp = components(roads);
  const compLen = new Map(), compMain = new Map(), compN = new Map();
  roads.forEach((rd, i) => { const c = comp[i]; const L = len(rd.pts); compLen.set(c, (compLen.get(c) ?? 0) + L); compN.set(c, (compN.get(c) ?? 0) + 1); if (!isMinor(rd.cls)) compMain.set(c, (compMain.get(c) ?? 0) + L); });
  const stubs = [], wet = [];
  let mainLen = 0, totalLen = 0;
  roads.forEach((rd, i) => {
    const L = len(rd.pts); totalLen += L; if (!isMinor(rd.cls)) mainLen += L;
    const c = comp[i];
    if ((compMain.get(c) ?? 0) === 0 && (compLen.get(c) ?? 0) < STUB_MAX) stubs.push({ i, cls: rd.cls, len: L, comp: c, edge: rd.pts.some(([x, y]) => x < 2 || y < 2 || x > cols - 2 || y > rows - 2), at: rd.pts[Math.floor(rd.pts.length / 2)] });
    // 표본은 **지도 안**만 센다(bbox 밖으로 이어지는 길은 바깥 점이 '~'로 잡혀 전부 「물가」로 보였다) · 가장자리 2칸 안이면 edge
    const ss = samples(rd.pts); let w = 0, b = 0, inb = 0;
    for (const p of ss) { if (p[0] < 0 || p[1] < 0 || p[0] >= cols || p[1] >= rows) continue; inb++; const t = at(p[0], p[1]); if (t === '~') w++; else if (t === 'b') b++; }
    const edge = rd.pts.some(([x, y]) => x < 2 || y < 2 || x > cols - 2 || y > rows - 2);
    const fracSea = inb ? w / inb : 0, fracBw = inb ? b / inb : 0;
    if (inb >= 3 && (fracSea >= WET_FRAC || fracBw >= WET_FRAC)) wet.push({ i, cls: rd.cls, len: L, inb, fracSea: Math.round(fracSea * 100) / 100, fracBw: Math.round(fracBw * 100) / 100, edge, at: rd.pts[Math.floor(rd.pts.length / 2)] });
  });
  // 길에서 먼 보도 — 반지름 3 안에 'r'이 없고 이웃에 '#'도 없는 'w'
  let farW = 0, wAll = 0; const farSpots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (T[r][c] !== 'w') continue; wAll++;
    let near = false;
    for (let dr = -3; dr <= 3 && !near; dr++) for (let dc = -3; dc <= 3; dc++) { const t = at(c + dc, r + dr); if (t === 'r' || t === '#' || t === 'p') { near = true; break; } }
    if (!near) { farW++; if (farW % 400 === 1) farSpots.push([c, r]); }
  }
  const budget = mainLen < 300 ? 0 : Math.min(36, Math.floor(mainLen / TILES_PER_CAR));
  const stubComps = new Set(stubs.map((s) => s.comp));
  return { region, roads: roads.length, comps: compLen.size, totalLen: Math.round(totalLen), mainLen: Math.round(mainLen), budget, stubs, stubComps: stubComps.size, stubLen: Math.round(stubs.reduce((a, s) => a + s.len, 0)), wet, wAll, farW, farSpots: farSpots.slice(0, 4) };
}

const argv = process.argv.slice(2);
const regionArgs = argv.filter((a) => !a.startsWith('--'));
const regions = regionArgs.length ? regionArgs : ALL;
const verbose = argv.includes('--verbose');
console.log('지역 | 도로 | 성분 | 총 길이 | 간선 길이 | 차량 예산(구 36) | 토막 성분/도로/길이(안쪽) | 물가 위 도로(안 표본 ≥50% — 안쪽) | 보도 w 전체/길에서 먼 w');
for (const region of regions) {
  const a = auditRegion(region);
  const inS = a.stubs.filter((x) => !x.edge), inW = a.wet.filter((x) => !x.edge);
  console.log(`${a.region} | ${a.roads} | ${a.comps} | ${a.totalLen} | ${a.mainLen} | ${a.budget} | ${a.stubComps}/${a.stubs.length}/${a.stubLen}(${inS.length}) | ${a.wet.length}(${inW.length}) | ${a.wAll}/${a.farW}`);
  if (verbose) {
    for (const s of a.stubs.slice(0, 12)) console.log(`   토막 ${s.cls} ${s.len.toFixed(1)}t${s.edge ? ' [가장자리]' : ''} @${s.at.map((v) => Math.round(v)).join(',')}`);
    for (const w of a.wet.slice(0, 12)) console.log(`   물가 ${w.cls} ${w.len.toFixed(1)}t 안 표본 ${w.inb} 바다 ${w.fracSea} · 방파제 ${w.fracBw}${w.edge ? ' [가장자리]' : ''} @${w.at.map((v) => Math.round(v)).join(',')}`);
    for (const f of a.farSpots) console.log(`   먼 보도 @${f.join(',')}`);
  }
}
