/**
 * f9_share_fillet_lines.cjs — 321차: 「1면 뜨기 · 2면 뜨기」 확정 선을 어종군 공통값으로 넣기
 *
 * 사용자 지시(2026-11-12): 「'7단계: 1면 뜨기'와 '8단계: 2면 뜨기'는 거의 모든 생선이 공통이라, 벵에돔 기준으로 해도 될 것 같아.
 *   어차피 같은 그림이 나오고 있어서. (단, 장어류나 기타 다른 어종에서 저 단계를 거치지 않는 어종은 별도) 이건 너가 지정해주고」.
 *
 * 장뜨기 뷰(등쪽 · 배쪽 · 척추 붙은 덩어리)는 어종군 공용 그림이고, 돔류 · 방어류 두 어종군의 그림 크기(128×64)와 기본선 8개가 같다.
 * 그래서 한 어종(벵에돔)의 확정 선을 `@bream` · `@amberjack` 두 군 키에 그대로 넣는다(개복 뒤 공용 뷰라 그림 자리로 옮기지 않는다 — `familyFrame` 없음).
 *  - 찾는 순서는 어종 → 군이라, 어종마다 따로 확정하면 그쪽이 먼저다.
 *  - 이 단계가 없는 갈래(장어류 · 넙치류 다섯장뜨기 · 4덩어리 해체 · 두족류)는 군 키가 다르거나 스테이지 id가 없어 닿지 않는다.
 *  - 군 키는 파일 맨 앞에 넣는다 — dev 서버 [확정]은 새 어종을 끝에 붙이므로 다른 PC의 확정분과 줄이 겹치지 않는다.
 *
 * 실행: node tools/f9_share_fillet_lines.cjs [--from largescale_blackfish] [--check]
 *   → `tools/f9_captures/captures.json`을 고치고 `apply_f9_captures.cjs`로 core 표를 다시 굽는다. 기준 어종의 선을 다시 확정했으면 다시 돌린다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tools/f9_captures/captures.json');
/** 7단계 「1면 뜨기」 · 8단계 「2면 뜨기」의 스테이지 */
const FILLET_STAGES = [
  'fillet_0_score', 'fillet_0_sever', 'fillet_0_ribsever',
  'fillet_1_score', 'fillet_1_score2', 'fillet_1_ribcut', 'fillet_1_sever', 'fillet_1_bellyribcut',
];
const FAMILIES = ['@amberjack', '@bream'];

function main() {
  const a = process.argv.slice(2);
  const from = a.includes('--from') ? a[a.indexOf('--from') + 1] : 'largescale_blackfish';
  const check = a.includes('--check');
  const table = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const src = table[from];
  if (!src) { console.error(`[f9_share_fillet_lines] ${from}의 확정 기록이 없다`); process.exit(1); }
  const missing = FILLET_STAGES.filter((id) => !src[id]);
  if (missing.length) { console.error(`[f9_share_fillet_lines] ${from}에 없는 단계: ${missing.join(', ')}`); process.exit(1); }
  const fams = {};
  let changed = 0;
  for (const fam of FAMILIES) {
    const cur = { ...(table[fam] ?? {}) };
    for (const id of FILLET_STAGES) {
      const o = src[id];
      // 좌표 필드만 옮긴다(선 · 스윕 · 탭) — 군 키의 다른 단계(사용자가 [군 확정]한 것)는 그대로
      const next = { from };
      for (const k of ['guidePath', 'guidePaths', 'sweepPath', 'tapPoint']) if (o[k]) next[k] = o[k];
      if (typeof o.at === 'string') next.at = o.at;
      if (JSON.stringify(cur[id]) !== JSON.stringify(next)) changed++;
      cur[id] = next;
    }
    fams[fam] = cur;
  }
  console.log(`[f9_share_fillet_lines] ${from} → ${FAMILIES.join(' · ')} · 단계 ${FILLET_STAGES.length} · 바뀌는 항목 ${changed}`);
  if (check || !changed) return;
  // 군 키를 맨 앞에(나머지는 원래 순서)
  const out = {};
  for (const fam of FAMILIES) out[fam] = fams[fam];
  for (const [k, v] of Object.entries(table)) if (!FAMILIES.includes(k)) out[k] = v;
  fs.writeFileSync(SRC, `${JSON.stringify(out, null, 1)}\n`, 'utf8');
  console.log(execFileSync(process.execPath, [path.join(ROOT, 'tools/apply_f9_captures.cjs')], { encoding: 'utf8' }).trim());
}
main();
