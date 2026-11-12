/**
 * f9_merge_captures.cjs — 다른 PC에서 받은 F9 [확정] 기록을 저장소 정본에 합친다 (322차)
 *
 * 사용자가 자기 PC dev 서버에서 [확정]한 `captures.json` · `log.jsonl`을 첨부로 보내면
 *   node tools/f9_merge_captures.cjs <받은 captures.json> [받은 log.jsonl]
 * 로 `tools/f9_captures/captures.json`(정본)에 합치고 `apply_f9_captures.cjs`를 돌린다.
 *
 * 규칙
 *  - 단계마다 `at`(확정 시각)이 늦은 쪽이 이긴다. 받은 파일에 없는 키(`@bream` 같은 군 공통값 포함)는 그대로 둔다.
 *  - **그림이 바뀌기 전에 그은 선은 버린다**(`STALE` 표) — 지아이뼈 분리(`pin_a` · `pin_b`)는 321차(2026-11-12 14:51Z)에
 *    그림이 「한 덩어리」에서 「갈빗대만 뗀 한 면 필렛」으로 바뀌었다. 그 전에 확정한 선은 다른 그림 위의 선이다.
 *    버린 것은 화면에 적는다(기록 `log.jsonl`에는 남긴다 — 무엇을 확정했는지는 지우지 않는다).
 *  - `log.jsonl`은 (시각 · 키 · 단계)가 같은 줄을 하나로 보고 시각 순으로 합친다.
 *
 *  --dry : 바꾸지 않고 무엇이 달라지는지만 적는다
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tools/f9_captures');
const CAP = path.join(DIR, 'captures.json');
const LOG = path.join(DIR, 'log.jsonl');

/** 단계 id → 이 시각 전에 확정한 좌표는 낡았다(그 뷰의 그림이 그때 바뀌었다) */
const STALE = {
  pin_a: '2026-11-12T14:51:07.000Z',
  pin_b: '2026-11-12T14:51:07.000Z',
};

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dry = process.argv.includes('--dry');
if (!args[0]) {
  console.error('사용: node tools/f9_merge_captures.cjs <받은 captures.json> [받은 log.jsonl] [--dry]');
  process.exit(1);
}

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {});
const mine = readJson(CAP);
const theirs = readJson(args[0]);

const isStale = (stageId, at) => {
  const cut = STALE[stageId];
  return !!cut && (typeof at !== 'string' || at < cut);
};

let added = 0; let replaced = 0; let kept = 0; const dropped = [];
// 저장소 정본에 이미 든 낡은 선도 함께 걷는다(받은 파일과 같은 규칙)
for (const key of Object.keys(mine)) {
  for (const id of Object.keys(mine[key] ?? {})) {
    if (isStale(id, mine[key][id]?.at)) { dropped.push(`${key}.${id} (정본)`); delete mine[key][id]; }
  }
}
for (const key of Object.keys(theirs)) {
  const src = theirs[key] ?? {};
  const dst = (mine[key] = mine[key] ?? {});
  for (const id of Object.keys(src)) {
    const t = src[id];
    if (isStale(id, t?.at)) { dropped.push(`${key}.${id}`); continue; }
    const m = dst[id];
    if (!m) { dst[id] = t; added++; continue; }
    const same = JSON.stringify({ ...m, at: 0 }) === JSON.stringify({ ...t, at: 0 });
    if (same) { kept++; continue; }
    if (String(t?.at ?? '') >= String(m?.at ?? '')) { dst[id] = t; replaced++; } else kept++;
  }
}

// 군 키(@…)를 맨 앞에 두고 나머지는 처음 나온 순서대로
const ordered = {};
for (const k of Object.keys(mine).filter((k) => k.startsWith('@')).sort()) ordered[k] = mine[k];
for (const k of Object.keys(mine).filter((k) => !k.startsWith('@'))) ordered[k] = mine[k];

let logAdded = 0;
let logLines = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split('\n').filter((l) => l.trim()) : [];
if (args[1] && fs.existsSync(args[1])) {
  const keyOf = (l) => { try { const o = JSON.parse(l); return `${o.at}|${o.key}|${o.stageId}`; } catch { return l; } };
  const seen = new Set(logLines.map(keyOf));
  for (const l of fs.readFileSync(args[1], 'utf8').split('\n').filter((x) => x.trim())) {
    const k = keyOf(l);
    if (seen.has(k)) continue;
    seen.add(k); logLines.push(l); logAdded++;
  }
  const atOf = (l) => { try { return String(JSON.parse(l).at ?? ''); } catch { return ''; } };
  logLines = logLines.map((l, i) => ({ l, i })).sort((a, b) => (atOf(a.l) < atOf(b.l) ? -1 : atOf(a.l) > atOf(b.l) ? 1 : a.i - b.i)).map((x) => x.l);
}

console.log(`[f9_merge] 새 단계 ${added} · 바뀐 단계 ${replaced} · 그대로 ${kept} · 버린 낡은 선 ${dropped.length} · 기록 ${logAdded}줄`);
if (dropped.length) console.log(`  버림(그림이 바뀌기 전 확정): ${dropped.join(', ')}`);
for (const k of Object.keys(ordered)) console.log(`  ${k}: ${Object.keys(ordered[k]).length}단계`);

if (!dry) {
  fs.writeFileSync(CAP, `${JSON.stringify(ordered, null, 1)}\n`, 'utf8');
  if (logAdded) fs.writeFileSync(LOG, `${logLines.join('\n')}\n`, 'utf8');
  execFileSync(process.execPath, [path.join(ROOT, 'tools/apply_f9_captures.cjs')], { stdio: 'inherit' });
}
