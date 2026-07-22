/**
 * @file chumSyncSim.ts
 * @description 밑밥 동조 수치 시뮬 하네스 (헤드리스). balance 파라미터 검증용.
 *
 * (조류 방향×세기) × (밑밥 종류) 격자 스윕 → 각 조합에서 투척점을 훑어
 * 최적 투척점 / 최대 동조율 / 이론 리드 / 동조 0.7↑ 투척점 비율을 출력.
 *
 * **실제 게임 코드(createChumParcel/stepChum/computeChumSync/predictChumPath)를
 * 그대로 소비한다** — 인라인 근사 모델 금지 (게임↔시뮬 지표 정합 원칙).
 * TUNING 값을 바꿔 재실행하면 밸런스 변화가 즉시 분포로 확인된다.
 *
 * 실행: core 빌드 후 `node packages/core/dist/scripts/chumSyncSim.js`
 * (index.ts에서 export하지 않음 — import 시 즉시 실행되는 스크립트)
 */

import { TUNING, ChumTypeKey } from '../config/tuning.js';
import { predictChumPath, optimalThrowX } from '../simulation/ChumPhysics.js';

// ── 시나리오 (고정 미끼) ──
const BAIT = { x: 0, d: 20, z: 6.0 };   // baitX / 거리(m) / 수심(m)
const WATER_HALF_W = 12;                 // 좌우 투척 가능 범위 (±m)
const Z_MAX = 12;

const CHUM_KEYS: ChumTypeKey[] = ['powder', 'grain', 'ball'];

// 조류: 가로(cx) 세기×방향 + 소량 원근(cd)
const CURRENTS = [
  { label: '←강', cx: -0.8, cd: 0.1 }, { label: '←중', cx: -0.4, cd: 0.05 },
  { label: '무시', cx: 0.0, cd: 0.0 },
  { label: '→중', cx: 0.4, cd: 0.05 }, { label: '→강', cx: 0.8, cd: 0.1 },
];

function throwPoints(): number[] {
  const n = TUNING.chumThrow.pointCount;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) pts.push(-WATER_HALF_W + (2 * WATER_HALF_W * i) / (n - 1));
  return pts;
}

function run(): void {
  const pts = throwPoints();
  console.log(`\n밑밥 동조 시뮬 — 투척점 ${pts.length}개, 미끼(거리 ${BAIT.d}m·수심 ${BAIT.z}m)`);
  console.log(`σdepth=${TUNING.chumSync.depthSigmaM} σhoriz=${TUNING.chumSync.horizSigmaM} Dweight=${TUNING.chumSync.currentDWeight}\n`);

  const rows: Record<string, string | number>[] = [];
  for (const cur of CURRENTS) {
    for (const key of CHUM_KEYS) {
      let bestX = pts[0], bestSync = 0, over70 = 0;
      for (const px of pts) {
        const pred = predictChumPath(px, BAIT.d, { x: cur.cx, d: cur.cd }, BAIT, Z_MAX, key);
        if (pred.peakSync > bestSync) { bestSync = pred.peakSync; bestX = px; }
        if (pred.peakSync >= 0.7) over70++;
      }
      rows.push({
        조류: cur.label, 밑밥: key,
        최적투척X: bestX.toFixed(1), 최대동조: bestSync.toFixed(2),
        이론리드X: optimalThrowX(BAIT.x, BAIT.z, cur.cx, key).toFixed(1),
        '0.7↑비율': `${((over70 / pts.length) * 100).toFixed(0)}%`,
      });
    }
  }
  console.table(rows);

  // 요약: 밑밥별 평균 최대동조 (스킬 커브 감)
  for (const key of CHUM_KEYS) {
    const avg = CURRENTS
      .map((c) => Math.max(...pts.map((p) =>
        predictChumPath(p, BAIT.d, { x: c.cx, d: c.cd }, BAIT, Z_MAX, key).peakSync)))
      .reduce((a, b) => a + b, 0) / CURRENTS.length;
    console.log(`평균 최대동조 [${key}] = ${avg.toFixed(2)}`);
  }
}

run();
