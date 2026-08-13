/**
 * @file CephalopodProfiles.ts
 * @description 두족류 손질 프로필 4종 + 부산물 테이블 (CEPHALOPOD_BUTCHERY_SPEC §5·§6)
 *
 * speciesId는 **실제 어종 DB id**를 쓴다 (v3.1 §0.5.1 — 스펙 v3의 가정 id는 전부 다름):
 *   무늬오징어 `squid` · 한치 `swordtip_squid` · 갑오징어 `cuttlefish` · 참문어 `octopus`.
 * 대문어 `giant_octopus`는 참문어 프로필을 공유한다 (전용 트리 없음 — §0.5.1).
 *
 * 순수 TS — 렌더/브라우저 API 없음.
 */

import type { CephalopodProfile, CephByproductDef, CephByproductId } from '../types/Butchery.js';

/** 무늬오징어 — 13스테이지. 뼈(펜)·아가미·날개·머리 3분할이 전부 개별 공정 */
export const BIGFIN_REEF_SQUID: CephalopodProfile = {
  speciesId: 'squid', kind: 'squid',
  shimeStages: 2, needsInversion: false, needsSaltScrub: false,
  skinLayers: 1, hasPen: true, hasCuttlebone: false,
  beakRemoval: 'dedicated', gillRemoval: 'separate', hasTentacles: true,
  mantleRatio: 0.46, finRatio: 0.11, armsRatio: 0.19, tentacleRatio: 0.00,
  headRatio: 0.06, boneRatio: 0.01, baseYieldRate: 0.72,
  inkAmount: 0.55, gonadChance: 0.35, spawningMonths: [4, 5, 6, 7],
  sliceMode: 'strip',
};

/** 한치(창꼴뚜기) — 14스테이지. 뼈+아가미 병합, 껍질 중단 절단, 촉완 분리 */
export const SWORDTIP_SQUID: CephalopodProfile = {
  speciesId: 'swordtip_squid', kind: 'squid',
  shimeStages: 2, needsInversion: false, needsSaltScrub: false,
  skinLayers: 1, hasPen: true, hasCuttlebone: false,
  // 머리부 3분할은 없지만 부리는 다리 밑동에서 따로 빼낸다 (사용자 지시 2026-08-05)
  beakRemoval: 'dedicated', gillRemoval: 'with_pen', hasTentacles: true,
  mantleRatio: 0.50, finRatio: 0.04, armsRatio: 0.13, tentacleRatio: 0.05,
  headRatio: 0.05, boneRatio: 0.01, baseYieldRate: 0.74,
  inkAmount: 0.45, gonadChance: 0.30, spawningMonths: [5, 6, 7, 8],
  sliceMode: 'strip',
};

/** 갑오징어 — 12스테이지. 갑(강체 판) 들어내기 + 속껍질 = 2겹 껍질 */
export const GOLDEN_CUTTLEFISH: CephalopodProfile = {
  speciesId: 'cuttlefish', kind: 'cuttlefish',
  shimeStages: 2, needsInversion: false, needsSaltScrub: false,
  skinLayers: 2, hasPen: false, hasCuttlebone: true,
  beakRemoval: 'dedicated', gillRemoval: 'with_viscera', hasTentacles: true,
  mantleRatio: 0.42, finRatio: 0.06, armsRatio: 0.16, tentacleRatio: 0.00,
  headRatio: 0.06, boneRatio: 0.08, baseYieldRate: 0.66,
  // 두족류 중 먹물이 가장 많다 — 터지면 얼룩 세척 부담 최대 + 속껍질까지 스며든다
  inkAmount: 0.90, gonadChance: 0.60, spawningMonths: [4, 5, 6],
  sliceMode: 'strip',
};

/** 참문어 — 11스테이지. 칼을 한 번도 쓰지 않는 유일한 트리 (외번·소금·문지르기·세척) */
export const COMMON_OCTOPUS: CephalopodProfile = {
  speciesId: 'octopus', kind: 'octopus',
  shimeStages: 0, needsInversion: true, needsSaltScrub: true,
  skinLayers: 0, hasPen: false, hasCuttlebone: false,
  beakRemoval: 'dedicated', gillRemoval: 'with_viscera', hasTentacles: false,
  mantleRatio: 0.22, finRatio: 0.00, armsRatio: 0.56, tentacleRatio: 0.00,
  headRatio: 0.00, boneRatio: 0.00, baseYieldRate: 0.78,
  inkAmount: 0.30, gonadChance: 0.20, spawningMonths: [5, 6, 7, 8],
  sliceMode: 'whole',
};

const CEPH_PROFILES: Record<string, CephalopodProfile> = {
  squid: BIGFIN_REEF_SQUID,
  swordtip_squid: SWORDTIP_SQUID,
  cuttlefish: GOLDEN_CUTTLEFISH,
  octopus: COMMON_OCTOPUS,
  // 대문어 — 참문어 트리·프로필 공유 (크기 편차만 개체 무게로 반영)
  giant_octopus: COMMON_OCTOPUS,
};

/** 두족류 손질 프로필 조회 — 미등록이면 undefined (손질 불가 어종) */
export function getCephalopodProfile(speciesId: string): CephalopodProfile | undefined {
  return CEPH_PROFILES[speciesId];
}

/** 손질 트리가 구현된 두족류인가 */
export function isCephalopodButcherable(speciesId: string): boolean {
  return speciesId in CEPH_PROFILES;
}

/**
 * 부산물 테이블 (§5).
 * `forced: true` 3종(머리덩어리·몸통 순살·문어 통마리)은 손질 진행에 필수라 버리기를 막는다.
 * `octo_slime`만 인벤토리에 들어가지 않고 "제거됨" 칩으로만 표시된다.
 */
export const CEPH_BYPRODUCTS: Record<CephByproductId, CephByproductDef> = {
  // 전용 에셋(촉완이 붙어있는 다리부와 머리부) — 사용자 제공 2026-08-10. 구 대체본(내장 주변부) 폐기
  ceph_head_mass:     { id: 'ceph_head_mass', nameKo: '머리+다리+내장 덩어리', defaultAction: 'keep', forced: true, stack: 1, price: 0, use: '중간 산출물 — 머리부 분할 공정의 입력', icon: 'trim_ceph_head_mass' },
  // 뼈 명명 (097차 사용자 지시) — 오징어류(무늬·한치) = '무늬오징어 뼈' 공용 / 갑오징어 = '갑오징어 뼈'
  ceph_pen:           { id: 'ceph_pen', nameKo: '무늬오징어 뼈', defaultAction: 'discard', stack: 20, price: 0, use: '폐기 · 공예 소품', icon: 'trim_ceph_pen' },
  ceph_cuttlebone:    { id: 'ceph_cuttlebone', nameKo: '갑오징어 뼈', defaultAction: 'discard', stack: 10, price: 50, use: '폐기 · 공예 · 사료', icon: 'trim_ceph_cuttlebone' },
  // ⚠ 껍질·아가미는 097차부터 **부산물로 지급하지 않는다** (트리 yields에서 제거 — def는 참조용 잔존)
  ceph_skin:          { id: 'ceph_skin', nameKo: '오징어 껍질', defaultAction: 'discard', stack: 10, price: 100, use: '(미지급 — 097차)' },
  ceph_inner_skin:    { id: 'ceph_inner_skin', nameKo: '속껍질(얇은 막)', defaultAction: 'discard', stack: 20, price: 0, use: '폐기' },
  ceph_gill:          { id: 'ceph_gill', nameKo: '아가미', defaultAction: 'discard', stack: 10, price: 50, use: '(미지급 — 097차)' },
  // 날개살 — 갑오징어는 실제로 거의 없어 **미지급** (갑오징어 트리에서 yields 제외 — 097차)
  ceph_fin_meat:      { id: 'ceph_fin_meat', nameKo: '날개살', defaultAction: 'keep', stack: 5, price: 1200, use: '식용 · 회뜨기(4점)', icon: 'trim_ceph_fin' },
    // 다리부 — 촉완을 따로 자른 뒤면 'trim_ceph_arms_only'(cephByproductIcon 분기)
  ceph_arms:          { id: 'ceph_arms', nameKo: '다리부', defaultAction: 'keep', stack: 5, price: 1800, use: '식용 — 회뜨기에서 촉완 분리', icon: 'trim_ceph_arms' },
  /**
   * 촉완 = 짧은 팔 8개와 **별개 부산물**. 한치는 전용 분리 스테이지(`ceph_tentacle_cut`)가 있고
   * 길이·식감이 달라 값도 따로 매긴다. 2026-08-05 전용 에셋 투입 — 다리 공용 해제.
   */
  ceph_tentacle:      { id: 'ceph_tentacle', nameKo: '촉완(긴 다리)', defaultAction: 'keep', stack: 10, price: 700, use: '식용 · 판매 · 미끼', icon: 'trim_ceph_tentacle' },
  ceph_head:          { id: 'ceph_head', nameKo: '머리부', defaultAction: 'keep', stack: 5, price: 900, use: '식용 (부리 · 눈 제거 후)', icon: 'trim_ceph_head' },
  ceph_beak:          { id: 'ceph_beak', nameKo: '입(부리)', defaultAction: 'discard', stack: 20, price: 0, use: '폐기 — 머리부에서 발라낸다', icon: 'trim_ceph_beak' },
  // 먹물주머니·생식소는 내장 덩어리에 딸려 나온다 — 전용 에셋 전까지 내장 주변부 공용
  ceph_ink_sac:       { id: 'ceph_ink_sac', nameKo: '먹물주머니', defaultAction: 'keep', stack: 10, price: 2500, use: '요리 재료', icon: 'trim_ceph_viscera' },
  ceph_gonad:         { id: 'ceph_gonad', nameKo: '생식소(알집)', defaultAction: 'keep', stack: 5, price: 1500, use: '계절 별미 — 산란기 한정', icon: 'trim_ceph_viscera' },
  // 몸통살 = **곧 필렛** (097차 — 구 "순수 필렛" 별도 지급 폐지). 이름은 지급 시
  // 어종 접두가 붙는다("무늬오징어 몸통살"/"한치 몸통살"/"갑오징어 몸통살") · 에셋은 종별 분기
  ceph_mantle_fillet: { id: 'ceph_mantle_fillet', nameKo: '몸통살 (body tube)', defaultAction: 'keep', forced: true, stack: 1, price: 0, use: '메인 수율 → 회뜨기(22점)', icon: 'trim_ceph_mantle_squid' },
  octo_viscera:       { id: 'octo_viscera', nameKo: '문어 내장 덩어리', defaultAction: 'discard', stack: 5, price: 30, use: '폐기 · 잡부산물', icon: 'trim_octo_viscera' },
  octo_ink_sac:       { id: 'octo_ink_sac', nameKo: '문어 먹물주머니', defaultAction: 'keep', stack: 10, price: 900, use: '요리 재료 (오징어보다 소량)', icon: 'trim_octo_viscera' },
  octo_beak:          { id: 'octo_beak', nameKo: '악판(입)', defaultAction: 'discard', stack: 20, price: 0, use: '폐기', icon: 'trim_octo_beak' },
  octo_slime:         { id: 'octo_slime', nameKo: '점액 · 이물', defaultAction: 'auto_discard', stack: 0, price: 0, use: '폐기 전용 — 인벤토리 미적재' },
  octo_whole:         { id: 'octo_whole', nameKo: '문어 통마리 순살', defaultAction: 'keep', forced: true, stack: 1, price: 0, use: '메인 수율 → 숙회 · 슬라이싱', icon: 'trim_octo_whole' },
};

/**
 * 부산물 아이콘 텍스처 키 — **종별 분기**가 필요한 것만 여기서 해소한다.
 * 갑오징어는 몸통살(둥근 자루형)·뼈(갑) 모양이 오징어류와 달라 전용 에셋을 쓴다.
 */
export function cephByproductIcon(
  id: CephByproductId, speciesId?: string, opts?: { skinOn?: boolean; tentacleRemoved?: boolean },
): string | undefined {
  if (id === 'ceph_mantle_fillet') {
    // 박피 전이면 껍질 붙은 몸통 / 갑오징어는 몸통 형태가 달라 전용 에셋
    if (opts?.skinOn) return 'trim_ceph_mantle_skin';
    return speciesId === 'cuttlefish' ? 'trim_ceph_mantle_cuttlefish' : 'trim_ceph_mantle_squid';
  }
  // 다리부 — 촉완을 이미 분리했으면 촉완 없는 다리 에셋 (한치 `ceph_tentacle_cut` 이후)
  if (id === 'ceph_arms' && opts?.tentacleRemoved) return 'trim_ceph_arms_only';
  return CEPH_BYPRODUCTS[id]?.icon;
}
