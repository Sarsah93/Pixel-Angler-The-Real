/**
 * @file verify_octopus97.mjs
 * @description 097차 — 부산물 개편 + 한치 라우팅 + 문어 8스테이지 core 실판정 검증.
 *  ① 한치 = 무늬오징어 트리·섹션 공유 ② 부산물 개편(껍질·아가미 미지급 / 뼈·몸통살 명명)
 *  ③ 문어 스테이지·섹션 1:1 ④ 문어 완주(가이드 준수 입력 — forceFinish 없이)
 * 실행: node scratchpad/verify_octopus97.mjs  (선행: core 빌드)
 */
import {
  ButcheryProcess, getButcheryProfile, sectionsForSpecies, canButcherSpecies,
  CEPH_BYPRODUCTS, OCTO_SALT_REGION,
} from '../packages/core/dist/index.js';

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}

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

console.log('── ① 한치 = 무늬오징어 트리·섹션 공유 ──');
{
  ok(canButcherSpecies('swordtip_squid'), '한치 손질 개방 (canButcherSpecies)');
  const sq = new ButcheryProcess(getButcheryProfile('squid'), 1.0);
  const st = new ButcheryProcess(getButcheryProfile('swordtip_squid'), 1.0);
  ok(st.stageList.length === 20, `한치 스테이지 20 (실제 ${st.stageList.length})`);
  ok(JSON.stringify(st.stageList.map((s) => s.id)) === JSON.stringify(sq.stageList.map((s) => s.id)),
    '한치 스테이지 = 무늬오징어와 동일');
  const secSq = sectionsForSpecies('squid', 'round').map((s) => s.id);
  const secSt = sectionsForSpecies('swordtip_squid', 'round').map((s) => s.id);
  ok(JSON.stringify(secSq) === JSON.stringify(secSt), '한치 섹션 = 무늬오징어와 동일');
}

console.log('── ② 부산물 개편 (097차) ──');
{
  ok(CEPH_BYPRODUCTS.ceph_pen.nameKo.includes('무늬오징어 뼈'), `연골 명칭 = '${CEPH_BYPRODUCTS.ceph_pen.nameKo}'`);
  ok(CEPH_BYPRODUCTS.ceph_cuttlebone.nameKo.includes('갑오징어 뼈'), `갑 명칭 = '${CEPH_BYPRODUCTS.ceph_cuttlebone.nameKo}'`);
  ok(CEPH_BYPRODUCTS.ceph_mantle_fillet.nameKo.includes('몸통살'), `몸통살 명칭 = '${CEPH_BYPRODUCTS.ceph_mantle_fillet.nameKo}'`);
  const yields = sectionsForSpecies('squid', 'round')
    .flatMap((s) => [...(s.yields ?? []), ...s.tasks.flatMap((t) => t.yields ?? [])]);
  ok(!yields.includes('ceph_skin'), '오징어 껍질 미지급 (yields에 없음)');
  ok(!yields.includes('ceph_gill'), '아가미 미지급 (yields에 없음)');
  ok(yields.includes('ceph_mantle_fillet'), '몸통살 지급 유지');
  ok(yields.includes('ceph_fin_meat'), '날개살 지급 유지 (무늬오징어)');
}

console.log('── ③ 문어 스테이지·섹션 정합 ──');
const profile = getButcheryProfile('octopus');
const p = new ButcheryProcess(profile, 1.0);
const EXPECT = [
  'octo_invert', 'octo_viscera_pull', 'octo_revert',
  'octo_salt', 'octo_scrub', 'octo_wash',
  'octo_beak_out', 'octo_done',
];
{
  ok(canButcherSpecies('octopus') && canButcherSpecies('giant_octopus'), '참문어·대문어 손질 개방');
  const ids = p.stageList.map((s) => s.id);
  ok(ids.length === 8, `문어 스테이지 = 8 (실제 ${ids.length})`);
  ok(JSON.stringify(ids) === JSON.stringify(EXPECT), '순서 일치 (외번→내장→되돌림→소금→문지르기→세척→악판→완료)');
  const sections = sectionsForSpecies('octopus', 'round');
  const refs = sections.flatMap((s) => s.tasks.flatMap((t) => t.stageIds));
  ok(JSON.stringify(refs) === JSON.stringify(EXPECT), '섹션 참조 = 스테이지 순서 1:1 (고아 0)');
  const yields = sections.flatMap((s) => [...(s.yields ?? []), ...s.tasks.flatMap((t) => t.yields ?? [])]);
  ok(yields.includes('octo_viscera') && yields.includes('octo_ink_sac')
    && yields.includes('octo_beak') && yields.includes('octo_whole'),
  '문어 부산물 4종 배선 (내장·먹물·악판·통마리)');
  ok(Array.isArray(OCTO_SALT_REGION) && OCTO_SALT_REGION.length >= 3, '소금 영역 폴리곤 export');
}

console.log('── ④ 문어 완주 (가이드 준수 입력) ──');
function assertStage(id) {
  ok(p.stage?.id === id, `현재 스테이지 = ${id} (실제 ${p.stage?.id})`);
}
function cutAlong() {
  const s = p.stage;
  const r = p.submitCut(tracePath(s.cut.guidePath));
  ok(r.passed, `${s.id} 통과 (cov ${r.coverage?.toFixed(2)})`);
}
assertStage('octo_invert');
ok(p.stage?.orientation === 'OCTO_WHOLE', '외번 뷰 = OCTO_WHOLE');
cutAlong();
assertStage('octo_viscera_pull');
ok(p.orientation === 'OCTO_INVERTED', `내장 단계 뷰 자동 스냅 = OCTO_INVERTED (실제 ${p.orientation})`);
cutAlong();
assertStage('octo_revert');
ok(p.submitWash(), '머리 되돌리기 (버튼) 통과');
assertStage('octo_salt');
ok(p.orientation === 'OCTO_WHOLE', `소금 단계 뷰 = OCTO_WHOLE (실제 ${p.orientation})`);
{
  let done = false;
  for (let i = 0; i < 40 && !done; i++) done = p.submitFill(0.05).stageDone;
  ok(done, '소금 치대기 게이지 완료');
}
assertStage('octo_scrub');
{
  let done = false;
  for (let i = 0; i < 40 && !done; i++) done = p.submitFill(0.05).stageDone;
  ok(done, '거품 문지르기 게이지 완료');
}
assertStage('octo_wash');
ok(p.submitWash(), '흐르는 물 세척 (버튼) 통과');
assertStage('octo_beak_out');
ok(p.orientation === 'OCTO_ORAL', `악판 단계 뷰 = OCTO_ORAL (실제 ${p.orientation})`);
cutAlong();
assertStage('octo_done');
ok(p.submitWash(), '손질 완료 (결과 버튼) 통과');
ok(p.finished, '완주 (finished)');

console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
