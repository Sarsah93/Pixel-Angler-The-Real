/**
 * @file CephalopodStages.ts
 * @description 두족류 손질 스테이지 트리 (CEPHALOPOD_BUTCHERY_SPEC §4)
 *
 * **87차 현재 무늬오징어(`squid`) 1종만 구현** — 스펙 §11.3의 "1종 완주 후 확장" 순서를 따른다.
 * 한치 15 / 갑오징어 13 / 문어 11은 트리 미작성이라 `undefined`를 돌려주고,
 * 게이트(`isCephalopodTreeReady`)가 준비 중 안내를 유지한다.
 *
 * ⚠ 스테이지 ↔ 사진 대응은 §1.1 표 그대로다 (`S1`~`S14` = 스테이지 · `①`~`⑪` = 실사 컷).
 *   임의 병합·생략 금지 — 대응을 주석에 남겨 감사 추적이 되게 한다.
 * ⚠ 구조 규약(§0.5.4): **스테이지 1개 = 작업 1개**, 섹션은 전부 `anyOrder: false`.
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { ButcheryStage, CutPoint, CutSpec, ButcheryOrientation } from '../types/Butchery.js';
import {
  CEPH_SHIME_1, CEPH_SHIME_2, CEPH_SHIME_1_PATH, CEPH_SHIME_2_PATH,
  CEPH_SLIT_PATH, CEPH_SPREAD_PATH, CEPH_VISCERA_PATH, CEPH_PEN_PATH,
  CEPH_SKIN_LIFT_PATH, CEPH_SKIN_GRIP, CEPH_PEEL_PATH,
  CEPH_GILL_REGION, CEPH_GILL_SWEEP, CEPH_FIN_PATHS, CEPH_HEAD_SPLIT_PATHS,
  CEPH_BEAK_CENTER, CEPH_BEAK_PATH,
} from './CephalopodGuides.js';

/** 컷 스펙 헬퍼 — 두족류는 tolerance가 어류보다 후하다(덩어리를 다루는 동작이 많다) */
function cCut(
  id: string, orientation: ButcheryOrientation, guidePath: readonly CutPoint[],
  opts: Partial<CutSpec> = {},
): CutSpec {
  return {
    id, orientationRequired: orientation, tool: 'knife',
    guidePath: guidePath as CutPoint[],
    tolerance: opts.tolerance ?? 0.11,
    minCoverage: opts.minCoverage ?? 0.6,
    strokesRequired: opts.strokesRequired,
    strong: opts.strong,
    guidePaths: opts.guidePaths,
  };
}

/**
 * 무늬오징어 — **14스테이지** (§1.1 13스테이지 + §0.5.6 부리 공정).
 *
 * 시메①② + 실사 ①~⑪이 순서 그대로 S1~S13이 되는 유일한 종이다(병합·생략·재배치 없음).
 * S14(`ceph_beak_out`)만 실사에 없는 추가 공정 — 사용자 지시에 따른 명시적 예외(§0.5.6).
 */
function buildSquidStages(): ButcheryStage[] {
  return [
    // ── 시메 (사진 시메①②) — 신경 차단. 색소포 발색이 유백색으로 전환된다 ──
    {
      id: 'ceph_shime_mantle', label: '시메 ① — 갑–눈 사이', orientation: 'CEPH_DORSAL',
      primitive: 'nerve_cut',
      guide: '몸통과 눈 사이 중심선을 짧고 정확하게 끊으세요 (선도 유지)',
      tapPoint: CEPH_SHIME_1, tapRadius: 0.06,
      cut: cCut('ceph_shime_mantle', 'CEPH_DORSAL', CEPH_SHIME_1_PATH, { tolerance: 0.07 }),
    },
    {
      id: 'ceph_shime_arms', label: '시메 ② — 눈–다리 사이', orientation: 'CEPH_DORSAL',
      primitive: 'nerve_cut',
      guide: '눈과 다리 사이를 끊으세요 — 먹물 분출 위험이 크게 줄어듭니다',
      tapPoint: CEPH_SHIME_2, tapRadius: 0.06,
      cut: cCut('ceph_shime_arms', 'CEPH_DORSAL', CEPH_SHIME_2_PATH, { tolerance: 0.07 }),
    },
    // ── 개복 (실사 ①②) ──
    {
      id: 'ceph_mantle_open', label: '몸통 절개', orientation: 'CEPH_VENTRAL',
      primitive: 'mantle_slit',
      guide: '외투막 입구에 칼을 넣어 몸통 끝까지 한 번에 갈라주세요',
      cut: cCut('ceph_mantle_open', 'CEPH_VENTRAL', CEPH_SLIT_PATH, { tolerance: 0.09 }),
    },
    {
      id: 'ceph_mantle_spread', label: '펼치기 · 내장 노출', orientation: 'CEPH_OPEN',
      primitive: 'lift_flap',
      guide: '갈라진 몸통을 바깥으로 젖혀 펼치세요',
      cut: cCut('ceph_mantle_spread', 'CEPH_OPEN', CEPH_SPREAD_PATH, { tolerance: 0.13 }),
    },
    // ── 내장 분리 (실사 ③④) ──
    {
      id: 'ceph_viscera_pull', label: '내장 분리', orientation: 'CEPH_OPEN',
      primitive: 'drag_out',
      guide: '머리를 들어올려 내장을 몸통에서 떼어내세요',
      cut: cCut('ceph_viscera_pull', 'CEPH_OPEN', CEPH_VISCERA_PATH, { tolerance: 0.13 }),
    },
    {
      id: 'ceph_split_check', label: '분리 결과 확인', orientation: 'CEPH_PARTS',
      primitive: 'result',
      guide: '머리·다리·내장이 한 덩어리로 분리되었습니다',
    },
    // ── 연골 (실사 ⑤) ──
    {
      id: 'ceph_pen_out', label: '오징어뼈(연골) 제거', orientation: 'CEPH_OPEN',
      primitive: 'drag_out',
      guide: '중심선의 투명한 연골을 몸통 끝에서 잡아 당겨 빼내세요',
      cut: cCut('ceph_pen_out', 'CEPH_OPEN', CEPH_PEN_PATH, { tolerance: 0.09 }),
    },
    // ── 껍질 (실사 ⑥⑦⑧) — S8에서 장축 180° 회전 ──
    {
      id: 'ceph_flip_skin', label: '뒤집어 껍질 잡기', orientation: 'CEPH_SKIN_UP',
      primitive: 'lift_flap', flipBefore: 'longAxis180',
      guide: '장축으로 돌려 껍질 면을 위로 두고, 몸통 끝 가장자리를 들추세요',
      cut: cCut('ceph_flip_skin', 'CEPH_SKIN_UP', CEPH_SKIN_LIFT_PATH, { tolerance: 0.12 }),
    },
    {
      id: 'ceph_skin_peel', label: '껍질 분리', orientation: 'CEPH_SKIN_UP',
      primitive: 'peel', pullsRequired: 1,
      guide: '몸통 끝에서 머리 방향으로 껍질을 끝까지 벗기세요',
      // 잡는 지점 = 몸통 끝 가장자리 (여기서 시작해야 껍질이 물린다)
      tapPoint: CEPH_SKIN_GRIP.squid, tapRadius: 0.14,
      sweepPath: CEPH_PEEL_PATH.squid as CutPoint[],
    },
    {
      id: 'ceph_skin_done', label: '껍질 분리 완료', orientation: 'CEPH_PARTS',
      primitive: 'result',
      guide: '껍질이 통째로 벗겨졌습니다',
    },
    // ── 마무리 (실사 ⑨⑩⑪) ──
    {
      id: 'ceph_gill_wash', label: '아가미 제거 · 내장면 닦기', orientation: 'CEPH_FLESH_UP',
      primitive: 'hold_scrub', fillTarget: 0.85,
      guide: '몸통 안쪽을 왕복으로 훑어 아가미와 잔막을 걷어내세요',
      regionPoly: CEPH_GILL_REGION as CutPoint[],
      sweepPath: CEPH_GILL_SWEEP as CutPoint[],
    },
    {
      id: 'ceph_fin_off', label: '날개(지느러미) 제거', orientation: 'CEPH_FLESH_UP',
      primitive: 'fin_cut',
      guide: '양쪽 날개 밑동을 각각 잘라 분리하세요 (순서 자유 — 2곳)',
      cut: cCut('ceph_fin_off', 'CEPH_FLESH_UP', CEPH_FIN_PATHS[0], {
        tolerance: 0.10, guidePaths: CEPH_FIN_PATHS.map((p) => p as CutPoint[]),
      }),
    },
    {
      id: 'ceph_head_split', label: '머리부 3분할', orientation: 'CEPH_PARTS',
      primitive: 'vessel_cut',
      guide: '덩어리를 다리 / 머리 / 먹물주머니 3조각으로 가르세요 (2곳)',
      cut: cCut('ceph_head_split', 'CEPH_PARTS', CEPH_HEAD_SPLIT_PATHS[0], {
        tolerance: 0.10, guidePaths: CEPH_HEAD_SPLIT_PATHS.map((p) => p as CutPoint[]),
      }),
    },
    // ── 부리 (§0.5.6 — 실사에 없는 유일한 추가 스테이지) ──
    {
      id: 'ceph_beak_out', label: '부리 빼내기', orientation: 'CEPH_PARTS',
      primitive: 'drag_out',
      guide: '다리 밑동 가운데의 부리를 눌러 밀어 올린 뒤 통째로 뽑으세요',
      tapPoint: CEPH_BEAK_CENTER,
      cut: cCut('ceph_beak_out', 'CEPH_PARTS', CEPH_BEAK_PATH, { tolerance: 0.10 }),
    },
  ];
}

/**
 * 두족류 스테이지 트리 — speciesId로 분기 (§4).
 * `kind`가 아니라 **speciesId**로 고르는 이유: 무늬오징어와 한치는 둘 다 `kind: 'squid'`인데
 * 트리가 다르다(뼈·아가미 분리 여부 · 껍질 중단 · 날개 · 3분할).
 *
 * @returns 미구현 종이면 `undefined` — 호출부가 게이트를 유지한다.
 */
export function buildCephalopodStages(speciesId: string): ButcheryStage[] | undefined {
  switch (speciesId) {
    case 'squid': return buildSquidStages();
    // TODO(88차~): swordtip_squid 15 · cuttlefish 13 · octopus 11 (§4.2~§4.4)
    default: return undefined;
  }
}

/** 손질 트리가 실제로 구현된 두족류인가 — 프로필만 있고 트리가 없는 종과 구분한다 */
export function isCephalopodTreeReady(speciesId: string): boolean {
  return buildCephalopodStages(speciesId) !== undefined;
}
