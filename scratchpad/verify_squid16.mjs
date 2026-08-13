/**
 * @file verify_squid16.mjs
 * @description 092차 — 무늬오징어 16스테이지 core 실판정 검증.
 *  ① 스테이지 순서(날개 2단 분할 ×2 반영) ② 섹션 정합(참조 1:1·순서) ③ 회전 자동 스냅
 *  ④ 가이드 준수 입력 완주(forceFinish 없이) ⑤ peel 투영 판정 ⑥ 탭 성공/실패
 * 실행: node scratchpad/verify_squid16.mjs  (선행: core 빌드)
 */
import {
  ButcheryProcess, getButcheryProfile, sectionsForSpecies,
  CEPH_PEEL_STEP_SWEEPS, CEPH_PEEL_FINISH_SWEEP, CEPH_BEAK_PATH, CEPH_HEAD_SPLIT_PATHS,
} from '../packages/core/dist/index.js';

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}

/** 가이드 경로를 40점 트레이스로 (evaluateCut 통과용) */
function tracePath(path, n = 40) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segs.push(d); total += d;
  }
  const out = [];
  for (let k = 0; k <= n; k++) {
    let target = (k / n) * total;
    let i = 0;
    while (i < segs.length - 1 && target > segs[i]) { target -= segs[i]; i++; }
    const t = segs[i] > 0 ? Math.min(1, target / segs[i]) : 0;
    out.push({
      x: path[i].x + (path[i + 1].x - path[i].x) * t,
      y: path[i].y + (path[i + 1].y - path[i].y) * t,
    });
  }
  return out;
}

/** client의 peel 당김 품질 계산 재현 (ButcheryPanel.onPointerUp — 095차 스윕 길이 비례) */
function peelQuality(sweep, from, to) {
  const dirRaw = { x: sweep[sweep.length - 1].x - sweep[0].x, y: sweep[sweep.length - 1].y - sweep[0].y };
  const dirLen = Math.max(1e-6, Math.hypot(dirRaw.x, dirRaw.y));
  const dir = { x: dirRaw.x / dirLen, y: dirRaw.y / dirLen };
  const mvx = to.x - from.x, mvy = to.y - from.y;
  const along = mvx * dir.x + mvy * dir.y;
  const perp = Math.abs(mvx * -dir.y + mvy * dir.x);
  const angleQ = Math.max(0.2, 1 - perp / Math.max(0.12, along));
  return Math.max(0, Math.min(1, along / Math.max(0.12, dirLen))) * angleQ;
}

const profile = getButcheryProfile('squid');
const p = new ButcheryProcess(profile, 1.0);

console.log('── ① 스테이지 순서 (20) ──');
const EXPECT = [
  'ceph_shime_mantle', 'ceph_shime_arms', 'ceph_mantle_open',
  'ceph_viscera_pull_1', 'ceph_viscera_pull_2', 'ceph_pen_out',
  'ceph_flip_skin',
  'ceph_skin_peel_1', 'ceph_skin_peel_2', 'ceph_skin_peel_3', 'ceph_skin_peel_4',
  'ceph_skin_finish', 'ceph_skin_done',
  'ceph_fin_off_1', 'ceph_fin_off_2', 'ceph_finskin_off_1', 'ceph_finskin_off_2',
  'ceph_gill_wash', 'ceph_head_split', 'ceph_beak_out',
];
const ids = p.stageList.map((s) => s.id);
ok(ids.length === 20, `스테이지 수 = 20 (실제 ${ids.length})`);
ok(JSON.stringify(ids) === JSON.stringify(EXPECT), '순서 일치 (껍질 가로 4분할 반영)');

console.log('── ② 섹션 정합 ──');
const sections = sectionsForSpecies('squid', profile.bodyShape ?? 'round');
const refs = sections.flatMap((s) => s.tasks.flatMap((t) => t.stageIds));
ok(JSON.stringify(refs) === JSON.stringify(EXPECT), '섹션 참조 = 스테이지 순서 1:1');
const trim = sections.find((s) => s.id === 'sec_ceph_trim');
ok(trim?.tasks.length === 5, `trim 섹션 5작업 (실제 ${trim?.tasks.length})`);
ok(trim?.tasks.find((t) => t.id === 't_ceph_fin_2')?.yields?.includes('ceph_fin_meat') === true,
  '날개살 부산물 = 2/2 완료 시 지급');

console.log('── ③④ 완주 (가이드 준수 입력 · 회전 스냅 확인) ──');
const rotSeen = {};
function assertStage(id) {
  ok(p.stage?.id === id, `현재 스테이지 = ${id} (실제 ${p.stage?.id})`);
  rotSeen[id] = p.rotation;
}
function cutAlong() {
  const s = p.stage;
  const path = s.cut.guidePath;
  const r = p.submitCut(tracePath(path));
  ok(r.passed, `${s.id} 컷 통과 (cov ${r.coverage?.toFixed(2)})`);
  return r;
}
// 시메 ×2 · 개복 · 내장 1/2·2/2 (094차 분할) · 연골
assertStage('ceph_shime_mantle'); cutAlong();
assertStage('ceph_shime_arms'); cutAlong();
assertStage('ceph_mantle_open'); cutAlong();
assertStage('ceph_viscera_pull_1'); cutAlong();
assertStage('ceph_viscera_pull_2'); cutAlong();
assertStage('ceph_pen_out'); cutAlong();
// 껍질 들추기 — 탭 + 회전 270 스냅
assertStage('ceph_flip_skin');
ok(p.rotation === 270, `flip_skin 회전 자동 스냅 = 270 (실제 ${p.rotation})`);
ok(p.canAct(), 'flip_skin canAct (방향+회전 일치)');
{
  const miss = p.submitTap(0.5);
  ok(!miss.passed, '탭 크게 빗나감 = 실패');
  const hit = p.submitTap(0.02);
  ok(hit.passed && hit.quality > 0.7, `탭 성공 (q ${hit.quality.toFixed(2)})`);
}
// 껍질 뜯기(가로) 4단계 — 회전 270 유지 + 각 단계 짧은 당김 (095차 분할)
{
  const sw0 = CEPH_PEEL_STEP_SWEEPS[0];
  const bad = peelQuality(sw0, sw0[0], { x: sw0[0].x - 0.20, y: sw0[0].y + 0.15 });   // 역방향
  ok(bad < 0.25, `역방향 당김 품질 ${bad.toFixed(3)} < 0.25 (실패 재현)`);
}
for (let step = 0; step < 4; step++) {
  assertStage(`ceph_skin_peel_${step + 1}`);
  ok(p.rotation === 270, `peel_${step + 1} 회전 유지 = 270 (실제 ${p.rotation})`);
  const sw = CEPH_PEEL_STEP_SWEEPS[step];
  const q = peelQuality(sw, sw[0], sw[sw.length - 1]);
  const r = p.submitPeelPull(q);
  ok(r.passed && r.stageDone, `${step + 1}/4 짧은 당김 통과 (q ${q.toFixed(2)})`);
}
// 껍질 뜯기 ② — 회전 270 유지 (상→하 마무리 당김)
assertStage('ceph_skin_finish');
ok(p.rotation === 270, `skin_finish 회전 유지 = 270 (실제 ${p.rotation})`);
{
  const sw = CEPH_PEEL_FINISH_SWEEP;
  const q = peelQuality(sw, sw[0], sw[sw.length - 1]);
  const r = p.submitPeelPull(q);
  ok(r.passed && r.stageDone, `마무리 스윕 당김 통과 (q ${q.toFixed(2)})`);
}
// 분리 완료 (버튼) — 회전·뷰 유지(CEPH_SKIN_UP·270 — 뒤집기/회전 연출 없이 결과 확인)
assertStage('ceph_skin_done');
ok(p.rotation === 270, `skin_done 회전 유지 = 270 (실제 ${p.rotation})`);
ok(p.stage?.orientation === 'CEPH_SKIN_UP', 'skin_done 뷰 = CEPH_SKIN_UP (뷰 전환 없음)');
ok(p.submitWash(), '결과 확인(버튼) 통과');
// 날개 구간 진입 — 회전 0 복귀
ok(p.rotation === 0, `finskin 진입 시 회전 스냅 = 0 (실제 ${p.rotation})`);
// 날개 — **날개살 분리 먼저, 껍질째 뜯기 다음** (094차 순서 재정의)
assertStage('ceph_fin_off_1'); cutAlong();
assertStage('ceph_fin_off_2'); cutAlong();
assertStage('ceph_finskin_off_1'); cutAlong();
assertStage('ceph_finskin_off_2'); cutAlong();
// 아가미 닦기 (fill)
assertStage('ceph_gill_wash');
{
  let done = false;
  for (let i = 0; i < 40 && !done; i++) done = p.submitFill(0.05).stageDone;
  ok(done, '아가미 닦기 게이지 완료');
}
// 3분할 (2경로) + 부리
assertStage('ceph_head_split');
{
  const s = p.stage;
  const paths = s.cut.guidePaths;
  const r1 = p.submitCut(tracePath(paths[0]));
  ok(r1.passed && !r1.stageDone, '3분할 1컷 통과 (스테이지 유지)');
  const r2 = p.submitCut(tracePath(paths[1]));
  ok(r2.passed && r2.stageDone, '3분할 2컷 통과 (스테이지 완료)');
}
// 실측 좌표 배선 확인 (094차)
ok(Math.abs(CEPH_HEAD_SPLIT_PATHS[0][0].x - 0.771) < 1e-6 && Math.abs(CEPH_HEAD_SPLIT_PATHS[1][0].x - 0.510) < 1e-6,
  '3분할 실측 2선 배선 (0.771 / 0.510)');
ok(Math.abs(CEPH_BEAK_PATH[0].x - 0.575) < 1e-6 && Math.abs(CEPH_BEAK_PATH[1].x - 0.493) < 1e-6,
  '부리 실측 경로 배선 (0.575→0.493)');
assertStage('ceph_beak_out'); cutAlong();
ok(p.finished, '완주 (finished)');

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
